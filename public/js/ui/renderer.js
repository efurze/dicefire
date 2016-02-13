$(function(){

	$('#radio_2d').change(function() {
		if($('#radio_2d').prop("checked")){
			Renderer._init2d.apply(Renderer);
    	}
	});

	$('#radio_3d').change(function() {
		if($('#radio_3d').prop("checked")){
			Renderer._init3d.apply(Renderer);
    	}
	});

	window.Renderer = {

		iface: {
			mouseOverCountry: function(id){},
			stateRendered: function(state, id){}
		},

		_renderer: null,
		_history: [], // array of gamestates
		_rendering: false,
		_lastState: null,
		_renderCallback: null,
		_listener: null,
		_canvas: null,
		_map: null,
		_playerNames: [],

		_initialized2d: false,
		_initialized3d: false,

		init: function(canvas, map, playerNames, iface) {
			Globals.ASSERT(Globals.implements(iface, Renderer.iface));
			this._renderCallback = iface.stateRendered;
			iface.stateRendered = this._stateRendered.bind(this);
			this._listener = iface;
			this._canvas = canvas;
			this._map = map;
			this._playerNames = playerNames;

			if($('#radio_3d').attr("checked")){
				Renderer._init3d();
    		} else {
    			Renderer._init2d();
    		}

    		PlayerStatus.init(playerNames);
		},

		setPlayerName: function(id, name) {
			PlayerStatus.setPlayerName(id, name);
		},

		stateUpdate: function(state, id) {
			this._lastState = state;
			this._history.push(state);
			this._renderNext();
		},

		renderHistory: function(state) {
			this._renderer.render(state, this._renderCallback);
		},
		
		setMouseOverCountry: function(id) {
			this._renderer.setMouseOverCountry(id);
		},
		
		setSelectedCountry: function(id) {
			this._renderer.setSelectedCountry(id);
		},

		_init2d: function() {
			$('#radio_2d').prop('checked', true);
			$('#canvas3d_div').hide();
			$('#c').show();

			this._renderer = Renderer2d;
			if (!this._initialized2d) {
				this._initialized2d = true;
				this._renderer.init(this._canvas, this._map, this._playerNames, this._listener);
			}
			if (this._lastState) {
				this.stateUpdate(this._lastState, this._lastState.stateId());
			}
		},

		_init3d: function(playerCount, canvas, map, playerNames, iface) {
			$('#radio_3d').prop('checked', true);
			$('#c').hide();
			$('#canvas3d_div').show();

			this._renderer = GLrenderer;
			if (!this._initialized3d) {
				this._initialized3d = true;
				this._renderer.init(this._canvas, this._map, this._playerNames, this._listener);
			}
			if (this._lastState) {
				this.stateUpdate(this._lastState, this._lastState.stateId());
			}
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
				PlayerStatus.renderPlayers(state);
			}
		}

	};

});