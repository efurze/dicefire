'use strict'

var fs = require('fs');

var sourceDir = '../public/js';
var Globals = require(sourceDir + '/globals.js');


var winRates = 	{ '2': [ '0.924', '0.0756' ],
	  '3': [ '0.647', '0.226', '0.128' ],
	  '4': [ '0.438', '0.215', '0.201', '0.146' ],
	  '5': [ '0.328', '0.191', '0.168', '0.0992', '0.214' ],
	  '6': [ '0.196', '0.225', '0.152', '0.138', '0.130', '0.159' ],
	  '7': [ '0.179', '0.160', '0.136', '0.123', '0.123', '0.142', '0.136' ],
	  '8': [ '0.0822','0.110', '0.116', '0.185', '0.164', '0.151', '0.116','0.0753' ] }

var Rating = function() {
	this._defaultRating = 1000;
};

// @results = [{ winner: 1, player1: 'Greedy 1.0', player2: 'Plyer 1.0' },...]
Rating.prototype.calculateFromResults = function (results) {
	var self = this;
	var ratings = {};
	
	results.forEach(function(result) {
		var players = self.extractPlayers(result);
		
		players.forEach(function(player) {
			if (!ratings.hashOwnProperty(player)) {
				// never seen this player before - give it the default rating
				ratings[player] = self._defaultRating;
			}
			
			
		});
	});
};

Rating.prototype.updateRatings = function (oldRatings, players, result) {
	var newRatings = JSON.parse(JSON.stringify(oldRatings));
	
	var gameSize = players.length;
	var expectedResults = players.map(function(player, idx) {
		return (winRates[gameSize][idx] * oldRatings[player]);
	});
	
	var normalizationFactor = expectedResults.reduce(function(total, val) {
		return total + val;
	});
	
	// make all expected results sum to 1
	expectedResults = expectedResults.map(function(val) {
		return val/normalizationFactor;
	});
	
	var winnerIndex = result.winner - 1;
	
	var deltas = expectedResults.map(function(val, index) {
		if (index == winnerIndex) {
			return 1 - val;
		} else {
			return 0 - val;
		}
	})
	
	return newRatings;
};

// @result = { winner: 1, player1: 'Greedy 1.0', player2: 'Plyer 1.0' }
Rating.prototype.extractPlayers = function (result) {
	var players = [];
	var keys = Object.keys(result);
	players.length = keys.length - 1; // subtract 1 for 'winner'
	
	keys.forEach(function(key) {
		if (key == "winner") {
			return;
		}
		if (key.substring(0, 6) == "player" && key.length == 7) {
			var index = parseInt(key.charAt(6)) - 1;
			players[index] = result[key];
		} else {
			console.log("Weird key name: " + key);
		}
	});
	
	players.forEach(function(player) {
		Globals.ASSERT(player);
	});
	
	return players;
}

// dir is something like "/thunderdome/results/matches/3players"
// This func goes through each subdir and loads the 'results.json' file
Rating.prototype.aggregateResults = function (dir) {
	var self = this;
	var results = [];
	var matchDirs = fs.readdirSync(dir);
	matchDirs.forEach(function(matchName) {
		var subdir = dir + '/' + matchName;
		var resultsFile = subdir + '/results.json';
		if (fs.existsSync(resultsFile)) {
			var matchResults = JSON.parse(fs.readFileSync(resultsFile));
			results.push(matchResults);
		}
	});
	
	return results;
}


var rating = new Rating();
var results = rating.aggregateResults('/Users/efurze/working/thunderdome_data/results/matches/2players');
rating.calculateFromResults(results);
