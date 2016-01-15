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
		_players: {}, // playerId => Engine::PlayerInterface

		_rendererInitialized: false,
		_currentViewState: -1,
		_rendering: false,
		_historyController: null,

		_playerId: -1,
		_isMyTurn: false,
		_mapController: null,

		init: function (gameId, replay) {
			Client._gameId = gameId;
			Globals.debug("gameId:", gameId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);

			// initialize the history controller
			Client._history = new History(gameId);
			Client._historyController = new HistoryController(Client._history, gameId);

			// get game info for rendering purposes
			Client._downloader = new Downloader();
			Client._downloader.getGameInfo(gameId, Client.gameInfoCB);

			// connect socket
			Client._socket = io.connect(window.location.hostname + ":5001/" + Client._gameId);
			Client._socket.on('error', Client.socket_error);
			Client._socket.on('disconnect', Client.disconnect);
			Client._socket.on('connect', Client.connect);
			Client._socket.on(Message.TYPE.MAP, Client.map_update);
			Client._socket.on(Message.TYPE.STATE, Client.state);
			Client._socket.on(Message.TYPE.CREATE_BOT, Client.create_bot);
			Client._socket.on(Message.TYPE.CREATE_HUMAN, Client.create_human);
			Client._socket.on(Message.TYPE.START_TURN, Client.start_turn);
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
				Client._currentViewState = state.stateId();
				Client._historyController.setViewState(Client._currentViewState);

				if (state.attack()) {
					Client._rendering = true;
				}

				Globals.debug("render state", state.stateId(), Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
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

		endTurnClicked: function() {
			if (Client._isMyTurn) {
				Client._isMyTurn = false;
				Client._socket.emit(Message.TYPE.END_TURN, Message.endTurn(Client._playerId));
			}
		},


		//====================================================================================================
		// MapcontrollerInterface
		//====================================================================================================
		
		MapControllerInterface: {

			currentPlayerId: function() { return Client._history.getState(Client._currentViewState).currentPlayerId();},

			update: function() {
				if (!Client._rendering) {
					var state = Client._history.getState(Client._currentViewState);
					var curr = state.currentPlayerId();
					if (Client._players[curr] && Client._players[curr].isHuman()) {
						Client.render(state);
					}
				}
			},
			
			attack: function(from, to, callback){
				if (Client._isMyTurn) {
					Globals.debug("<= attack", from.id(), "to", to.id(), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
					Client._socket.emit(Message.TYPE.ATTACK, Message.attack(from.id(), to.id()));
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
		socket_error: function(err) {
			Globals.debug("=> Socket ERROR:", err, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT_SOCKET);
		},

		disconnect: function() {
			Globals.debug("=> Socket DISCONNECT", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);

			// tell all the AI's to chill
			Object.keys(Client._players).forEach(function(id) {
				if (Client._players[id]) {
					Client._players[id].turnEnded();
				}
			});

			Client._isMyTurn = false;
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
			Client._historyController.updateStateCount(msg.stateId);
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
		
		// @msg: {playerId:, name:}
		create_human: function(msg) {
			Globals.debug("=> create_human", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);

			if (Client._playerId != msg.playerId) {
				Client._playerId = msg.playerId;
				Client._players[msg.playerId] = Engine.PlayerInterface;
				$('#end_turn').click(Client.endTurnClicked);
				$('#game_controls').css('display', 'block');
			}
		},

		// @msg: {playerId:, stateId:}
		start_turn: function(msg) {
			if (msg.playerId == Client._playerId) {
				Globals.debug("=> start_turn", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
				Client._history.getState(msg.stateId, function(state) {
					if (Client._map) {
						Client._map.setState(state);
					}
					Client._isMyTurn = true;
				});
			}
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
						Globals.ASSERT(Client._players[id]);
						Client._players[id].start();
					});

					if (Client._gameInfo) {
						Client.initRenderer();
					}

					if (Client._playerId >= 0 && !Client._mapController) {
						// create map controller
						Client._mapController = new Mapcontroller(Client._playerId, Client._canvas, Client._map, Client.MapControllerInterface);
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

