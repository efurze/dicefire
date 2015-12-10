"use strict"

var Engine = require('../game/engine.js');

var Plyer = require('../ai/plyer.js');
var Greedy = require('../ai/greedy.js');
var Aggressive = require('../ai/aggressive.js');
var AIs = [
	Plyer,
	Greedy,
	Aggressive
];

var Server = function (gameId, socket) {
		console.log("gameId: " + gameId);
		var self = this;
		self._gameId = gameId;
		self._socket = socket;
		self._aiMap = {};
		
		AIs.forEach(function(ai) {
			self._aiMap[ai.getName()] = ai;
		});
		self._aiMap["human"] = "human";
};
		

Server.prototype.start = function(playerCode) {	
	var self = this;
	self._engine = new Engine();
	
	self._engine.init(playerCode.map(function(pc){return self._aiMap[pc];}));
	self._engine.setup();
	
	self._socket.emit("map", self._engine.map().serializeHexes());
				
	self._engine.registerStateCallback(self.engineUpdate.bind(self));			
	self._engine.startTurn(0);
};

Server.prototype.endTurn = function(playerId) {
	var self = this;
	self._engine.endTurn();
}	

Server.prototype.attack = function(from, to) {
	var self = this;
	console.log("attack from ", from, "to", to);
	self._engine.attack(parseInt(from), parseInt(to), function (success) {
		self._socket.emit("attack_done", {result: success});
	});
}

Server.prototype.engineUpdate = function(gamestate, stateId) {
	var self = this;
	if (gamestate) {
		self._socket.emit("state", gamestate.serialize());
	}
};


module.exports = Server;