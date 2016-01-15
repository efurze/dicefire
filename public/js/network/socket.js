'use strict'

var log = null;
var CHANNEL;

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
	var logger = require('../../../lib/logger.js');
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
	this._callbacks = {}; // map from event => array of callbacks
};

SocketWrapper.prototype.id = function() {return this._id;}

SocketWrapper.prototype.ip= function() {
	if (this._socket) {
		return this._socket.handshake.address;
	} 
}

SocketWrapper.prototype.on = function(event, callback) {
	var self = this;

	if (self._callbacks.hasOwnProperty(event)) {
		// add this callback to the list for this event
		self._callbacks[event].push(callback);
	} else {
		// create a callback list for this event
		self._callbacks[event] = [callback];

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
				cb.apply(null, args);
			});
		});
	}
};

SocketWrapper.prototype.emit = function(event, data) {
	log("<=", event, JSON.stringify(data), Globals.LEVEL.INFO, CHANNEL, this._gameId);
	this._socket.emit(event, data);
};


SocketWrapper.prototype.removeListener = function() {

};

SocketWrapper.prototype.disconnect = function() {
	var self = this;
	this._callbacks = {};
	if (self._socket) {
		self._socket.disconnect();
		delete self._socket;
		self._socket = null;
	}
}



if (typeof module !== 'undefined' && module.exports){
	module.exports = SocketWrapper;
}