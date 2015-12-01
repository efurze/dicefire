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
			Replay._controller = new Replaycontroller(Replay._gameId);

			$.get( "/getMap?gameId=" + gameId).done(function(data) {
				Replay.ajaxDone(data);
			}).fail(function(err) {
				Replay.ajaxFail(err);
			});
		},
		
		ajaxDone: function(data) {
			//console.log("Got ajax data: " + (data));
			Replay._initialMap = JSON.parse(data);
			Replay._controller.init(Replay.callback);
		},
		
		callback: function(state) {
			
			if (!Engine.isInitialized()) {
				var players = [];
				if (state && state._players) {
					players.length = Object.keys(state._players).length;
				} else {
					// just default to 2 players
					players.length = 2;
				}
				players.fill(AI.DoNothing);
			
				Engine.init(players.map(function(p){return p;}));
				Renderer.init(players.length, Replay._canvas, players.map(function(pc, idx) {
					return ("player " + idx);
				}));						
			
				Engine.setup(JSON.stringify(Replay._initialMap), state ? JSON.stringify(state) : null);
				if (state) {
					Engine.pushHistory(state);
				}
				Renderer.clearAll();
			
				$('#back_btn').click(Replay._controller.historyBack.bind(Replay._controller));
				$('#forward_btn').click(Replay._controller.historyForward.bind(Replay._controller));
			}
			
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