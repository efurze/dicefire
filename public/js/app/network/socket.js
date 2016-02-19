/*jslint browser: true*/
/*jslint node: true*/

var log = null;
var CHANNEL;

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
	var logger = require('../../../../lib/logger.js');
	var Message = require('./message');
	log = logger.log;
	CHANNEL = logger.CHANNEL.SERVER_SOCKET;
} else {
	log = Globals.debug;
	CHANNEL = Globals.CHANNEL.CLIENT_SOCKET;
}


/*========================================================================================================================================*/
// SocketWrapper: wraps a Socket.IO socket
/*========================================================================================================================================*/
var SocketWrapper = function(socket, gameId) {
	this._socket = socket;
	this._gameId = gameId;
	this._id = socket.id;
	this._callbacks = {}; // map from event => array of {fn: , context: }
};

SocketWrapper.prototype.id = function() {return this._id;};

SocketWrapper.prototype.ip= function() {
	if (this._socket) {
		return this._socket.handshake.address;
	} 
};

/*
	this can be called EITHER like this:
		on('foo', myFunc.bind(this))
	OR:
		on('foo', myFunc, this)

	use the second if you want removeListener() to work.
*/
SocketWrapper.prototype.on = function(event, callback, context /*optional*/) {
	var self = this;

	if (self._callbacks.hasOwnProperty(event)) {
		// add this callback to the list for this event
		self._callbacks[event].push({fn: callback, context: context});
	} else {
		// create a callback list for this event
		self._callbacks[event] = [{fn: callback, context: context}];

		// start listening for this event
		self._socket.on(event, function() {
			log("=>", event, JSON.stringify(arguments), Globals.LEVEL.INFO, CHANNEL, self._gameId);
			
			// marshall the callback arguments
			var args = [];
			args.push(self);
			var count = Object.keys(arguments).length;
			for (var i=0; i < count; i++) {
				args.push(arguments[i]);
			}

			// callback everyone who's listening
			self._callbacks[event].forEach(function(cb) {
				cb.fn.apply(cb.context, args);
			});
		});
	}
};

SocketWrapper.prototype._emit = function(event, data) {
	log("<=", event, JSON.stringify(data), Globals.LEVEL.INFO, CHANNEL, this._gameId);
	this._socket.emit(event, data);
};


SocketWrapper.prototype.removeAll = function() {
	var self = this;
	if (self._socket) {
		Object.keys(self._callbacks).forEach(function(event) {
			self._socket.removeAllListeners(event);
		});
	}
	self._callbacks = {};
};

SocketWrapper.prototype.removeAllListeners = function(event) {
	if (this._socket) {
		this._socket.removeAllListeners(event);
	}

	delete this._callbacks[event];
};

SocketWrapper.prototype.removeListener = function(event, listener, context /*optional*/) {
	var self = this;
	var cbs = self._callbacks[event];
	if (cbs) {
		cbs.forEach(function(cb, idx) {
			if (listener == cb.fn && context == cb.context) {
				self._callbacks[event].splice(idx, 1);
			}
		});
	}
};

SocketWrapper.prototype.disconnect = function() {
	var self = this;
	this._callbacks = {};
	if (self._socket) {
		self._socket.disconnect();
		delete self._socket;
		self._socket = null;
	}
};

SocketWrapper.prototype.sendPlayerStatus = function(playerId, connected, name) {
	this._emit(Message.TYPE.PLAYER_STATUS, Message.playerStatus(playerId, connected, name));
};

SocketWrapper.prototype.sendPlayerInitialized = function(playerId) {
	this._emit(Message.TYPE.PLAYER_INITIALIZED, Message.playerInitialized(playerId));
};

SocketWrapper.prototype.sendCreateBot = function(name, playerId) {
	this._emit(Message.TYPE.CREATE_BOT, Message.createBot(name, playerId));
};

SocketWrapper.prototype.sendCreateHuman = function(name, playerId) {
	this._emit(Message.TYPE.CREATE_HUMAN, Message.createHuman(name, playerId));
};

SocketWrapper.prototype.sendState = function(stateId, gameId) {
	this._emit(Message.TYPE.STATE, Message.state(stateId, gameId));
};

SocketWrapper.prototype.sendStartTurn = function(playerId, stateId) {
	this._emit(Message.TYPE.START_TURN, Message.startTurn(playerId, stateId));
};

SocketWrapper.prototype.sendAttack = function(fromId, toId, playerId) {
	this._emit(Message.TYPE.ATTACK, Message.attack(fromId, toId, playerId));
};


SocketWrapper.prototype.sendAttackResult = function(playerId, success, stateId) {
	this._emit(Message.TYPE.ATTACK_RESULT, Message.attackResult(playerId, success, stateId));
};

SocketWrapper.prototype.sendEndTurn = function(playerId) {
	this._emit(Message.TYPE.END_TURN, Message.endTurn(playerId));
};

SocketWrapper.prototype.sendTurnEnded = function(playerId, stateId) {
	this._emit(Message.TYPE.TURN_ENDED, Message.turnEnded(playerId, stateId));
};

if (typeof module !== 'undefined' && module.exports){
	module.exports = SocketWrapper;
}