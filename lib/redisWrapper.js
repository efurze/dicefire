/* jslint node: true */

var bluebirdPromise = require('bluebird');
var redis = require('redis');
var Gameinfo = require('../public/js/game/gameinfo');
var logger = null;

bluebirdPromise.promisifyAll(redis.RedisClient.prototype);
bluebirdPromise.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(); //6379, 'localhost', '');

var KEYS = {
	CLIENT_ERROR: function(timestamp, gameId) {return ['error', 'client', timestamp, gameId].join(':');},
	CLIENT_ERROR_LIST: function() {return ['error', 'client', 'list'].join(':');},
	SERVER_LOG: function() {return ['log', 'server'].join(':');},
	
	ACTIVE_GAME: function(gameId) {return ['active', gameId].join(':');},
	
	GAME_LIST: function() {return 'gamelist';},
	ARENA_GAME_LIST: function() {return 'arena';},
	LADDER_GAME_LIST: function() {return 'ladder';},
	MAP: function(gameId) {return 'game:' + gameId + ':map';},
	GAME_INFO: function(gameId) {return 'game:' + gameId + ':gameInfo';},
	STATE: function(gameId, stateId) {return 'game:' + gameId + ":state:" + stateId;},
	STATE_COUNT: function(gameId) {return 'game:' + gameId + ":state:*";},
	SERVER_STATE: function(gameId) {return 'serverstate:' + gameId;},
	
	AI_LIST: function() {return 'ailist';},
	AI: function(aiHash) {return 'ai:' + aiHash;},
	AI_TEMP: function(aiHash) {return 'aiTemp:' + aiHash;},
	AI_GAMES: function(aiHash) {return 'ai:' + aiHash + ':games';},
};

