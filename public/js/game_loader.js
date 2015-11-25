"use strict"

$(function() {
	
	window.GameLoader = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_initialMap: null,
		_initialState: null,
		_controller: null,
		_mapController: null,
		
		mouseOverCountry: function() { return GameLoader._mouseOverCountry; },
		selectedCountry: function() { return GameLoader._selectedCountry; },
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function () {
			
            $('#setup').css('display', 'block');
			$('#game').css('display', 'none');

			$.get( "/testmaps/initialstate.json").done(function(data) {
				GameLoader.ajaxDone(data);
			}).fail(function(err) {
				GameLoader.ajaxFail(err);
			});
		},
		
		ajaxDone: function(data) {
			//console.log("Got ajax data: " + JSON.stringify(data));
			GameLoader._initialState = JSON.stringify(data.state);
			GameLoader._initialMap = JSON.stringify(data.map);
			
			$('#start_game').click(Setupcontroller.startGame);
			Setupcontroller.init(GameLoader.start, Object.keys(data.state._players).length);
		},
		
		start: function(players) {
			$('#setup').css('display', 'none');
			$('#game').css('display', 'block');
			
			Engine.init(players.map(function(p){return p;}));
			Renderer.init(players.length, GameLoader._canvas, players.map(function(pc) {
				if (pc == "human") {
					return "human";
				} else {
					return pc.getName();
				}
			}));						
			
			Engine.setup(GameLoader._initialMap, GameLoader._initialState);
			Engine.registerRenderingCallback(GameLoader.update);
			Renderer.clearAll();
			
			GameLoader._mapController = new Mapcontroller(GameLoader.update);
			
			GameLoader._controller = new Gamecontroller();
			GameLoader.update();
			
			
			$('#end_turn').click(GameLoader._controller.endTurn.bind(GameLoader._controller));
			$('#back_btn').click(GameLoader._controller.historyBack.bind(GameLoader._controller));
			$('#forward_btn').click(GameLoader._controller.historyForward.bind(GameLoader._controller));
			
			Engine.startTurn(0);
		},
		
		ajaxFail: function(err) {
			console.log("Ajax error: ", err.error(), err);
			//$('#start_test').click(Game.start);
		},

		update: function(gamestate) {
			gamestate = gamestate || Engine.getState();
			Renderer.render(gamestate);
			if (GameLoader._controller) {
				GameLoader._controller.update();
			}
		},
		
	};
});