"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Map = require('./map.js');
	var Country = require('./country.js');
	var Player = require('./player.js');
	var Gamestate = require('./gamestate.js');
}


var Engine = function() {
	this._AIs = null;
	this._currentPlayerId = 0;
	this._gameOver = false;
	this._attackInProgress = false;
	this._history = [];
	this._players = [];
	this._gameCallback = null; 	// called when game is over
	this._stateCallback = null;	// called whenever the state updates
	this._attackCallback = null; // call AIs back with attack results
	this._initialized = false;
	this._map = null;
	this._watchdogTimerID = -1;
};
        
Engine.prototype.map = function() { return this._map; };
Engine.prototype.getPlayer = function(id) { return this._players[id]; };
Engine.prototype.currentPlayer = function() { return this._players[this._currentPlayerId]; };
Engine.prototype.currentPlayerId = function() { return this._currentPlayerId; };
Engine.prototype.isAttacking = function() {return this._attackInProgress;};
Engine.prototype.isInitialized = function() {return this._initialized;};
	
Engine.prototype.setCurrentPlayer = function(id) {
	Globals.debug("Current player set to " + id, Globals.LEVEL.TRACE, Globals.CHANNEL.ENGINE);
	this._currentPlayerId = id;
};

// @callback = function(winningAI, winningID), called when game is over
Engine.prototype.init = function(playerCode, callback) {
	console.time("DICEFIRE");
	var self = this;
	
	self._history = [];
	self.setCurrentPlayer(0);
	self._gameOver = false;
	self._attackInProgress = false;
	self._gameCallback = callback;
	self._stateCallback = null;
	self._playerCode = playerCode;
	if (self._AIs){
		self._AIs.forEach(function(ai) {
			ai.stop();
		});
	}
	self._AIs = [];
	self._AIs.length = playerCode.length;
	
	self._players = [];
	for (var i=0; i < playerCode.length; i++) {
		self._players.push(new Player(i));
	}
	
	self._initialized = true;	
};
		
// @cb: function(gamestate, index){}
Engine.prototype.registerStateCallback = function(cb) {
	this._stateCallback = cb;
};

