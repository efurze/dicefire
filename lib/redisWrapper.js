'use strict'

var Promise = require('bluebird');
var redis = require('redis');
var logger = null;

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(); //6379, 'localhost', '');

var KEYS = {
	CLIENT_ERROR: function(timestamp, gameId) {return ['error', 'client', timestamp, gameId].join(':');},
	CLIENT_ERROR_LIST: function() {return ['error', 'client', '*'].join(':');},
	SERVER_LOG: function() {return ['log', 'server'].join(':');},
	
	ACTIVE_GAME: function(gameId) {return ['active', gameId].join(':');},
	
	GAME_LIST: function() {return 'gamelist';},
	ARENA_GAME_LIST: function() {return 'arena';},
	LADDER_GAME_LIST: function() {return 'ladder';},
	MAP: function(gameId) {return 'game:' + gameId + ':map';},
	GAME_INFO: function(gameId) {return 'game:' + gameId + ':gameInfo';},
	STATE: function(gameId, stateId) {return 'game:' + gameId + ":state:" + stateId;},
	STATE_COUNT: function(gameId) {return 'game:' + gameId + ":state:*";},
	
	AI_LIST: function() {return 'ailist';},
	AI: function(aiHash) {return 'ai:' + aiHash;},
	AI_GAMES: function(aiHash) {return 'ai:' + aiHash + ':games';},
	AI_RATING_HISTORY: function(aiHash) {return 'ai:rating_history:' + aiHash;}	
};

