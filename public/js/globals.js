"use strict"

var logBuffer = [];
var BUFFER_LENGTH = 100;

var uploadFn = null;
var GAME_ID = "";

var redirectFn = null;

var Globals = {
			initLogger: function(game_id, logUploadFn) {
				GAME_ID = game_id;
				uploadFn = logUploadFn;
			},
			
			setLogRedirect: function(fn) {
				redirectFn = fn;
			},
	
		// USAGE: debug("my msg", foo, bar, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	    debug: function(title) {
				if (redirectFn) {
					redirectFn.apply(null, arguments);
				} else {
					var argc = arguments.length;

					var gameId = "";
					var gameIdx = argc-1;
					if (typeof arguments[gameIdx] == 'string') {
						gameIdx = argc - 1;
						gameId = arguments[gameIdx];
					} else {
						gameIdx = argc;
						gameId = GAME_ID;
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
				
						var msg = ""
						var args = arguments;
						Object.keys(arguments).forEach(function(key, idx) {
							if (idx < levelIdx) {
								msg += args[key] + " ";
							}
						});
				
						if (level < Globals.LEVEL.TRACE && channel != Globals.CHANNEL.RENDERER) {
							logBuffer.unshift({
								channel: channel,
								level: level,
								gameId: GAME_ID,
								msg: msg.substring(0, 100)
							});
				
							if (logBuffer.length > BUFFER_LENGTH) {
								logBuffer.pop();
							}
				
							if (uploadFn && level == Globals.LEVEL.ERROR) {
								uploadFn(GAME_ID, logBuffer);
							}
						}
				
						if (level <= Globals.channels[channel]) {
							console.log(msg);
						}
				
					} else {
			        	console.log(title, arguments);
					}
				}
	    },
	
		ASSERT: function (condition) {
			if (!condition) {
				console.log("ASSERTION FAILURE");
				try {
					var err = new Error('assertion');
					console.log(err.stack);
				} catch (e) {}
				debugger;
				throw new Error("Assertion Failure");
			}
		},
		
		showNumbers: false,
		showCountryIds: false,
		markHexCenters: false,
		markCountryCenters: false,
		drawCountryConnections: false,
		maxPlayers: 8,
		maxDice: 8,
		maxStoredDice: 64,
		startingDice: 10,
		numCountries: 32,
		timeout: 0,
		play_sounds: 0,
		suppress_ui: 0,
		uploadGame: false
	};

Globals.LEVEL = {
	"NONE" : 0,
	"ERROR" : 1,
	"WARN" : 2,
	"INFO" : 3,
	"DEBUG" : 4,
	"TRACE" : 5 
}

Globals.levelNames = [];
Object.keys(Globals.LEVEL).forEach(function(name, idx) {
	Globals.levelNames[idx] = name;
});

// The order in CHANNEL and channels must match. DON'T CHANGE THESE NUMBERS. To change the loglevel, see Globals.channels below
Globals.CHANNEL = {
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
	"AI_WRAPPER" : 10,

	"SERVER": 11,
	"SERVER_SOCKET" : 12,
	"USER_AI": 13,
	"GAME": 14,
	"ADMIN": 15,
	"DEFAULT": 16,
};

Globals.channelNames = [];
Object.keys(Globals.CHANNEL).forEach(function(name, idx) {
	Globals.channelNames[idx] = name;
});

// Loglevel for each channel. Numbers correspond to Globals.LEVEL
Globals.channels = [];
Globals.channels.length = Object.keys(Globals.CHANNEL).length;

Globals.channels[Globals.CHANNEL.ENGINE] 					= Globals.LEVEL.INFO;
Globals.channels[Globals.CHANNEL.MAP] 						= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.HEX] 						= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.COUNTRY] 				= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.PLAYER] 					= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.PLYER] 					= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.RENDERER] 				= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.GREEDY] 					= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.CLIENT] 					= Globals.LEVEL.INFO;
Globals.channels[Globals.CHANNEL.CLIENT_SOCKET] 	= Globals.LEVEL.INFO;
Globals.channels[Globals.CHANNEL.AI_WRAPPER] 			= Globals.LEVEL.INFO;



Globals.shuffleArray = function(inArray) {
	// Copy the array to avoid changing it.
	var array = inArray.map(function(elem) { return elem; });

    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
};

Globals.implements = function(obj, iface) {
	for (var func in iface) {
		if (typeof iface[func] === 'function') {
			if ((!obj.hasOwnProperty(func) && !obj.__proto__.hasOwnProperty(func)) || typeof obj[func] !== 'function') {
				return false;
			}
		}
	}
	return true;
};

Globals.indexOfMax = function(ary) {
	var max = ary[0];
	var idx = 0;
	for (var i=1; i < ary.length; i++) {
		if (ary[i] > max) {
			idx = i;
			max = ary[i];
		}
	}
	return idx;
};

if (typeof module !== 'undefined' && module.exports){
	module.exports = Globals;
}
