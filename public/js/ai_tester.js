$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		selectedCountry: function() { return Game._selectedCountry; },
		
		init: function (playerCode) {
			Engine.init(playerCode);
			Renderer.setupRollDivs();
			Renderer.render(Engine.serializeState());
			
			$(Globals.canvas).mousemove(Game.mouseMove);
            $(Globals.canvas).mouseleave(Game.mouseLeave);
            $(Globals.canvas).click(Engine.click);
            $('#start_test').click(Engine.startTest);
		},
		
		
		mouseMove: function(event) {

            var hex = Hex.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                if (!country) {
                    Globals.canvas.style.cursor = 'default';
                }

                if (country != Game._mouseOverCountry) {
                    var currentPlayer = Player.get(Engine._currentPlayerId);
                    var prevCountry = Game._mouseOverCountry;
                    Game._mouseOverCountry = country;                    
                    if (prevCountry) {
                        Renderer.paintCountry(prevCountry);
                    }
                    if (country) {
						Globals.debug("country owner: " + country.owner() + "  currentPlayer: " + currentPlayer);
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
		
		
		startTest: function () {
			
		}
		
	};
});