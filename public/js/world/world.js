"use strict"


$(function() {

	window.onerror = function(msg, url, lineNum) {
		//Globals.debug("Uncaught exception", msg, url, lineNum, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT, Game._gameId);
	};


	window.World = {
		
		_canvas: document.getElementById("c"),
		
		
		
		init: function () {
			Renderer2d.init(World._canvas);
			Renderer2d.render();
		},

		
	};
});

