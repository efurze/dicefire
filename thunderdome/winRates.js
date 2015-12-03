"use strict"

var fs = require('fs');


var WinRates = function(dir) {
	this._dir = dir || "./results";
};

WinRates.prototype.calculate = function() {
	var self = this;
	var results = {};
	var gameTypes = fs.readdirSync(self._dir + "/matches"); // eg "2players", "3players" etc
	gameTypes.forEach(function(subdir) {
		var gameTypeRate = self.calculateGameType(self._dir + "/matches/" + subdir);
		results[subdir] = gameTypeRate;
	});
	
	console.log(results);
};


WinRates.prototype.calculateGameType = function(dir) {
	var self = this;
	var wins = [];
	var matches = fs.readdirSync(dir);
	matches.forEach(function(match) {
		var matchDir = dir + '/' + match;
		var results = JSON.parse(fs.readFileSync(matchDir + '/results.json', 'utf8'));
		var keys = Object.keys(results);
		if (!wins.length) {
			wins.length = keys.length - 1;
			for (var i=0; i < wins.length; i++) {
				wins[i] = 0;
			}
		}
		var winnerId = parseInt(results.winner) - 1;
		wins[winnerId] ++;
	});
	
	var winRate = wins.map(function(total) {
		return (total/matches.length).toPrecision(3);
	});
	
	return winRate;
};

var rate = new WinRates();
rate.calculate();
