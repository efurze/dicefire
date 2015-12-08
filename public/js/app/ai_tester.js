"use strict"

var GameRepeater = function(players, runCount) {
	this._currentRun = 0;
	this._runCount = runCount;
	this._players = players.map(function(p){return p;});
	this._playerMapping = [];
	this._whoWentFirst = {};
	this._results = {};
	this._callback = null;
	this._engine = null;
};

GameRepeater.prototype.start = function(callback) {
	var self = this;
	Renderer.init(self._players.length, AI_Tester._canvas);
	self._callback = callback;
	self._currentRun = 0;
	self._playerMapping = [];
	self._whoWentFirst = {};
	self._results = {};
	self._players.forEach(function(player) {
		self._whoWentFirst[player.getName()] = [];
		self._whoWentFirst[player.getName()].length = self._players.length;
		self._whoWentFirst[player.getName()].fill(0);
		
		self._results[player.getName()] = [];
		self._results[player.getName()].length = self._players.length;
		self._results[player.getName()].fill(0);
	});
	self.simulateGame();
};

GameRepeater.prototype.gameOver = function (winner, id) {
	var self = this;
	
	var winner = self._players[self._playerMapping[id]];
	var name = winner.getName();
	
	
	console.log("Player " + id + " wins: " + name);
	self._results[name][id] += 1;
	
	if (self._currentRun < self._runCount) {
		self.simulateGame();
		if (self._callback) {
			self._callback(self._results, self._whoWentFirst);
		}
	} else {
		console.log("test over");
		if (self._callback) {
			var cb = self._callback;
			var results = self._results;
			var whoWentFirst = self._whoWentFirst;
			self._whoWentFirst = null;
			self._results = null;
			self._callback = null;
			cb(results, whoWentFirst);
		} else {
			Object.keys(self._results).forEach(function(name) {
				console.log(name + " : " + 
					JSON.stringify(self._results[name].map(function(won, idx) {
						return won + "/" + self._whoWentFirst[name][idx];
					})));
			});
		}
	}
	
	
};

GameRepeater.prototype.simulateGame = function() {
	var self = this;
	console.log("Beginning Trial " + self._currentRun + " out of " + self._runCount);
	
	var temp = self._players.map(function(p) {return p;});
	var players = [];

	// randomize the order
	self._playerMapping = [];
	while(players.length < self._players.length) {
		do {
			var idx = Math.round((temp.length-1) * Math.random());
		} while (temp[idx] === null);
		
		self._playerMapping.push(idx);
		players.push(temp[idx]);
		temp[idx] = null;				
	}
	
	self._playerMapping.forEach(function(id, order) {
		var playerName = self._players[id].getName();
		self._whoWentFirst[playerName][order] += 1;
	});
	
	self._currentRun ++;
	
	self._engine = new Engine();
	self._engine.init(players.map(function(p){return p;}), self.gameOver.bind(self));
	self._engine.setup();
	Renderer.clearAll();
	
	Renderer.render(self._engine.getState());
	
	self._engine.startTurn(0);
};

// the idea here is you give it an AI, and this will run all combinations of that AI.
// You can see the how it does in 2 person games vs itself, 3 person games vs itself, etc
var runAllPlayerCounts = function(player, runs_per) {
	this._player = player;
	this._runs_per = runs_per;
	this._runner = null;
	this._collatedResults = [];
	this._collatedRunTrackers = [];
	this._players = [];
};

runAllPlayerCounts.prototype.start = function() {
	// start with 2-player game
	this._players = [this._player, this._player];
	this.doMatchup();
};

runAllPlayerCounts.prototype.doMatchup = function() {
	this._runner = new GameRepeater(this._players, this._runs_per);
	this._runner.start(this.matchupDone.bind(this));
}

runAllPlayerCounts.prototype.matchupDone = function(results, runTracker) {
	var self = this;
	
	// save results
	self._collatedResults.push(results);
	self._collatedRunTrackers.push(runTracker);
	
	if (self._players.length < 8) {
		// add another player and do it again
		self._players.push(self._player);
		self.doMatchup();
	} else {
		
		self._collatedResults.forEach(function(result, run) {
			Object.keys(result).forEach(function(name) {
				console.log(name + " : " + 
					JSON.stringify(result[name].map(function(won, idx) {
						return won + "/" + self._collatedRunTrackers[run][name][idx];
					})));
			});
		});
	}
};

$(function() {

	
	window.AI_Tester = {
		
		_canvas: document.getElementById("c"),
		_players: [],
		_runner: null,
				
		init: function (playerCode) {
			$('#setup').css('display', 'block');
			$('#results_div').css('display', 'none');
			$('#game').css('display', 'none');
			
			Globals.suppress_ui = true;
			
			$('#start_game').click(Testercontroller.startGame);
			Testercontroller.init(AI_Tester.start);
		},
		
		
		/*
			results = {
				"Plyer" : [2, 54, 345]  // wins by position
			}
			
			runTracker = {
				"Plyer" : [23, 23, 43] // # of times playing in that position
			}
		*/
		simulationDone: function(results, runTracker) {
			Testerrenderer.update(results, runTracker);
		},
		
		
		start: function (players, runCount) {
			$('#setup').css('display', 'none');
			
			AI_Tester._players = players.map(function(p){return p;});
			runCount = runCount || 5;
			
			Testerrenderer.init(players, $('#results_div'));
			
			$('#results').css('width', '75%');
			$('#results').css('text-align', 'left');
			$('#results').css('table-layout', 'fixed');
			$('#results_div').css('display', 'block');
			
			//var runner = new runAllPlayerCounts(AI.Plyer, 100);
			//runner.start();
			
			AI_Tester._runner = new GameRepeater(players, runCount);
			AI_Tester._runner.start(AI_Tester.simulationDone);
		},
		
		
	};		
});