"use strict"

var Gameinfo = function(playerNameAry, winnerId) {
	if (typeof winnerId !== 'undefined') {
		this._winner = winnerId;
	}
	this._players = JSON.parse(JSON.stringify(playerNameAry));
};

Gameinfo.prototype.serialize = function() {
	var ret = {
		winner: this._winner,
		players: this._players
	};
	return ret;
}

Gameinfo.prototype.toString = function() {
	return JSON.stringify(this.serialize());
}