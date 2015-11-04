Engine = (function() {
	
    _playerCode: null;
    _currentPlayerId: 0;
    _gameOver: false;

	return {
		
        
        
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
            Hex.init(); 
            Country.init();
            var country = new Country(Hex.get(Math.floor(Math.random() * Hex.count())));

            for (var i = 0; i < Globals.numCountries - 1; i++) {
                var countryStart = Math.floor(Math.random() * Country.count());
                var adjacentHex;

                for (var j = 0; j < Country.count(); j++) {
                    var country = Country.get((j + countryStart) % Country.count());
                    if (country.isLake()) {
                        continue;
                    }
                    adjacentHex = country.findAdjacentHex(true);
                    if (adjacentHex) {
                        break;
                    }
                }
                if (!adjacentHex) {
                    Globals.debug("RAN OUT OF SPACE!", i);
                    break;
                }
                var newCountry = new Country(adjacentHex);
                if (newCountry.isLake()) {
                    i--;
                }
            }

            Globals.debug("Created countries", Country.array());

            Hex.absorbSingles();
            Country.pruneLakes();


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

            Game.startTurn(0);

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

            Game.startTurn(Engine._currentPlayerId);
        },

		attack: function(fromCountry, toCountry, callback) {
			var self = this;
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
			
			Renderer.renderAttack(fromCountry, toCountry, fromRollArray, toRollArray, function done() {
				
				fromCountry.setIsAttacking(false);
	            toCountry.setIsAttacking(false);

	            if (fromCountry.owner()._countries.length == Country.array().length) {
	                Engine.gameOver();
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
                currentPlayerId: Engine._currentPlayerId
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

    }
})();



