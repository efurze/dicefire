'use strict'

var Promise = require('bluebird');
var redis = require('redis');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(); //6379, 'localhost', '');

var KEYS = {
	CLIENT_ERROR: function(timestamp, gameId) {return ['error', 'client', timestamp, gameId].join(':');},
	CLIENT_ERROR_LIST: function() {return ['error', 'client', '*'].join(':');},
	SERVER_LOG: function(timestamp, gameId) {return ['log', 'server', timestamp, gameId].join(':');},
	
	GAME_LIST: function() {return 'gamelist';},
	MAP: function(gameId) {return 'game:' + gameId + ':map';},
	GAME_INFO: function(gameId) {return 'game:' + gameId + ':gameInfo';},
	STATE: function(gameId, stateId) {return 'game:' + gameId + ":state:" + stateId;},
	STATE_COUNT: function(gameId) {return 'game:' + gameId + ":state:*";},
	
	AI_LIST: function() {return 'ailist';},
	AI: function(aiHash) {return 'ai:' + aiHash;},
	AI_GAMES: function(aiHash) {return 'ai:' + aiHash + ':games';}	
};

module.exports = {
	
	clientErrorReport: function(msg, gameId) {
		return redisClient.setAsync(KEYS.CLIENT_ERROR(Date.now(), gameId), msg);
	},
	
	// retuns array of {timestamp: , gameId: }
	getClientErrorReportList: function() {
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
		return redisClient.setAsync(KEYS.SERVER_LOG(Date.now(), gameId), JSON.stringify({
			channel: channel,
			level: level,
			gameId: gameId,
			msg: msg
		}));
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
		return redisClient.keysAsync(KEYS.STATE_COUNT(gameId));
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
	
	// @data: {code: , name:, wins: , losses: ,}
	saveAI: function(aiHash, data) { 
		return redisClient.setAsync(KEYS.AI(aiHash), data);
	},
	
	getAI: function(aiHash) {
		return redisClient.getAsync(KEYS.AI(aiHash));
	},
	
	expireAI: function(aiHash, ttl) {
		return redisClient.expireAsync(KEYS.AI(aiHash), ttl);
	}
};