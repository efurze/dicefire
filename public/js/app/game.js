"use strict"


$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_controller: null,
		_mapController: null,
		_gameId: null,
		_uploader: null,
		_engine: null,
		
		
		currentPlayer: function() { return Game._engine.currentPlayer(); },
		
		init: function (gameId) {
			console.log("gameId: " + gameId);
			Game._gameId = gameId;
			Game._uploader = new Uploader(gameId);
			$('#setup').css('display', 'block');
			$('#game').css('display', 'none');
			
			$('#start_game').click(Setupcontroller.startGame);
			Setupcontroller.init(Game.start);
		},
		
		start: function(playerCode) {
			
			$('#setup').css('display', 'none');
			$('#game').css('display', 'block');
			
			Game._engine = new Engine();
			Game._engine.init(playerCode.map(function(pc){return pc;}));
			Renderer.init(playerCode.length, Game._canvas, playerCode.map(function(pc) {
				if (pc == "human") {
					return "human";
				} else {
					return pc.getName();
				}
			}));
			
			Game._engine.setup();
			
			if (Globals.uploadGame && Game._gameId) {
				// upload map data to server
				$.ajax({
					type: 'POST',
					url: '/uploadMap?gameId=' + Game._gameId,
					data: Map.serializeHexes(),
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					success: Game.uploadSuccess,
					failure: Game.uploadFailure
				});
			}
			
			
			Game._engine.registerStateCallback(Game.engineUpdate);
			Game._controller = new Gamecontroller(Game._engine);
			Game._mapController = new Mapcontroller(Game.mapUpdate, Game._engine);

			Game.redraw();
			
			
			$('#end_turn').click(Game._controller.endTurn.bind(Game._controller));
			$('#back_btn').click(Game._controller.historyBack.bind(Game._controller));
			$('#forward_btn').click(Game._controller.historyForward.bind(Game._controller));
			
			Game._engine.startTurn(0);
		},
		
		uploadSuccess: function(data) {
			console.log("UPLOAD SUCCESS: " + errMsg);
		},
		
		uploadFailure: function(errMsg) {
			console.log("UPLOAD FAILURE: " + errMsg);
		},
		
		mapUpdate: function() {
			if (!Game._controller.viewingHistory()) {
				Game.redraw();
			}
		},

		engineUpdate: function(gamestate, stateId) {
			gamestate = gamestate || Game._engine.getState();
			if (Globals.uploadGame && Game._gameId) {
				// upload the state info
				Game._uploader.push(JSON.parse(gamestate.serialize()));
			}
			Game.redraw(gamestate);
		},
		
		redraw: function(gamestate) {
			gamestate = gamestate || Game._engine.getState();
			Renderer.render(gamestate, Game._engine.finishAttack.bind(Game._engine));
			if (Game._controller) {
				Game._controller.update();
			}
		}
		
	};
});

