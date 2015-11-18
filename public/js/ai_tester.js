"use strict"

var GameRepeater = function(players, runCount) {
	this._currentRun = 0;
	this._runCount = runCount;
	this._players = players.map(function(p){return p;});
	this._playerMapping = [];
	this._whoWentFirst = {};
	this._results = {};
};

GameRepeater.prototype.start = function() {
	var self = this;
	Renderer.init(self._players.length, Game._canvas);
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
	} else {
		console.log("test over");
		Object.keys(self._results).forEach(function(name) {
			console.log(name + " : " + 
				JSON.stringify(self._results[name].map(function(won, idx) {
					return won + "/" + self._whoWentFirst[name][idx];
				})));
		});
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
	
	Engine.init(players, self.gameOver, self);
	Engine.setup();
	Renderer.clearAll();
	
	Renderer.render();
	
	Engine.startTurn(0);
};

$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_players: [AI.Aggressive, AI.Aggressive],
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		selectedCountry: function() { return Game._selectedCountry; },
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (playerCode) {
			Globals.suppress_ui = 1;
			$('#start_test').click(Game.start);  
		},
		
		
		start: function () {
			var runner = new GameRepeater(Game._players, 20);
			runner.start();
		},
	};		
});