"use strict"

var Gameinfo = function(playerNameAry, winnerId, avgTimes) {
	if (typeof winnerId !== 'undefined') {
		this.winner = winnerId;
	}
	if (typeof avgTimes !== 'undefined') {
		this.avgTimes = avgTimes;
	}
	this.players = JSON.parse(JSON.stringify(playerNameAry));
};

Gameinfo.prototype.serialize = function() {
	var ret = {
		winner: this.winner,
		players: this.players,
		avgTimes: this.avgTimes
	};
	return ret;
}

Gameinfo.prototype.toString = function() {
	return JSON.stringify(this.serialize());
}

if (typeof module !== 'undefined' && module.exports){
	module.exports = Gameinfo;
}