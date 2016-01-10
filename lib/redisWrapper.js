'use strict'

var Promise = require('bluebird');
var redis = require('redis');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(); //6379, 'localhost', '');

var KEYS = {
	CLIENT_LOG: function(gameId, channel, level) {return ['log', 'client', gameId, channel, level].join(':');},
	SERVER_LOG: function(gameId, channel, level) {return ['log', 'server', gameId, channel, level].join(':');},
	
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
	
	clientLog: function(msg, channel, level, gameId) {
		
	},
	
	serverLog: function(msg, channel, level, gameId) {
		
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