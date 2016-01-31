"use strict"


$(function() {

	window.onerror = function(msg, url, lineNum) {
		//Globals.debug("Uncaught exception", msg, url, lineNum, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT, Game._gameId);
	};


	window.World = {
		
		_canvas: document.getElementById("c"),
		_position: [0,0],
		
		
		
		init: function () {
			Renderer2d.init(World._canvas);
			Renderer2d.render();
			$(document).keydown(this.keyDown.bind(this));
		},

		keyDown: function(event) {
			
			var self = this;

			switch (event.which) {
				case 37: // left
				case 65: // a
					self._position[0] -= 10;
					Renderer2d.render(self._position);
					break;
				case 38: // up
				case 87: // w
					self._position[1] += 10;
					Renderer2d.render(self._position);
					break;
				case 39: // right
				case 68: // d
					self._position[0] += 10;
					Renderer2d.render(self._position);
					break;
				case 40: // down
				case 83: // s
					self._position[1] -= 10;
					Renderer2d.render(self._position);
					break;
			}
		},
	};
});
