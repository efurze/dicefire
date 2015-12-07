"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Hashes = require('../jshashes');
}

var SHA1 = new Hashes.SHA1();

var Gamestate = function(players, countries, currentPlayerId, attack) {
	var self = this;
	self._currentPlayerId = typeof currentPlayerId === 'undefined' ? -1 : currentPlayerId;
	self._players = {};
	self._countries = {};
	self._attack = null;
	if (players) {
		players.forEach(function(player) {
			self._players[player.id()] = {
				id: player.id(),
				hasLost: player.hasLost(),
				storedDice: player.storedDice(),
				numContiguousCountries: player.numContiguousCountries()
			};
		});
	}
	if (countries) {
		countries.forEach(function(country) {
			self._countries[country.id()] = {
				id: country.id(),
				owner: country.ownerId(),
				numDice: country.numDice()
			};
		});
	}
	if (attack) {
		Globals.ASSERT(attack.fromCountryId >= 0);
		self._attack = attack;
	}
};

Gamestate.prototype.serialize = function() {
	return JSON.stringify(this);
};

Gamestate.deserialize = function(state) {
	var gs = JSON.parse(state);
	var gamestate = Gamestate.prototype.clone.call(gs);
	return gamestate;
};

Gamestate.prototype.clone = function() {
	var copy = new Gamestate();
	copy._currentPlayerId = this._currentPlayerId;
	copy._players = JSON.parse(JSON.stringify(this._players));
	copy._countries = JSON.parse(JSON.stringify(this._countries));
	copy._attack = this._attack ? JSON.parse(JSON.stringify(this._attack)) : null;
	return copy;
};

Gamestate.prototype.toString = function() {
	return JSON.stringify(this);
};



Gamestate.prototype.playerCountries = function(playerId) {
	var self = this;
	var ret = {};
	var last = -1;
	Object.keys(self._countries).forEach(function(countryId) {
		countryId = Number(countryId);
		Globals.ASSERT(last < countryId);
		last = countryId;
		if (self._countries[countryId].owner == playerId) {
			ret[countryId] = countryId;
		};
	});
	return ret;
};

Gamestate.prototype.playerIds = function() {return Object.keys(this._players);};
Gamestate.prototype.players = function() {return this._players;};

Gamestate.prototype.currentPlayerId = function() {return this._currentPlayerId;};
Gamestate.prototype.setCurrentPlayerId = function(id) {this._currentPlayerId = id;};

Gamestate.prototype.playerHasLost = function(id) {return this._players[id].hasLost;};
Gamestate.prototype.setPlayerHasLost = function(id, lost) {this._players[id].hasLost = lost;};

Gamestate.prototype.storedDice = function(playerId) {return this._players[playerId].storedDice;};
Gamestate.prototype.setPlayerHasLost = function(playerId, count) {this._players[playerId].storedDice = count;};

Gamestate.prototype.storedDice = function(playerId) {return this._players[playerId].storedDice;};
Gamestate.prototype.setPlayerHasLost = function(playerId, count) {this._players[playerId].storedDice = count;};

Gamestate.prototype.numContiguous = function(playerId) {return this._players[playerId].numContiguousCountries;};
Gamestate.prototype.setNumContiguous = function(playerId, count) {this._players[playerId].numContiguousCountries = count;};


Gamestate.prototype.countryIds = function() {return Object.keys(this._countries);};
Gamestate.prototype.countries = function() {
	if (!this._countries) {
		this._countries = {};
	} 
	
	return JSON.parse(JSON.stringify(this._countries));
};

Gamestate.prototype.countryOwner = function(countryId) {
	Globals.ASSERT(this._countries[countryId]);
	return this._countries[countryId].owner;
};
Gamestate.prototype.setCountryOwner = function(countryId, owner) {
	this._countries[countryId].owner = owner;
};

Gamestate.prototype.countryDice = function(countryId) { return this._countries[countryId].numDice;};
Gamestate.prototype.setCountryDice = function(countryId, count) {
	Globals.ASSERT(count > 0 && count <= 8);
	this._countries[countryId].numDice = count;
};

Gamestate.prototype.setAttack = function(attack) {
	Globals.ASSERT(attack.fromCountryId >= 0);
	this._attack = attack;
}
Gamestate.prototype.attack = function() {
	if (!this._attack) {
		this._attack =  {
			fromCountryId: -1,
			toCountryId: -1,
			fromRollArray: [],
			toRollArray: []
		};
	} 
	return JSON.parse(JSON.stringify(this._attack));
};

Gamestate.prototype.playerHash = function(playerId) {
	if (this._players && this._players[playerId]) {
		return SHA1.hex(JSON.stringify(this._players[playerId]));
	} else {
		return -1;
	}
};


Gamestate.prototype.countryHash = function(countryId) {
	if (this._countries[countryId]) {
		return SHA1.hex(JSON.stringify(this._countries[countryId]));
	} else {
		return -1;
	}
};

Gamestate.prototype.countriesHash = function() {
	return SHA1.hex(JSON.stringify(this._countries));
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Gamestate;
}