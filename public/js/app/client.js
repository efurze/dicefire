"use strict"


$(function() {

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

	History.prototype.getLatest = function() {
		if (this._array.length) {
			return this._array[this._array.length - 1];
		} else {
			return null;
		}
	};

	History.prototype.currentPlayerId = function() {
		return this._array[this._array.length-1].currentPlayerId();
	};

	
	window.Client = {
		
		_canvas: document.getElementById("c"),
		_downloader: null,
		_controller: null,
		_mapController: null,
		_gameId: null,
		_playerId: 0,
		_history: null,
		_socket: null,
		_map: null,
		_isAttacking: false,
		_mcAttackCallback: null,
		_lastRenderedState: -1,
		_playerNames: [],
		
		MODES: {PLAY: 1, WATCH:2},
		_mode: 0,
		
		
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (gameId, replay) {
			Client._gameId = gameId;
			Globals.debug("gameId:", gameId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
			
			if (replay) {
				Client._mode = Client.MODES.WATCH;	
			} else {
				Client._mode = Client.MODES.PLAY;
			}
			
			Client._history = new History();
			
			// grab game info
			Client._downloader = new Downloader();
			Client._downloader.getGameInfo(gameId, Client.gameInfoReceived);
		},

		// HTTP request callback
		gameInfoReceived: function(success, data) {
			if (success) {
				Client._playerNames = JSON.parse(data).players;
				// request the map
				Client._downloader.getMap(Client._gameId, Client.mapReceived);
			} else {
				// TODO: FIXME: redirect user to an error page
				Globals.debug("GetGameInfo error", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
		
		// HTTP request callback		
		mapReceived: function(success, data) {
			
			if (success) {
				if (!Client._map) {
					Globals.debug("Got map from server", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					Client._map = new Map();
					Client._map.deserializeHexes(mapData);
					Renderer.init(Client._playerNames.length, Client._canvas, Client._map, Client._playerNames);
					
					// replay doesn't get a map controller
					if (Client._mode == Client.MODES.PLAY) {
						Client._mapController = new Mapcontroller(Client.mapUpdate, Client._canvas, Client._map, Client.mapConInterface);
					}
					
					// we got the map, start the game
					Client.start(Client._playerNames);
				} else {
					Globals.debug("Got map when we already had one", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
				}
			} else {
				// if we fail just assume that the server will send the map data via a socket push later
				Globals.debug("Get Map error", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
			
		},
		
		// HTTP request callback
		stateReceived: function(success, stateData) {
			if (success) {
				Globals.debug("Got state data", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				var gamestate = Gamestate.deserialize(stateData);
				Client._history.push(gamestate);
				if (Client._controller) {
					Client._controller.update();
				}
				if (!Client.upToDate()) {
					Client.redraw(Client._lastRenderedState + 1);
				}
			} else {
				Globals.debug("Unable to download state data", stateData, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
		
		
		socketError: function(err) {
			Globals.debug("Socket ERROR:", err, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
		},
		
		start: function(playerNames) {

			$('#game').css('display', 'block');
			
			Client._playerNames = playerCode.map(function(pc) {
				if (pc == "human") {
					return "human";
				} else {
					return pc.getName();
				}
			});
			
			if (Client._mode == Client.MODES.PLAY) {
				Client._socket.emit("create_game", {gameId: Client._gameId, players: Client._playerNames});
			}
			
			Client._controller = new Clientcontroller(Client._history, Client.endTurn);
			
			
			$('#end_turn').click(Client._controller.endTurn.bind(Client._controller));
			$('#back_btn').click(Client._controller.historyBack.bind(Client._controller));
			$('#forward_btn').click(Client._controller.historyForward.bind(Client._controller));
		},
		
		upToDate: function() {
			return (Client._lastRenderedState == (Client._history.length()-1));
		},
		
		// push notification from server that the map is available
		mapAvailable: function() {
			if (!Client._map) {
				// request the map
				Client._downloader.getMap(Client._gameId, Client.mapReceived);
			}
		},

		// push notification from server that a new state is available
		engineUpdate: function(stateId) {
			Globals.debug("Got state push from server for stateId " + stateId, Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
			Client._downloader.getState(Client._gameId, stateId, Client.stateReceived);
		},
		
		// from server
		attackResult: function(data) {
			// TODO: FIXME: Is this fxn necessary? I think we can just rely on the engineUpdate() event
			if (Client._mcAttackCallback) {
				Client._mcAttackCallback(data.result);
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
				} else {
					// update the map state
					Client._map.setState(gamestate);
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
		},
		
		// So the MapController can call back into us
		mapConInterface: {
			currentPlayerId: function() {
				return Client._history.getLatest().currentPlayerId();
			},
			
			attack: function(from, to, callback) {
				Client._mcAttackCallback = callback;
				Client._socket.emit('attack', {from: from.id(), to: to.id()});
			},
			
			isThisPlayer: function(playerId) {
				return (playerId == Client._playerId);
			},
			
			clickable: function() {
				return (Client.upToDate() && !Client._controller.viewingHistory());
			}
		}
		
	};
});

