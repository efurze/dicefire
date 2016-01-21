'use strict'

var rwClient = require('./redisWrapper');
var logger = require('./logger');
var Promise = require('bluebird');

var DEFAULT_RATING = 1500;

module.exports = {

	// @gameInfo = {winner: 0, players[pid1, pid2...]}
	eloFromResult: function(gameInfo) {
		gameInfo = JSON.parse(gameInfo);
		logger.log("eloFromResults", gameInfo, logger.LEVEL.INFO, logger.CHANNEL.RATER);
		var ratings = {}; // pid to rating history

		logger.log("players:", gameInfo.players, logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
		return Promise.all(gameInfo.players.map(function(player) {
			return rwClient.getAIRatingHistory(player)
				.then(function(ratingHistory) {
					// initialize the ratings map
					var latest = 0;
					if (ratingHistory && ratingHistory.length) {
						latest = ratingHistory[ratingHistory.length-1];
					}
					ratings[player] = latest ? latest : DEFAULT_RATING;
					logger.log("player", player, "initialized rating to", ratings[player], logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
				});
		})).then(function() {
			ratings = updateElo(ratings, gameInfo);
			logger.log("Updated ratings", ratings, logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
			return ratings;	
		});
	},


	updateAllRatings: function() {
		logger.log("updateAllRatings", logger.LEVEL.INFO, logger.CHANNEL.RATER);
		return rwClient.getArenaGames()
			.then(function(games) { // @games = array[<gameId>]
				logger.log("Got arena games", games, logger.LEVEL.DEBUG, logger.CHANNEL.RATER);

				games.forEach(function(game) {
					rwClient.getGameInfo(game)
						.then(function(gameInfo) {
							return module.exports.eloFromResult(gameInfo);
						})
						.then(function(updatedRating) {
							return Promise.all(Object.keys(updatedRating).map(function(player) {
								// save new rating
								return rwClient.pushAIRating(player, updatedRating[player]);
							}));
						})
						.catch(function(err) {
							logger.log("updateAllRatings error", err.toString(), logger.LEVEL.ERROR, logger.CHANNEL.RATER);
						});
				});
			});

	/*
				return Promise.all(games.map(function(game) {
					return rwClient.getGameInfo(game);
				}));
			})
			.then(function(gameInfos) { // @gameInfos = array[gameInfo]
				logger.log("Got gamesInfos", gameInfos.length, logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
				return Promise.all(gameInfos.map(function(gameInfo) {
					return module.exports.eloFromResult(gameInfo);
				 }));
			})
			.then(function(gameRatings) {
				// collate the results into a history for each player
				var ratingsHistories = {}; // playerId => array[rating]
				gameRatings.forEach(function(gameRating) {
					Object.keys(gameRating).forEach(function(player) {
						if (!ratingsHistories[player]) {
							ratingsHistories[player] = [];
						} 
						ratingsHistories[player].push(gameRating[player]);
					});
				});
		 	})
			.catch(function(err) {
				logger.log("updateAllRatings error", err.toString(), logger.LEVEL.ERROR, logger.CHANNEL.RATER);
			});
*/
	},
};



// for games of 2 + n players, updates ratings by considering it an (n+1)-sequence
// of 2 player games
// @result = { winner: 1, players: [] }
var updateElo = function(oldRatings, result) {
	logger.log("updateElo", oldRatings, result, logger.LEVEL.DEBUG, logger.CHANNEL.RATER);
	var newRatings = JSON.parse(JSON.stringify(oldRatings));
	var players = result.players;
	var winnerIdx = result.winner;
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
	});
	
	
	return newRatings;
};


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