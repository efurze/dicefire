'use strict'

var redis = require('./redisWrapper.js');

module.exports = {
	LEVEL: {
		"NONE" : 0,
		"ERROR" : 1,
		"WARN" : 2,
		"INFO" : 3,
		"DEBUG" : 4,
		"TRACE" : 5 
	},
	
	CHANNEL: {
		"ENGINE" : 0,
		"MAP" : 1,
		"HEX" : 2,
		"COUNTRY" : 3,
		"PLAYER" : 4,
		"PLYER" : 5,
		"RENDERER" : 6,
		"GREEDY" : 7,
		"CLIENT" : 8,

		"SERVER": 9,
		"SUBMIT": 10,
		"DEFAULT": 12
	},
	
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
						msg += args[key] + " ";
					}
				});

				if (level <= ChannelLevels[channel]) {
					// log to redis
					redis.serverLog(ChannelNames[channel], level, msg, gameId);
				}

				if (level <= ConsoleLevels[channel]) {
					// log to console
					console.log('[' + ChannelNames[channel] + ']', 
											'[' + LevelNames[level] + ']', 
											msg);
				}
			}
		}
	}
};


var ChannelLevels = [
	0, //"ENGINE",
	0, //"MAP",
	0, //"HEX",
	0, //"COUNTRY",
	0, //"PLAYER"
	0, //"AI.PLYER"
	0, //"RENDERER",
	0, //"GREEDY",
	0, //"CLIENT",
	
	0, //"SERVER"
	0, //"SUBMIT",
	0, //"DEFAULT",
];

var ConsoleLevels = [
	0, //"ENGINE",
	0, //"MAP",
	0, //"HEX",
	0, //"COUNTRY",
	0, //"PLAYER"
	0, //"AI.PLYER"
	0, //"RENDERER",
	0, //"GREEDY",
	0, //"CLIENT",
	
	5, //"SERVER"
	0, //"SUBMIT",
	0, //"DEFAULT",
];

var ChannelNames = [];
Object.keys(module.exports.CHANNEL).forEach(function(ch, idx) {
	ChannelNames[idx] = ch;
});

var LevelNames = [];
Object.keys(module.exports.LEVEL).forEach(function(l, idx) {
	LevelNames[idx] = l;
});



