"use strict"

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals');
};


// @playerInfos = array[{id: , avgTime:, }]
var Gameinfo = function(playerInfos, winnerId) {

	Globals.ASSERT(playerInfos[0] instanceof Object);
	Globals.ASSERT(playerInfos[0].hasOwnProperty('id'));
	var self = this;

	if (typeof winnerId !== 'undefined') {
		self.winner = winnerId;
	}

	self.players = [];
	playerInfos.forEach(function(info, idx) {
		self.players.push(JSON.parse(JSON.stringify(info)));
	});
};

Gameinfo.prototype.getWinner = function() {
	return this.winner;
};

Gameinfo.prototype.getPlayers = function() {
	return this.players.map(function(info) {
		return info.id;
	});
};

Gameinfo.prototype.avgTime = function(playerIdx) {
	return this.players[playerIdx].avgTime;
};

Gameinfo.prototype.setTimestamp = function(time) {
	this.timestamp = time;
};

Gameinfo.prototype.getTimestamp = function() {
	return this.timestamp;
};

Gameinfo.prototype.serialize = function() {
	var ret = {
		winner: this.winner,
		players: JSON.parse(JSON.stringify(this.players)),
		timestamp: this.timestamp ? this.timestamp : 0
	};
	return ret;
};

Gameinfo.deserialize = function(obj) {
	if (obj && obj.players) {
		return new Gameinfo(obj.players, obj.winner);
	} else {
		return null;
	}
};

Gameinfo.prototype.toString = function() {
	return JSON.stringify(this.serialize());
};

Gameinfo.fromString = function(str) {
	return Gameinfo.deserialize(JSON.parse(str));
};

if (typeof module !== 'undefined' && module.exports){
	module.exports = Gameinfo;
};