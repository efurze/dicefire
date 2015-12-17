"use strict"

$(function() {
	
	window.Replay = {
		
		_canvas: document.getElementById("c"),
		_initialMap: null,
		_gameId: -1,
		_controller: null,
		_playerNames: null,
		_engine: null,
		
		init: function (gameId) {
			console.log("gameId: " + gameId);
			Replay._gameId = gameId;
			Replay._engine = new Engine();
			Replay._controller = new Replaycontroller(Replay._gameId, Replay._engine);			

			$.get( "/getMap?gameId=" + gameId).done(function(data) {
				Replay.ajaxDone(data);
			}).fail(function(err) {
				Replay.ajaxFail(err);
			});
		},
		
		ajaxDone: function(data) {
			//console.log("Got ajax data: " + (data));
			if (!Replay._initialMap) {
				// got map data
				Replay._initialMap = JSON.parse(data);
				
				// now request game info
				$.get( "/getGameInfo?gameId=" + Replay._gameId).done(function(data) {
					Replay.ajaxDone(data);
				}).fail(function(err) {
					Replay.ajaxFail(err);
				});
			} else if (!Replay._playerNames){
				// got game info
				Replay._playerNames = JSON.parse(data).players;
				
				// initialze controller (will call back to callback())
				Replay._controller.init(Replay.callback);
			}
			
		},
		
		callback: function(state) {
			
			if (!Replay._engine.isInitialized()) {
				var players = [];
				if (state && state._players) {
					players.length = Object.keys(state._players).length;
				} else {
					// just default to 2 players
					players.length = 2;
				}
				players.fill(AI.DoNothing);
			
				Replay._engine.init(players.map(function(p){return p;}));
				Replay._engine.setup(JSON.stringify(Replay._initialMap), state ? JSON.stringify(state) : null);
				
				if (!Replay._playerNames || Replay._playerNames.length != players.length) {
					Replay._playerNames = players;
				}
				
				Renderer.init(players.length, Replay._canvas, Replay._engine.map(), Replay._playerNames);						
			
				if (state) {
					Replay._engine.pushHistory(state);
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
			gamestate = gamestate || Replay._engine.getState();
			Renderer.render(gamestate);
			if (Replay._controller) {
				Replay._controller.update();
			}
		},
		
	};
});