'use strict'


var HexState = function(id) {
	this._id = id;
	this._ownerId = -1;
	this._diceCount = 0;
};

HexState.prototype.clone = function() {
	var copy = new HexState(this._id);
	copy._ownerId = this._ownerId;
	copy._diceCount = this._diceCount;
	return copy;
};

HexState.prototype.id = function() {
	return this._id;
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

HexState.prototype.adjacent = function() {
	var x = this._id[0], y = this._id[1];
	var list = [];
	list.push([x, y+2]);
	list.push([x, y-2]);
	list.push([x+1, y+1]);
	list.push([x+1, y-1]);
	list.push([x-1, y+1]);
	list.push([x-1, y-1]);
	return list;
};


var WorldState = function() {
	this._hexMap = {};
	this._playerHexes = {}; // playerId to list of hexIds
};

WorldState.prototype.clone = function() {
	var self = this;
	var copy = new WorldState();
	copy._playerHexes = JSON.parse(JSON.stringify(self._playerHexes));
	Object.keys(self._hexMap).forEach(function(key) {
		copy._hexMap[key] = self._hexMap[key].clone();
	});

	return copy;
}

WorldState.prototype.merge = function(state) {
	var self = this;
	Object.keys(state._hexMap).forEach(function(hexId) {
		if (self.ownerId(hexId) != state.ownerId(hexId)) {
			self.setOwner(hexId, state.ownerId(hexId));
		}
		self._hexMap[hexId] = state._hexMap[hexId].clone();
	});
};

WorldState.prototype.hexes = function() {
	var self = this;
	var hexes = [];
	Object.keys(self._hexMap).forEach(function(id) {
		hexes.push(self._hexMap[id]);
	});
	return hexes;
};

WorldState.prototype.playerHexes = function(playerId) {
	var self = this;
	return Object.keys(self._playerHexes[playerId]).map(function(key) {
		return self._hexMap[key];
	});
};

// @hexId = [row, col]
WorldState.prototype.getHex = function(hexId) {
	var hex = this._hexMap[KEY(hexId)];
	return hex ? hex.clone() : null;
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
	return hex ? hex.diceCount() : 0;
};

WorldState.prototype.setDice = function(hexId, count) {
	this._hexMap[KEY(hexId)] = this._hexMap[KEY(hexId)] || new HexState(hexId);
	this._hexMap[KEY(hexId)].setDice(count);
};

var KEY = function(hexId) { 
	return Array.isArray(hexId) ? hexId[0] + ',' + hexId[1] : hexId;
};