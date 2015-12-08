"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Country = require('./country.js');
}

var Player = function(id) {
	this._id = id;
	this._countries = []; // array of countryIds
	this._storedDice = 0;
	this._numContiguousCountries = 0;		
};

Player.init = function(count) {

	Player._array = [];
	for (var i = 0; i < count; i++) {
		Player._array.push(new Player(i));
	}
	Globals.debug("Created players ", Player._array, Globals.LEVEL.INFO, Globals.CHANNEL.PLAYER);
};



Player.setState = function(gamestate, map) {
	
	Player._array = [];
	Player._array.length = gamestate.playerIds().length;
	
	gamestate.playerIds().forEach(function(playerId) {
		var player = new Player(playerId);
		player._countries = [];
		gamestate.countryIds().forEach(function(countryId) {
			var country = map.getCountry(countryId);
			if (country.ownerId() == playerId) {
				player._countries.push(countryId);
			}
		});
		player._storedDice = gamestate.storedDice(playerId);
		player._numContiguousCountries = gamestate.numContiguous(playerId);
		Player._array[playerId] = player;
		Globals.debug("Deserialized player: " + JSON.stringify(player), Globals.LEVEL.INFO, Globals.CHANNEL.PLAYER);
	});
};


Player.array = function() { return Player._array; };
Player.count = function() { return Player._array.length; };
Player.get = function(id) { 
	//Globals.ASSERT(Player._array[id]);
	return Player._array[id]; 
};

Player.randomPlayer = function() {
	return Player._array[Math.floor(Math.random() * Player._array.length)];
};

Player.rollDie = function() {
	return Math.floor(Math.random() * 6) + 1;
}

Player.rollDice = function(num) {
	var array = [];
	for (var i = 0; i < num; i++) {
		array.push(Player.rollDie());
	}
	return array;
}



Player.prototype.id = function() { return this._id; };
Player.prototype.hasLost = function() { return this._countries.length == 0; };
Player.prototype.storedDice = function() { return this._storedDice; };
Player.prototype.countryCount = function() {return this._countries.length;};
Player.prototype.numContiguousCountries = function() { return this._numContiguousCountries; };


// Take ownership of a country.
Player.prototype.addCountry = function(country) {
	var oldOwner = Player.get(country.ownerId());
	if (oldOwner) {
 		oldOwner.loseCountry(country);
 	}
	country.setOwner(this.id());
	this._countries.push(country.id());
	Globals.debug("Player " + this._id + " added country " + country.id(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
	Globals.debug("New country count: " + this._countries.length, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
};

// Take away the country from this player.
Player.prototype.loseCountry = function(country) {
	var self = this;
	this._countries = this._countries.filter(function(elem) {
		Globals.debug("Player " + self._id + " lost country " + country.id(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
		Globals.debug("New country count: " + self._countries.length, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
		return elem != country.id();
	})
};

// Pick all the countries which have some space in them.
Player.prototype.countriesWithSpace = function(map) {
	return this._countries.filter(function(countryId) {
		return map.getCountry(countryId).numDice() < Globals.maxDice;
	}).map(function(countryId) {
		return map.getCountry(countryId);
	});
};

// Update the information for this player.
Player.prototype.updateStatus = function(map) {
	var self = this;

	// Did this player lose?
	if (this.hasLost()) {
 		return;
	}


	var alreadySeen = {};
	var maxIslandSize = 0;

	var traverse = function(country) {
		if (alreadySeen[country.id()]) {
			return 0;
		}
		alreadySeen[country.id()] = true;
	
		return 1 + 
				map.adjacentCountries(country.id()).reduce(function(total, adjacentCountryId) {
					var adjacentCountry = map.getCountry(adjacentCountryId);
					Globals.ASSERT(adjacentCountry);
					if (adjacentCountry.ownerId() == self.id()) {
						total += traverse(adjacentCountry);
					}
					return total;
				}, 0);
	};

	this._countries.forEach(function(countryId) {
		var islandSize = traverse(map.getCountry(countryId));

		if (islandSize > maxIslandSize) {
			maxIslandSize = islandSize;
		}
	});

	this._numContiguousCountries = maxIslandSize;
};



if (typeof module !== 'undefined' && module.exports){
	module.exports = Player;
}