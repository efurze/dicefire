$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		selectedCountry: function() { return Game._selectedCountry; },
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (playerCode) {
			Engine.init(playerCode);
			Renderer.init(playerCode.length);
			Renderer.render(Engine.serializeState());
			
			$(Globals.canvas).mousemove(Game.mouseMove);
            $(Globals.canvas).mouseleave(Game.mouseLeave);
            $(Globals.canvas).click(Game.click);
            $('#start_test').click(Game.startTest);
			$('#end_turn').click(Engine.endTurn);
		},
		
		startTurn: function(playerId) {
         
            if (Engine._playerCode[playerId] != "human") {
                $('#end_turn').prop('disabled', true);
            } else {
                $('#end_turn').prop('disabled', false);
            }

			Engine.startTurn(playerId);
        },
		
		mouseMove: function(event) {

            var hex = Hex.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                if (!country) {
                    Globals.canvas.style.cursor = 'default';
                }

                if (country != Game._mouseOverCountry) {
                    var currentPlayer = Game.currentPlayer();
                    var prevCountry = Game._mouseOverCountry;
                    Game._mouseOverCountry = country;                    
                    if (prevCountry) {
                        Renderer.paintCountry(prevCountry);
                    }
                    if (country) {
						if ((country.owner() == currentPlayer && country.numDice() > 1) || 
                           (Game._selectedCountry != null && currentPlayer.canAttack(Game._selectedCountry, country))) {
							Globals.canvas.style.cursor = 'pointer';
                        	Renderer.paintCountry(Game._mouseOverCountry); 
                    	} else {
                        	Globals.canvas.style.cursor = 'default';                        
						}
                    }
                }
            } else {
                if (Game._mouseOverCountry) {
                    var prevCountry = Engine._mouseOverCountry;
                    Engine._mouseOverCountry = null;                   
                    Renderer.paintCountry(prevCountry);
                }
                Globals.canvas.style.cursor = 'default';
            }
        },

        mouseLeave: function(event) {
            if (Game._mouseOverCountry) {
                var country = Game._mouseOverCountry;
                Game._mouseOverCountry = null;
                Renderer.paintCountry(country);
            }
        },


		click: function(event) {
            var hex = Hex.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                var currentPlayer = Game.currentPlayer(); 
                if (country) {
                    if (country.owner() == currentPlayer && country.numDice() > 1) {  
                        // Select and deselect of countries owned by this user.                  
                        if (Game._selectedCountry == country) {
                            Game._selectedCountry = null;
                            Renderer.paintCountry(country);
                        } else {
                            var oldCountry = Game._selectedCountry;
                            Game._selectedCountry = country;
                            if (oldCountry) {
                                Renderer.paintCountry(oldCountry);
                            }
                            Renderer.paintCountry(country);
                        }
                    } else {
                        // Attacks.
						Engine.attack(Game._selectedCountry, country, function(result) {
                            var prevCountry = Game._selectedCountry;
                            Game._selectedCountry = null;
                            Renderer.paintCountry(prevCountry);
                            Renderer.paintCountry(country);
                            $('#end_turn').prop('disabled', false);
                        });
				/*
                        if (Game._selectedCountry != null && currentPlayer.canAttack(Game._selectedCountry, country)) {
                            // Disable the button during attacks.
                            $('#end_turn').prop('disabled', true);
                            currentPlayer.attack(Game._selectedCountry, country, function(result) {
                                var prevCountry = Game._selectedCountry;
                                Game._selectedCountry = null;
                                Renderer.paintCountry(prevCountry);
                                Renderer.paintCountry(country);
                                $('#end_turn').prop('disabled', false);
                            });
                        }
				*/
                    }
                }
            }            
        },
		
		
		startTest: function () {
			
		}
		
	};
});