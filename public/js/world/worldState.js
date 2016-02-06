'use strict'


var HexState = function(id) {
	var self = this;

	this._id = id;
	this._ownerId = -1;
	this._diceCount = 0;
	this._adjacencies = [];
	this._adjacencies = [[0, 2], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]].map(function(elem) {
		return [id[0] + elem[0], id[1] + elem[1]];
	});
};

HexState.prototype.clone = function() {
	var copy = new HexState(this._id);
	copy._ownerId = this._ownerId;
	copy._diceCount = this._diceCount;
	copy._adjacencies = _.clone(this._adjacencies);
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
	return this._adjacencies;	// Note that this can be changed by the recipient. Could clone it to avoid.
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


WorldState.prototype.playerIds = function() {
	var self = this;
	return Object.keys(self._playerHexes);
};


WorldState.prototype.hexIds = function() {
	var self = this;
	return Object.keys(self._hexMap).map(function(key) {
		var parts= key.split(',');
		return [parseInt(parts[0]), parseInt(parts[1])];
	});
};

WorldState.prototype.playerHexIds = function(playerId) {
	var self = this;
	return Object.keys(self._playerHexes[playerId]).map(function(key) {
		var parts= key.split(',');
		return [parseInt(parts[0]), parseInt(parts[1])];
	});
};

WorldState.prototype.storedDice = function(playerId) {
	return 0;
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




