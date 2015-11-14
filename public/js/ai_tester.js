"use strict"

$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_runCount: 0,
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		selectedCountry: function() { return Game._selectedCountry; },
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (playerCode) {
			Globals.suppress_ui = 1;
			Game._runCount = 0;
			Renderer.init(players.length, Game._canvas);			
			
            $('#start_test').click(Game.start);
		},
		
		start: function () {
			Game.startTest();
		},
		
		startTest: function () {
			Game._runCount ++;
			Game.simulateGame();
		},
		
		gameOver: function (winner) {
			console.log("Player " + winner + " wins");
			if (Game._runCount < 5) {
				Game.startTest();
			} else {
				console.log("test over");
			}
		},
		
		simulateGame: function() {
			var players = [AI.Aggressive, AI.Aggressive];
			Engine.init(players, Game.gameOver);
			Engine.setup();
			Renderer.clearAll();
			
			Renderer.render();
			
			Engine.startTurn(0);
		}
		
	};
});