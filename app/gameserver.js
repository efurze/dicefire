"use strict"

var GAME_LINGER_TIMEOUT = 100000000; // milliseconds


var redis = require('redis');
var redisClient = redis.createClient();
var Globals = require('..//public/js/globals.js');

var SocketHandler = function() {

	var sio = require('socket.io');
	var io = null;
	var games = {};
	
	return {
		
		listen: function(app, port) {
			var server = app.listen(port);
			io = require('socket.io').listen(server);
		},
		
		createGame: function(req, res) {
			var gameId = req.query['gameId'];
			var resultsData = req.body;
			// randomize the player order
			resultsData.players = Globals.shuffleArray(resultsData.players);
			Globals.debug("Create game", gameId, resultsData, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
			var filename = gameId + "/game.json";
			redisClient.set(filename, JSON.stringify(resultsData), function(err, reply) {
				if (err) {
					Globals.debug("ERROR saving gameInfo to Redis:", err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
					res.status(500).send(JSON.stringify({err: err}));
				} else {
					Globals.debug("Listening for game " + gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
					var socketNamespace = io.of("/" + gameId);
					var watchNamespace = io.of("/watch/" + gameId);
					games[gameId] = new GameServer(gameId, socketNamespace, watchNamespace);
					res.status(200).send("{}");
				}
			});
		},
		
		removeGame: function(gameId) {
			if(games.hasOwnProperty(gameId)) {
				games[gameId].close();
				delete games[gameId];
			}
		}
	};
}();


/*========================================================================================================================================*/
// PlayerWrapper: implements Engine::PlayerInterface
/*========================================================================================================================================*/
var PlayerWrapper = function (id) {
	this._socket = null;
	this._id = id;
};

PlayerWrapper.prototype.id = function() {return this._id};
PlayerWrapper.prototype.setSocket = function(socket) {this._socket = socket;};
PlayerWrapper.prototype.hasSocket = function() {return (this._socket != null);};
PlayerWrapper.prototype.socket = function() {return this._socket;};

PlayerWrapper.prototype.getName = function() {return "human";};
PlayerWrapper.prototype.isHuman = function() {return true;};
PlayerWrapper.prototype.start = function() {};
PlayerWrapper.prototype.stop = function() {};
PlayerWrapper.prototype.startTurn = function(state) {
	Globals.debug("startTurn", this._id, Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
	if (this._socket) {
		this._socket.emit('start_turn', {playerId: this._id, stateId: state.stateId()});
	}
};
PlayerWrapper.prototype.attackDone = function(success) {};
PlayerWrapper.prototype.loses = function() {};

/*========================================================================================================================================*/
// AISocketWrapper: implements Engine::PlayerInterface
/*========================================================================================================================================*/
var AISocketWrapper = function (aiName, id) {
	this._socket = null;
	this._name = aiName;
	this._id = id;
};

AISocketWrapper.prototype.id = function() {return this._id};
AISocketWrapper.prototype.setSocket = function(socket) {this._socket = socket;};
AISocketWrapper.prototype.hasSocket = function() {return (this._socket != null);};
AISocketWrapper.prototype.socket = function() {return this._socket;};

AISocketWrapper.prototype.getName = function() {return this._name;};
AISocketWrapper.prototype.isHuman = function() {return false;};
AISocketWrapper.prototype.start = function() {};
AISocketWrapper.prototype.stop = function() {};
AISocketWrapper.prototype.startTurn = function(state) {
	Globals.debug("startTurn", this._id, Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
	if (this._socket) {
		Globals.debug("Sending startTurn for player", this._id, Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
		this._socket.emit('start_turn', {playerId: this._id, stateId: state.stateId()});
	}
};
AISocketWrapper.prototype.attackDone = function(success) {};
AISocketWrapper.prototype.loses = function() {};

/*========================================================================================================================================*/
// SocketWrapper: wraps a Socket.IO socket
/*========================================================================================================================================*/
var SocketWrapper = function(socket) {
	this._socket = socket;
	this._id = socket.id;
	this._callbacks = {};
};

SocketWrapper.prototype.id = function() {return this._id;}

SocketWrapper.prototype.ip= function() {
	if (this._socket) {
		return this._socket.handshake.address;
	} 
}

SocketWrapper.prototype.on = function(event, callback) {
	var self = this;
	self._socket.on(event, function() {
		Globals.debug("Got socket event", event, JSON.stringify(arguments), self._id, Globals.LEVEL.TRACE, Globals.CHANNEL.SERVER);
		var args = [];
		args.push(self);
		var count = Object.keys(arguments).length;
		for (var i=0; i < count; i++) {
			args.push(arguments[i]);
		}
		callback.apply(null, args);
	});
};

SocketWrapper.prototype.emit = function(event, data) {
	this._socket.emit(event, data);
};

SocketWrapper.prototype.disconnect = function() {
	var self = this;
	self._socket.disconnect();
	delete self._socket;
	self._socket = null;
}

/*========================================================================================================================================*/
// GameServer - one of these for each active game
/*========================================================================================================================================*/

var Engine = require('../public/js/game/engine.js');
var Plyer = require('../public/js/ai/plyer.js');
var Greedy = require('../public/js/ai/greedy.js');
var Aggressive = require('../public/js/ai/aggressive.js');
var Human = require('../public/js/ai/human.js');
var AIWrapper = require('../public/js/game/aiwrapper.js');


var GameServer = function(gameId, namespace, watchNamespace) {
	var self = this;
	self._gameId = gameId;
	self._ns = namespace;
	self._watchersNs = watchNamespace;
	self._sockets = {};
	self._socketMap = {}; // socketId to array of playerIds
	self._ipMap = {}; // IP address to array of playerIds
	self._gameInfo = null;
	self._playerMap = []; // array of PlayerInterface
	self._connectionCount = 0;
	self._expectedHumans = 0;
	self._currentHumans = 0;
	self._started = false;
	self._watchdogTimerId = -1;
	
	// get the game info
	redisClient.get(gameId+"/game.json", function(err, data) {
		try {
			if (!data) {
				Globals.debug("No game file found for gameId " + gameId, Globals.LEVEL.WARN, Globals.CHANNEL.SERVER);
			} else {
				Globals.debug("Got game info: " + data, Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
				self._gameInfo = JSON.parse(data);
				
				self._engine = new Engine();
				
				//initialize the AIs
				var players = [];
				self._gameInfo['players'].forEach(function(playerName, id) {
					if (playerName === "human") {
						self._expectedHumans ++;
						var pw = new PlayerWrapper(id);
						Globals.debug("Inserted human at position " + pw.id(), Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
						players.push(pw);
						self._playerMap.push(pw);
					} else {
						var ai = new AISocketWrapper(playerName, id);
						players.push(ai);
						self._playerMap.push(ai);
					}
				});
				
				Globals.debug("Players for game " + gameId + ":", Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
				Object.keys(self._playerMap).forEach(function(id) {
					Globals.debug(JSON.stringify(self._playerMap[id]), Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
				})
				
				
				// initialize the game engine
				self._engine.init(players);
				self._engine.setup();

				// push the map data to redis
				var filename = self._gameId + "/map.json";
				redisClient.set(filename, self._engine.map().serializeHexes(), function(err, reply) {
					if (err) {
						Globals.debug("ERROR saving map data to Redis:", err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
					} 

					self._engine.registerStateCallback(self.engineUpdate.bind(self));			
				
					// listen for player connections
					namespace.on('connection', self.connectPlayer.bind(self));
					// listen for watcher connections
					watchNamespace.on('connection', self.connectWatcher.bind(self));
				});
			}
		} catch (err) {
			Globals.debug("Exception initializing game engine", err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
		}
	});
};


GameServer.prototype.connectWatcher = function(socket) {
	Globals.debug("Connected watcher socket id " + socket.id + " at " + socket.handshake.address + " to game " + this._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	var self = this;
	var sock = new SocketWrapper(socket);
	self._sockets[sock.id()] = sock;
	
}

GameServer.prototype.connectPlayer = function(socket) {
	Globals.debug("Connected player socket id " + socket.id + " at " + socket.handshake.address + " to game " + this._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	var self = this;
	var sock = new SocketWrapper(socket);
	self._sockets[sock.id()] = sock;
	self._connectionCount ++;
	sock.on('error', this.socketError.bind(this));
	sock.on('disconnect', this.disconnect.bind(this));
	sock.on('end_turn', this.endTurn.bind(this));
	sock.on('attack', this.attack.bind(this));
	
	if (self._watchdogTimerId >= 0) {
		clearTimeout(self._watchdogTimerId);
	}
	self._watchdogTimerId = -1;
	
	// find a slot for this player
	var id = self.reconnect(sock);
	
	if (id < 0) {
		for (var i=0; i < self._gameInfo.players.length; i++) {
			if (self._playerMap[i].isHuman() && !self._playerMap[i].hasSocket()) {
				Globals.debug('Assigning socket ' + sock.id() + ' to player ' + i, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
				self._currentHumans ++; 
				self._playerMap[i].setSocket(sock);
				
				if (!self._socketMap[sock.id()]) { self._socketMap[sock.id()] = []; }
				self._socketMap[sock.id()].push(i);
				
				if (!self._ipMap[sock.ip()]) { self._ipMap[sock.ip()] = []; }
				self._ipMap[sock.ip()].push(i);
				id = i;
				break;
			}
		}
	}
	
	sock.emit("map", {playerId: id, waitingFor: self._expectedHumans - self._currentHumans});
	if (self._currentHumans == self._expectedHumans && !self._started) {
		// everyone's here, start the game!
		self.startGame();
	}
};

// checks to see if we've seen this IP address before, and if so
// attempts to reconnect socket to same player
GameServer.prototype.reconnect = function(socketWrapper) {
	var self = this;
	var humanAssignedTo = -1;
	if (self._ipMap.hasOwnProperty(socketWrapper.ip())) {
		var playerIds = self._ipMap[socketWrapper.ip()];
		playerIds.forEach(function(playerId) {
			// try to reconnect all the players that were previously assigned to this IP
			if (self._playerMap[playerId] && !self._playerMap[playerId].hasSocket()) {
				Globals.debug('Reconnecting socket ' + socketWrapper.id() + ' to player ' + playerId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
				
				if (self._playerMap[playerId].isHuman()) {
					self._playerMap[playerId].setSocket(socketWrapper);

					if (!self._socketMap[socketWrapper.id()]) { self._socketMap[socketWrapper.id()] = []; }
					self._socketMap[socketWrapper.id()].push(playerId);
					
					self._currentHumans ++; 
					humanAssignedTo = playerId;
				} else { 
					self.assignBot(self._playerMap[playerId], socketWrapper);
					if (self._engine.currentPlayerId() == playerId) {
						self._playerMap[playerId].startTurn(self._engine.getState());
					}
				}
			}
		});
		
	} else {
		Globals.debug("haven't seen this IP before", Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
	}
	
	return humanAssignedTo;
};

GameServer.prototype.disconnect = function(socketWrapper) {
	var self = this;
		
	if (self._socketMap.hasOwnProperty(socketWrapper.id())) {
		self._connectionCount --;
		self._currentHumans --;
		Globals.debug('Socket ' + socketWrapper.id() + ' disconnected. Current connectionCount', self._connectionCount, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
		
		var playerIds = self._socketMap[socketWrapper.id()];
		playerIds.forEach(function(playerId) {
			if (self._playerMap[playerId]) {
				Globals.debug('Socket disconnect orphaning player', playerId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
				self._playerMap[playerId].setSocket(null);
			}
		});
		delete self._socketMap[socketWrapper.id()];
		
		if (self._connectionCount == 0) {
			Globals.debug('No active connections, starting linger timer', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
			self._watchdogTimerId = setTimeout(function() {
				Globals.debug('Timeout expired, cleaning up game', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
				SocketHandler.removeGame(self._gameId);
				self._watchdogTimerId = -1;
			}, GAME_LINGER_TIMEOUT);
		}
	} else {
		// a watcher left
		Globals.debug('Watcher socket ' + socketWrapper.id() + ' disconnected.', Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
	}
};

GameServer.prototype.startGame = function() {
	var self = this;
	
	Globals.debug('startGame', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	
	// farm out the AIs to various players
	var bots = self._playerMap.filter(function(player, id) {
		return !player.isHuman();
	});
	
	bots.forEach(function(bot) {
		Globals.ASSERT(bot instanceof AISocketWrapper);
		if (!bot.hasSocket()) {
			self.assignBot(bot)
		}
	});
	
	Globals.debug('Game started', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	self._started = true;
	self._engine.startTurn(0);
};

// @bot: AISocketWrapper
GameServer.prototype.assignBot = function(bot, socket) {
	var self = this;
	var socketIds = [];
	Object.keys(self._sockets).forEach(function(socketId) {
		socketIds.push(socketId);
	});

	if (!socket) {
		// randomly pick a socket to assign it to
		var index = Math.round(Math.random() * (socketIds.length - 1));
		socket = self._sockets[socketIds[index]];
	}
	Globals.ASSERT(socket instanceof SocketWrapper);
	Globals.debug('Assigning Bot ' + bot.getName() + ' at position ' + bot.id() + ' to socket ' + socket.id(), Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	bot.setSocket(socket);
	
	if (!self._socketMap[socket.id()]) { self._socketMap[socket.id()] = []; }
	self._socketMap[socket.id()].push(bot.id());
	
	if (!self._ipMap[socket.ip()]) { self._ipMap[socket.ip()] = []; }
	self._ipMap[socket.ip()].push(bot.id());
	
	socket.emit('create_bot', {name: bot.getName(), playerId: bot.id()});
};

GameServer.prototype.close = function() {
	var self = this;
	Globals.debug('GameServer::close', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	self._engine.registerStateCallback(null);
	
	Object.keys(self._sockets).forEach(function(id) {
		self._sockets[id].disconnect();
		delete self._sockets[id];
		self._sockets[id] = null;
	});
	
	self._sockets.length = 0;

	delete self._ns;
	self._ns = null;
	
	delete self._watchersNs;
	self._watchersNs = null;
};

// from socket
GameServer.prototype.endTurn = function(socketWrapper, data) {
	try {
		Globals.debug("Player " + data.playerId + " ending turn", Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
		var self = this;
		self._engine.endTurn();
	} catch (err) {
		Globals.debug("GameServer::endTurn error", err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
	}
};

// from socket
GameServer.prototype.attack = function(socketWrapper, data) {
	try {
		var self = this;
		Globals.debug("Got attack msg", socketWrapper.id(), JSON.stringify(data), Globals.LEVEL.TRACE, Globals.CHANNEL.SERVER);
		self._engine.attack(parseInt(data.from), parseInt(data.to), null);
	} catch (err) {
		Globals.debug("GameServer::attack error", err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
	}
};

// from socket
GameServer.prototype.socketError = function(socketWrapper, err) {
	Globals.debug("Socket error: " + err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
};

// from engine
GameServer.prototype.engineUpdate = function(gamestate, stateId) {
	Globals.debug("engineUpdate", stateId, Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
	var self = this;
	if (gamestate) {
		var filename = self._gameId + "/state_" + stateId + ".json";
		var stateData = JSON.stringify(gamestate.serialize());
		redisClient.set(filename, stateData, function(err, reply) {
			if (err) {
				Globals.debug("ERROR saving engine state to Redis:", err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
			} else {
				Globals.debug("sending state update, stateId", stateId, Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
				// brodcast to all
				self._ns.emit("state", stateId);
				self._watchersNs.emit("state", stateId);
			}
		});
		
	}
};


/*========================================================================================================================================*/

module.exports = SocketHandler;