'use strict'

var redis = require('./redisWrapper.js');

var LEVEL = {
	"NONE" : 0,
	"ERROR" : 1,
	"WARN" : 2,
	"INFO" : 3,
	"DEBUG" : 4,
	"TRACE" : 5 
};

var CHANNEL = {
	"ENGINE" : 0,
	"MAP" : 1,
	"HEX" : 2,
	"COUNTRY" : 3,
	"PLAYER" : 4,
	"PLYER" : 5,
	"RENDERER" : 6,
	"GREEDY" : 7,
	"CLIENT" : 8,
	"CLIENT_SOCKET" : 9,

	"SERVER": 10,
	"SERVER_SOCKET" : 11,
	"SUBMIT": 12,
	"GAME": 14,
	"ADMIN": 15,
	"DEFAULT": 16,
};

var ChannelLevels = [
	2, //"ENGINE",
	2, //"MAP",
	2, //"HEX",
	2, //"COUNTRY",
	2, //"PLAYER"
	0, //"AI.PLYER"
	0, //"RENDERER",
	0, //"GREEDY",
	0, //"CLIENT",
	0, //"CLIENT_SOCKET",

	3, //"SERVER"
	2, //"SERVER_SOCKET"
	2, //"SUBMIT",
	2, //"GAME"
	2, //"ADMIN"
	2, //"DEFAULT",
];

var ConsoleLevels = [
	4, //"ENGINE",
	4, //"MAP",
	4, //"HEX",
	4, //"COUNTRY",
	4, //"PLAYER"
	4, //"AI.PLYER"
	4, //"RENDERER",
	4, //"GREEDY",
	4, //"CLIENT",
	4, //"CLIENT_SOCKET",

	4, //"SERVER"
	4, //"SERVER_SOCKET"
	4, //"SUBMIT",
	4, //"GAME"
	4, //"ADMIN"
	4, //"DEFAULT",
];

var ChannelNames = [];
Object.keys(CHANNEL).forEach(function(ch, idx) {
	ChannelNames[idx] = ch;
});

var LevelNames = [];
Object.keys(LEVEL).forEach(function(l, idx) {
	LevelNames[idx] = l;
});

module.exports = {
	
	LEVEL: LEVEL,
	CHANNEL: CHANNEL,
	channelNames: ChannelNames,
	levelNames: LevelNames,
	
	setLogLevel: function(channel, level) {
		ChannelLevels[channel] = level;
	},
	
	// USAGE: logger.log("my msg", foo, bar, ... baz, LEVEL.INFO, CHANNEL.ENGINE, gameId);
	log: function(vargs) {
		var argc = arguments.length;
		
		var gameId = "";
		var gameIdx = argc-1;
		if (typeof arguments[gameIdx] == 'string') {
			gameIdx = argc - 1;
			gameId = arguments[gameIdx];
		} else {
			gameIdx = argc;
			gameId = "none";
		}

		var channelIdx = gameIdx - 1;
		var levelIdx = channelIdx - 1;

		if (levelIdx >= 1 
			&& (typeof arguments[channelIdx]) == 'number'
			&& (typeof arguments[levelIdx]) == 'number'
			&& arguments[channelIdx] < ChannelNames.length
			) {
			
			var channel = arguments[channelIdx];
			var level = arguments[levelIdx];

			if ((level <= ChannelLevels[channel]) || (level <= ConsoleLevels[channel])) {
				var msg = ""
				var args = arguments;
				Object.keys(arguments).forEach(function(key, idx) {
					if (idx < levelIdx) {
						msg += ((typeof args[key] == 'object') ? JSON.stringify(args[key]) : args[key]) + " ";
					}
				});

				if (level <= ChannelLevels[channel]) {
					// log to redis
					redis.serverLog(msg, ChannelNames[channel], LevelNames[level], gameId);
				}

				if (level <= ConsoleLevels[channel]) {
					// log to console
					console.log('[' + ChannelNames[channel] + ']', 
											'[' + LevelNames[level] + ']', 
											msg,
											'[' + gameId + ']');
				}
			}
		}
	}
};






