"use strict"
$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_controller: null,
		_mapController: null,
		
		
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (playerCode) {
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
			Engine.registerRenderingCallback(Game.update);
			Game._controller = new Gamecontroller();
			Game._mapController = new Mapcontroller(Game.update);

			Game.update();
			
			
			$('#end_turn').click(Game._controller.endTurn.bind(Game._controller));
			$('#back_btn').click(Game._controller.historyBack.bind(Game._controller));
			$('#forward_btn').click(Game._controller.historyForward.bind(Game._controller));
			
			Engine.startTurn(0);
		},
		

		update: function(gamestate) {
			gamestate = gamestate || Engine.getState();
			Renderer.render(gamestate);
			if (Game._controller) {
				Game._controller.update();
			}
		},
		
	};
});

