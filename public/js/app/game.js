"use strict"
$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_controller: null,
		_mapController: null,
		_gameId: -1,
		_lastUploadedState: 0,
		
		
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (gameId) {
			console.log("gameId: " + gameId);
			Game._gameId = gameId;
			$('#setup').css('display', 'block');
			$('#game').css('display', 'none');
			
			$('#start_game').click(Setupcontroller.startGame);
			Setupcontroller.init(Game.start);
		},
		
		start: function(playerCode) {
			
			$('#setup').css('display', 'none');
			$('#game').css('display', 'block');
			
			Engine.init(playerCode.map(function(pc){return pc;}));
			Renderer.init(playerCode.length, Game._canvas, playerCode.map(function(pc) {
				if (pc == "human") {
					return "human";
				} else {
					return pc.getName();
				}
			}));
			
			Engine.setup();
			
			if (Globals.uploadGame && Game._gameId > 0) {
				// upload map data to server
				$.ajax({
					type: 'POST',
					url: '/uploadMap?gameId=' + Game._gameId,
					data: Map.serializeHexes(),
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					success: Game.uploadSuccess,
					failure: Game.uploadError
				});
			}
			
			
			Engine.registerRenderingCallback(Game.update);
			Game._controller = new Gamecontroller();
			Game._mapController = new Mapcontroller(Game.update);

			Game.update();
			
			
			$('#end_turn').click(Game._controller.endTurn.bind(Game._controller));
			$('#back_btn').click(Game._controller.historyBack.bind(Game._controller));
			$('#forward_btn').click(Game._controller.historyForward.bind(Game._controller));
			
			Engine.startTurn(0);
		},
		
		uploadSuccess: function(data) {
			console.log("UPLOAD SUCCESS: " + errMsg);
		},
		
		uploadFailure: function(errMsg) {
			console.log("UPLOAD FAILURE: " + errMsg);
		},

		update: function(gamestate) {
			gamestate = gamestate || Engine.getState();
			Renderer.render(gamestate);
			if (Game._controller) {
				Game._controller.update();
			}
			
			if (Globals.uploadGame && Game._gameId > 0 && Game._lastUploadedState < Engine.historyLength()) {
				// upload the state info
				Game._lastUploadedState = Engine.historyLength();
				$.ajax({
					type: 'POST',
					url: '/uploadState?gameId=' + Game._gameId + "&moveId=" + Game._lastUploadedState,
					data: Engine.getHistory(Game._lastUploadedState - 1).serialize(),
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					success: Game.uploadSuccess,
					failure: Game.uploadError
				});
			}
		},
		
	};
});

