Engine = (function() {
	
    _playerCode: null;
    _currentPlayerId: 0;
    _gameOver: false;

	return {
		
        
        
        currentPlayer: function() { return Player.get(Engine._currentPlayerId); },

        init: function(playerCode) {
            console.time("DICEFIRE");

            Globals.context.clearRect(0,0,2000,2000);
            Globals.context.lineJoin = "straight";

            Engine._playerCode = playerCode;
            var isHumanList = Engine._playerCode.map(function(elem) { return elem == "human"; });
            Engine._playerCode.forEach(function(elem, index) {
                if (elem != "human") {
                    elem.init(index, isHumanList);
                }
            });

            //Engine.setupRollDivs();

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
                player.updateDisplay();
            });

            Country.array().forEach(function(country) {
                //country.paint();
            });

            Engine.startTurn(0);

        },


        click: function(event) {
            var hex = Hex.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                var currentPlayer = Player.get(Engine._currentPlayerId);                    
                if (country) {
                    if (country.owner() == currentPlayer && country.numDice() > 1) {  
                        // Select and deselect of countries owned by this user.                  
                        if (Engine._selectedCountry == country) {
                            Engine._selectedCountry = null;
                            country.click();
                        } else {
                            var oldCountry = Engine._selectedCountry;
                            Engine._selectedCountry = country;
                            if (oldCountry) {
                                oldCountry.click();
                            }
                            country.click();
                        }
                    } else {
                        // Attacks.
                        if (Engine._selectedCountry != null && currentPlayer.canAttack(Engine._selectedCountry, country)) {
                            // Disable the button during attacks.
                            $('#end_turn').prop('disabled', true);
                            currentPlayer.attack(Engine._selectedCountry, country, function(result) {
                                var prevCountry = Engine._selectedCountry;
                                Engine._selectedCountry = null;
                                //prevCountry.paint();
                                //country.paint();
                                $('#end_turn').prop('disabled', false);;
                            });
                        }
                    }
                }
            }            
        },

        startTurn: function(playerId) {
            Engine._currentPlayerId = playerId;
            Player.get(playerId).startTurn();

            if (Engine._playerCode[playerId] != "human") {
                $('#end_turn').prop('disabled', true);
                Engine._playerCode[playerId].startTurn(Engine.interface);
            } else {
                $('#end_turn').prop('disabled', false);
            }
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
                Player.get(Engine._currentPlayerId).attack(Country.get(fromCountryId), Country.get(toCountryId), 
                    function(result) {
                        callback(result);    
                    });
            },
            endTurn: function() { Engine.endTurn(); }
        }

    }
})();



