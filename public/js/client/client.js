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
	
	
	window.Client = {
		
		_canvas: document.getElementById("c"),
		_socket: null,
		_downloader: null,
		_history: null,
		_gameId: null,	

		_map: null,
		_gameInfo: null,
		_players: {}, // playerId => SocketAIController

		_rendererInitialized: false,
		_currentViewState: -1,
		_rendering: false,

		init: function (gameId, replay) {
			Client._gameId = gameId;
			Globals.debug("gameId:", gameId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
			
			Client._downloader = new Downloader();
			Client._history = new History(gameId);

			Client._socket = io.connect(window.location.hostname + ":5001/" + Client._gameId);
			Client._socket.on('error', Client.socket_error);
			Client._socket.on('disconnect', Client.disconnect);
			Client._socket.on('connect', Client.connect);
			Client._socket.on(Message.TYPE.MAP, Client.map_update);
			Client._socket.on(Message.TYPE.STATE, Client.state);
			Client._socket.on(Message.TYPE.CREATE_BOT, Client.create_bot);
			Client._socket.on(Message.TYPE.CREATE_HUMAN, Client.create_human);

			// get game info for rendering purposes
			Client._downloader.getGameInfo(gameId, Client.gameInfoCB);
		},

		initRenderer: function() {
			if (!Client._rendererInitialized) {
				Globals.debug("Initializing renderer", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				$('#game').css('display', 'block');
				Client._rendererInitialized = true;
				Renderer.init(Client._gameInfo.players.length,
							Client._canvas,
							Client._map,
							Client._gameInfo.players);
				Client.processNextState();
			}
		},

		upToDate: function() {
			return (Client._currentViewState == Client._history.latestId());
		}, 

		processNextState: function() {
			if (Client._rendererInitialized && !Client._rendering) {
				if (!Client.upToDate()) {
					if (Client._currentViewState < 0) {
						Client._currentViewState = Client._history.latestId();
					} else {
						Client._currentViewState ++;
					}
					Globals.debug("viewState", Client._currentViewState, Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
					Client._history.getState(Client._currentViewState, Client.render);
				}
			}
		},  

		render: function(state) {
			if (!Client._rendererInitialized || !state) {
				return;
			}

			if (!Client._rendering) {

				if (state.attack()) {
					Client._rendering = true;
				}

				Globals.debug("render state", state.stateId(), Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				Renderer.render(state, function() {
					// render done
					Client._rendering = false;
					if (!Client.upToDate()) {
						Client.processNextState();
					}
				});

				if (!state.attack()) {
					Client.processNextState();
				}
			}
		},


		//====================================================================================================
		// Socket events
		//====================================================================================================
		socket_error: function(err) {
			Globals.debug("=> Socket ERROR:", err, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT_SOCKET);
		},

		disconnect: function() {
			Globals.debug("=> Socket DISCONNECT", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);

			// tell all the AI's to chill
			Object.keys(Client._players).forEach(function(id) {
				Client._players[id].turnEnded();
			});
		},

		connect: function() {
			Globals.debug("=> Socket CONNECT", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
		},

		// @msg: {gameId: <string>}
		map_update: function(msg) {
			Globals.debug("=> map", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			if (!Client._map) {
				Client._downloader.getMap(Client._gameId, Client.mapData);
			}
		},

		// @msg: {stateId:, gameId:}
		state: function(msg) {
			Globals.debug("=> state", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			Client._history.getState(msg.stateId, function(state) {
				Client.processNextState();
			});
		},

		// @msg: {name: AI.getName(), playerId: <int>}
		create_bot: function(msg) {
			Globals.debug("=> create_bot", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			var aiName = msg['name'];
			if (AIMap.hasOwnProperty(aiName)) {
				var id = parseInt(msg['playerId']);
				Globals.debug("Initializing new bot", aiName, "with playerId:", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				if (Client._players.hasOwnProperty(id)) {
					Globals.debug("Already have a player", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					if (Client._players[id].getName() == aiName) {
						Globals.debug("Same AI, not re-initializing", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
						return;
					} else {
						Globals.debug("Different AI", Client._players[id].getName(), 
							"re-initializing player", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
						Client._players[id].stop();
						Client._players[id] = null;
					}
				}

				Client._players[id] = new SocketAIController(Client._socket, Client._history, AIMap[aiName], id, false); 
				if (Client._map) {
					Client._players[id].start();
				}
				
			} else {
				Globals.debug("Unknown AI requested:", aiName, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
		
		create_human: function(msg) {
			Globals.debug("=> create_human", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
		},

		
		// END: Socket events ---------------


		//====================================================================================================
		// HTTP callbacks
		//====================================================================================================
		mapData: function(success, data) {
			if (success) {
				if (!Client._map) {
					Globals.debug("Got map from server", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					Client._map = new Map();
					Client._map.deserializeHexes(data);

					// start all the AI's
					Object.keys(Client._players).forEach(function(id) {
						Client._players[id].start();
					});

					if (Client._gameInfo) {
						Client.initRenderer();
					}

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
					Client._gameInfo = JSON.parse(data);

					if (Client._map) {
						Client.initRenderer();
					}
				}
			} else {
				Globals.debug("Get gameInfo error", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
	};


});

