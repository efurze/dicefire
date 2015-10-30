$(function() {
	window.Globals = {
	    debug: function(title) {
	        console.log(title, arguments);
	    },
	    showNumbers: false,
	    markHexCenters: false,
	    markCountryCenters: false,
	    drawCountryConnections: false,
	    maxDice: 8,
	    maxStoredDice: 64,
	    startingDice: 10,
	    numCountries: 35
	};


	Globals.canvas = document.getElementById("c");
	Globals.context = Globals.canvas.getContext('2d');

	Globals.shuffleArray = function(array) {
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

});


