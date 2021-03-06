/* jslint node: true */

var rwClient = require('./redisWrapper');
var logger = require('./logger');
var bluebirdPromise = require('bluebird');
var Gameinfo = require('../public/js/app/game/gameinfo');

var DEFAULT_RATING = 1500;

module.exports = {

	// @gameInfo = Gameinfo
	updateEloForResult: function(gameInfo) {
		logger.log("eloFromResults", gameInfo, logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
		if (gameInfo.hasBeenRated()) {
			logger.log("game already rated, skipping", gameInfo, logger.LEVEL.INFO, logger.CHANNEL.RATER);
			return null;
		}

		var ratings = {}; // pid to rating history
		var newRatings = {};
		gameInfo = Gameinfo.deserialize(gameInfo.serialize()); 

		// get current ratings for all players
		return bluebirdPromise.all(gameInfo.getPlayers().map(function(player) {
			return rwClient.getAI(player)
				.then(function(ai) {
					// initialize the ratings map
					ai = JSON.parse(ai);
					ratings[player] = ai.eloRating ? ai.eloRating : DEFAULT_RATING;
					gameInfo.setEloPreRating(player, ratings[player]);
					logger.log("player", player, "initialized rating to", ratings[player], logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
				});
		})).then(function() {
			newRatings = updateElo(ratings, gameInfo);
			logger.log("Updated ratings", newRatings, logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
			// update gameInfo post ratings
			Object.keys(ratings).forEach(function(player) {
				gameInfo.setEloPostRating(player, newRatings[player]);
			});
			return gameInfo;	
		});
	},


	updateAllRatings: function() {
		logger.log("updateAllRatings", logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
		return rwClient.getArenaGames()
			.then(function(games) { // @games = array[<gameId>]
				logger.log("Got arena games", games, logger.LEVEL.DEBUG, logger.CHANNEL.RATER);

				return bluebirdPromise.each(games, function(gameId) {
					return rwClient.getGameInfo(gameId)
						.then(function(gameInfo) {
							logger.log("Rating game", gameId, logger.LEVEL.INFO, logger.CHANNEL.RATER);
							return module.exports.updateEloForResult(gameInfo);
						})
						.then(function(gameInfo) {
							if (gameInfo) {

								return updatePlayerRatings(gameInfo)
									.then(function() {
										logger.log("Updated AI ratings for game", logger.LEVEL.INFO, logger.CHANNEL.RATER);
										return rwClient.saveGameInfo(gameId, gameInfo);
									})
									.then(function() {
										logger.log("Updated gameInfo", gameId, logger.LEVEL.INFO, logger.CHANNEL.RATER);
									});
							}
						})
						.catch(function(err) {
							logger.log("updateAllRatings error", err.toString(), logger.LEVEL.ERROR, logger.CHANNEL.RATER);
						});
				});
			});
	},
};


var updatePlayerRatings = function(gameInfo) {
	// update ratings for each player
	return bluebirdPromise.all(gameInfo.getPlayers().map(function(player) {
		return setAIRating(player, gameInfo.getEloPostRating(player));
	}));
};

// @player = <String>
// @rating = <int>
var setAIRating = function (player, rating) {
	return rwClient.getAI(player) 
		.then(function(ai) {
			if (ai) {
				ai = JSON.parse(ai);
				logger.log("updating player " + player + " rating from " + ai.eloRating + " to " + rating, 
									logger.LEVEL.INFO, logger.CHANNEL.RATER);
				ai.eloRating = rating;
				return rwClient.saveAI(player, JSON.stringify(ai));
			}
		});
};


// for games of 2 + n players, updates ratings by considering it an (n+1)-sequence
// of 2 player games
// @gameInfo = Gameinfo object
var updateElo = function(oldRatings, gameInfo) {
	logger.log("updateElo", oldRatings, gameInfo, logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
	var newRatings = JSON.parse(JSON.stringify(oldRatings));
	var players = gameInfo.getPlayers();
	var winnerIdx = gameInfo.getWinner();
	var winner = players[winnerIdx];
	
	players.forEach(function(loser, idx) {
		if (idx == winnerIdx) {
			return;
		}
		var subPlayers = [winner, loser];
		var subResult = {winner: 0, players: [winner, loser]};
		var delta = calculateEloDelta(oldRatings, subResult);
		
		newRatings[winner] += delta[0];
		newRatings[loser] += delta[1];

		newRatings[winner] = Math.round(newRatings[winner]);
		newRatings[loser] = Math.round(newRatings[loser]);
	});
	
	
	return newRatings;
};

// assumes 2-player game
// @ratings = {pid1: rating, pid2: rating}
// @result = {winner: 0, players: [pid1, pid2]}
var calculateEloDelta = function (oldRatings, result) {
	var players = result.players;

	if (players[0] == players[1]) {
		return [0,0];
	}

	var gameSize = players.length;
	
	var expectedResults = eloExpectedResults(oldRatings, players);
	
	var winnerIdx = result.winner;
	var winner = players[winnerIdx];
		
	var kFactor = 24;
	var adjustments = players.map(function(player, idx) {
		var result = (idx == winnerIdx) ? 1 : 0;
		return kFactor*(result - expectedResults[idx]);
	});

	return adjustments;
};


// @ratings = {'Plyer 1.0' : 1230, 'Aggressive' : 1000'}
// @players = ['Plyer 1.0', 'Aggressive'] *IN THE ORDER* in which they played
//
// @return = [.87, .13] each players' chance of winning. Must sum to 1.
var eloExpectedResults = function (ratings, players) {
	var rating0 = ratings[players[0]];
	var rating1 = ratings[players[1]];
	var expected = [ (1 / (1 + Math.pow(10, (rating1 - rating0)/400) ) ),
				 	 (1 / (1 + Math.pow(10, (rating0 - rating1)/400) ) ) ];
	
	return expected;
};