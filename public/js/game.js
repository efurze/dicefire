$(function() {

    window.Game = {
        _mouseOverCountry: null,
        _selectedCountry: null,
        _currentPlayerNum: 0,

        mouseOverCountry: function() { return Game._mouseOverCountry; },
        selectedCountry: function() { return Game._selectedCountry; },
        currentPlayer: function() { return Game._currentPlayer; },

        init: function() {
            Globals.context.clearRect(0,0,2000,2000);
            Globals.context.lineJoin = "straight";
            

            // Clear the Hex and Country statics.
            Player.init(Globals.numPlayers);
            Hex.init(); 
            Country.init();
            var country = new Country(Hex.get(Math.floor(Math.random() * Hex.count())));

            for (var i = 0; i < 29; i++) {
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

            Hex.absorbSingles();
            Country.pruneLakes();


            Country.shuffleArray();

            var currPlayer = 0;
            Country.array().forEach(function(country) {
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
                country.paint();
            });


            $(Globals.canvas).mousemove(Game.mouseMove);
            $(Globals.canvas).mouseleave(Game.mouseLeave);
            $(Globals.canvas).click(Game.click);
            $('#end_turn').click(Game.endTurn);

            Game.startTurn(0);

        },


        mouseMove: function(event) {

            var hex = Hex.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                if (!country) {
                    Globals.canvas.style.cursor = 'default';
                }

                if (country != Game._mouseOverCountry) {
                    var currentPlayer = Player.get(Game._currentPlayerNum);
                    var prevCountry = Game._mouseOverCountry;
                    Game._mouseOverCountry = country;                    
                    if (prevCountry) {
                        prevCountry.mouseLeave();
                    }
                    if (country && (
                            (country.owner() == currentPlayer && country.numDice() > 1) || 
                            (Game._selectedCountry != null && currentPlayer.canAttack(Game._selectedCountry, country))
                        )) {
                        Game._mouseOverCountry.mouseEnter();                        
                    } else {
                        Globals.canvas.style.cursor = 'default';                        
                    }
                }
            } else {
                if (Game._mouseOverCountry) {
                    var prevCountry = Game._mouseOverCountry;
                    Game._mouseOverCountry = null;                   
                    prevCountry.mouseLeave();
                }
                Globals.canvas.style.cursor = 'default';
            }
             // document.getElementById("info").textContent = hex.num();
             // document.getElementById("info").textContent = hex;
        },

        mouseLeave: function(event) {
            if (Game._mouseOverCountry) {
                var country = Game._mouseOverCountry;
                Game._mouseOverCountry = null;
                country.mouseLeave();
            }
        },

        click: function(event) {
            var hex = Hex.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                var currentPlayer = Player.get(Game._currentPlayerNum);                    
                if (country) {
                    if (country.owner() == currentPlayer && country.numDice() > 1) {  
                        // Select and deselect of countries owned by this user.                  
                        if (Game._selectedCountry == country) {
                            Game._selectedCountry = null;
                            country.click();
                        } else {
                            var oldCountry = Game._selectedCountry;
                            Game._selectedCountry = country;
                            if (oldCountry) {
                                oldCountry.click();
                            }
                            country.click();
                        }
                    } else {
                        // Attacks.
                        if (Game._selectedCountry != null && currentPlayer.canAttack(Game._selectedCountry, country)) {

                            currentPlayer.attack(Game._selectedCountry, country);
                            var prevCountry = Game._selectedCountry;
                            Game._selectedCountry = null;
                            prevCountry.paint();
                            country.paint();
                        }
                    }
                }
            }            
        },

        startTurn: function(playerNum) {
            Game._currentPlayerNum = playerNum;
            Player.get(playerNum).startTurn();

        },

        endTurn: function(event) {
            Player.get(Game._currentPlayerNum).endTurn();
            Game._currentPlayerNum++;
            if (Game._currentPlayerNum >= Globals.numPlayers) {
                Game._currentPlayerNum = 0;
            }
            // If that player has lost, skip him.
            if (Player.get(Game._currentPlayerNum).hasLost()) {
                Game.endTurn();
            }
            Game.startTurn(Game._currentPlayerNum);
        }

    }
});



