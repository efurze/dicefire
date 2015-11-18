"use strict"

var Engine = {
		
	_playerCode: null,
	_currentPlayerId: 0,
	_gameOver: false,
	_attackInProgress: false,
	_previousAttack: {},
	_history: [],
	_historyIndex: 0,
	_callback: null,
        
	currentPlayer: function() { return Player.get(Engine._currentPlayerId); },
	
	setCurrentPlayer: function(id) {
		Globals.debug("Current player set to " + id, Globals.LEVEL.TRACE, Globals.CHANNEL.ENGINE);
		this._currentPlayerId = id;
	},

	init: function(playerCode, callback) {
		console.time("DICEFIRE");
		
		this._history = [];
		Engine.setCurrentPlayer(0);
		this._gameOver = false;
		this._attackInProgress = false;
		this._previousAttack = false;
		this._historyIndex = 0;
		this._callback = callback;
		
		Engine._playerCode = playerCode;
		var isHumanList = Engine._playerCode.map(function(elem) { return elem == "human"; });
		Engine._playerCode.forEach(function(elem, index) {
			if (elem != "human") {
				Globals.debug("Creating player " + index + ": " + elem.getName(), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
				Engine._playerCode[index] = elem.create(index, isHumanList);
				Globals.debug(JSON.stringify(Engine._playerCode[index]), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
			}
		});

		Player.init(playerCode.length);		
	},
	
	setup: function(initialMap, initialState) {
		
		if (initialMap) {
			Globals.debug("Using provided map", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
			Map.deserializeHexes(initialMap);
		} else {
			Map.generateMap();
			//Globals.debug("Map: " + Map.serializeHexes(), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		}
		
		if (initialState) {
			Globals.debug("Using provided initial state", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
			Engine.deserialize(initialState);
			
		} else {
			// assign initial dice
			Player.array().forEach(function(player) {
				Engine.addDiceToPlayer(player, Globals.startingDice);
			});
			
		}
		
		Player.array().forEach(function(player) {
			player.updateStatus();
			Renderer.renderPlayer(player);
		});
		
		//Globals.debug("Initial gamestate: " + this.getState().serialize(), Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	},
	
	pushHistory: function() {
		Engine._history.push(this.serialize());
		Engine._historyIndex = this._history.length - 1;
	},
	
	
	// Give dice to a player. In all cases, the dice go to random
	// countries
	addDiceToPlayer: function(player, num) {

		// Make stored dice available for distribution.
		num += player._storedDice;
		player._storedDice = 0;

		var countriesWithSpace;
		for (var i = 0; i < num; i++) {
			// Have to do this again and again because countries may fill up.
	 		countriesWithSpace = player.countriesWithSpace();
	 		if (countriesWithSpace.length == 0) {
	 			player._storedDice += num - i;
	 			if (player._storedDice > Globals.maxStoredDice) {
	 				player._storedDice = Globals.maxStoredDice;
	 			}
	 			break;
	 		}
	 		var country = countriesWithSpace[Math.floor(Math.random() * countriesWithSpace.length)];
			country.addDie();
			Renderer.renderCountry(country);
		}
	},

	isHuman: function(playerId) {
		return Engine._playerCode[playerId] == "human";
	},

	startTurn: function(playerId, callback) {
		Globals.debug("Player " + playerId + " starting turn", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		Engine.setCurrentPlayer(playerId);
		Engine._previousAttack = {};
		Engine.pushHistory();

		if (Engine._playerCode[Engine._currentPlayerId] != "human") {
			window.setTimeout(function() {
					Engine._playerCode[Engine._currentPlayerId].startTurn(Engine.interface)
				}, 0);
		} 

		Renderer.renderPlayers(Player._array);
		Renderer.renderControls();
	},

	endTurn: function(event) {
		Globals.debug("Player " + Engine._currentPlayerId + " ending turn", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		var cur = Engine._currentPlayerId;
		var player = Player.get(Engine._currentPlayerId);
		Engine.addDiceToPlayer(player, player._numContiguousCountries);
		Renderer.renderPlayer(player);
		
		// go to the next player that hasn't lost
		do {
			cur++;
			if (cur >= Engine._playerCode.length) {
				cur = 0;
			}
		} while (Player.get(cur).hasLost() && cur !== Engine._currentPlayerId);

		if (cur == Engine._currentPlayerId) {
			Engine.gameOver(player);
		} else {
			Engine.setCurrentPlayer(cur);
		}

		if (Engine._gameOver) {
			return;
		}

		Engine.startTurn(Engine._currentPlayerId);
	},
	

	attack: function(fromCountry, toCountry, callback) {
		Globals.debug("Attack FROM", fromCountry._id, "TO", toCountry._id, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		var self = this;

		self._attackInProgress = true;

		var fromPlayer = Player.get(fromCountry.ownerId());
		var toPlayer = Player.get(toCountry.ownerId());
		
		// make sure the 2 countries are next to each other
		var neighbors = Map.adjacentCountries(fromCountry.id());
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
			ok = false;
		}

		if (!ok) {
			Globals.ASSERT(false);
			Globals.debug("Illegal attack", fromCountry, toCountry, Globals.LEVEL.WARN, Globals.CHANNEL.ENGINE);
			return null;    		
		}

		var fromNumDice = fromCountry.numDice();
		var toNumDice = toCountry.numDice();
		var fromRollArray = Player.rollDice(fromNumDice);
		var toRollArray = Player.rollDice(toNumDice);

		var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
		var toRoll = toRollArray.reduce(function(total, die) { return total + die; });

		self._previousAttack = {
			fromCountryId: fromCountry._id,
			toCountryId: toCountry._id,
			fromRollArray: fromRollArray,
			toRollArray: toRollArray
		}

		Renderer.renderAttack(fromCountry, toCountry, fromRollArray, toRollArray, function done() {

			self._attackInProgress = false;

			fromCountry.setIsFighting(false);
			toCountry.setIsFighting(false);

			// Note that ties go to the toCountry. And, no matter what happens, the fromCountry
			// goes down to 1 die.
			fromCountry.setNumDice(1);

			if (fromRoll > toRoll) {
				Globals.debug("Attacker wins", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
				var oldOwner = Player.get(toCountry.ownerId());
				toCountry.setNumDice(fromNumDice - 1);
				fromPlayer.addCountry(toCountry);
				oldOwner.updateStatus();
				fromPlayer.updateStatus();
				
				if (oldOwner.hasLost()) {
					Globals.debug("Player " + oldOwner.id() + " has lost and can no longer play", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
				}
				
				// this defeat may have knocked oldOwner out.
				// Redraw its info
				Renderer.renderPlayer(oldOwner);

				if (fromPlayer.countryCount() == Map.countryCount()) {
					Engine.gameOver(fromPlayer);
				}
			} else {
				Globals.debug("Attacker loses", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
			}
			
			// attack is done, save to history
			Engine.pushHistory();
			
			Renderer.renderControls();

			callback(fromRoll > toRoll);
		});

	},

	// Called when an attack ends the game.
	gameOver: function(winner) {
		if (!Engine._gameOver) {
			console.log("GAME OVER");
			Engine._gameOver = true;
			console.timeEnd("DICEFIRE");
		
			if (Engine._callback) {
				Engine._callback(Engine._playerCode[winner.id()], winner.id());
			}
		}
	},

	isGameOver: function() {
		return Engine._gameOver;
	},
	
	serialize: function() {
		return this.getState().serialize();
	},
	
	deserialize: function(state) {
		
		var gamestate = Gamestate.deserialize(state);
		this.setState(gamestate);
	},
	
	setHistoryIndex: function(index) {
		this._historyIndex = index;
		this.deserialize(this._history[index]);
	},
	
	isHistoryCurrent: function() {
		return this._historyIndex == (this._history.length - 1);
	},

	getState: function() {
		return new Gamestate(Player.array(), Map._countryArray, Engine._currentPlayerId, Engine._previousAttack);
	},
	
	setState: function(gamestate) {
		Map.setState(gamestate);
		Player.setState(gamestate);
		this._previousAttack = gamestate.previousAttack();
		Engine.setCurrentPlayer(gamestate.currentPlayerId());
	},
	
	// unittest accessors
	playerCount: function() {
		return Player._array.length;
	},
	
	playerCountryCount: function(id) {
		return Player.get(id)._countries.length;
	},
	
	totalCountryCount: function() {
		return Map.countryCount();
	},

	// The interface passed to AIs so they can control the game.
	interface: {
		adjacentCountries: function(countryId) { return Map.adjacentCountries(countryId);},
		getState: function() { return Engine.getState(); },
		attack: function(fromCountryId, toCountryId, callback) { 	

			Engine.attack(Map._countryArray[fromCountryId], Map._countryArray[toCountryId], function(result) {	
				callback(result);    
			});

		},
		endTurn: function() { Engine.endTurn(); }
	}

};



