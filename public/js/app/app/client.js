
$(function() {

	"use strict";

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
		_viewer: null,
		_gameId: null,	
		_initialized: false,
		_watch: false,

		_map: null,
		_gameInfo: null,
		_players: {}, // playerId => Engine::PlayerInterface

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
			

			if (!watch) {
				Client._socket.on(Message.TYPE.CREATE_BOT, Client.create_bot);
				Client._socket.on(Message.TYPE.CREATE_HUMAN, Client.create_human);
				Client._socket.on(Message.TYPE.START_TURN, Client.start_turn);
			}

			Client._viewer = new Viewer(Client._history, Client._socket);

			Status.setStatus("Loading...");
		},


		setInitialized: function() {
			// initialize renderer
			if (!Client._initialized) {

				Client._initialized = true;
				
				if (!Client._watch) {
					// don't need a map controller if we're only watching
					Globals.ASSERT(Client._mapController);
				}

				// initialize viewer
				Client._viewer.init(Client._canvas, Client._map, Client._gameInfo);


				if (!Client._watch) {
					// tell the server we're initialized
					Client._socket.sendPlayerInitialized(Client._playerId);
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

			if (Client._isMyTurn && Client._viewer.upToDate()) {
				Client._isMyTurn = false;
				Client._socket.sendEndTurn(Client._playerId);
			} else if (!Client._isMyTurn) {
				Globals.debug("End Turn clicked when it's not my turn", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);				
			} else if (!Client._viewer.upToDate()) {
				Globals.debug("End Turn clicked when client isn't up to date", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
			}
		},


		//====================================================================================================
		// MapcontrollerInterface
		//====================================================================================================
		
		MapControllerInterface: {

			currentPlayerId: function() { return Client._history.getLatest().currentPlayerId();},

			
			attack: function(from, to, callback){
				if (Client._isMyTurn) {
					//Globals.debug("<= attack", from.id(), "to", to.id(), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
					Client._socket.sendAttack(from.id(), to.id(), Client._playerId);
				}
			},
			
			clickable: function() {
				if (Renderer._rendering || !Client._isMyTurn || Client._viewer.viewingHistory()) {
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

			Status.setStatus("Lost Connection to Server. Reconnecting...");

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
			Status.clear();
			if (Client._initialized && !Client._watch) {
				// tell the server we're initialized
				Client._socket.sendPlayerInitialized(Client._playerId);
			}
		},


		// @msg: {name: AI.getName(), playerId: <int>}
		create_bot: function(sock, msg) {
			var aiName = msg.name;
			if (AIMap.hasOwnProperty(aiName)) {
				var id = parseInt(msg.playerId);
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
				if (Client._mapController) {
					Client._mapController.setPlayerId(Client._playerId);
				}
				$('#end_turn').click(Client.endTurnClicked);
				$('#game_controls').css('display', 'block');
			}
		},

		// @msg: {playerId:, stateId:}
		start_turn: function(sock, msg) {
			if (msg.playerId == Client._playerId) {
				Client._history.getHistory(msg.stateId)
					.then(function(state) {
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
					Client._map = new GameMap();
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

