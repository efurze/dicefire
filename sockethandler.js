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

var server = require('./public/js/app/server.js');

var Session = function(socket) {
	this._socket = socket;
	this._server = null;
	socket.on('error', this.socketError.bind(this));
	socket.on('initialized', this.initialize.bind(this));
	socket.on('end_turn', this.endTurn.bind(this));
};

Session.prototype.initialize = function(data) {
	this._server = new server(data.gameId, this._socket);
	try {
		this._server.start(data.players);
	} catch (err) {
		console.log("Server error: " + err);
	}
};

Session.prototype.endTurn = function(data) {
	console.log("Player " + data.playerId + " ending turn");
	this._server.endTurn(data.playerId);
};

Session.prototype.socketError = function(err) {
	console.log("Socket error: " + err);
};


/*========================================================================================================================================*/

module.exports = SocketHandler;