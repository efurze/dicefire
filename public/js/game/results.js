"use strict"

var Gameresults = function(winnerId, playerNameAry) {
	this._winner = winnerId;
	this._players = JSON.parse(JSON.stringify(playerNameAry));
};

Gameresults.prototype.serialize = function() {
	var ret = {
		winner: this._winner,
		players: this._players
	};
	return ret;
}