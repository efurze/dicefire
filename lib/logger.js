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
		"SERVER": 1,
		"SUBMIT": 2,
		"CONSOLE": 3,
		"DEFAULT": 4
	},
	
	setLogLevel: function(channel, level) {
		ChannelLevels[channel] = level;
	},
	
	// USAGE: logger.server("my msg", foo, bar, LEVEL.INFO, CHANNEL.ENGINE, gameId);
	server: function(args) {
		var args = new Array(arguments.length);
		for(var i = 0; i < args.length; ++i) {
        args[i] = arguments[i];
    }
		if (typeof args[args.length-1] == 'number') {
			args.push('none'); // no game id
		}
		args.push(true);
		log.apply(this, args);
	},
	
	// USAGE: logger.client("my msg", foo, bar, LEVEL.INFO, CHANNEL.ENGINE, gameId);
	client: function(args) {
		var args = new Array(arguments.length);
		for(var i = 0; i < args.length; ++i) {
        args[i] = arguments[i];
    }
		if (typeof args[args.length-1] == 'number') {
			args.push('none'); // no game id
		}
		args.push(false);
		log.apply(this, args);
	},
};





var ChannelLevels = [
	0, //"ENGINE",
	0, //"SERVER",
	0, //"SUBMIT",
	5, //"CONSOLE"
	0, //"DEFAULT",
];

var ChannelNames = [];
Object.keys(module.exports.CHANNEL).forEach(function(ch) {
	ChannelNames.push(ch);
});

var LevelNames = [];
Object.keys(module.exports.LEVEL).forEach(function(l) {
	LevelNames.push(l);
});

// USAGE: log("my msg", foo, bar, LEVEL.INFO, CHANNEL.ENGINE, gameId, server=true|false);
var log = function(title) {
	var argc = arguments.length;
	
	var serverIdx = argc - 1;
	var gameIdx = argc - 2;
	var channelIdx = argc - 3;
	var levelIdx = argc - 4;
	
	if (argc >= 5 
		&& (typeof arguments[channelIdx]) == 'number'
		&& (typeof arguments[levelIdx]) == 'number'
		&& arguments[channelIdx] < ChannelNames.length
		) {
		
		var server = arguments[serverIdx];
		var channel = arguments[channelIdx];
		var level = arguments[levelIdx];

		if (level <= ChannelLevels[channel] || (server && level <= ChannelLevels[module.exports.CHANNEL.CONSOLE])) {
			var msg = ""
			var args = arguments;
			Object.keys(arguments).forEach(function(key, idx) {
				if (idx < levelIdx) {
					msg += args[key] + " ";
				}
			});
		
			if (level <= ChannelLevels[channel]) {
				// log to redis
				if (server) {
					redis.serverLog(ChannelNames[channel], level, msg);
				} else {
					redis.clientLog(ChannelNames[channel], level, msg);
				}
			}
		
			if (server && level <= ChannelLevels[module.exports.CHANNEL.CONSOLE]) {
				// log to console
				console.log('[' + ChannelNames[channel] + ']', 
										'[' + LevelNames[level] + ']', 
										msg);
			}
		}
	}
};


