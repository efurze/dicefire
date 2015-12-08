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



var Session = function(socket) {
	this._socket = socket;
	this._engine = null;
	socket.on('initialized', this.initialize.bind(this));
};

Session.prototype.initialize = function(data) {
	console.log(data);
};



/*========================================================================================================================================*/

module.exports = SocketHandler;