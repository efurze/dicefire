Engine = {
		
	_playerCode: null,
	_currentPlayerId: 0,
	_gameOver: false,
	_attackInProgress: false,
	_previousAttack: {},
        
	currentPlayer: function() { return Player.get(Engine._currentPlayerId); },

	init: function(playerCode) {
		console.time("DICEFIRE");

		Engine._playerCode = playerCode;
		var isHumanList = Engine._playerCode.map(function(elem) { return elem == "human"; });
		Engine._playerCode.forEach(function(elem, index) {
			if (elem != "human") {
				elem.init(index, isHumanList);
			}
		});

		// Clear the Hex and Country statics.
		Player.init(playerCode.length);
		Country.init();

		var country = Map.generateMap();

		// Use a shuffled countries list to randomize who gets what.
		var shuffledCountries = Globals.shuffleArray(Country.array());
		var currPlayer = 0;
		shuffledCountries.forEach(function(country) {
			Player.get(currPlayer).takeCountry(country);
			country.setupEdges();
			currPlayer++;
			if (currPlayer >= Player.count()) {
				currPlayer = 0;
			}
		});

		Player.array().forEach(function(player) {
			player.addDice(Globals.startingDice);
			player.updateStatus();
			Renderer.renderPlayer(player);
		});

	},

	isHuman: function(playerId) {
		return Engine._playerCode[playerId] == "human";
	},

	startTurn: function(playerId) {
		Engine._currentPlayerId = playerId;
		Player.get(playerId).startTurn();

		if (Engine._playerCode[playerId] != "human") {
			Engine._playerCode[playerId].startTurn(Engine.interface);
		} 

		Renderer.renderPlayers();
		Renderer.renderControls();
	},

	endTurn: function(event) {
		Player.get(Engine._currentPlayerId).endTurn();
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
		//Globals.debug("Attack FROM", fromCountry._id, "TO", toCountry._id);
		var self = this;

		self._attackInProgress = true;

		var fromPlayer = fromCountry.owner();
		var toPlayer = toCountry.owner();

		if (!fromCountry.adjacentCountries().find(function(elem) { return elem == toCountry; })) {
			Globals.debug("Illegal attack", fromCountry, toCountry);
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

			fromCountry.setIsAttacking(false);
			toCountry.setIsAttacking(false);

			// Note that ties go to the toCountry. And, no matter what happens, the fromCountry
			// goes down to 1 die.
			fromCountry.setNumDice(1);

			if (fromRoll > toRoll) {
				//Globals.debug("Attacker wins");
				var oldOwner = toCountry.owner();
				toCountry.setNumDice(fromNumDice - 1);
				fromPlayer.takeCountry(toCountry);
				oldOwner.updateStatus();

				if (fromCountry.owner()._countries.length == Country.array().length) {
					Engine.gameOver();
				}
			} else {
				//Globals.debug("Attacker loses");
			}

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


	serializeState: function() {
		var state = {
			players: {},
			countries: {},
			currentPlayerId: Engine._currentPlayerId,
			previousAttack: {
				fromCountryId: -1,
				toCountryId: -1,
				fromRollArray: [],
				toRollArray: []
			}
		};

		Player.array().forEach(function(player) {
			state.players[player.id()] = {
				id: player.id(),
				hasLost: player.hasLost(),
				storedDice: player.storedDice(),
				numContiguousCountries: player.numContiguousCountries()
			};
		});

		Country.array().forEach(function(country) {
			state.countries[country.id()] = {
				id: country.id(),
				owner: country.owner().id(),
				numDice: country.numDice(),
				adjacentCountries: country.adjacentCountries().map(function(adjacentCountry) {
					return adjacentCountry.id();
				})
			};
		});

		state.previousAttack = Engine._previousAttack;

		return state;
	},

	// The interface passed to AIs so they can control the game.
	interface: {
		getState: function() { return Engine.serializeState(); },
		attack: function(fromCountryId, toCountryId, callback) { 	

			Engine.attack(Country.get(fromCountryId), Country.get(toCountryId), function(result) {	
				callback(result);    
			});

		},
		endTurn: function() { Engine.endTurn(); }
	}

};



