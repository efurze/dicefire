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
Rating.prototype.calculateFromResults = function (results, randomize) {
	var self = this;
	randomize = randomize || false;
	var ratings = {};
	var reordered = [];
	
	if (randomize) {
		while (results.length) {
			// pick a random game
			var idx = Math.round(Math.random() * (results.length-1));
			reordered.push(results[idx]);
			results.splice(idx, 1);
		}
	} else {
		reordered = results;
	}
	
	reordered.forEach(function(result, idx) {	
		console.log("");
		console.log("Game", idx+1);
		var players = self.extractPlayers(result);
		players.forEach(function(player) {
			if (!ratings.hasOwnProperty(player)) {
				// never seen this player before - give it the default rating
				ratings[player] = self._defaultRating;
			}
		});
		//console.log("initial ratings: ", JSON.stringify(ratings));
		//console.log("results:", JSON.stringify(result));
		ratings = self.updateRatings(ratings, players, result);
		console.log("updated ratings: ", JSON.stringify(ratings));
	});
};

// @ratings = {'Plyer 1.0' : 1230, 'Aggressive' : 1000'}
// @players = ['Plyer 1.0', 'Aggressive'] *IN THE ORDER* in which they played
//
// @return = [.87, .13] each players' chance of winning. Must sum to 1.
Rating.prototype.expectedResults = function (ratings, players) {
	var rating0 = ratings[players[0]];
	var rating1 = ratings[players[1]];
	var expected = [ (1 / (1 + Math.pow(10, (rating1 - rating0)/400) ) ),
				 	 (1 / (1 + Math.pow(10, (rating0 - rating1)/400) ) ) ];
	
	return expected;
};

// for games of 2 + n players, updates ratings by considering it an (n+1)-sequence
// of 2 player games
// @result = { winner: 1, player1: 'Greedy 1.0', player2: 'Plyer 1.0' }
Rating.prototype.updateRatings = function (oldRatings, players, result) {
	var self = this;
	var newRatings = JSON.parse(JSON.stringify(oldRatings));
	var winnerIdx = result.winner - 1;
	var winner = players[winnerIdx];
	
	players.forEach(function(loser, idx) {
		if (idx == winnerIdx) {
			return;
		}
		var subPlayers = [winner, loser];
		var subResult = {winner: 1, player1: winner, player2: loser};
		var delta = self.calculateRatingsDelta(oldRatings, subPlayers, subResult);
		
		newRatings[winner] += delta[0];
		newRatings[loser] += delta[1];
	});
	
	
	return newRatings;
}
	
Rating.prototype.calculateRatingsDelta = function (oldRatings, players, result) {
	if (players[0] == players[1]) {
		return [0,0];
	}
	var gameSize = players.length;
	
	var expectedResults = this.expectedResults(oldRatings, players);
	
	var winnerIdx = result.winner - 1;
	var winner = players[winnerIdx];
		
	var newRatings = JSON.parse(JSON.stringify(oldRatings));
	var kFactor = 24;
	var adjustments = players.map(function(player, idx) {
		var result = (idx == winnerIdx) ? 1 : 0;
		return kFactor*(result - expectedResults[idx]);
	});
	
	return adjustments;
};

// @result = { winner: 1, player1: 'Greedy 1.0', player2: 'Plyer 1.0' }
// @return:  ['Greedy 1.0', 'Plyer 1.0']
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
// @return = [
//				{"winner":1,"player1":"Plyer 1.0","player2":"Aggressive"},
//				{"winner":2,"player1":"Plyer 1.0","player2":"Greedy"}, ...
//			]
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
var results = [];
//results = results.concat(rating.aggregateResults('/Users/efurze/working/thunderdome_data/results/matches/2players'));
//results = results.concat(rating.aggregateResults('/Users/efurze/working/thunderdome_data/results/matches/3players'));
//results = results.concat(rating.aggregateResults('/Users/efurze/working/thunderdome_data/results/matches/4players'));
//results = results.concat(rating.aggregateResults('/Users/efurze/working/thunderdome_data/results/matches/5players'));
//results = results.concat(rating.aggregateResults('/Users/efurze/working/thunderdome_data/results/matches/6players'));
//results = results.concat(rating.aggregateResults('/Users/efurze/working/thunderdome_data/results/matches/7players'));
results = results.concat(rating.aggregateResults('/Users/efurze/working/thunderdome_data/results/matches/8players'));
rating.calculateFromResults(results, true);
