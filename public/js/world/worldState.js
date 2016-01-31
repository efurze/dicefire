'use strict'


var HexState = function(id) {
	this._ownerId = -1;
	this._diceCount = 0;
};

HexState.prototype.ownerId = function() {
	return this._ownerId;
};

HexState.prototype.diceCount = function() {
	return this._diceCount;
};

HexState.prototype.setDice = function(count) {
	this._diceCount = count;
};


var WorldState = function() {
	this._hexMap = {};
};

// @hexId = [row, col]
WorldState.prototype.getHex = function(hexId) {
	return this._hexMap[hexId[0] + ',' + hexId[1]];
};

WorldState.prototype.setHex = function(hexId, hexState) {
	this._hexMap[hexId[0] + ',' + hexId[1]] = hexState;
};

WorldState.prototype.ownerId = function(hexId) {
	var hex = this._hexMap[hexId[0] + ',' + hexId[1]];
	return hex ? hex.ownerId() : -1;
};

WorldState.prototype.diceCount = function(hexId) {
	var hex = this._hexMap[rhexId[0] + ',' + hexId[1]];
	return hex ? hex[row + ',' + col].diceCount() : hex;
};

WorldState.prototype.setDice = function(hexId, count) {
	this._hexMap[hexId[0] + ',' + hexId[1]] = this._hexMap[hexId[0] + ',' + hexId[1]] || new HexState(hexId);
	this._hexMap[hexId[0] + ',' + hexId[1]].setDice(count);
};