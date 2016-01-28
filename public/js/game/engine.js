"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Map = require('./map.js');
	var Country = require('./country.js');
	var Player = require('./player.js');
	var Gamestate = require('./gamestate.js');
	var AIWrapper = require('./aiwrapper.js');
}

var MOVE_TIME_BUDGET = 2000; // each player gets 2 seconds per turn

var Engine = function() {
	this._AIs = null;
	this._currentPlayerId = 0;
	this._gameOver = false;
	this._history = [];
	this._players = [];
	this._gameCallback = null; 	// called when game is over
	this._stateCallback = null;	// called whenever the state updates
	this._attackCallback = null; // call AIs back with attack results
	this._keepHistory = true;
	this._stateCount = 0;
	this._initialized = false;
	this._map = null;
	this._enforceTimeLimits = false;

	Globals.ASSERT(Globals.implements(this, Engine.ControllerInterface))
};

// This is what must be passed into init(). This interface allows the Engine to control bots
// and human players
Engine.PlayerInterface = {
	getName: function(){return "human";},
	isHuman: function(){return true;},
	start: function(){},
	stop: function(){},
	startTurn: function(state){},
	attackDone: function(success, stateId){},
	turnEnded: function() {},
	loses: function(){}
};

// Engine implements this. This allows bots to call back into the Engine.
Engine.ControllerInterface = {
	map: function(){},
	getState: function(){},
	endTurn: function(){},
	attack: function(from, to, callback){} // callback: function(success){}
};
        
Engine.prototype.map = function() { return this._map; };
Engine.prototype.getPlayer = function(id) { return this._players[id]; };
Engine.prototype.currentPlayer = function() { return this._players[this._currentPlayerId]; };
Engine.prototype.currentPlayerId = function() { return this._currentPlayerId; };
Engine.prototype.isInitialized = function() {return this._initialized;};
Engine.prototype.setKeepHistory = function(keep) { this._keepHistory = keep;};	
Engine.prototype.setEnforceTime = function(enforce) { this._enforceTimeLimits = enforce;};	
Engine.prototype.currentStateId = function() {
	if (this._history.length) {
		return this._history[this._history.length-1].stateId();
	} else {
		return 0;
	}
};

