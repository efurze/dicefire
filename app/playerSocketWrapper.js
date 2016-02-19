'use strict'

var Globals = require('../public/js/app/globals.js');
var Engine = require('../public/js/app/game/engine.js');
var Message = require('../public/js/app/network/message.js');

/*========================================================================================================================================*/
// PlayerWrapper: implements Engine::PlayerInterface. This allows the engine to communicate with a human player over a socket.
// @controller: a reference to the engine
/*========================================================================================================================================*/
var PlayerWrapper = function (id, controller) {
	Globals.ASSERT(Globals.implements(controller, Engine.ControllerInferface));

	this._socket = null;
	this._started = false;
	this._id = id;
	this._initialized = false;
	this._controller = controller;

	Globals.ASSERT(Globals.implements(this, Engine.PlayerInferface));
};

PlayerWrapper.prototype.id = function() {return this._id};
PlayerWrapper.prototype.hasSocket = function() {return (this._socket != null);};
PlayerWrapper.prototype.socket = function() {return this._socket;};
PlayerWrapper.prototype.getName = function() {return "human";};
PlayerWrapper.prototype.isHuman = function() {return true;};
PlayerWrapper.prototype.isInitialized = function() { return this._initialized; };
PlayerWrapper.prototype.setInitialized = function(init) { this._initialized = init; };

PlayerWrapper.prototype.setSocket = function(socket) {
	this._socket = socket;
	if (socket) {
		socket.on(Message.TYPE.END_TURN, this.end_turn.bind(this));
		socket.on(Message.TYPE.ATTACK, this.attack.bind(this));
	}
};


PlayerWrapper.prototype.start = function() {
	this._started = true;
	if (this._socket) {
		this._socket.sendCreateHuman(this.getName(), this._id);
	}
};
PlayerWrapper.prototype.stop = function() {this._started = false;};

//====================================================================================================
// Socket events
//====================================================================================================

PlayerWrapper.prototype.attack = function(socketWrapper, data) {
	var self = this;
	if (self._started && data.playerId == self._id) {
		self._controller.attack(parseInt(data.from), parseInt(data.to), self.attackDone.bind(self));
	}
};

PlayerWrapper.prototype.end_turn = function(socketWrapper, data) {
	var self = this;
	if (self._started && data.playerId == self._id) {
		self._controller.endTurn();
	}
};

//====================================================================================================
// Engine events
//====================================================================================================

PlayerWrapper.prototype.startTurn = function(state) {
	if (this._started && this._socket) {
		this._socket.sendStartTurn(this._id, state.stateId());
	}
};
PlayerWrapper.prototype.attackDone = function(success) {};
PlayerWrapper.prototype.turnEnded = function() {
	if (this._started && this._socket) {
		this._socket.sendTurnEnded(this._id, state.stateId());
	}
};
PlayerWrapper.prototype.loses = function() {};


module.exports = PlayerWrapper;
