Globals = {
		// USAGE: debug("my msg", foo, bar, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	    debug: function(title) {
			var argc = arguments.length;
		
			if (argc >= 3 
				&& (typeof arguments[argc-1]) == 'number'
				&& (typeof arguments[argc-2]) == 'number'
				&& arguments[argc-1] < Globals.channels.length
				) {
				
				var channel = arguments[argc-1];
				var level = arguments[argc-2];
				
				if (level <= Globals.channels[channel]) {
					delete arguments[argc-1];
					delete arguments[argc-2];
					console.log(title, arguments);
				}
				
			} else {
	        	console.log(title, arguments);
			}
	    },
	
		ASSERT: function (condition) {
			console.log("ASSERTION FAILURE");
			if (!condition) {
				debugger;
			}
		},
		
	    showNumbers: false,
	    markHexCenters: false,
	    markCountryCenters: false,
	    drawCountryConnections: false,
	    maxDice: 8,
	    maxStoredDice: 64,
	    startingDice: 10,
	    numCountries: 35,
	    timeout: 0,
		play_sounds: 0,
		suppress_ui: 0
	};

Globals.LEVEL = {
	"NONE" : 0,
	"ERROR" : 1,
	"WARN" : 2,
	"INFO" : 3,
	"DEBUG" : 4,
	"TRACE" : 5 
}

// The order in CHANNEL and channels must match
Globals.CHANNEL = {
	"ENGINE" : 0,
	"MAP" : 1,
	"HEX" : 2,
	"COUNTRY" : 3,
	"PLAYER" : 4
};

// Loglevel for each channel. Numbers correspond to Globals.LEVEL
Globals.channels = [
	3, //"ENGINE",
	3, //"MAP",
	3, //"HEX",
	3, //"COUNTRY",
	3 //"PLAYER"
];



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



