$(function() {

    window.Game = {
        _mouseOverCountry: null,
        _selectedCountry: null,

        mouseOvercountry: function() { return Game._mouseOverCountry; },
        selectedCountry: function() { return Game._selectedCountry; },

        init: function() {
            Globals.context.clearRect(0,0,2000,2000);
            Globals.context.lineJoin = "straight";
            

            // Clear the Hex and Country statics.
            Player.init(8);
            Hex.init(); 
            Country.init();
            var country = new Country(Hex.get(Math.floor(Math.random() * Hex.count())), Player.randomPlayer());

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
                var newCountry = new Country(adjacentHex, Player.randomPlayer());
                if (newCountry.isLake()) {
                    i--;
                }
            }

            Hex.absorbSingles();
            Country.pruneLakes();

            Country.array().forEach(function(country) {
                country.setupEdges();
                country.paint();
            });

            $(Globals.canvas).mousemove(Game.mouseMove);
            $(Globals.canvas).mouseleave(Game.mouseLeave);
            $(Globals.canvas).click(Game.click);

        },


        mouseMove: function(event) {

            var hex = Hex.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                if (country) {
                    Globals.canvas.style.cursor = 'pointer';
                } else {
                    Globals.canvas.style.cursor = 'default';
                }

                if (country != Game._mouseOverCountry) {
                    if (Game._mouseOverCountry) {
                        Game._mouseOverCountry.mouseLeave();
                    }
                    Game._mouseOverCountry = country;
                    if (country) {
                        Game._mouseOverCountry.mouseEnter();                        
                    }
                }
            } else {
                if (Game._mouseOverCountry) {
                    Game._mouseOverCountry.mouseLeave();
                    Game._mouseOverCountry = null;
                }
                Globals.canvas.style.cursor = 'default';
            }
            //    document.getElementById("info").textContent = hex.num();
//                document.getElementById("info").textContent = hex;
        },

        mouseLeave: function(event) {
            if (Game._mouseOverCountry) {
                Game._mouseOverCountry.mouseLeave();
                Game._mouseOverCountry = null;
            }
        },

        click: function(event) {
            var hex = Hex.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                if (country) {                    
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
                }
            }            
        }

    }
});



