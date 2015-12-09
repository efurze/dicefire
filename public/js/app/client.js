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
		_playerNames: [],
		
		
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (gameId) {
			console.log("gameId: " + gameId);
			Client._gameId = gameId;
			$('#setup').css('display', 'block');
			$('#game').css('display', 'none');
			
			$('#start_game').click(Setupcontroller.startGame);
			Setupcontroller.init(Client.start);
			
			Client._socket = io.connect(window.location.hostname + ":5001");
			Client._socket.on('map', Client.mapLoad);
			Client._socket.on('state', Client.engineUpdate);
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
			
			Client._controller = new Clientcontroller(Client._history);
			//Client._mapController = new Mapcontroller(Client.mapUpdate);
			
			
			$('#end_turn').click(Client._controller.endTurn.bind(Client._controller));
			$('#back_btn').click(Client._controller.historyBack.bind(Client._controller));
			$('#forward_btn').click(Client._controller.historyForward.bind(Client._controller));
		},
		
		mapLoad: function(mapData) {
			if (!Client._map) {
				Client._map = new Map();
				Client._map.deserializeHexes(mapData);
				Renderer.init(Client._playerNames.length, Client._canvas, Client._map, Client._playerNames);
			}
		},

		mapUpdate: function() {
			if (!Client._controller.viewingHistory()) {
				Client.redraw();
			}
		},

		engineUpdate: function(stateData) {
			var gamestate = Gamestate.deserialize(stateData);
			Client.redraw(gamestate);
		},
		
		redraw: function(stateData) {
			var gamestate = Gamestate.deserialize(stateData)
			Renderer.render(gamestate /*,Engine.finishAttack*/);
			if (Client._controller) {
				Client._controller.update();
			}
		}
		
	};
});