Engine.prototype.setup = function(initialMap, initialState) {
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
	
	// initialize AIs
	var isHumanList = self._playerCode.map(function(elem) { return elem == "human"; });
	self._playerCode.forEach(function(elem, index) {
		if (elem != "human") {
			Globals.debug("Creating player " + index + ": " + elem.getName(), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
			self._AIs[index] = new AIWrapper(elem, self, index, true);
			Globals.debug(JSON.stringify(self._AIs[index].getAI()), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		} else {
			self._AIs[index] = "human";
		}
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
	
	Globals.debug("Initial gamestate: " + this.getState().toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.ENGINE);
};

// @attack (optional):  {
//	fromCountryId: fromCountry._id,
//	toCountryId: toCountry._id,
//	fromRollArray: fromRollArray,
//	toRollArray: toRollArray
// } 
Engine.prototype.pushHistory = function(state, attack){
	var self = this;
	if (attack) {
		state.setAttack(attack);
	}
	var len = self._history.length;
	self._history.push(state);
	if (self._stateCallback) {
		self._stateCallback(state, len);
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
	return this._AIs[playerId] == "human";
};

Engine.prototype.startTurn = function(playerId, callback) {
	Globals.debug("Player " + playerId + " starting turn", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	self.setCurrentPlayer(playerId);
	self.pushHistory(self.getState());

	if (!self.isHuman(self._currentPlayerId)) {
		self._timeout(function() {
				self._AIs[self._currentPlayerId].startTurn(self.getState())
			}, 0);
	} 
};

Engine.prototype.endTurn = function(event) {
	Globals.debug("Player " + this._currentPlayerId + " ending turn", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	var cur = self._currentPlayerId;
	var player = self._players[self._currentPlayerId];
	self.addDiceToPlayer(player, player._numContiguousCountries);
	
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
	Globals.debug("Attack FROM", fromCountry._id, "TO", toCountry._id, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
	
	self._attackInProgress = true;
	self._attackCallback = callback;

	var fromPlayer = this._players[fromCountry.ownerId()];
	var toPlayer = this._players[toCountry.ownerId()];
	
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
		Globals.debug("Attacking country has too few dice", Globals.LEVEL.WARN, Globals.CHANNEL.ENGINE);
		ok = false;
	}
	
	if (fromCountry.ownerId() == toCountry.ownerId()) {
		Globals.debug("Player attacking itself", Globals.LEVEL.WARN, Globals.CHANNEL.ENGINE);
		ok = false;
	}
	
	if (fromCountry.id() == toCountry.id()) {
		Globals.debug("Country attacking itself", Globals.LEVEL.WARN, Globals.CHANNEL.ENGINE);
		ok = false;
	}

	if (!ok) {
		//Globals.ASSERT(false);
		Globals.debug("Illegal attack", fromCountry, toCountry, Globals.LEVEL.WARN, Globals.CHANNEL.ENGINE);
		if (self._attackCallback) {
			self._attackCallback(false);
		}
		return;    		
	}

	var fromNumDice = fromCountry.numDice();
	var toNumDice = toCountry.numDice();
	var fromRollArray = Player.rollDice(fromNumDice);
	var toRollArray = Player.rollDice(toNumDice);

	var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
	var toRoll = toRollArray.reduce(function(total, die) { return total + die; });

	var attack = {
		fromCountryId: fromCountry._id,
		toCountryId: toCountry._id,
		fromRollArray: fromRollArray,
		toRollArray: toRollArray
	}
	
	// IMPORTANT: the way this now works is that Engine expects the application wrapper (ie, Game) to call
	// finishAttack() when the attack rendering is done. The pushHistory() here informs Game, via
	// the stateCallback that an attack needs to be rendered
	
	self.pushHistory(self.getState(), attack);

	if (typeof module !== 'undefined' && module.exports) {
		self.finishAttack(attack);
	} else {
		Globals.ASSERT(self._watchdogTimerID < 0);
		self._watchdogTimerID = self._timeout(function() {
			console.log("Watchdog timeout! Did you forget to call Engine.finishAttack?");
		}, 5000);
	}
};

Engine.prototype.finishAttack = function(attack) {
	var self = this;
	
	if (self._watchdogTimerID >= 0) {
		window.clearTimeout(self._watchdogTimerID);
	}
	self._watchdogTimerID = -1;
	
	self._attackInProgress = false;
	
	var fromCountry = self._map.getCountry(attack.fromCountryId);
	var toCountry = self._map.getCountry(attack.toCountryId);
	var fromRoll = attack.fromRollArray.reduce(function(total, die) { return total + die; });
	var toRoll = attack.toRollArray.reduce(function(total, die) { return total + die; });
	var fromNumDice = fromCountry.numDice();
	var toNumDice = toCountry.numDice();
	var fromPlayer = self._players[fromCountry.ownerId()];
	var toPlayer = self._players[toCountry.ownerId()];

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
	self.pushHistory(self.getState());
	if (self._attackCallback) {
		var temp = self._attackCallback;
		self._attackCallback = null;
		temp(fromRoll > toRoll);
	}
};

// Called when an attack ends the game.
Engine.prototype.gameOver = function(winner) {
	var self = this;
	if (!self._gameOver) {
		console.log("GAME OVER");
		self._gameOver = true;
		console.timeEnd("DICEFIRE");
		
		// shut down all of the AIs
		self._AIs.forEach(function(ai) {
			if (ai && ai instanceof AIWrapper) {
				ai.stop();
			}
		});
	
		if (self._gameCallback) {
			self._gameCallback(self._AIs[winner.id()].getAI(), winner.id());
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
	return new Gamestate(this._players, this._map._countryArray, this._currentPlayerId);
};

Engine.prototype.setState = function(gamestate) {
	var self = this;
	self._map.setState(gamestate);
	
	self._players = [];
	self._players.length = gamestate.playerIds().length;
	gamestate.playerIds().forEach(function(playerId) {
		var player = new Player(playerId);
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
		Globals.debug("Deserialized player: " + JSON.stringify(player), Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	});
	
	self.setCurrentPlayer(gamestate.currentPlayerId());
};

// unittest accessors
Engine.prototype.playerCount = function() {
	return Player._array.length;
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


var AIInterface = function(aiwrapper) {
	var engine = aiwrapper._engine;
	return {
		adjacentCountries: function(countryId) { return engine.map().adjacentCountries(countryId);},
		getState: function() { return engine.getState(); },
		attack: function(fromCountryId, toCountryId, callback) { 	
			aiwrapper.attack(fromCountryId, toCountryId, callback);
		},
		endTurn: function() { 
			aiwrapper.endTurn(); 
		}
	};
};

//--------------------------------------------------------------------------------------
//	AIWrapper
//--------------------------------------------------------------------------------------
var AIWrapper = function(ai, engine, playerId, trusted) {
	this._trusted = (typeof trusted == undefined) ? false : trusted;
	this._isMyTurn = false;
	this._engine = engine;
	
	if (this._trusted) {
		this._ai = ai.create(playerId);
	} else {
		this._worker = new Worker("/js/game/aiworker.js");
		this._worker.onmessage = this.callback.bind(this);
		this._worker.postMessage({command: 'init', adjacencyList: engine.map().adjacencyList(), ai: ai.getName(), playerId: playerId});
	}
};


AIWrapper.prototype.getAI = function() {
	return this._ai;
};

// from engine
AIWrapper.prototype.stop = function() {
	if (!this._trusted && this._worker) {
		this._worker.close();
		this._worker = null;
	}
};

// from engine
AIWrapper.prototype.startTurn = function(state) {
	Globals.ASSERT(!this._isMyTurn);
	this._isMyTurn = true;
	if (this._trusted) {
		this._ai.startTurn(AIInterface(this));
	} else {
		this._worker.postMessage({command: 'startTurn', state: state.serialize()});
	}
};

// from engine
AIWrapper.prototype.attackDone = function(success) {
	if (this._trusted) {
		this._aiCallback(success);
	} else {
		this._worker.postMessage({command: 'attackResult', result: success, state: this._engine.getState().serialize()})
	}
};

// from engine
AIWrapper.prototype.loses = function() {
	if (this._trusted) {
		this._ai = null;
	} else {
		this._worker.close();
		this._worker = null;
	}
};

// from AI
AIWrapper.prototype.endTurn = function() {
	Globals.ASSERT(this._isMyTurn);
	this._isMyTurn = false;
	this._engine.endTurn();
};

// from AI
AIWrapper.prototype.attack = function(from, to, callback) {
	this._aiCallback = callback;
	this._engine.attack(this._engine.map().getCountry(from), this._engine.map().getCountry(to), this.attackDone.bind(this));
}

// from AIWorker
AIWrapper.prototype.callback = function(e) {
	Globals.ASSERT(this._isMyTurn);
	console.log("Got message from worker", e);
	var data = e.data;
	switch (data.command) {
		case 'attack':
			var from = parseInt(data.from);
			var to = parseInt(data.to);
			this._engine.attack(this._engine.map().getCountry(from), this._engine.map().getCountry(to), this.attackDone.bind(this));
			break;
		case 'endTurn':
			this._isMyTurn = false;
			this._engine.endTurn();
			break;
	}
};


if (typeof module !== 'undefined' && module.exports) {
	module.exports = Engine;
}