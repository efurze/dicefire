"use strict"


var redis = require('redis');
var redisClient = redis.createClient();

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
			console.log("Listening for game " + gameId);
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
	
	// get the game info
	redisClient.get(gameId+"/game.json", function(err, data) {
		if (!data) {
			console.log("No game file found for gameId " + gameId);
		} else {
			console.log("Got game info: " + data);
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
					console.log("ERROR saving map data to Redis:", err);
				} 

				self._engine.registerStateCallback(self.engineUpdate.bind(self));			
				
				// listen for client connections
				namespace.on('connection', self.connect.bind(self));
			});
		}
	});
};

Session.prototype.close = function() {
	var self = this;
	self._engine.registerStateCallback(null);
	
	Object.keys(self._sockets).forEach(function(id) {
		self._sockets[id].disconnect;
		delete self._sockets[id];
	});

};

Session.prototype.connect = function(socket) {
	console.log("Connected socket for game " + this._gameId);
	var self = this;
	self._sockets[socket.id] = socket;
	self._connectionCount ++;
	self._currentHumans ++;
	socket.on('error', this.socketError.bind(this));
	socket.on('disconnect', this.disconnect.bind(this));
	socket.on('end_turn', this.endTurn.bind(this));
	socket.on('attack', this.attack.bind(this));
	
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
	
	console.log('Disconnected. Current connectionCount', self._connectionCount);
	
	if (self._sockets.hasOwnProperty(socket.id)) {
		delete self._sockets[socket.id];
	}
	
	delete self._ns;
	self._ns = null;
	
	if (self._connectionCount == 0) {
		SocketHandler.removeGame(self._gameId);
	}
};

// from socket
Session.prototype.endTurn = function(data) {
	try {
		console.log("Player " + data.playerId + " ending turn");
		var self = this;
		self._engine.endTurn();
	} catch (err) {
		console.log("Session::endTurn error", err);
	}
};

// from socket
Session.prototype.attack = function(data) {
	try {
		var self = this;
		console.log("attack from ", data.from, "to", data.to);
		self._engine.attack(parseInt(data.from), parseInt(data.to), function (success) {
			self._ns.emit("attack_result", {result: success});
		});
	} catch (err) {
		console.log("Session::attack error", err);
	}
};

// from socket
Session.prototype.socketError = function(err) {
	console.log("Socket error: " + err);
};

// from engine
Session.prototype.engineUpdate = function(gamestate, stateId) {
	console.log("engineUpdate", stateId);
	var self = this;
	if (gamestate) {
		var filename = self._gameId + "/state_" + stateId + ".json";
		var stateData = JSON.stringify(gamestate.serialize());
		redisClient.set(filename, stateData, function(err, reply) {
			if (err) {
				console.log("ERROR saving engine state to Redis:", err);
			} else {
				self._ns.emit("state", stateId);
			}
		});
		
	}
};


/*========================================================================================================================================*/

module.exports = SocketHandler;