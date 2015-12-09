"use strict"

var History = function() {
	this._array = [];
};

History.prototype.push = function(state) {
	Globals.ASSERT(state instanceof Gamestate);
	this._array.push(state);
};

History.prototype.length = function() {
	return this._array.length;
};

History.prototype.getState = function(index) {
	if (index >= 0 && index < this._array.length) {
		return this._array[index];
	} else {
		return null;
	}
};

History.prototype.currentPlayerId = function() {
	return this._array[this._array.length-1].currentPlayerId();
};


$(function() {

	
	window.Client = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_controller: null,
		_mapController: null,
		_gameId: null,
		_history: null,
		_socket: null,
		_map: null,
		_isAttacking: false,
		_lastRenderedState: -1,
		_playerNames: [],
		
		
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (gameId) {
			Globals.debug("gameId:", gameId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
			Client._gameId = gameId;
			$('#setup').css('display', 'block');
			$('#game').css('display', 'none');
			
			$('#start_game').click(Setupcontroller.startGame);
			Setupcontroller.init(Client.start);
			
			Client._history = new History();
			
			Client._socket = io.connect(window.location.hostname + ":5001");
			Client._socket.on('map', Client.mapLoad);
			Client._socket.on('state', Client.engineUpdate);
			Client._socket.on('error', Client.socketError);
		},
		
		socketError: function(err) {
			Globals.debug("Socket ERROR:", err, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
		},
		
		start: function(playerCode) {
			
			$('#setup').css('display', 'none');
			$('#game').css('display', 'block');
			
			Client._playerNames = playerCode.map(function(pc) {
				if (pc == "human") {
					return "human";
				} else {
					return pc.getName();
				}
			});
			
			Client._socket.emit("initialized", {gameId: Client._gameId, players: Client._playerNames});
			
			Client._controller = new Clientcontroller(Client._history, Client.endTurn);
			//Client._mapController = new Mapcontroller(Client.mapUpdate);
			
			
			$('#end_turn').click(Client._controller.endTurn.bind(Client._controller));
			$('#back_btn').click(Client._controller.historyBack.bind(Client._controller));
			$('#forward_btn').click(Client._controller.historyForward.bind(Client._controller));
		},
		
		upToDate: function() {
			return (Client._lastRenderedState == (Client._history.length()-1));
		},
		
		// from server
		mapLoad: function(mapData) {
			if (!Client._map) {
				Globals.debug("Got map from server", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				Client._map = new Map();
				Client._map.deserializeHexes(mapData);
				Renderer.init(Client._playerNames.length, Client._canvas, Client._map, Client._playerNames);
			}
		},

		// from server
		engineUpdate: function(stateData) {
			Globals.debug("Got state update from server", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
			var gamestate = Gamestate.deserialize(stateData);
			Client._history.push(gamestate);
			if (Client._controller) {
				Client._controller.update();
			}
			if (!Client.upToDate()) {
				Client.redraw(Client._lastRenderedState + 1);
			}
		},
		
		// from mapController
		mapUpdate: function() {
			if (!Client._controller.viewingHistory() && !Client._isAttacking && Client.upToDate()) {
				Client.redraw(Client._lastRenderedState);
			}
		},
		
		// from controller
		endTurn: function() {
			Client._socket.emit("end_turn", {playerId: 0});
		},
		
		// from renderer
		renderAttackDone: function() {
			Globals.debug("Attack animation finished", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
			Client._isAttacking = false;
			Client._controller.setIsAttacking(false);
			if (!Client.upToDate()) {
				Client.redraw(Client._lastRenderedState + 1);
			}
		},
		
		
		redraw: function(stateNum) {
			
			// only render if we're not currently in the process of animating
			// some previous attack
			if (Client._isAttacking || Client._controller.viewingHistory()) {
				Globals.debug("aborting redraw", "attacking", Client._isAttacking, "viewHistory", 
								Client._controller.viewingHistory(), Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
				return;
			}
			
			var gamestate = Client._history.getState(stateNum);
			if (gamestate) {
				if (gamestate.attack()) {
					Client._isAttacking = true;
					Client._controller.setIsAttacking(true);
					Globals.debug("Attack animation beginning", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				}
				
				Client._lastRenderedState = stateNum;
				Globals.debug("Rendering state", stateNum, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
				Renderer.render(gamestate, Client.renderAttackDone);
				if (Client._controller) {
					Client._controller.update();
				}
				
				if (!Client._isAttacking && !Client.upToDate()) {
					window.setTimeout(function() {
						Client.redraw(Client._lastRenderedState + 1);
					}, 0);
				}
			}
		}
		
	};
});

