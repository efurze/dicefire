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

	init: function(playerCode, callback) {
		console.time("DICEFIRE");
		
		this._history = [];
		this._currentPlayerId = 0;
		this._gameOver = false;
		this._attackInProgress = false;
		this._previousAttack = false;
		this._historyIndex = 0;
		this._callback = callback;
		
		Engine._playerCode = playerCode;
		var isHumanList = Engine._playerCode.map(function(elem) { return elem == "human"; });
		Engine._playerCode.forEach(function(elem, index) {
			if (elem != "human") {
				Engine._playerCode[index] = elem.create(index, isHumanList);
			}
		});

		Player.init(playerCode.length);		
	},
	
	setup: function() {
		Map.generateMap();
		
		// assign initial dice
		Player.array().forEach(function(player) {
			Engine.addDiceToPlayer(player, Globals.startingDice);
			player.updateStatus();
			Renderer.renderPlayer(player);
		});
		
		Globals.debug("Map: " + Map.serializeHexes(), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		Globals.debug("Initial gamestate: " + this.getState().serialize(), Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
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
		Engine._currentPlayerId = playerId;
		Engine._previousAttack = {};
		Engine.pushHistory();

		if (Engine._playerCode[playerId] != "human") {
			window.setTimeout(function() {
					Engine._playerCode[playerId].startTurn(Engine.interface)
				}, 0);
		} 

		Renderer.renderPlayers(Player._array);
		Renderer.renderControls();
	},

	endTurn: function(event) {
		var player = Player.get(Engine._currentPlayerId);
		Engine.addDiceToPlayer(player, player._numContiguousCountries);
		Renderer.renderPlayer(player);
		
		Engine._currentPlayerId++;
		if (Engine._currentPlayerId >= Engine._playerCode.length) {
			Engine._currentPlayerId = 0;
		}
		
		// If that player has lost, skip him.
		if (Player.get(Engine._currentPlayerId).hasLost()) {
			Engine.endTurn();
			return;
		}

		if (Engine._gameOver) {
			return;
		}

		Engine.startTurn(Engine._currentPlayerId);
	},
	

	attack: function(fromCountry, toCountry, callback) {
		//Globals.debug("Attack FROM", fromCountry._id, "TO", toCountry._id, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
		var self = this;

		self._attackInProgress = true;

		var fromPlayer = fromCountry.owner();
		var toPlayer = toCountry.owner();
		
		var neighbors = Map.adjacentCountries(fromCountry.id());
		var ok = false;
		for (var i=0; i < neighbors.length; i++) {
			if (neighbors[i] == toCountry.id()) {
				ok = true;
				break;
			}
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
				//Globals.debug("Attacker wins", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
				var oldOwner = toCountry.owner();
				toCountry.setNumDice(fromNumDice - 1);
				fromPlayer.takeCountry(toCountry);
				oldOwner.updateStatus();
				
				// this defeat may have knocked oldOwner out.
				// Redraw its info
				Renderer.renderPlayer(oldOwner);

				if (fromCountry.owner()._countries.length == Map.countryCount()) {
					Engine.gameOver(fromCountry.owner());
				}
			} else {
				//Globals.debug("Attacker loses", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
			}
			
			// attack is done, save to history
			Engine.pushHistory();
			
			Renderer.renderControls();

			callback(fromRoll > toRoll);
		});

	},

	// Called when an attack ends the game.
	gameOver: function(winner) {
		console.log("GAME OVER");
		Engine._gameOver = true;
		console.timeEnd("DICEFIRE");
		
		if (Engine._callback) {
			Engine._callback(winner.id());
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
		this._currentPlayerId = gamestate.currentPlayerId();
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



