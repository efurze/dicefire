"use strict"

var Engine = {
		
	_playerCode: null,
	_currentPlayerId: 0,
	_gameOver: false,
	_attackInProgress: false,
	_previousAttack: {},
	_history: [],
	_historyIndex: 0,
        
	currentPlayer: function() { return Player.get(Engine._currentPlayerId); },

	init: function(playerCode) {
		console.time("DICEFIRE");
		
		this._history = [];

		Engine._playerCode = playerCode;
		var isHumanList = Engine._playerCode.map(function(elem) { return elem == "human"; });
		Engine._playerCode.forEach(function(elem, index) {
			if (elem != "human") {
				elem.init(index, isHumanList);
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
		
		this._history.push(this.serialize());
		this._historyIndex = this._history.length - 1;
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

	startTurn: function(playerId) {
		Engine._currentPlayerId = playerId;

		if (Engine._playerCode[playerId] != "human") {
			Engine._playerCode[playerId].startTurn(Engine.interface);
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

		if (!fromCountry.adjacentCountries().find(function(elem) { return elem == toCountry; })) {
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

				if (fromCountry.owner()._countries.length == Map._countryArray.length) {
					Engine.gameOver();
				}
			} else {
				//Globals.debug("Attacker loses", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
			}
			
			// attack is done, save to history
			Engine._history.push(Engine.serialize());
			Engine._historyIndex = Engine._history.length - 1;
			
			Renderer.renderControls();

			callback({
				fromRollArray: fromRollArray,
				fromRoll: fromRoll,
				toRollArray: toRollArray,
				toRoll: toRoll
			});
		});

	},

	// Called when an attack ends the game.
	gameOver: function() {
		console.log("GAME OVER");
		Engine._gameOver = true;
		console.timeEnd("DICEFIRE");
		
	},


	serialize: function() {
		var state = {
			players: [],
			map: [],
			currentPlayerId: Engine._currentPlayerId,
			previousAttack: {
				fromCountryId: -1,
				toCountryId: -1,
				fromRollArray: [],
				toRollArray: []
			}
		};

		state.players = Player.serialize();
		state.map = Map.serialize();
		state.previousAttack = Engine._previousAttack;

		return state;
	},
	
	deserialize: function(state) {
		
		Player.deserialize(state.players);
		Map.deserialize(state.map);
		this._previousAttack = state.previousAttack;
		this._currentPlayerId = state.currentPlayerId;
	},
	
	setHistoryIndex: function(index) {
		this._historyIndex = index;
		this.deserialize(this._history[index]);
		if (this.isHistoryCurrent()) {
			// this is a hack for now. I have make the states more granular
			this._currentPlayerId = 0;
		}
	},
	
	isHistoryCurrent: function() {
		return this._historyIndex == (this._history.length - 1);
	},

	// this is for the AI's. SerializeState is for history
	getState: function() {
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

		return state;
	},

	// The interface passed to AIs so they can control the game.
	interface: {
		getState: function() { return Engine.getState(); },
		attack: function(fromCountryId, toCountryId, callback) { 	

			Engine.attack(Map._countryArray[fromCountryId], Map._countryArray[toCountryId], function(result) {	
				callback(result);    
			});

		},
		endTurn: function() { Engine.endTurn(); }
	}

};



