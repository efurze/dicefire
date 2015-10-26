$(function() {
	window.Globals = {
	    debug: function(title) {
	        console.log(title, arguments);
	    },
	    showNumbers: false
	};


	Globals.canvas = document.getElementById("c");
	Globals.context = Globals.canvas.getContext('2d');
});


