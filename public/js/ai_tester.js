$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		selectedCountry: function() { return Game._selectedCountry; },
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (playerCode) {
			Globals.suppress_ui = 0;
			
			Engine.init(playerCode);
			Renderer.init(playerCode.length, Game._canvas);			
			Engine.setup();
			
			Renderer.render(Player._array, Map._countryArray);
						
			$(Game._canvas).mousemove(Game.mouseMove);
            $(Game._canvas).mouseleave(Game.mouseLeave);
            $(Game._canvas).click(Game.click);
            $('#start_test').click(Game.startTest);
		},
		
		startTest: function () {
			Engine.startTurn(0);
		},
		
		mouseMove: function(event) {

            var hex = Map.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                if (!country) {
                    Game._canvas.style.cursor = 'default';
                }

                if (country != Game._mouseOverCountry) {
                    var currentPlayer = Game.currentPlayer();
                    var prevCountry = Game._mouseOverCountry;
                    Game._mouseOverCountry = country;                    
                    if (prevCountry) {
                        Renderer.renderCountry(prevCountry);
                    }
                    if (country) {
						if ((country.owner() == currentPlayer && country.numDice() > 1) || 
                           (Game._selectedCountry != null && currentPlayer.canAttack(Game._selectedCountry, country))) {
							Game._canvas.style.cursor = 'pointer';
                        	Renderer.renderCountry(Game._mouseOverCountry); 
                    	} else {
                        	Game._canvas.style.cursor = 'default';                        
						}
                    }
                }
            } else {
                if (Game._mouseOverCountry) {
                    var prevCountry = Engine._mouseOverCountry;
                    Engine._mouseOverCountry = null;                   
                    Renderer.renderCountry(prevCountry);
                }
                Game._canvas.style.cursor = 'default';
            }
        },

        mouseLeave: function(event) {
            if (Game._mouseOverCountry) {
                var country = Game._mouseOverCountry;
                Game._mouseOverCountry = null;
                Renderer.renderCountry(country);
            }
        },


		click: function(event) {
            var hex = Map.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                var currentPlayer = Game.currentPlayer(); 
                if (country) {
                    if (country.owner() == currentPlayer && country.numDice() > 1) {  
                        // Select and deselect of countries owned by this user.                  
                        if (Game._selectedCountry == country) {
                            Game._selectedCountry = null;
                            Renderer.renderCountry(country);
                        } else {
                            var oldCountry = Game._selectedCountry;
                            Game._selectedCountry = country;
                            if (oldCountry) {
                                Renderer.renderCountry(oldCountry);
                            }
                            Renderer.renderCountry(country);
                        }
                    } else {
                        // Attacks.
						Engine.attack(Game._selectedCountry, country, function(result) {
                            var prevCountry = Game._selectedCountry;
                            Game._selectedCountry = null;
                            Renderer.renderCountry(prevCountry);
                            Renderer.renderCountry(country);
                            $('#end_turn').prop('disabled', false);
                        });
                    }
                }
            }            
        },
		
		
	};
});