module.exports = {
	
	clientErrorReport: function(msg, gameId) {
		var key = KEYS.CLIENT_ERROR(Date.now(), gameId);
		return redisClient.setAsync(key, msg)
			.then(function() {
				redisClient.lpushAsync(KEYS.CLIENT_ERROR_LIST(), key);
			});
	},
	
	// retuns a sorted array of {timestamp: , gameId: }, most recent timestamp first
	getClientErrorReportList: function() {
		return redisClient.lrangeAsync(KEYS.CLIENT_ERROR_LIST(), 0, 100)
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
		return redisClient.delAsync(KEYS.ACTIVE_GAME(gameId))
					.then(function() {
						return module.exports.delServerState(gameId);
					});
	},
	
	saveMap: function(gameId, map) {
		return redisClient.setAsync(KEYS.MAP(gameId), map);
	},
	
	getMap: function(gameId) {
		return redisClient.getAsync(KEYS.MAP(gameId));
	},
	
	saveGameInfo: function(gameId, gameInfo) {
		getLogger().ASSERT(gameInfo instanceof Gameinfo);
		return redisClient.setAsync(KEYS.GAME_INFO(gameId), gameInfo.toString());
	},
	

	// returns: Gameinfo object
	getGameInfo: function(gameId) {
		return redisClient.getAsync(KEYS.GAME_INFO(gameId))
			.then(function(str) {
				return str ? Gameinfo.fromString(str) : null;
			});
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
	
	delAIGames: function(aiHash) {
		return redisClient.delAsync(KEYS.AI_GAMES(aiHash));
	},
	
	// @data: {code: ,name: ,wins: ,losses: ,eloRating: ,avgMoveTime:, avgCount:}
	saveAI: function(aiHash, data) { 
		return redisClient.setAsync(KEYS.AI(aiHash), data);
	},
	
	// returns : {code: ,name: ,wins: ,losses: ,eloRating:  avgMoveTime:, avgCount:}
	getAI: function(aiHash, isTemp) {
		isTemp = isTemp || false;
		if (isTemp) {
			return redisClient.getAsync(KEYS.AI_TEMP(aiHash));
		} else {
			return redisClient.getAsync(KEYS.AI(aiHash));
		}
	},
	
	saveTempAI: function(aiHash, data, ttl) {
		return redisClient.setAsync(KEYS.AI_TEMP(aiHash), data)	
					.then(function() {
						redisClient.expireAsync(KEYS.AI_TEMP(aiHash), ttl);
					});
	},

	makeAIPermanent: function(aiHash) {
		return redisClient.renameAsync(KEYS.AI_TEMP(aiHash), KEYS.AI(aiHash))
					.then(function() {
						// remove the timeout
						return redisClient.persistAsync(KEYS.AI(aiHash));
					});
	},

	saveServerState: function(gameId, data) {
		return redisClient.setAsync(KEYS.SERVER_STATE(gameId), data);
	},

	getServerState: function(gameId) {
		return redisClient.getAsync(KEYS.SERVER_STATE(gameId));
	},

	delServerState: function(gameId) {
		return redisClient.delAsync(KEYS.SERVER_STATE(gameId));
	},

	//=========================================================================================================
	// Util functions - should probably go in another file
	//=========================================================================================================

	// @gameInfo = {winner: <int>, players: name_array, avgTimes: array[<int>]}
	// @ratingCode (optional) = 'ARENA' or 'LADDER'
	recordGame: function (gameId, gameInfo, ratingCode /*optional*/) {
		getLogger().log("recordGame", gameInfo, ratingCode, logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT, gameId);
		gameInfo.setTimestamp(Date.now());

		 return module.exports.saveGameInfo(gameId, gameInfo, ratingCode)
		 	.then(function(reply) {
				
				if (typeof gameInfo.getWinner() === 'undefined') {
					logger.log("no winner specified", logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT, gameId);
					return;
				}
				
				var uniquePlayers = {};
				gameInfo.getPlayers().forEach(function(player) {
					uniquePlayers[player] = true;
				});

				logger.log("recording player results", logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT, gameId);

				// record the win and loss for each player
				return bluebirdPromise.each(Object.keys(uniquePlayers), function(player, idx) {
					if (idx == gameInfo.getWinner()) {
						return module.exports.recordWin(player);
					} else {
						return module.exports.recordLoss(player);
					}
				}).then(function() {
					if (ratingCode == "ARENA") {
						logger.log("recording AI history", logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT, gameId);
						// Add the game to each AI's history
						return bluebirdPromise.each(Object.keys(uniquePlayers), function(player) {
							return module.exports.pushAIGame(player, gameId);
						}).then(function() {
							// record average move times
							gameInfo.getPlayers().forEach(function(player, idx) {
								return module.exports.updateAvgMoveTime(player, gameInfo.avgTime(idx));
							});
						});
					} else {
						return;
					}
				}).then(function() {
					logger.log("creating entry in game log", logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT, gameId);
					// Add the game to the overall history
					return module.exports.pushGame(gameId);
				}).then(function() {
					if (ratingCode == "ARENA") {
						// mark this game as an arena game for rating purposes
						logger.log("Adding arena result", logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT, gameId);
						return module.exports.addArenaGame(gameId);
					} else if (ratingCode == "LADDER") {
						// mark this game as ladder game for rating purposes
						logger.log("Adding ladder result", logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT, gameId);
						return module.exports.addLadderGame(gameId);
					}
				});
			});
	},


	updateAvgMoveTime: function(uid, time) {
		getLogger().log("updateAvgMoveTime", uid, logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT);
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
				logger.log("Error updating avgMoveTime", err, logger.LEVEL.ERROR, logger.CHANNEL.DEFAULT);
			});
	},


	recordWin:function(uid) {
		getLogger().log("recordWin", uid, logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT);
		return module.exports.getAI(uid)
			.then(function(str) {
				var info = JSON.parse(str);
				if (!info || !str) {
					// unknown player
					return;
				}

				if (!info.hasOwnProperty('wins')) {
					info.wins = 0;
				}
				info.wins ++;
				return module.exports.saveAI(uid, JSON.stringify(info));
		
			}).catch(function(err) {
				logger.log("Error recording win", err, err.toString(), logger.LEVEL.ERROR, logger.CHANNEL.DEFAULT);
			});
	},

	recordLoss: function(uid) {
		getLogger().log("recordLoss", uid, logger.LEVEL.DEBUG, logger.CHANNEL.DEFAULT);
		return module.exports.getAI(uid)
			.then(function(str) {
				var info = JSON.parse(str);
				if (!info || !str) {
					// unknown player
					return;
				}
				if (!info.hasOwnProperty('losses')) {
					info.losses = 0;
				}
				info.losses ++;
				return module.exports.saveAI(uid, JSON.stringify(info));
		
			}).catch(function(err) {
				logger.log("Error recording loss", err, err.toString(), logger.LEVEL.ERROR, logger.CHANNEL.DEFAULT);
			});
	},

};

var getLogger = function() {
	if (!logger) {
		logger = require('./logger.js');
	}
	return logger;
};