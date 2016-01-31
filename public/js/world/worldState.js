'use strict'


var HexState = function(id) {
	this._id = id;
	this._ownerId = -1;
	this._diceCount = 0;
};

HexState.prototype.ownerId = function() {
	return this._ownerId;
};

HexState.prototype.setOwner = function(owner) {
	this._ownerId = owner;
};

HexState.prototype.diceCount = function() {
	return this._diceCount;
};

HexState.prototype.setDice = function(count) {
	this._diceCount = count;
};


var WorldState = function() {
	this._hexMap = {};
	this._playerHexes = {}; // playerId to list of countries
};

// @hexId = [row, col]
WorldState.prototype.getHex = function(hexId) {
	return this._hexMap[KEY(hexId)];
};

WorldState.prototype.setHex = function(hexId, hexState) {
	this._hexMap[KEY(hexId)] = hexState;
};

WorldState.prototype.ownerId = function(hexId) {
	var hex = this._hexMap[KEY(hexId)];
	return hex ? hex.ownerId() : -1;
};

WorldState.prototype.setOwner = function(hexId, ownerId) {
	var hex = this._hexMap[KEY(hexId)] || new HexState(hexId);
	this._hexMap[KEY(hexId)] = hex;

	if (hex.ownerId() >= 0) {
		delete this._playerHexes[hex.ownerId()][KEY(hexId)];
	}
	hex.setOwner(ownerId);
	if (!this._playerHexes[ownerId]) {
		this._playerHexes[ownerId] = {};
	}
	this._playerHexes[ownerId][KEY(hexId)] = true;
};

WorldState.prototype.diceCount = function(hexId) {
	var hex = this._hexMap[KEY(hexId)];
	return hex ? hex[row + ',' + col].diceCount() : hex;
};

WorldState.prototype.setDice = function(hexId, count) {
	this._hexMap[KEY(hexId)] = this._hexMap[KEY(hexId)] || new HexState(hexId);
	this._hexMap[KEY(hexId)].setDice(count);
};

var KEY = function(hexId) { return hexId[0] + ',' + hexId[1]};