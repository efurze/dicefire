$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_historyIndex: -1,
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		selectedCountry: function() { return Game._selectedCountry; },
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (playerCode) {
			Engine.init(playerCode);
			Renderer.init(playerCode.length, Game._canvas);
			
			Engine.setup();
			
			Renderer.render(Player._array, Map._countryArray);
			
			$(Game._canvas).mousemove(Game.mouseMove);
            $(Game._canvas).mouseleave(Game.mouseLeave);
            $(Game._canvas).click(Game.click);
			$('#end_turn').click(Engine.endTurn);
			$('#back_btn').click(Game.historyBack);
			$('#forward_btn').click(Game.historyForward);
			
			Engine.startTurn(0);
		},
		
		
		mouseMove: function(event) {
			var currentPlayer = Game.currentPlayer();
            var hex = Map.fromMousePos(event.offsetX, event.offsetY);
            if (hex && Engine.isHuman(currentPlayer._id)) {
                var country = hex.country();
                if (!country) {
                    Game._canvas.style.cursor = 'default';
                }

                if (country != Game._mouseOverCountry) {
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
			var currentPlayer = Game.currentPlayer(); 
			if (!Engine.isHuman(currentPlayer._id)) {
				if (Game._selectedCountry) {
					var prevCountry = Game._selectedCountry;
					Game._selectedCountry = null;
					Renderer.renderCountry(prevCountry);
				}
				return;
			}
            var hex = Map.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                
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
                            $('#end_turn').prop('disabled', false);
                        });
                    }
                }
            }            
        },

		historyBack: function (event) {
			if (Game._historyIndex < 0) {
				Game._historyIndex = Engine._history.length - 1;
			}
			
			if (Game._historyIndex > 0) {
				Game._historyIndex --;
				var gameState = Engine.deserialize(Engine._history[Game._historyIndex]);
				Renderer.render(gameState.players, gameState.countries);
			}
		},
		
		historyForward: function (event) {
			
		}
		
	};
});