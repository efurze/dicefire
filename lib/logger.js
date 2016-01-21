'use strict'

var redis = require('./redisWrapper.js');
var Globals = require('../public/js/globals');


var ChannelLevels = [];
ChannelLevels.length = Object.keys(Globals.CHANNEL).length;

ChannelLevels[Globals.CHANNEL.ENGINE] 					= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.MAP] 							= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.HEX] 							= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.COUNTRY] 					= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.PLAYER] 					= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.PLYER] 						= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.RENDERER] 				= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.GREEDY] 					= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.CLIENT] 					= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.CLIENT_SOCKET] 		= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.AI_WRAPPER] 			= Globals.LEVEL.WARN;

ChannelLevels[Globals.CHANNEL.SERVER] 					= Globals.LEVEL.INFO;
ChannelLevels[Globals.CHANNEL.SERVER_SOCKET] 		= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.USER_AI] 					= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.GAME] 						= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.ADMIN] 						= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.RATER] 						= Globals.LEVEL.WARN;
ChannelLevels[Globals.CHANNEL.DEFAULT] 					= Globals.LEVEL.INFO;

var ConsoleLevels = [];
ConsoleLevels.length = Object.keys(Globals.CHANNEL).length;

ConsoleLevels[Globals.CHANNEL.ENGINE] 					= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.MAP] 							= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.HEX] 							= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.COUNTRY] 					= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.PLAYER] 					= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.PLYER] 						= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.RENDERER] 				= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.GREEDY] 					= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.CLIENT] 					= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.CLIENT_SOCKET] 		= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.AI_WRAPPER] 			= Globals.LEVEL.DEBUG;

ConsoleLevels[Globals.CHANNEL.SERVER] 					= Globals.LEVEL.DEBUG;
ConsoleLevels[Globals.CHANNEL.SERVER_SOCKET] 		= Globals.LEVEL.DEBUG;
ConsoleLevels[Globals.CHANNEL.USER_AI] 					= Globals.LEVEL.DEBUG;
ConsoleLevels[Globals.CHANNEL.GAME] 						= Globals.LEVEL.DEBUG;
ConsoleLevels[Globals.CHANNEL.ADMIN] 						= Globals.LEVEL.DEBUG;
ConsoleLevels[Globals.CHANNEL.RATER] 						= Globals.LEVEL.WARN;
ConsoleLevels[Globals.CHANNEL.DEFAULT] 					= Globals.LEVEL.DEBUG;

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






