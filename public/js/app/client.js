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
		_gameId: null,	
		_latestStateId: -1,

		_map: null,
		_players: {}, // playerId => SocketAIController

		init: function (gameId, replay) {
			Client._gameId = gameId;
			Globals.debug("gameId:", gameId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
			
			Client._downloader = new Downloader();

			Client._socket = io.connect(window.location.hostname + ":5001/" + Client._gameId);
			Client._socket.on('error', Client.socket_error);
			Client._socket.on('disconnect', Client.disconnect);
			Client._socket.on(Message.TYPE.MAP, Client.map_update);
			Client._socket.on(Message.TYPE.STATE, Client.state);
			Client._socket.on(Message.TYPE.CREATE_BOT, Client.create_bot);
			Client._socket.on(Message.TYPE.CREATE_HUMAN, Client.create_human);
			Client._socket.on(Message.TYPE.START_TURN, Client.start_turn);
		},

		//====================================================================================================
		// Socket events
		//====================================================================================================
		socket_error: function(err) {
			Globals.debug("=> Socket ERROR:", err, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT_SOCKET);
		},

		disconnect: function() {
			Globals.debug("=> Socket DISCONNECT", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
		},

		// @msg: {gameId: <string>}
		map_update: function(msg) {
			Globals.debug("=> Socket map", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			if (!Client._map) {
				Client._downloader.getMap(Client._gameId, Client.mapData);
			}
		},

		state: function(msg) {
			Globals.debug("=> Socket state", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
		},

		// @msg: {name: AI.getName(), playerId: <int>}
		create_bot: function(msg) {
			Globals.debug("=> Socket create_bot", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			var aiName = msg['name'];
			if (AIMap.hasOwnProperty(aiName)) {
				var id = parseInt(msg['playerId']);
				Globals.debug("Initializing new bot", aiName, "with playerId:", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				if (Client._players.hasOwnProperty(id)) {
					Globals.debug("Already have a player", id, "re-initializing bot", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				}

				Client._players[id] = new SocketAIController(Client._socket, AIMap[aiName], id, false); 
				if (Client._map) {
					Client._players[id].start();
				}
				
			} else {
				Globals.debug("Unknown AI requested:", aiName, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
		
		create_human: function(msg) {
			Globals.debug("=> Socket create_human", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
		},

		// @msg: {playerId:, stateId:}
		start_turn: function(msg) {
			Globals.debug("=> Socket start_turn", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			if (Client._players.hasOwnProperty(msg.playerId) && Client._players[msg.playerId]) {
				Client._players[msg.playerId].startTurn();
			} else {
				Globals.debug("Got start_turn for playerId that we don't have", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT_SOCKET);
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
						Client._players[id].start();
					});

				} else {
					Globals.debug("Got map when we already had one", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				}
			} else {
				Globals.debug("Get Map error", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},

	};




	/*========================================================================================================================================*/
	// SocketAIController: 	Implements AIController so AIWrapper can connect to it.
	// 						Implelments Engine::PlayerWrapper so client can use it
	/*========================================================================================================================================*/
	
	var SocketAIController = function(socket, ai, playerId, trusted) {
		this._aiWrapper = new AIWrapper(ai, this, playerId, trusted);
		this._socket = socket;
		this._started = false;
		this._startTurnPending = false;

		Globals.ASSERT(Globals.implements(this, Engine.PlayerWrapper));
		Globals.ASSERT(Globals.implements(this, AIWrapper.ControllerInterface));
	};

	// Implementing the Engine::PlayerWrapper interface

	SocketAIController.prototype.getName = function(){return this._aiWrapper.getName();};
	SocketAIController.prototype.isHuman = function(){return false;};
	SocketAIController.prototype.start = function(){
		if (!this._started) {
			this._started = true;
			this._aiWrapper.start();
			if (this._startTurnPending) {
				this._startTurnPending = false;
				this.startTurn();
			}
		}
	};
	SocketAIController.prototype.stop = function(){
		this._started = false;
		this._aiWrapper.stop();
	};
	SocketAIController.prototype.startTurn = function(state){
		// The AI can't start until the map is downloaded, and sometimes the first
		// start_turn event from the server comes first. This is an attempt
		// to deal with that
		if (this._started) {
			this._aiWrapper.startTurn(state);
		} else {
			this._startTurnPending = true;
		}
	};
	SocketAIController.prototype.attackDone = function(success){this._aiWrapper.attackDone(success);};
	SocketAIController.prototype.turnEnded = function() {this._aiWrapper.turnEnded();};
	SocketAIController.prototype.loses = function(){this._aiWrapper.loses();};
	
	// Implementing the AIController interface
	
	SocketAIController.prototype.map = function() {
		Globals.ASSERT(Client._map);
		return Client._map;
	};
		
	SocketAIController.prototype.getState = function() {
		return Client._history.getState(Client._currentState);
	};
	
	SocketAIController.prototype.endTurn = function(playerId){
		this._socket.emit(Message.TYPE.END_TURN, Message.endTurn(playerId));
	};
	
	// @callback: function(success){}
	SocketAIController.prototype.attack = function(from, to, callback){
		Client._attackCallback = callback;
		Globals.debug("<= attack", from, "=>", to, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
		this._socket.emit(Message.TYPE.ATTACK, Message.attack(from.id(), to.id()));
	};

});

