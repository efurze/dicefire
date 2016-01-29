'use strict'

var Globals = require('../public/js/globals.js');
var Engine = require('../public/js/game/engine.js');
var Message = require('../public/js/network/message.js');

/*========================================================================================================================================*/
// AISocketWrapper: implements Engine::PlayerInterface
// @controller: a reference to the engine
/*========================================================================================================================================*/
var AISocketWrapper = function (aiName, id, controller) {
	Globals.ASSERT(Globals.implements(controller, Engine.ControllerInferface));

	this._socket = null;
	this._started = true;
	this._name = aiName;
	this._id = id;
	this._controller = controller;

	Globals.ASSERT(Globals.implements(this, Engine.PlayerInferface));
};

AISocketWrapper.prototype.id = function() {return this._id};
AISocketWrapper.prototype.hasSocket = function() {return (this._socket != null);};
AISocketWrapper.prototype.socket = function() {return this._socket;};
AISocketWrapper.prototype.getName = function() {return this._name;};
AISocketWrapper.prototype.isHuman = function() {return false;};
AISocketWrapper.prototype.isInitialized = function() {return false;};
AISocketWrapper.prototype.setInitialized = function(init) {};

AISocketWrapper.prototype.setSocket = function(socket) {
	this._socket = socket;
	if (socket) {
		socket.on(Message.TYPE.END_TURN, this.end_turn.bind(this));
		socket.on(Message.TYPE.ATTACK, this.attack.bind(this));
	}
};


AISocketWrapper.prototype.start = function() {this._started = true;};
AISocketWrapper.prototype.stop = function() {this._started = false;};


//====================================================================================================
// Socket events
//====================================================================================================

AISocketWrapper.prototype.attack = function(socketWrapper, data) {
	var self = this;
	if (self._started && data.playerId == self._id) {
		self._controller.attack(parseInt(data.from), parseInt(data.to), self.attackDone.bind(self));
	}
};

AISocketWrapper.prototype.end_turn = function(socketWrapper, data) {
	var self = this;
	if (self._started && data.playerId == self._id) {
		self._controller.endTurn();
	}
};


//====================================================================================================
// Engine events
//====================================================================================================

AISocketWrapper.prototype.startTurn = function(state) {
	if (this._started && this._socket) {
		this._socket.sendStartTurn(this._id, state.stateId());
	}
};

AISocketWrapper.prototype.attackDone = function(success, stateId) {
	if (this._started && this._socket) {
		this._socket.sendAttackResult(this._id, success, stateId);
	}
};
AISocketWrapper.prototype.turnEnded = function() {
	if (this._started && this._socket) {
		this._socket.sendTurnEnded(this._id, state.stateId());
	}
};

AISocketWrapper.prototype.loses = function() {};

module.exports = AISocketWrapper;