"use strict"

var sio = require('socket.io');

var SocketHandler = function(app, port) {
	var server = app.listen(port);
	var io = require('socket.io').listen(server);
	io.on('connection', connect);
};

var connect = function(socket) {
	new Session(socket);
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

var Session = function(socket) {
	this._socket = socket;
	socket.on('error', this.socketError.bind(this));
	socket.on('initialized', this.initialize.bind(this));
	socket.on('end_turn', this.endTurn.bind(this));
	socket.on('attack', this.attack.bind(this));
};

/* 
	from socket
	
	@data = {
		gameId: <string>,
		players: [<string>, <string>...]
	}
*/
Session.prototype.initialize = function(data) {	
	try {
		console.log("creating new game " + data.gameId);
		var self = this;
		
		var playerCode = data.players;
		self._gameId = data.gameId;
		self._aiMap = {};

		AIs.forEach(function(ai) {
			self._aiMap[ai.getName()] = ai;
		});
		self._aiMap["human"] = "human";
		
		
		self._engine = new Engine();

		self._engine.init(playerCode.map(function(pc){return self._aiMap[pc];}));
		self._engine.setup();

		self._socket.emit("map", self._engine.map().serializeHexes());

		self._engine.registerStateCallback(self.engineUpdate.bind(self));			
		self._engine.startTurn(0);
		
	} catch (err) {
		console.log("Server error: " + err);
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
			self._socket.emit("attack_done", {result: success});
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
		self._socket.emit("state", gamestate.serialize());
	}
};


/*========================================================================================================================================*/

module.exports = SocketHandler;