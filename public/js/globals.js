$(function() {
	window.Globals = {
	    debug: function(title) {
	        console.log(title, arguments);
	    },
	    showNumbers: false,
	    markHexCenters: false,
	    markCountryCenters: true,
	    drawCountryConnections: true
	};


	Globals.canvas = document.getElementById("c");
	Globals.context = Globals.canvas.getContext('2d');
});


