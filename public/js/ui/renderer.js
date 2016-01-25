$(function(){

	window.Renderer = {

		iface: {
			mouseOverCountry: function(id){},
			stateRendered: function(state, id){}
		},

		_renderer: null,
		_history: [], // array of gamestates
		_rendering: false,
		_renderCallback: null,

		init2d: function(playerCount, canvas, map, playerNames, iface) {
			Globals.ASSERT(Globals.implements(iface, Renderer.iface));
			this._renderer = Renderer2d;
			this._renderCallback = iface.stateRendered;
			iface.stateRendered = this._stateRendered.bind(this);
			this._renderer.init(playerCount, canvas, map, playerNames, iface);
		},

		init3d: function(playerCount, canvas, map, playerNames, iface) {
			Globals.ASSERT(Globals.implements(iface, Renderer.iface));
			this._renderer = GLrenderer;
			this._renderCallback = iface.stateRendered;
			iface.stateRendered = this._stateRendered.bind(this);
			this._renderer.init(playerCount, canvas, map, playerNames, iface);
		},

		stateUpdate: function(state, id) {
			this._history.push(state);
			this._renderNext();
		},

		renderHistory: function(state) {
			this._renderer.render(state, null);
		},
		
		setMouseOverCountry: function(id) {
			this._renderer.setMouseOverCountry(id);
		},
		
		setSelectedCountry: function(id) {
			this._renderer.setSelectedCountry(id);
		},

		_render: function(state, callback) {
			this._renderer.render(state, callback);
		},

		_stateRendered: function(state, id) {
			this._rendering = false;
			this._renderCallback(state, id);
			this._renderNext();
		},

		_renderNext: function() {
			if (!this._rendering && this._history.length) {
				var state = this._history.shift();
				this._rendering = true;
				this._render(state, this._stateRendered.bind(this));
			}
		}

	};

});