"use strict"


$(function() {

	/*========================================================================================================================================*/
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
	
	/*========================================================================================================================================*/
	
	window.Client = {
		
		_canvas: document.getElementById("c"),
		_downloader: null,
		_controller: null,
		_mapController: null,
		_gameId: null,
		_playerId: -1,
		_history: null,
		_socket: null,
		_map: null,
		_isAttacking: false,
		_attackCallback: null,
		_currentState: -1,
		_currentPlayer: -1,
		_playerNames: [],
		_started: false,
		_bots: {}, // map from playerId to AIWrapper
		
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
			Client._controller = new Clientcontroller(Client._history, Client._playerId, replay, Client.endTurnClicked);
		},

		// HTTP request callback
		gameInfoReceived: function(success, data) {
			if (success) {
				Client._playerNames = JSON.parse(data).players;
				
				// connect to server
				if (!Client._socket) {
					
					if (Client._mode == Client.MODES.PLAY) {
						Client._socket = io.connect(window.location.hostname + ":5001/" + Client._gameId);
						Client._socket.on('map', Client.mapAvailable);
						Client._socket.on('error', Client.socketError);
						Client._socket.on('state', Client.engineUpdate);
						Client._socket.on('create_bot', Client.createBot);
						Client._socket.on('start_turn', Client.startTurn);
					} else {
						Client._socket = io.connect(window.location.hostname + ":5001/watch/" + Client._gameId);
						Client._socket.on('state', Client.engineUpdate);
					}
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
			}
			
		},
		
		// from History
		stateUpdate: function() {
			if (Client._history.length() > 0) {
				if (!Client._started) {
					// this will coerce processNextState to handle the most recent state
					Client._currentState = Client._history.length()-2;
					Client.processNextState();
					Client.start();
				}
				
				Globals.debug("Got state data", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				
				if (!Client.upToDate()) {
					Client.processNextState();
				}
				
				if (Client._controller) {
					Client._controller.update();
				}
			} 
		},
		
		start: function() {
			Globals.debug("start()", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
			Client._started = true;
			$('#wait_message').css('display', 'none');
			$('#game').css('display', 'block');
			if (Client._mode == Client.MODES.PLAY) {
				$('#view_link').css('display', 'block');
			}
			
			if (Client._mode == Client.MODES.PLAY) {
				$('#end_turn').click(Client._controller.endTurn.bind(Client._controller));
			} else {
				$('#end_turn').css('display', 'none');
			}
			$('#back_btn').click(Client._controller.historyBack.bind(Client._controller));
			$('#forward_btn').click(Client._controller.historyForward.bind(Client._controller));
			
			// startup the AIs
			Object.keys(Client._bots).forEach(function(id) {
				// we have to wait until we have a map to start the bots
				Globals.debug("Starting bot", id, Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				Client._bots[id].start();
			});
			
			// the length check is to see if we're reconnecting to a game already under way
			if (Client._bots[0] && Client._history.length() == 1) {
				// if player 0 is a bot, tell it to start
				Globals.debug("Calling startTurn for player 0", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				Client._bots[0].startTurn(Client._history.getState(0));
			}
		},
		
		upToDate: function() {
			return (Client._currentState == (Client._history.length()-1));
		},
		
		// push notification from server that the map is available
		mapAvailable: function(data) {
			Globals.debug("=> map", JSON.stringify(data), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			if (Client._playerId == -1) {
				Client._playerId = data.playerId;
				Client._controller.setPlayerId(data.playerId);
				Globals.debug("Got player Id", data.playerId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				
				var playersToJoin = data['waitingFor'];
				if (playersToJoin > 0) {
					Globals.debug("Waiting for " + playersToJoin + " to join", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					$('#wait_message').css('display', 'block');
				}
			}
			if (!Client._map) {
				// request the map
				Client._downloader.getMap(Client._gameId, Client.mapReceived);
			}
		},

		// push notification from server that a new state is available
		// @stateId: 0-based counter. First state is 0.
		engineUpdate: function(stateId) {
			Globals.debug("=> state " + stateId, Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT_SOCKET);
			Client._history.updateStateCount(stateId+1);
		},
				
		// from server
		// @data: {name: AI.getName(), playerId: <int>}
		createBot: function(data) {
			Globals.debug("=> create_bot", JSON.stringify(data), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			var aiName = data['name'];
			if (AIMap.hasOwnProperty(aiName)) {
				var id = parseInt(data['playerId']);
				Globals.debug("Initializing new bot", aiName, "with playerId:", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				if (Client._bots.hasOwnProperty(id)) {
					Globals.debug("Already have a player", id, "re-initializing bot", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				}
				Client._bots[id] = new AIWrapper(AIMap[aiName], Client, id, false);
				
			} else {
				Globals.debug("Unknown AI requested:", aiName, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
		
		// from server - for the bots
		startTurn: function(data) {
			Globals.debug("=> start_turn", JSON.stringify(data), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			if (Client._started) {
				if (Client._bots[data['playerId']]) {
					Client._history.onStateReceived(data['stateId'], function(state) {
						Globals.debug("Calling startTurn for player", data['playerId'], Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
						Client._bots[data['playerId']].startTurn(state);
					});
				} else {
					Globals.debug("Got start_turn event for nonexistant bot", data['playerId'], Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
				}
			} else {
				Globals.debug("Got start_turn event before game has started", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
			}
		},
		
		// from mapController
		mapUpdate: function() {
			if (!Client._controller.viewingHistory() && !Client._isAttacking && Client.upToDate()) {
				Client.redraw();
			}
		},
		
		// from controller
		endTurnClicked: function(currentPlayerId) {
			Globals.debug("<= end_turn", currentPlayerId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			Client._socket.emit("end_turn", {playerId: currentPlayerId});
		},
		
		// from renderer
		renderAttackDone: function() {
			Globals.debug("Attack animation finished", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
			Client._isAttacking = false;
			Client._controller.setIsAttacking(false);
			if (!Client.upToDate()) {
				Client.processNextState();
			}
		},
		
		processNextState: function() {
			Globals.debug("processNextState. Current state is", Client._currentState, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
			if (Client._currentState < 0) {
				Client._currentState = 0;
			} else if (Client._currentState < (Client._history.length() - 1)){
				Client._currentState ++;
			}
			
			Globals.debug("process state", Client._currentState, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
			
			Client._currentPlayer = Client.getState().currentPlayerId();
			
			if (Client._attackCallback) {
				Client._attackCallback();
				Client._attackCallback = null;
			}
			
			Client.redraw();
			
			if (!Client._isAttacking && !Client.upToDate()) {
				Client.processNextState();
			} else {
				Globals.debug("Client is up to date. Most recent state we have is", Client._history.length()-1, Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
			}
		},
		
		redraw: function() {
			
			// only render if we're not currently in the process of animating
			// some previous attack
			if (Client._isAttacking || Client._controller.viewingHistory()) {
				Globals.debug("aborting redraw", "attacking", Client._isAttacking, "viewHistory", 
								Client._controller.viewingHistory(), Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
				return;
			}
			
			var gamestate = Client._history.getState(Client._currentState);
			if (gamestate) {
				if (gamestate.attack()) {
					Client._isAttacking = true;
					Client._controller.setIsAttacking(true);
					Globals.debug("Attack animation beginning", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				} else {
					// update the map state
					Client._map.setState(gamestate);
				}
				
				//Globals.debug("Rendering state", Client._currentState, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
				Renderer.render(gamestate, Client.renderAttackDone);
				if (Client._controller) {
					Client._controller.update();
				}
			}
		},
		
		socketError: function(err) {
			Globals.debug("Socket ERROR:", err, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT_SOCKET);
		},
		
		/*========================================================================================================================================*/
		// Implementing the AIController interface
		/*========================================================================================================================================*/
		map: function() {
			return Client._map;
		},
		
		getState: function() {
			return Client._history.getState(Client._currentState);
		},
		
		endTurn: function(playerId){
			Client.endTurnClicked(playerId);
		},
		
		// @callback: function(success){}
		attack: function(from, to, callback){
			Client._attackCallback = callback;
			Globals.debug("<= attack", from, "=>", to, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			Client._socket.emit('attack', {from: from.id(), to: to.id()});
		}, 
		/*========================================================================================================================================*/
		
		
		// So the MapController can call back into us
		mapConInterface: {
			currentPlayerId: function() {
				var state = Client._history.getLatest();
				return state ? state.currentPlayerId() : -1;
			},
			
			attack: function(from, to, callback) {
				Client._attackCallback = callback;
				Globals.debug("<= attack", from, "=>", to, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
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

