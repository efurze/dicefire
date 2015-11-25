"use strict"

$(function() {
	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_players: [AI.Greedy, AI.Plyer],
		_initialMap: null,
		_initialState: null,
		_controller: null,
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		selectedCountry: function() { return Game._selectedCountry; },
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function () {
			Renderer.init(Game._players.length, Game._canvas);						
            

			$.get( "/testmaps/initialstate.json").done(function(data) {
				Game.ajaxDone(data);
			}).fail(function(err) {
				Game.ajaxFail(err);
			});
		},
		
		ajaxDone: function (data){
			//console.log("Got ajax data: " + JSON.stringify(data));
			Game._initialState = JSON.stringify(data.state);
			Game._initialMap = JSON.stringify(data.map);
			
			Engine.init(Game._players.map(function(p){return p;}));
			Engine.setup(Game._initialMap, Game._initialState);
			Engine.registerRenderingCallback(Game.update);
			Renderer.clearAll();
			
			Game._controller = new Gamecontroller();
			Game.update();
			
			$('#start_test').click(Game.start);
			$('#end_turn').click(Game._controller.endTurn.bind(Game._controller));
			$('#back_btn').click(Game._controller.historyBack.bind(Game._controller));
			$('#forward_btn').click(Game._controller.historyForward.bind(Game._controller));
		},
		
		ajaxFail: function(err) {
			console.log("Ajax error: ", err.error(), err);
			//$('#start_test').click(Game.start);
		},
		
		start: function () {
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