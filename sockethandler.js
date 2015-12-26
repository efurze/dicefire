"use strict"

var GAME_LINGER_TIMEOUT = 100000000; // milliseconds


var redis = require('redis');
var redisClient = redis.createClient();
var Globals = require('./public/js/globals.js');

var SocketHandler = function() {

	var sio = require('socket.io');
	var io = null;
	var sessions = {};
	
	return {
		
		listen: function(app, port) {
			var server = app.listen(port);
			io = require('socket.io').listen(server);
			
		},
		
		create: function(gameId) {
			Globals.debug("Listening for game " + gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
			var socketNamespace = io.of("/" + gameId);
			sessions[gameId] = new Session(gameId, socketNamespace);
		},
		
		removeGame: function(gameId) {
			if(sessions.hasOwnProperty(gameId)) {
				sessions[gameId].close();
				delete sessions[gameId];
			}
		}
	};
}();


/*========================================================================================================================================*/

var Engine = require('./public/js/game/engine.js');
var Plyer = require('./public/js/ai/plyer.js');
var Greedy = require('./public/js/ai/greedy.js');
var Aggressive = require('./public/js/ai/aggressive.js');
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

var Session = function(gameId, namespace) {
	var self = this;
	self._gameId = gameId;
	self._ns = namespace;
	self._sockets = {};
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
				// initialize the game engine
				self._engine = new Engine();
				self._engine.init(JSON.parse(data)['players'].map(function(playerName) {
					if (playerName === "human") {
						self._expectedHumans ++;
						return playerName;
					} else if (AIMap.hasOwnProperty(playerName)) {
						return AIMap[playerName];
					} else {
						return null;
					}
				}));
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


Session.prototype.connect = function(socket) {
	Globals.debug("Connected socket id " + socket.id + " for game " + this._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	var self = this;
	self._sockets[socket.id] = socket;
	self._connectionCount ++;
	self._currentHumans ++;
	socket.on('error', this.socketError.bind(this));
	socket.on('disconnect', this.disconnect.bind(this));
	socket.on('end_turn', this.endTurn.bind(this));
	socket.on('attack', this.attack.bind(this));
	
	if (self._watchdogTimerId >= 0) {
		clearTimeout(self._watchdogTimerId);
	}
	self._watchdogTimerId = -1;
	
	socket.emit("map");
	if (self._currentHumans == self._expectedHumans && !self._started) {
		// everyone's here, start the game!
		self._started = true;
		self._engine.startTurn(0);
	}
};

Session.prototype.disconnect = function(socket) {
	var self = this;
	self._connectionCount --;
	self._currentHumans --;
	
	Globals.debug('Socket id' + socket.id + 'disconnected. Current connectionCount', self._connectionCount, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	
	if (self._connectionCount == 0) {
		Globals.debug('No active connections, starting linger timer', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
		self._watchdogTimerId = setTimeout(function() {
			Globals.debug('Timeout expired, cleaning up game', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
			SocketHandler.removeGame(self._gameId);
			self._watchdogTimerId = -1;
		}, GAME_LINGER_TIMEOUT);
	}
};

Session.prototype.close = function() {
	var self = this;
	Globals.debug('Session::close', self._gameId, Globals.LEVEL.INFO, Globals.CHANNEL.SERVER);
	self._engine.registerStateCallback(null);
	
	Object.keys(self._sockets).forEach(function(id) {
		self._sockets[id].disconnect;
		delete self._sockets[id];
	});
	
	self._sockets.length = 0;

	delete self._ns;
	self._ns = null;
};

// from socket
Session.prototype.endTurn = function(data) {
	try {
		Globals.debug("Player " + data.playerId + " ending turn", Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
		var self = this;
		self._engine.endTurn();
	} catch (err) {
		Globals.debug("Session::endTurn error", err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
	}
};

// from socket
Session.prototype.attack = function(data) {
	try {
		var self = this;
		Globals.debug("attack from ", data.from, "to", data.to, Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
		self._engine.attack(parseInt(data.from), parseInt(data.to), function (success) {
			Globals.debug("sending attack result, success:", success, Globals.LEVEL.DEBUG, Globals.CHANNEL.SERVER);
			self._ns.emit("attack_result", {result: success});
		});
	} catch (err) {
		Globals.debug("Session::attack error", err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
	}
};

// from socket
Session.prototype.socketError = function(err) {
	Globals.debug("Socket error: " + err, Globals.LEVEL.ERROR, Globals.CHANNEL.SERVER);
};

// from engine
Session.prototype.engineUpdate = function(gamestate, stateId) {
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
				self._ns.emit("state", stateId);
			}
		});
		
	}
};


/*========================================================================================================================================*/

module.exports = SocketHandler;