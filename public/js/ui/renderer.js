$(function(){

	window.Renderer = {

		iface: {
			mouseOverCountry: function(id){}
		},

		_renderer: null,

		init2d: function(playerCount, canvas, map, playerNames, iface) {
			this._renderer = Renderer2d;
			this._renderer.init(playerCount, canvas, map, playerNames, iface);
		},

		init3d: function(playerCount, canvas, map, playerNames, iface) {
			this._renderer = GLrenderer;
			this._renderer.init(playerCount, canvas, map, playerNames, iface);
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