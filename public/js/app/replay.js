"use strict"

$(function() {
	
	window.Replay = {
		
		_canvas: document.getElementById("c"),
		_initialMap: null,
		_gameId: -1,
		_controller: null,
		
		init: function (gameId) {
			console.log("gameId: " + gameId);
			Replay._gameId = gameId;

			$.get( "/getMap?gameId=" + gameId).done(function(data) {
				Replay.ajaxDone(data);
			}).fail(function(err) {
				Replay.ajaxFail(err);
			});
		},
		
		ajaxDone: function(data) {
			//console.log("Got ajax data: " + (data));
			if (!Replay._initialMap) {
				Replay._initialMap = JSON.parse(data);
				$.get( "/getState?gameId=" + Replay._gameId + "&moveId=1").done(function(data) {
					Replay.ajaxDone(data);
				}).fail(function(err) {
					Replay.ajaxFail(err);
				});
			} else {
				Replay.start(Replay._initialMap, JSON.parse(data));
			}
		},
		
		start: function(map, state) {
			Globals.ASSERT(state && state._players);
			var players = [];
			players.length = Object.keys(state._players).length;
			players.fill(AI.DoNothing);
			
			Engine.init(players.map(function(p){return p;}));
			Renderer.init(players.length, Replay._canvas, players.map(function(pc, idx) {
				return ("player " + idx);
			}));						
			
			Engine.setup(JSON.stringify(map), JSON.stringify(state));
			Engine.registerRenderingCallback(Replay.update);
			Renderer.clearAll();
			
			Replay._controller = new Replaycontroller(Replay._gameId);
			
			$('#back_btn').click(Replay._controller.historyBack.bind(Replay._controller));
			$('#forward_btn').click(Replay._controller.historyForward.bind(Replay._controller));
			
			Replay.update();
		},
		
		ajaxFail: function(err) {
			console.log("Ajax error: ", err.error(), err);
		},

		update: function(gamestate) {
			gamestate = gamestate || Engine.getState();
			Renderer.render(gamestate);
			if (Replay._controller) {
				Replay._controller.update();
			}
		},
		
	};
});