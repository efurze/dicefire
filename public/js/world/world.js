"use strict"


$(function() {

	window.onerror = function(msg, url, lineNum) {
		//Globals.debug("Uncaught exception", msg, url, lineNum, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT, Game._gameId);
	};


	window.World = {
		
		_canvas: document.getElementById("c"),
		_position: [0,0],
		_worldState: null,
		
		
		
		init: function () {
			this._worldState = new WorldState();
			this._worldState.setDice([0,0], 8);
			this._worldState.setOwner([0,0], 0);
			this._worldState.setDice([4,0], 8);
			this._worldState.setOwner([4,0], 1);

			Renderer2d.init(World._canvas);

			this._engine = new Engine();
			this._engine.init([new AI.Aggressive(), new AI.Aggressive()]);
			this._engine.setup(this._worldState);
			Renderer2d.render(World._worldState);
			this._engine.registerListener(this.stateUpdate.bind(this));
			this._engine.start();

			$(document).keydown(this.keyDown.bind(this));
		},

		stateUpdate: function(state) {
			World._worldState.merge(state);
			Renderer2d.update(state);
		},

		keyDown: function(event) {
			
			var self = this;

			switch (event.which) {
				case 37: // left
				case 65: // a
					self._position[0] -= 10;
					Renderer2d.setPosition(self._position);
					break;
				case 38: // up
				case 87: // w
					self._position[1] += 10;
					Renderer2d.setPosition(self._position);
					break;
				case 39: // right
				case 68: // d
					self._position[0] += 10;
					Renderer2d.setPosition(self._position);
					break;
				case 40: // down
				case 83: // s
					self._position[1] -= 10;
					Renderer2d.setPosition(self._position);
					break;
			}
		},
	};
});

