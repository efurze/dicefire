"use strict"

var Engine = require('../game/engine.js');

var Server = function (gameId, socket) {
		console.log("gameId: " + gameId);
		this._gameId = gameId;
		this._socket = socket;
};
		

Server.prototype.start = function(playerCode) {	
	Engine.init(playerCode.map(function(pc){return pc;}));
	Engine.setup();
				
	Engine.registerStateCallback(Server.engineUpdate);			
	Engine.startTurn(0);
};
	

Server.prototype.engineUpdate = function(gamestate, stateId) {

};


module.exports = Server;