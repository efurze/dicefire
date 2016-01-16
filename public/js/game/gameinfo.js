"use strict"

var Gameinfo = function(playerNameAry, winnerId) {
	if (typeof winnerId !== 'undefined') {
		this.winner = winnerId;
	}
	this.players = JSON.parse(JSON.stringify(playerNameAry));
};

Gameinfo.prototype.serialize = function() {
	var ret = {
		winner: this.winner,
		players: this.players
	};
	return ret;
}

Gameinfo.prototype.toString = function() {
	return JSON.stringify(this.serialize());
}

if (typeof module !== 'undefined' && module.exports){
	module.exports = Gameinfo;
}