module.exports = {
	
	clientErrorReport: function(msg, gameId) {
		return redisClient.setAsync(KEYS.CLIENT_ERROR(Date.now(), gameId), msg);
	},
	
	// retuns array of {timestamp: , gameId: }
	getClientErrorReportList: function() {
		// TODO: FIXME: don't use keys here. 
		return redisClient.keysAsync(KEYS.CLIENT_ERROR_LIST())
			.then(function(keys) { // should be array of error:client:23948237:3e8273-22898a
				var ret = keys.map(function(key) {
					var parts = key.split(':');
					return {timestamp: parts[2], gameId: parts[3]};
				});
				return ret;
			});
	},
	
	getClientErrorReport: function(timestamp, gameId) {
		return redisClient.getAsync(KEYS.CLIENT_ERROR(timestamp, gameId));
	},
	
	serverLog: function(msg, channel, level, gameId) {
		return redisClient.lpushAsync(KEYS.SERVER_LOG(), JSON.stringify({
			channel: channel,
			level: level,
			gameId: gameId,
			msg: msg,
			timestamp: Date.now()
		}));
	},
	
	// returns a STRING of: array of {channel:, level:, gameId:, msg:, timestamp:}
	getServerLog: function() {
		return redisClient.lrangeAsync(KEYS.SERVER_LOG(), 0, 100);
	},
	
	
	addArenaGame: function(gameId) {
		return redisClient.rpushAsync(KEYS.ARENA_GAME_LIST(), gameId);
	},

	addLadderGame: function(gameId) {
		return redisClient.rpushAsync(KEYS.LADDER_GAME_LIST(), gameId);
	},

	getLadderGames: function() {
		return redisClient.lrangeAsync(KEYS.LADDER_GAME_LIST(), 0, -1);
	},

	getArenaGames: function() {
		return redisClient.lrangeAsync(KEYS.ARENA_GAME_LIST(), 0, -1);
	},

	
	addActiveGame: function(gameId, timestamp) {
		return redisClient.setAsync(KEYS.ACTIVE_GAME(gameId), timestamp);
	},
	
	// returns an array of gameIds
	getActiveGames: function() {
		return redisClient.keysAsync(KEYS.ACTIVE_GAME('*'))
			.then(function(keys) { // array of "active:gameId"
				return keys.map(function(key) {
					return key.split(':')[1];
				});
			});
	},
	
	removeActiveGame: function(gameId) {
		return redisClient.delAsync(KEYS.ACTIVE_GAME(gameId));
	},
	
	saveMap: function(gameId, map) {
		return redisClient.setAsync(KEYS.MAP(gameId), map);
	},
	
	getMap: function(gameId) {
		return redisClient.getAsync(KEYS.MAP(gameId));
	},
	
	saveGameInfo: function(gameId, info) {
		return redisClient.setAsync(KEYS.GAME_INFO(gameId), info);
	},
	
	getGameInfo: function(gameId) {
		return redisClient.getAsync(KEYS.GAME_INFO(gameId));
	},
	
	saveState: function(gameId, stateId, data) {
		return redisClient.setAsync(KEYS.STATE(gameId, stateId), data);
	},
	
	getState: function(gameId, stateId) {
		return redisClient.getAsync(KEYS.STATE(gameId, stateId));
	},
	
	getStateCount: function(gameId) {
		return redisClient.keysAsync(KEYS.STATE_COUNT(gameId))
							.then(function(keys) {
								return keys.length;
							});
	},
	
	// adds gameId to list of games
	pushGame: function(gameId) {
		return redisClient.rpushAsync(KEYS.GAME_LIST(), gameId);
	},
	
	getGameList: function() {
		return redisClient.lrangeAsync(KEYS.GAME_LIST(), 0, -1);
	},
	
	// adds aiHash to the list of AIs
	pushAI: function(aiHash, aiName) {
		return redisClient.rpushAsync(KEYS.AI_LIST(), JSON.stringify({hash: aiHash, name: aiName}));
	},
	
	/*
	returns: 
	[ '{"hash":"2bddb50c85b9bb4b65af3d778e79ca8855145f5a","name":"Aggressive"}',
      '{"hash":"b7e9475e872750b5b36458d8f6ac91c8ccbb1223","name":"Plyer 1.0"}'
		...
     ]
	*/
	getAIList: function() {
		return redisClient.lrangeAsync(KEYS.AI_LIST(), 0, -1);
	},
	
	
	pushAIGame: function(aiHash, gameId) {
		return redisClient.rpushAsync(KEYS.AI_GAMES(aiHash), gameId);
	},
	
	getAIGames: function(aiHash) {
		return redisClient.lrangeAsync(KEYS.AI_GAMES(aiHash), 0, -1);
	},

	pushAIRating: function(aiHash, rating) {
		return redisClient.rpushAsync(KEYS.AI_RATING_HISTORY(aiHash), rating);
	},
	
	getAIRatingHistory: function(aiHash) {
		return redisClient.lrangeAsync(KEYS.AI_RATING_HISTORY(aiHash), 0, -1);
	},
	
	delAIGames: function(aiHash) {
		return redisClient.delAsync(KEYS.AI_GAMES(aiHash));
	},
	
	// @data: {code: , name:, wins: , losses: , avgMoveTime:, avgCount:}
	saveAI: function(aiHash, data) { 
		return redisClient.setAsync(KEYS.AI(aiHash), data);
	},
	
	// returns : {code: , name:, wins: , losses: , avgMoveTime:, avgCount:}
	getAI: function(aiHash) {
		return redisClient.getAsync(KEYS.AI(aiHash));
	},
	
	expireAI: function(aiHash, ttl) {
		return redisClient.expireAsync(KEYS.AI(aiHash), ttl);
	},

	//=========================================================================================================
	// Util functions - should probably go in another file
	//=========================================================================================================

	// @results = {winner: <int>, players: name_array, avgTimes: array[<int>]}
	// @ratingCode (optional) = 'ARENA' or 'LADDER'
	recordGame: function (gameId, results, ratingCode /*optional*/) {
		loadLogger();
		logger.log("saveGameInfo", results, ratingCode, logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);
		results.timestamp = Date.now();

		 return module.exports.saveGameInfo(gameId, JSON.stringify(results), ratingCode)
		 	.then(function(reply) {
				
				if (typeof results.winner === 'undefined') {
					logger.log("no winner specified", logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);
					return;
				}
				
				var uniquePlayers = {};
				results.players.forEach(function(player) {
					uniquePlayers[player] = true;
				});

				logger.log("recording player results", logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);

				// record the win and loss for each player
				return Promise.each(Object.keys(uniquePlayers), function(player, idx) {
					if (idx == results.winner) {
						return module.exports.recordWin(player);
					} else {
						return module.exports.recordLoss(player);
					}
				}).then(function() {
					if (ratingCode == "ARENA") {
						logger.log("recording AI history", logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);
						// Add the game to each AI's history
						return Promise.each(Object.keys(uniquePlayers), function(player) {
							return module.exports.pushAIGame(player, gameId);
						}).then(function() {
							// record average move times
							results.players.forEach(function(player, idx) {
								return module.exports.updateAvgMoveTime(player, results.avgTimes[idx]);
							});
						});
					} else {
						return;
					}
				}).then(function() {
					logger.log("creating entry in game log", logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);
					// Add the game to the overall history
					return module.exports.pushGame(gameId);
				}).then(function() {
					if (ratingCode == "ARENA") {
						// mark this game as an arena game for rating purposes
						logger.log("Adding arena result", logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);
						return module.exports.addArenaGame(gameId);
					} else if (ratingCode == "LADDER") {
						// mark this game as ladder game for rating purposes
						logger.log("Adding ladder result", logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);
						return module.exports.addLadderGame(gameId);
					}
				});
			});
	},


	updateAvgMoveTime: function(uid, time) {
		loadLogger();
		logger.log("updateAvgMoveTime", uid, logger.LEVEL.DEBUG, logger.CHANNEL.USER_AI);
		return module.exports.getAI(uid)
			.then(function(str) {
				var info = JSON.parse(str);
				if (!info.hasOwnProperty('avgMoveTime')){
					info.avgMoveTime = 0;
				}
				if (!info.hasOwnProperty('avgCount')){
					info.avgCount = 0;
				}
				info.avgMoveTime = parseInt(info.avgMoveTime);
				info.avgCount = parseInt(info.avgCount);

				info.avgMoveTime = Math.round(((info.avgMoveTime * info.avgCount) + time) / (info.avgCount+1));
				info.avgCount ++;

				return module.exports.saveAI(uid, JSON.stringify(info));
			}).catch(function(err) {
				logger.log("Error updating avgMoveTime", err, logger.LEVEL.ERROR, logger.CHANNEL.USER_AI);
			});
	},


	recordWin:function(uid) {
		loadLogger();
		logger.log("recordWin", uid, logger.LEVEL.DEBUG, logger.CHANNEL.USER_AI);
		return module.exports.getAI(uid)
			.then(function(str) {
				var info = JSON.parse(str);
				if (!info.hasOwnProperty('wins')) {
					info.wins = 0;
				}
				info.wins ++;
				return module.exports.saveAI(uid, JSON.stringify(info));
		
			}).catch(function(err) {
				logger.log("Error recording win", err, logger.LEVEL.ERROR, logger.CHANNEL.USER_AI);
			});
	},

	recordLoss: function(uid) {
		loadLogger();
		logger.log("recordLoss", uid, logger.LEVEL.DEBUG, logger.CHANNEL.USER_AI);
		return module.exports.getAI(uid)
			.then(function(str) {
				var info = JSON.parse(str);
				if (!info.hasOwnProperty('losses')) {
					info.losses = 0;
				}
				info.losses ++;
				return module.exports.saveAI(uid, JSON.stringify(info));
		
			}).catch(function(err) {
				logger.log("Error recording loss", err, logger.LEVEL.ERROR, logger.CHANNEL.USER_AI);
			});
	},

};

var loadLogger = function() {
	if (!logger) {
		logger = require('./logger.js');
	}
};