"use strict"


var redis = require('redis');
var redisClient = redis.createClient();

var SocketHandler = function() {

	var sio = require('socket.io');
	var io = null;
	
	return {
		
		listen: function(app, port) {
			var server = app.listen(port);
			io = require('socket.io').listen(server);
			
		},
		
		create: function(gameId) {
			console.log("Listening for game " + gameId);
			var gameIO = io.of("/" + gameId);
			new Session(gameId, gameIO);
		}
	};
};


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

var Session = function(gameId, namespaced_listener) {
	var self = this;
	self._gameId = gameId;
	self._socket = null;
	
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
				namespaced_listener.on('connection', self.connect.bind(self));
			});
		}
	});
};

Session.prototype.connect = function(socket) {
	console.log("Connected socket for game " + this._gameId);
	var self = this;
	self._socket = socket;
	socket.on('error', this.socketError.bind(this));
	socket.on('end_turn', this.endTurn.bind(this));
	socket.on('attack', this.attack.bind(this));
	
	socket.emit("map");
	
	self._engine.startTurn(0);
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
			self._socket.emit("attack_result", {result: success});
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
	var self = this;
	if (gamestate) {
		var filename = self._gameId + "/state_" + stateId + ".json";
		var stateData = JSON.stringify(gamestate.serialize());
		redisClient.set(filename, stateData, function(err, reply) {
			if (err) {
				console.log("ERROR saving engine state to Redis:", err);
			} else {
				self._socket.emit("state", stateId);
			}
		});
		
	}
};


/*========================================================================================================================================*/

module.exports = SocketHandler();