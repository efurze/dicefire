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
					games[gameId] = new GameServer(gameId, socketNamespace);
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
PlayerWrapper.prototype.stop = function() {};
PlayerWrapper.prototype.startTurn = function() {};
PlayerWrapper.prototype.attackDone = function(success) {};
PlayerWrapper.prototype.loses = function() {};

/*========================================================================================================================================*/
// AISocketWrapper: implements Engine::PlayerInterface
/*========================================================================================================================================*/
var AISocketWrapper = function (AI, id) {
	this._socket = null;
	this._name = AI.getName();
	this._id = id;
};

AISocketWrapper.prototype.id = function() {return this._id};
AISocketWrapper.prototype.setSocket = function(socket) {this._socket = socket;};
AISocketWrapper.prototype.hasSocket = function() {return (this._socket != null);};
AISocketWrapper.prototype.socket = function() {return this._socket;};

AISocketWrapper.prototype.getName = function() {return this._name;};
AISocketWrapper.prototype.isHuman = function() {return false;};
AISocketWrapper.prototype.stop = function() {};
AISocketWrapper.prototype.startTurn = function() {};
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
var AIWrapper = require('../public/js/game/aiwrapper.js');
var AIs = [
	Plyer,
	Greedy,
	Aggressive
];
var AIMap = {};

// initialize the AI name-to-class mapping
AIs.forEach(function(ai) {
	AIMap[ai.getName()] = ai;
});
AIMap["human"] = "human";

var GameServer = function(gameId, namespace) {
	var self = this;
	self._gameId = gameId;
	self._ns = namespace;
	self._sockets = {};
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
					} else if (AIMap.hasOwnProperty(playerName)) {
						var ai = new AISocketWrapper(AIMap[playerName], id);
						players.push(ai);
						self._playerMap.push(ai);
					} else {
						Globals.debug("Unexpected player name:", playerName, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
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
				
					// listen for client connections
					namespace.on('connection', self.connect.bind(self));
				});
			}
		} catch (err) {
			Globals.debug("Exception initializing game engine", err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
		}
	});
};


GameServer.prototype.connect = function(socket) {
	Globals.debug("Connected socket id " + socket.id + " for game " + this._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
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
	
	// TODO: FIXME: don't do this if the client is a watcher
	// find a slot for this player
	var id = 0;
	for (var i=0; i < self._gameInfo.players.length; i++) {
		if (self._playerMap[i].isHuman() && !self._playerMap[i].hasSocket()) {
			Globals.debug('Assigning socket ' + sock.id() + ' to player ' + i, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
			self._currentHumans ++; 
			self._playerMap[i].setSocket(sock);
			id = i;
			break;
		}
	}
	
	sock.emit("map", {playerId: id});
	if (self._currentHumans == self._expectedHumans && !self._started) {
		// everyone's here, start the game!
		self.startGame();
	}
};

GameServer.prototype.disconnect = function(socketWrapper) {
	var self = this;
	self._connectionCount --;
	self._currentHumans --;
	
	Globals.debug('Socket ' + socketWrapper.id() + ' disconnected. Current connectionCount', self._connectionCount, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	
	if (self._connectionCount == 0) {
		Globals.debug('No active connections, starting linger timer', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
		self._watchdogTimerId = setTimeout(function() {
			Globals.debug('Timeout expired, cleaning up game', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
			SocketHandler.removeGame(self._gameId);
			self._watchdogTimerId = -1;
		}, GAME_LINGER_TIMEOUT);
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
GameServer.prototype.assignBot = function(bot, player) {
	var self = this;
	var socketIds = [];
	Object.keys(self._sockets).forEach(function(socketId) {
		socketIds.push(socketId);
	});

	// randomly pick a socket to assign it to
	var index = Math.round(Math.random() * (socketIds.length - 1));
	var socket = self._sockets[socketIds[index]];
	Globals.ASSERT(socket instanceof SocketWrapper);
	Globals.debug('Assigning Bot ' + bot.getName() + ' at position ' + bot.id() + ' to socket ' + socket.id(), Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
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
		self._engine.attack(parseInt(data.from), parseInt(data.to), function (success) {
			Globals.debug("sending attack result, success:", success, Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
			self._ns.emit("attack_result", {result: success});
		});
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
			}
		});
		
	}
};


/*========================================================================================================================================*/

module.exports = SocketHandler;