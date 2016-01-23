$(function(){

	window.Renderer = {

		_renderer: null,

		init2d: function(playerCount, canvas, map, playerNames) {
			this._renderer = Renderer2d;
			this._renderer.init(playerCount, canvas, map, playerNames);
		},

		init3d: function() {},



		clearAll: function() {
			this._renderer.clearAll();
		},
		
		setMouseOverCountry: function(id) {
			this._renderer.setMouseOverCountry(id);
		},
		
		setSelectedCountry: function(id) {
			this._renderer.setSelectedCountry(id);
		},

		render: function(state, attackCallback) {
			this._renderer.render(state, attackCallback);
		},

	};

});