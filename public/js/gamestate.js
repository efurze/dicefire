"use strict"


/*
var state = {
	players: {},
	countries: {},
	currentPlayerId: Engine._currentPlayerId,
};

Player.array().forEach(function(player) {
	state.players[player.id()] = {
		id: player.id(),
		hasLost: player.hasLost(),
		storedDice: player.storedDice(),
		numContiguousCountries: player.numContiguousCountries()
	};
});

Map._countryArray.forEach(function(country) {
	state.countries[country.id()] = {
		id: country.id(),
		owner: country.owner().id(),
		numDice: country.numDice(),
		adjacentCountries: country.adjacentCountries().map(function(adjacentCountry) {
			return adjacentCountry.id();
		})
	};
});

*/

var Gamestate = function(players, countries, currentPlayerId) {
	var self = this;
	self._currentPlayerId = typeof currentPlayerId === 'undefined' ? -1 : currentPlayerId;
	self._players = {};
	self._countries = {};
	self._adjacencyList = {};
	self._playerCountries = {};
	if (players) {
		players.forEach(function(player) {
			self._players[player.id()] = {
				id: player.id(),
				hasLost: player.hasLost(),
				storedDice: player.storedDice(),
				numContiguousCountries: player.numContiguousCountries
			};
			self._playerCountries[player.id()] = {};
		});
	}
	if (countries) {
		countries.forEach(function(country) {
			self._countries[country.id()] = {
				id: country.id(),
				owner: country.owner().id(),
				numDice: country.numDice()
			};
			self._adjacencyList[country.id()] = country.adjacentCountries().map(function(ac) {
				return ac.id();
			});
			//self._playerCountries[country.owner().id()][country.id()] = country.id();
		});
	}
};

Gamestate.prototype.clone = function() {
	var copy = new Gamestate();
	copy._currentPlayerId = this._currentPlayerId;
	copy._players = JSON.parse(JSON.stringify(this._players));
	copy._countries = JSON.parse(JSON.stringify(this._countries));
	copy._adjacencyList = this._adjacencyList;
	copy._playerCountries = JSON.parse(JSON.stringify(this._playerCountries));
	return copy;
};

Gamestate.prototype.toString = function() {
	return JSON.stringify(this);
};

Gamestate.prototype.playerCountries = function() {return this._playerCountries;};
Gamestate.prototype.setPlayerCountries = function(playerCountries) {this._playerCountries = playerCountries;};

Gamestate.prototype.playerIds = function() {return Object.keys(this._players);};

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

Gamestate.prototype.countryOwner = function(countryId) {return this._countries[countryId].owner;};
Gamestate.prototype.setCountryOwner = function(countryId, owner) {
	this._countries[countryId].owner = owner;
};

Gamestate.prototype.countryDice = function(countryId) {return this._countries[countryId].numDice;};
Gamestate.prototype.setCountryDice = function(countryId, count) {this._countries[countryId].numDice = count;};

Gamestate.prototype.adjacentCountries = function(countryId) {return this._adjacencyList[countryId];};
