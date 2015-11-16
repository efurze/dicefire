"use strict"

$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_runCount: 0,
		_MAX_RUNS: 50,
		_results: [],
		_firstMoveCount: [],
		_players: [AI.Aggressive, AI.Plyer],
		_playerMapping : [],
		
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
			Game._runCount = 0;
			Game._firstMoveCount.length = Game._players.length;
			Game._firstMoveCount.fill(0);
			Game._results.length = Game._players.length;
			Game._results.fill(0);
			Game.startTest();
		},
		
		startTest: function () {
			Game._runCount ++;
			window.setTimeout(function() {
				Game.simulateGame(Game._players);
			}, 0);
			
		},
		
		gameOver: function (winner, id) {
			console.log("Player " + id + " wins: " + Game._players[Game._playerMapping[id]].getName());
			Game._results[Game._playerMapping[id]] = Game._results[Game._playerMapping[id]] + 1 ;
			if (Game._runCount < Game._MAX_RUNS) {
				Game.startTest();
			} else {
				console.log("test over");
				Game._players.forEach(function(player, index) {
					console.log("Player " + player.getName() + " went first " + 100*Game._firstMoveCount[index]/Game._runCount +
					"% of the time and won " + 100*Game._results[index]/Game._runCount + "% of the time");
				});
			}
		},
		
		simulateGame: function(player_list) {
			console.log("Beginning Trial " + Game._runCount + " out of " + Game._MAX_RUNS);
			
			var temp = player_list.map(function(p) {return p;});
			var players = [];

			// randomize the order
			Game._playerMapping = [];
			while(players.length < player_list.length) {
				do {
					var idx = Math.round((temp.length-1) * Math.random());
				} while (temp[idx] === null);
				
				Game._playerMapping.push(idx);
				players.push(temp[idx]);
				temp[idx] = null;				
			}
			
			console.log("Player " + players[0].getName() + " has first move");
			Game._firstMoveCount[Game._playerMapping[0]] = Game._firstMoveCount[Game._playerMapping[0]] + 1;
			Engine.init(players, Game.gameOver);
			Engine.setup();
			Renderer.clearAll();
			
			Renderer.render();
			
			Engine.startTurn(0);
		}
		
	};
});