Engine.prototype.setCurrentPlayer = function(id) {
	Globals.debug("Current player set to " + id, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
	this._currentPlayerId = id;
};

// @players =  array[object] of PlayerInterface
// @callback = function(winningAI, winningID), called when game is over
Engine.prototype.init = function(players, callback) {
	console.time("DICEFIRE");
	players.forEach(function(ai) {
		Globals.ASSERT(Globals.implements(ai, Engine.PlayerInterface));
	});
	Globals.debug("Engine init", players.map(function(player) {return player.getName();}), Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	
	self._history = [];
	self._stateCount = 0;
	self.setCurrentPlayer(0);
	self._gameOver = false;
	self._gameCallback = callback;
	self._stateCallback = null;
	if (self._AIs){
		self._AIs.forEach(function(ai) {
			ai.stop();
		});
	}
	self._AIs = [];
	self._AIs.length = players.length;
	
	self._players = [];
	for (var i=0; i < players.length; i++) {
		self._players.push(new Player(i, self));
		self._AIs[i] = players[i];
	}
	
	self._initialized = true;	
};
		
// @cb: function(gamestate, index){}
Engine.prototype.registerStateCallback = function(cb) {
	this._stateCallback = cb;
};

Engine.prototype.setup = function(initialMap, initialState) {
	Globals.debug("Engine setup", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	
	self._map = new Map();
	
	if (initialMap) {
		Globals.debug("Using provided map", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
		self._map.deserializeHexes(initialMap);
	} else {
		self._map.generateMap();
		Globals.debug("Map: " + self._map.serializeHexes(), Globals.LEVEL.TRACE, Globals.CHANNEL.ENGINE);
	}
	
	self._map.assignCountries(self._players);
	
	// start the AIs - this has to happen after the map is initialized
	self._AIs.forEach(function(ai) {
		ai.start();
	});
	
	if (initialState) {
		Globals.debug("Using provided initial state", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
		self.deserialize(JSON.parse(initialState));
	} else {
		// assign initial dice
		self._players.forEach(function(player) {
			self.addDiceToPlayer(player, Globals.startingDice);
		});
	}
		
	self._players.forEach(function(player) {
		player.updateStatus(self._map);
	});
};

// @attack (optional):  {
//	fromCountryId: fromCountry._id,
//	toCountryId: toCountry._id,
//	fromRollArray: fromRollArray,
//	toRollArray: toRollArray
// } 
Engine.prototype.pushHistory = function(attack){
	var self = this;
	var stateId = self._stateCount;
	self._stateCount ++;
	var state = new Gamestate(self._players, self._map._countryArray, self._currentPlayerId, stateId);
	if (attack) {
		state.setAttack(attack);
	}
	
	if (self._keepHistory) {
		self._history.push(state);
	} else {
		self._history = [state];
	}
	
	if (self._stateCallback) {
		self._stateCallback(state, stateId);
	}
};


// Give dice to a player. In all cases, the dice go to random
// countries
Engine.prototype.addDiceToPlayer = function(player, num) {
	
	var self = this;
	
	// Make stored dice available for distribution.
	num += player._storedDice;
	player._storedDice = 0;

	var countriesWithSpace;
	for (var i = 0; i < num; i++) {
		// Have to do this again and again because countries may fill up.
 		countriesWithSpace = player.countriesWithSpace(self._map);
 		if (countriesWithSpace.length == 0) {
 			player._storedDice += num - i;
 			if (player._storedDice > Globals.maxStoredDice) {
 				player._storedDice = Globals.maxStoredDice;
 			}
 			break;
 		}
 		var country = countriesWithSpace[Math.floor(Math.random() * countriesWithSpace.length)];
		country.addDie();
	}
};

Engine.prototype.isHuman = function(playerId) {
	return this._AIs[playerId].isHuman();
};

Engine.prototype.startTurn = function(playerId, callback) {
	Globals.debug("Player " + playerId + " starting turn", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	self.setCurrentPlayer(playerId);
	self.pushHistory();

	self._timeout(function() {
		if (!self.isHuman(playerId) && self._enforceTimeLimits) {
			self._players[playerId].setTimeBudget(MOVE_TIME_BUDGET);
			self._startClock(playerId);
		}
		self._AIs[self._currentPlayerId].startTurn(self.getState())
		self._players[self._currentPlayerId].turnStarted();
	}, 0);

};

Engine.prototype.endTurn = function() {
	Globals.debug("Player " + this._currentPlayerId + " ending turn", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	self._stopClock(self._currentPlayerId);
	var cur = self._currentPlayerId;
	var player = self._players[self._currentPlayerId];
	self.addDiceToPlayer(player, player._numContiguousCountries);
	self._players[self._currentPlayerId].turnEnded();
	
	// go to the next player that hasn't lost
	do {
		cur++;
		if (cur >= self._AIs.length) {
			cur = 0;
		}
	} while (this._players[cur].hasLost() && cur !== self._currentPlayerId);

	if (cur == self._currentPlayerId) {
		self.gameOver(player);
	} else {
		self.startTurn(cur);
	}
};


Engine.prototype.attack = function(fromCountry, toCountry, callback) {
	var self = this;
	
	if (typeof fromCountry === 'number') {
		fromCountry = self._map.getCountry(fromCountry); 
	}
	if (typeof toCountry === 'number') {
		toCountry = self._map.getCountry(toCountry); 
	}
	
	var fromPlayer = self._players[fromCountry.ownerId()];
	var toPlayer = self._players[toCountry.ownerId()];

	if (fromPlayer.id() != self._currentPlayerId) {
		Globals.debug("Attacking player not current player", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		if (self._attackCallback) {
			self._attackCallback(false, self.currentStateId());
		}
		return;
	}

	Globals.debug("Attack FROM", fromCountry._id, "TO", toCountry._id, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
	
	self._stopClock(self._currentPlayerId);

	self._attackCallback = callback;
	
	// make sure the 2 countries are next to each other
	var neighbors = self._map.adjacentCountries(fromCountry.id());
	var ok = false;
	for (var i=0; i < neighbors.length; i++) {
		if (neighbors[i] == toCountry.id()) {
			// countries aren't neighbors
			ok = true;
			break;
		}
	}
	
	// make sure attacker has at least 2
	if (fromCountry.numDice() < 2) {
		Globals.debug("Attacking country has too few dice", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		ok = false;
	}
	
	if (fromCountry.ownerId() == toCountry.ownerId()) {
		Globals.debug("Player attacking itself", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		ok = false;
	}
	
	if (fromCountry.id() == toCountry.id()) {
		Globals.debug("Country attacking itself", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		ok = false;
	}

	if (!ok) {
		//Globals.ASSERT(false);
		Globals.debug("Illegal attack", fromCountry.id(), toCountry.id(), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		if (self._attackCallback) {
			self._attackCallback(false, self.currentStateId());
		}		
		self._startClock(self._currentPlayerId);
		
	} else {
		var fromNumDice = fromCountry.numDice();
		var toNumDice = toCountry.numDice();
		var fromRollArray = Player.rollDice(fromNumDice);
		var toRollArray = Player.rollDice(toNumDice);

		Globals.ASSERT(fromRollArray && fromRollArray.length > 1);
		Globals.ASSERT(fromNumDice == fromRollArray.length);
		
		Globals.debug("Attack roll", fromRollArray, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		Globals.debug("Defend roll", toRollArray, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);

		var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; }, 0);
		var toRoll = toRollArray.reduce(function(total, die) { return total + die; }, 0);

		var attack = {
			fromCountryId: fromCountry._id,
			toCountryId: toCountry._id,
			fromRollArray: fromRollArray,
			toRollArray: toRollArray
		}
	
		self.pushHistory(attack);
	
		// Note that ties go to the toCountry. And, no matter what happens, the fromCountry
		// goes down to 1 die.
		fromCountry.setNumDice(1);

		if (fromRoll > toRoll) {
			Globals.debug("Attacker wins", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
			var oldOwner = self._players[toCountry.ownerId()];
			toCountry.setNumDice(fromNumDice - 1);
			fromPlayer.addCountry(toCountry);
			oldOwner.loseCountry(toCountry);
			oldOwner.updateStatus(self._map);
			fromPlayer.updateStatus(self._map);
			
			Globals.debug("Losing player has " + oldOwner.countryCount() + " countries left", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
			
			if (oldOwner.hasLost()) {
				Globals.debug("Player " + oldOwner.id() + " has lost and can no longer play", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
			}
			

			if (fromPlayer.countryCount() == self._map.countryCount()) {
				self.gameOver(fromPlayer);
				return;
			}
		} else {
			Globals.debug("Attacker loses", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		}
		
		// attack is done, save to history
		self.pushHistory();
		self._startClock(self._currentPlayerId);
		if (self._attackCallback) {
			var temp = self._attackCallback;
			self._attackCallback = null;
			temp(fromRoll > toRoll, self.currentStateId());
		}
	}
};

Engine.prototype.penalizePlayer = function(id) {
	var self = this;
	if (!self._enforceTimeLimits) {
		return;
	}

	if (id == self._currentPlayerId) {
		if (!self._AIs[id].isHuman()) {
			if (Globals.timePenalties) {
				Globals.debug("Penalizing player", id, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
				var player = self._players[id];

				// remove stored dice first
				if (player.storedDice()) {
					player.removeStoredDie();
				} else {
					// get list of countries for this player that have at least 2 die
					var countries = player.countries().map(function(countryId) {
						return self._map.getCountry(countryId);
					}).filter(function(country) {
						return (country.numDice() > 1);
					});

					if (countries.length) {
						// randomly pick a country
						var idx = Math.floor(countries.length * Math.random());
						Globals.debug("Removing die from country", countries[idx].id(), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);		
						countries[idx].removeDie();
					} else {
						Globals.debug("Player has no more dice to remove", id, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);	
						self._AIs[id].turnEnded();
						self.endTurn();	
					}
				}
			} else {
				Globals.debug("Player over time limit - ending turn", id, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);	
				self._AIs[id].turnEnded();
				self.endTurn();	
			}
		}

	} else {
		Globals.debug("PenalizePlayer called for non-current player", id, Globals.LEVEL.WARN, Globals.CHANNEL.ENGINE);
	}
};

// Called when an attack ends the game.
Engine.prototype.gameOver = function(winner) {
	var self = this;
	if (!self._gameOver) {
		console.log("GAME OVER");
		self.pushHistory();
		self._gameOver = true;
		console.timeEnd("DICEFIRE");
		
		// shut down all of the AIs
		self._AIs.forEach(function(ai) {
			if (ai && ai instanceof AIWrapper) {
				ai.stop();
			}
		});
	
		if (self._gameCallback) {
			self._gameCallback(self._AIs[winner.id()].getName(), winner.id());
		}
	}
};

Engine.prototype.isGameOver = function() {
	return this._gameOver;
};

Engine.prototype.deserialize = function(state) {	
	var gamestate = Gamestate.deserialize(state);
	this.setState(gamestate);
};

Engine.prototype.serializeMap = function() {
	return this._map.serializeHexes();
};

Engine.prototype.historyLength = function() {
	return this._history.length;
};

Engine.prototype.getHistory = function(index) {
	if (index >= 0 && index < this._history.length) {
		return this._history[index];
	} else {
		return new Gamestate();
	}
};
	
Engine.prototype.getState = function() {
	if (this._history.length) {
		return this._history[this._history.length-1];
	} else {
		return null;
	}
};

Engine.prototype.setState = function(gamestate) {
	var self = this;
	self._map.setState(gamestate);
	
	self._players = [];
	self._players.length = gamestate.playerIds().length;
	gamestate.playerIds().forEach(function(playerId) {
		var player = new Player(playerId, self);
		player._countries = [];
		gamestate.countryIds().forEach(function(countryId) {
			var country = self._map.getCountry(countryId);
			if (country.ownerId() == playerId) {
				player._countries.push(countryId);
			}
		});
		player._storedDice = gamestate.storedDice(playerId);
		player._numContiguousCountries = gamestate.numContiguous(playerId);
		self._players[playerId] = player;
		Globals.debug("Deserialized player", playerId, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	});
	
	self._stateCount = gamestate.stateId();
	self.setCurrentPlayer(gamestate.currentPlayerId());
};

// unittest accessors
Engine.prototype.playerCount = function() {
	return this._players ? this._players.length : 0;
};

Engine.prototype.playerCountryCount = function(id) {
	return this._players[id]._countries.length;
};

Engine.prototype.totalCountryCount = function() {
	return this._map.countryCount();
};

Engine.prototype._timeout = function(callback, interval) {
	if (typeof module !== 'undefined' && module.exports) {
		return setTimeout(callback, interval);
	} else {
		return window.setTimeout(callback, interval);
	}
};

Engine.prototype._startClock = function(playerId) {
	var self = this;
	if (self._enforceTimeLimits && !self._AIs[playerId].isHuman()) {
		self._players[playerId].startClock();
	}
};

Engine.prototype._stopClock = function(playerId) {
	var self = this;
	if (self._enforceTimeLimits && !self._AIs[playerId].isHuman()) {
		self._players[playerId].stopClock();
	}
};


if (typeof module !== 'undefined' && module.exports) {
	module.exports = Engine;
}