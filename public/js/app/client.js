"use strict"


$(function() {

	// initialize the AI name-to-class mapping
	var AIs = [
		AI.Plyer,
		AI.Greedy,
		AI.Aggressive
	];
	var AIMap = {};
	AIs.forEach(function(ai) {
		AIMap[ai.getName()] = ai;
	});
	
	window.onerror = function(msg, url, lineNum) {
		Globals.debug("Uncaught exception", msg, url, lineNum, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT, Client._gameId);
	};

	
	window.Client = {
		
		_canvas: document.getElementById("c"),
		_socket: null,
		_downloader: null,
		_history: null,
		_gameId: null,	
		_initialized: false,
		_watch: false,

		_map: null,
		_gameInfo: null,
		_players: {}, // playerId => Engine::PlayerInterface
		_playerStatus: {}, // playerId => true iff player is connected

		_rendererInitialized: false,
		_currentViewState: -1,
		_rendering: false,
		_historyController: null,

		_playerId: -1,
		_isMyTurn: false,
		_mapController: null,

		init: function (gameId, watch) {
			Client._gameId = gameId;
			Client._watch = watch;
			Globals.debug("gameId:", gameId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);

			var uploader = new Uploader();
			Globals.initLogger(gameId, uploader.uploadLogDump.bind(uploader));

			// initialize the history controller
			Client._history = new History(gameId);
			Client._historyController = new HistoryController(Client._history, gameId);

			// get game info for rendering purposes
			Client._downloader = new Downloader();
			Client._downloader.getGameInfo(gameId, Client.gameInfoCB);

			// connect socket
			var socketPath = "";
			if (watch) {
				Globals.debug("Connecting as watcher", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				socketPath = window.location.hostname + ":5001/watch/" + gameId;
			} else {
				socketPath = window.location.hostname + ":5001/" + gameId;
			}

			Client._socket = new SocketWrapper(io.connect(socketPath), gameId);
			Client._socket.on('error', Client.socket_error);
			Client._socket.on('disconnect', Client.disconnect);
			Client._socket.on('connect', Client.connect);
			Client._socket.on(Message.TYPE.STATE, Client.state);
			Client._socket.on(Message.TYPE.PLAYER_STATUS, Client.player_status);

			if (!watch) {
				Client._socket.on(Message.TYPE.CREATE_BOT, Client.create_bot);
				Client._socket.on(Message.TYPE.CREATE_HUMAN, Client.create_human);
				Client._socket.on(Message.TYPE.START_TURN, Client.start_turn);
			}
		},


		setInitialized: function() {
			// initialize renderer
			if (!Client._rendererInitialized) {
				Globals.debug("Initializing renderer", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				if (!Client._watch) {
					// don't needs a map controller if we're only watching
					Globals.ASSERT(Client._mapController);
				}
				$('#game').css('display', 'block');
				Client._rendererInitialized = true;
				Renderer.init(Client._canvas,
							Client._map,
							Client._gameInfo.getPlayers(),
							Client);

				// render the disconnected players properly
				Object.keys(Client._playerStatus).forEach(function(id) {
					if (!Client._playerStatus[id]) {
						Renderer.setPlayerName(id, "Disconnected");
					}
				});

				Client.processNextState();
			}
			if (!Client._initialized && !Client._watch) {
				Client._initialized = true;
				// tell the server we're initialized
				Client._socket.sendPlayerInitialized(Client._playerId);
			}
		},

		upToDate: function() {
			return (Client._currentViewState == Client._history.latestId());
		}, 

		processNextState: function() {
			if (Client._rendererInitialized && !Client._rendering && !Client._historyController.viewingHistory()) {
				if (!Client.upToDate()) {
					var nextState = 0;
					if (Client._currentViewState < 0) {
						nextState = Client._history.latestId();
					} else {
						nextState = Client._currentViewState + 1;
					}
					Client._history.getState(nextState, function(state) {
						if (Client._map) {
							Client._map.setState(state);
						}
						Client.render(state);
					});
				}
			}
		},  

		render: function(state) {
			if (!Client._rendererInitialized || !state || Client._historyController.viewingHistory()) {
				return;
			}

			if (!Client._rendering) {
				Client._rendering = true;

				Globals.debug("render state", state.stateId(), Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
				Renderer.stateUpdate(state, state.stateId()); // will call back to stateRendered()
			}
		},

		// from renderer
		stateRendered: function(state, id) {
			// render done
			Globals.debug("state", id, "rendered", Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
			Client._rendering = false;
			Client._currentViewState = state.stateId();

			if (!Client._historyController.viewingHistory()) {
				Client._historyController.setViewState(Client._currentViewState);
				if (!Client.upToDate()) {
					Client.processNextState();
				}
			}
		},

		// from renderer
		mouseOverCountry: function(id) {
			if (Client._mapController) {
				Client._mapController.mouseOverCountry(id);
			}
		},


		endTurnClicked: function() {
			Globals.debug("End Turn clicked", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);

			if (Client._isMyTurn && Client.upToDate()) {
				Client._isMyTurn = false;
				Client._socket.sendEndTurn(Client._playerId);
			} else if (!Client._isMyTurn) {
				Globals.debug("End Turn clicked when it's not my turn", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);				
			} else if (!Client.upToDate()) {
				Globals.debug("End Turn clicked when client isn't up to date", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
			}
		},


		//====================================================================================================
		// MapcontrollerInterface
		//====================================================================================================
		
		MapControllerInterface: {

			currentPlayerId: function() { return Client._history.getState(Client._currentViewState).currentPlayerId();},

			
			attack: function(from, to, callback){
				if (Client._isMyTurn) {
					//Globals.debug("<= attack", from.id(), "to", to.id(), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
					Client._socket.sendAttack(from.id(), to.id(), Client._playerId);
				}
			},
			
			clickable: function() {
				if (Client._rendering || !Client._isMyTurn || Client._historyController.viewingHistory()) {
					return false;
				}

				return true;
			}
		},


		//====================================================================================================
		// Socket events
		//====================================================================================================
		socket_error: function(sock, err) {
			Globals.debug("=> Socket ERROR:", err, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT_SOCKET);
		},

		disconnect: function(sock) {
			Globals.debug("=> Socket DISCONNECT", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);

			// tell all the AI's to chill
			Object.keys(Client._players).forEach(function(id) {
				if (Client._players[id]) {
					Client._players[id].turnEnded();
				}
			});

			Client._isMyTurn = false;
		},

		connect: function(sock) {
			Globals.debug("=> Socket CONNECT", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			if (Client._initialized && !Client._watch) {
				// tell the server we're initialized
				Client._socket.sendPlayerInitialized(Client._playerId);
			}
		},

		// @msg: {playerId: ,connected: ,playerName:}
		player_status: function(sock, msg) {
			
			Client._playerStatus[msg.playerId] = msg.connected;

			if (msg.connected) {
				Renderer.setPlayerName(msg.playerId, msg.playerName);
			} else {
				Renderer.setPlayerName(msg.playerId, "Disconnected");
			}
		},


		// @msg: {stateId:, gameId:}
		state: function(sock, msg) {
			Client._historyController.updateStateCount(msg.stateId);
			Client._history.getState(msg.stateId, function(state) {
				Client.processNextState();
			});
		},

		// @msg: {name: AI.getName(), playerId: <int>}
		create_bot: function(sock, msg) {
			var aiName = msg['name'];
			if (AIMap.hasOwnProperty(aiName)) {
				var id = parseInt(msg['playerId']);
				Globals.debug("Initializing new bot", aiName, "with playerId:", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				if (Client._players.hasOwnProperty(id)) {
					Globals.debug("Already have a player", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					if (Client._players[id].getName() == aiName) {
						Globals.debug("Same AI, not re-initializing", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
						Client._players[id].turnEnded();
						return;
					} else {
						Globals.debug("Different AI", Client._players[id].getName(), 
							"re-initializing player", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
						Client._players[id].stop();
						Client._players[id] = null;
					}
				}

				Client._players[id] = new SocketAIController(Client._socket, Client._history, AIMap[aiName], id); 
				if (Client._map) {
					Client._players[id].start();
				}
				
			} else {
				Globals.debug("Unknown AI requested:", aiName, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
		
		// @msg: {playerId:, name:}
		create_human: function(sock, msg) {
			if (Client._playerId != msg.playerId) {
				Client._playerId = msg.playerId;
				Client._players[msg.playerId] = Engine.PlayerInterface;
				$('#end_turn').click(Client.endTurnClicked);
				$('#game_controls').css('display', 'block');
			}
		},

		// @msg: {playerId:, stateId:}
		start_turn: function(sock, msg) {
			if (msg.playerId == Client._playerId) {
				Client._history.getState(msg.stateId, function(state) {
					Client._isMyTurn = true;
				});
			}
		},

		
		// END: Socket events ---------------


		//====================================================================================================
		// HTTP callbacks
		//====================================================================================================
		mapDataCB: function(success, data) {
			if (success) {
				if (!Client._map) {
					Globals.debug("Got map from server", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					Client._map = new Map();
					Client._map.deserializeHexes(data);

					// start all the AI's
					Object.keys(Client._players).forEach(function(id) {
						Globals.ASSERT(Client._players[id]);
						Client._players[id].start();
					});

					if (!Client._watch && !Client._mapController) {
						// create map controller
						Client._mapController = new Mapcontroller(Client._playerId, Client._map, Client.MapControllerInterface);
					}

					Client.setInitialized();					

				} else {
					Globals.debug("Got map when we already had one", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				}
			} else {
				Globals.debug("Get Map error", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},

		gameInfoCB: function(success, data) {
			if (success) {
				if (!Client._gameInfo) {
					Globals.debug("Got gameInfo from server", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					Client._gameInfo = Gameinfo.deserialize(data);
				}

				if (!Client._map) {
					Client._downloader.getMap(Client._gameId, Client.mapDataCB);
				}
			} else {
				Globals.debug("Get gameInfo error", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
	};


});

