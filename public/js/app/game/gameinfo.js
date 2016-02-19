/*jslint browser: true*/
/*jslint node: true*/

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals');
}


// @playerInfos = array[{id: , avgTime:, }]
var Gameinfo = function(playerInfos, winnerId) {

	Globals.ASSERT(playerInfos[0] instanceof Object);
	Globals.ASSERT(playerInfos[0].hasOwnProperty('id'));
	var self = this;

	if (typeof winnerId !== 'undefined') {
		self.winner = winnerId;
	}

	self.players = [];
	self.playerMap = {}; // playerId to array index
	playerInfos.forEach(function(info, idx) {
		self.players.push(JSON.parse(JSON.stringify(info)));
		self.playerMap[info.id] = idx;
	});
};

Gameinfo.prototype.getWinner = function() {
	return this.winner;
};

Gameinfo.prototype.setPlayerName = function(id, name) {
	if (id < this.players.length) {
		this.players[id].id = name;
	}
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

Gameinfo.prototype.setEloPreRating = function(playerId, rating) {
	var idx = this.playerMap[playerId];
	if (typeof idx == 'number' && this.players[idx]) {
		this.players[idx].eloPreRating = rating;
	}
};

Gameinfo.prototype.setEloPostRating = function(playerId, rating) {
	var idx = this.playerMap[playerId];
	if (typeof idx == 'number' && this.players[idx]) {
		this.players[idx].eloPostRating = rating;
	}
};

Gameinfo.prototype.getEloPostRating = function(playerId) {
	var idx = this.playerMap[playerId];
	if (typeof idx == 'number' && this.players[idx]) {
		return this.players[idx].eloPostRating;
	}
};

Gameinfo.prototype.hasBeenRated = function() {
	return (this.players[0] && this.players[0].eloPostRating);
};

Gameinfo.prototype.serialize = function() {
	var ret = {
		winner: this.winner,
		players: JSON.parse(JSON.stringify(this.players)),
		timestamp: this.timestamp ? this.timestamp : 0,
	};
	return ret;
};

Gameinfo.deserialize = function(obj) {
	if (obj && obj.players) {
		var gi = new Gameinfo(obj.players, obj.winner);
		gi.timestamp = obj.timestamp ? obj.timestamp : 0;
		return gi;
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
}