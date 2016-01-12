'use strict'

var redis = require('./redisWrapper.js');
var Globals = require('../public/js/globals');


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
	2, //"AI_WRAPPER"

	3, //"SERVER"
	2, //"SERVER_SOCKET"
	2, //"SUBMIT",
	2, //"GAME"
	2, //"ADMIN"
	3, //"DEFAULT",
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
	4, //"AI_WRAPPER"

	4, //"SERVER"
	4, //"SERVER_SOCKET"
	4, //"SUBMIT",
	4, //"GAME"
	4, //"ADMIN"
	4, //"DEFAULT",
];


module.exports = {
	
	LEVEL: Globals.LEVEL,
	CHANNEL: Globals.CHANNEL,
	channelNames: Globals.channelNames,
	levelNames: Globals.levelNames,
	
	setLogLevel: function(channel, level) {
		ChannelLevels[channel] = level;
	},
	
	// USAGE: logger.log("my msg", foo, bar, ... baz, logger.LEVEL.INFO, logger.CHANNEL.ENGINE, gameId);
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
			&& arguments[channelIdx] < Globals.channelNames.length
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
					redis.serverLog(msg, Globals.channelNames[channel], Globals.levelNames[level], gameId);
				}

				if (level <= ConsoleLevels[channel]) {
					// log to console
					console.log('[' + Globals.channelNames[channel] + ']', 
											'[' + Globals.levelNames[level] + ']', 
											msg,
											'[' + gameId + ']');
				}
			}
		}
	}
};






