"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Country = require('./country.js');
}

var PENALTY_TIMEOUT = 100;

var Player = function(id, engine) {
	this._id = id;
	this._engine = engine;
	this._countries = []; // array of countryIds
	this._storedDice = 0;
	this._numContiguousCountries = 0;		
	this._timeBudget = -1;
	this._timerId = -1;
	this._inPenalty = false;
	this._turnCount = 0;
	this._totalTime = 0;
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
Player.prototype.removeStoredDie = function() { if (this._storedDice) {this._storedDice --;} };
Player.prototype.countries = function() {return this._countries;};
Player.prototype.countryCount = function() {return this._countries.length;};
Player.prototype.numContiguousCountries = function() { return this._numContiguousCountries; };

Player.prototype.turnStarted = function() {  };
Player.prototype.turnEnded = function() { 
	this._turnCount ++;
	this._totalTime -= this._timeBudget;
};
Player.prototype.timePerTurn = function() {
	return this._turnCount ? Math.round(this._totalTime / this._turnCount) : 0;
}

Player.prototype.setTimeBudget = function(millis) {
	var self = this;
	self._timeBudget = millis;
	this._totalTime += millis;
	self._inPenalty = false;
	if (self._timerId >= 0) {
		self._cancelTimer(self._timerId);
		self._timerId = -1;
	}
	Globals.debug("setTimeBudget", self._timeBudget, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
};

Player.prototype.startClock = function() {
	var self = this;
	if (self._timerId == -1) {
		self._timerId = self._setTimer(self.timeout.bind(self), self._timeBudget);
		self._mark = Date.now();
		Globals.debug("startClock playerId=", self._id, self._timeBudget, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
	} else {
		Globals.debug("starClock called with no timerId >= 0", Globals.LEVEL.WARN, Globals.CHANNEL.PLAYER);
	}
};

Player.prototype.stopClock = function() {
	var self = this;
	if (self._timerId >= 0) {
		self._cancelTimer(self._timerId);
		self._timeBudget -= Math.max(Date.now() - self._mark, 0);
		self._timerId = -1;
		Globals.debug("stopClock playerId=", self._id, self._timeBudget, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
	} else {
		Globals.debug("stopClock called with timerId=-1", Globals.LEVEL.WARN, Globals.CHANNEL.PLAYER);
	}
};

Player.prototype.timeout = function() {
	var self = this;
	self._timerId = -1;

	if (Globals.timePenalties) {
		self._timeBudget = PENALTY_TIMEOUT;
		self._totalTime += PENALTY_TIMEOUT;
		self.startClock();

		if (!self._inPenalty) {
			Globals.debug("Player", self._id, "entering penalty", Globals.LEVEL.INFO, Globals.CHANNEL.PLAYER);
			self._inPenalty = true;
		} else {
			self.penalize();
		}
	} else {
		self.penalize();
	}
};

Player.prototype.penalize = function() {
	var self = this;
	if (self._engine) {
		self._engine.penalizePlayer(self._id);
	}
};

// Take ownership of a country.
Player.prototype.addCountry = function(country) {
	country.setOwner(this.id());
	this._countries.push(country.id());
	Globals.debug("Player " + this._id + " added country " + country.id(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLAYER);
	Globals.debug("New country count: " + this._countries.length, Globals.LEVEL.TRACE, Globals.CHANNEL.PLAYER);
};

// Take away the country from this player.
Player.prototype.loseCountry = function(country) {
	var self = this;
	Globals.debug("Player " + self._id + " lost country " + country.id(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
	this._countries = this._countries.filter(function(elem) {
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

Player.prototype._setTimer = function(callback, interval) {
	if (typeof module !== 'undefined' && module.exports) {
		return setTimeout(callback, interval);
	} else {
		return window.setTimeout(callback, interval);
	}
};

Player.prototype._cancelTimer = function(id) {
	if (typeof module !== 'undefined' && module.exports) {
		return clearTimeout(id);
	} else {
		return window.clearTimeout(id);
	}
};



if (typeof module !== 'undefined' && module.exports){
	module.exports = Player;
}