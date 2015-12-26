"use strict"


$(function() {

	// @callback: function()
	var History = function(gameId, callback) {
		this._array = [];
		this._gameId = gameId;
		this._cb = callback;
		this._downloader = new Downloader;
		this._stateCount = 0;
	};
		
	History.prototype.fetchHistory = function() {
		this._downloader.getStateCount(this._gameId, this.gotStateCount.bind(this));
	};
	
	History.prototype.gotStateCount = function(success, data) {
		if (success) {
			this.updateStateCount(data['stateCount']);
		} else {
			Globals.debug("error getting stateCount", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
		}
	};
	
	History.prototype.updateStateCount = function(count) {
		if (count > this._stateCount) {
			Globals.debug("StateCount updated to", count, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
			this._stateCount = count;
		}
		
		var current = this._array.length;
		if (current < this._stateCount && !this._downloader.hasPending()) {
			this._downloader.getState(this._gameId, current, this.gotState.bind(this));
		}
	}
	
	History.prototype.gotState = function(success, data) {
		if (success) {
			var gamestate = Gamestate.deserialize(JSON.parse(data.data));
			var id = parseInt(data.id); // 0-based. First state is state 0.
			Globals.ASSERT(id == this._array.length);
			this._array.push(gamestate);
			
			Globals.debug("Downloaded state", id, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
			
			var current = this._array.length;
			if (current < this._stateCount) {
				this._downloader.getState(this._gameId, current, this.gotState.bind(this));
			} else if (this._cb) {
				this._cb();
			}
		}
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
		_started: false,
		
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
			
			// grab game info
			Client._downloader = new Downloader();
			Client._downloader.getGameInfo(gameId, Client.gameInfoReceived);
			
			Client._history = new History(gameId, Client.stateUpdate);
		},

		// HTTP request callback
		gameInfoReceived: function(success, data) {
			if (success) {
				Client._playerNames = JSON.parse(data).players;
				
				// connect to server
				if (!Client._socket) {
					Client._socket = io.connect(window.location.hostname + ":5001/" + Client._gameId);
					
					Client._socket.on('attack_result', Client.attackResult);
					Client._socket.on('error', Client.socketError);
					Client._socket.on('state', Client.engineUpdate);
				}
				
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
					Client._map.deserializeHexes(data);
					Renderer.init(Client._playerNames.length, Client._canvas, Client._map, Client._playerNames);
					
					// replay doesn't get a map controller
					if (Client._mode == Client.MODES.PLAY) {
						Client._mapController = new Mapcontroller(Client.mapUpdate, Client._canvas, Client._map, Client.mapConInterface);
					}
					
					// download any existing state data
					Client._history.fetchHistory();
					
					
				} else {
					Globals.debug("Got map when we already had one", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
				}
			} else {
				// if we fail just assume that the server will send the map data via a socket push later
				Globals.debug("Get Map error", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
				Client._socket.on('map', Client.mapAvailable);
			}
			
		},
		
		// from History
		stateUpdate: function() {
			if (Client._history.length() > 0) {
				if (!Client._started) {
					Client.start();
					Client.redraw(Client._history.length()-1);
				}
				
				Globals.debug("Got state data", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				
				if (!Client.upToDate()) {
					Client.redraw(Client._lastRenderedState + 1);
				}
				
				if (Client._controller) {
					Client._controller.update();
				}
			} 
		},
		
		start: function() {
			Client._started = true;
			$('#game').css('display', 'block');
			
			Client._controller = new Clientcontroller(Client._history, Client.endTurn);
			
			if (Client._mode == Client.MODES.PLAY) {
				$('#end_turn').click(Client._controller.endTurn.bind(Client._controller));
			} else {
				$('#end_turn').css('display', 'none');
			}
			$('#back_btn').click(Client._controller.historyBack.bind(Client._controller));
			$('#forward_btn').click(Client._controller.historyForward.bind(Client._controller));
		},
		
		upToDate: function() {
			return (Client._lastRenderedState == (Client._history.length()-1));
		},
		
		// push notification from server that the map is available
		mapAvailable: function() {
			Globals.debug("Server map push", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
			if (!Client._map) {
				// request the map
				Client._downloader.getMap(Client._gameId, Client.mapReceived);
			}
		},

		// push notification from server that a new state is available
		// @stateId: 0-based counter. First state is 0.
		engineUpdate: function(stateId) {
			Globals.debug("Got state push from server for stateId " + stateId, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
			Client._history.updateStateCount(stateId+1);
		},
		
		// from server
		attackResult: function(data) {
			// TODO: FIXME: Is this fxn necessary? I think we can just rely on the engineUpdate() event
			if (Client._mcAttackCallback) {
				// tell the map controller to reset its 'selected country' states 
				// (and re-enable the 'end turn' button)
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
		
		socketError: function(err) {
			Globals.debug("Socket ERROR:", err, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
		},
		
		// So the MapController can call back into us
		mapConInterface: {
			currentPlayerId: function() {
				var state = Client._history.getLatest();
				return state ? state.currentPlayerId() : -1;
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

