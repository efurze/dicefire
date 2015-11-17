"use strict"

$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_runCount: 0,
		_MAX_RUNS: 100,
		_results: {},
		_whoWentFirst: {},
		_players: [AI.Aggressive, AI.Aggressive, AI.Aggressive],
		_playerMapping : [],
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		selectedCountry: function() { return Game._selectedCountry; },
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (playerCode) {
			Globals.suppress_ui = 1;
			Game._runCount = 0;
			Engine.init(Game._players.map(function(p){return p;}));
			Renderer.init(Game._players.length, Game._canvas);	
			
			// initialize the result tracking data structures
			Game._players.forEach(function(player) {
				if (!Game._results[player.getName()]) {
					var ary = [];
					ary.length = Game._players.length;
					ary.fill(0);
					Game._results[player.getName()] = ary;
				
					ary = [];
					ary.length = Game._players.length;
					ary.fill(0);
					Game._whoWentFirst[player.getName()] = ary;
				}
			});				
          
			Renderer.clearAll();
			Renderer.render();
			$('#start_test').click(Game.start);  
		},
		
		
		start: function () {
			Game._runCount = 0;
			Game.startTest();
		},
		
		startTest: function () {
			Game._runCount ++;
			window.setTimeout(function() {
				Game.simulateGame(Game._players);
			}, 0);
			
		},
		
		gameOver: function (winner, id) {
			var winner = Game._players[Game._playerMapping[id]];
			var name = winner.getName();
			
			
			console.log("Player " + id + " wins: " + name);
			Game._results[name][id] += 1;
			
			if (Game._runCount < Game._MAX_RUNS) {
				Game.startTest();
			} else {
				console.log("test over");
				Object.keys(Game._results).forEach(function(name) {
					console.log(name + " : " + 
						JSON.stringify(Game._results[name].map(function(won, idx) {
							return won + "/" + Game._whoWentFirst[name][idx];
						})));
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
			
			Game._playerMapping.forEach(function(id, order) {
				var playerName = Game._players[id].getName();
				Game._whoWentFirst[playerName][order] += 1;
			});
			
			
			Engine.init(players, Game.gameOver);
			Engine.setup();
			Renderer.clearAll();
			
			Renderer.render();
			
			Engine.startTurn(0);
		}
		
	};
});