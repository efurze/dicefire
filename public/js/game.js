"use strict"
$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		
		mouseOverCountry: function() { return Game._mouseOverCountry; },
		setMouseOverCountry: function(country) {
			Game._mouseOverCountry = country;
			Renderer.setMouseOverCountry(country ? country.id() : -1);
		},
		selectedCountry: function() { return Game._selectedCountry; },
		setSelectedCountry: function(country) {
			Game._selectedCountry = country;
			Renderer.setSelectedCountry(country ? country.id() : -1);
		},
		currentPlayer: function() { return Engine.currentPlayer(); },
		
		init: function (playerCode) {
			Engine.init(playerCode);
			Renderer.init(playerCode.length, Game._canvas);
			
			Engine.setup();
			
			Renderer.render(Engine.getState());
			
			$(Game._canvas).mousemove(Game.mouseMove);
            $(Game._canvas).mouseleave(Game.mouseLeave);
            $(Game._canvas).click(Game.click);
			$('#end_turn').click(Engine.endTurn);
			$('#back_btn').click(Game.historyBack);
			$('#forward_btn').click(Game.historyForward);
			
			Engine.startTurn(0);
		},
		
		isCountryClickable: function(country) {
			if (!country || !Engine.isHuman(Engine.currentPlayerId())) {
				return false;
			}
			
			// can always de-select
			if (Game.selectedCountry() && country.id() == Game.selectedCountry().id()) {
				return true;
			}
			
			// user is choosing a country to attack from
			if (!Game.selectedCountry() && country.ownerId() == Engine.currentPlayerId() && country.numDice() > 1) {
				return true;
			}
			
			// user is choosing a country to attack
			if (Game.selectedCountry() && country.ownerId() !== Engine.currentPlayerId()) {
				return true;
			}
			
			return false;
		},
		
		mouseMove: function(event) {
			var currentPlayer = Game.currentPlayer();
            var hex = Map.fromMousePos(event.offsetX, event.offsetY);
			var country = hex ? hex.country() : null;
            if (Game.isCountryClickable(country)) {
				
				if (Game.mouseOverCountry() !== country) {
					Game.setMouseOverCountry(country);
					Game._canvas.style.cursor = 'pointer';
					Renderer.render(Engine.getState());
				}
				
            } else {
                if (Game.mouseOverCountry()) {
                    Game.setMouseOverCountry(null);
                    Renderer.render(Engine.getState());
                }
                Game._canvas.style.cursor = 'default';
            }
        },

        mouseLeave: function(event) {
            if (Game.mouseOverCountry()) {
                var country = Game.mouseOverCountry();
                Game.setMouseOverCountry(null);
                Renderer.render(Engine.getState());
            }
        },


		click: function(event) {
			var currentPlayer = Game.currentPlayer(); 
			if (!Engine.isHuman(currentPlayer._id)) {
				if (Game.selectedCountry()) {
					var prevCountry = Game.selectedCountry();
					Game.setSelectedCountry(null);
					Renderer.render(Engine.getState());
				}
				return;
			}
            var hex = Map.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = hex.country();
                
                if (country) {
                    if (Player.get(country.ownerId()) == currentPlayer && country.numDice() > 1) {  
                        // Select and deselect of countries owned by this user.                  
                        if (Game.selectedCountry() == country) {
                            Game.setSelectedCountry(null);
                            Renderer.render(Engine.getState());
                        } else {
                            var oldCountry = Game.selectedCountry();
                            Game.setSelectedCountry(country);
                            if (oldCountry) {
                                Renderer.render(Engine.getState());
                            }
                            Renderer.render(Engine.getState());
                        }
                    } else {
                        // Attacks.
						Engine.attack(Game.selectedCountry(), country, function(result) {
                            var prevCountry = Game.selectedCountry();
                            Game.setSelectedCountry(null);
                            $('#end_turn').prop('disabled', false);
                        });
                    }
                }
            }            
        },

		historyBack: function (event) {
			if (Engine._historyIndex < 0) {
				Engine._historyIndex = Engine._history.length - 1;
			}
			
			if (Engine._historyIndex > 0) {
				Engine.setHistoryIndex(Engine._historyIndex - 1);
				Renderer.render(Engine.getState());
				
				if (!Engine.isHistoryCurrent()) {
					Renderer.renderHistoricalAttack(Map.getCountry(Engine._previousAttack.fromCountryId),
						Map.getCountry(Engine._previousAttack.toCountryId),
						Engine._previousAttack.fromRollArray,
						Engine._previousAttack.toRollArray,
						Engine.getState());
						Renderer.renderControls();
				}
			}
		},
		
		historyForward: function (event) {
			if (Engine._historyIndex < Engine._history.length - 1) {
				
				Engine.setHistoryIndex(Engine._historyIndex + 1);
				Renderer.render(Engine.getState());
				
				if (!Engine.isHistoryCurrent()) {	
					Renderer.renderHistoricalAttack(Map.getCountry(Engine._previousAttack.fromCountryId),
						Map.getCountry(Engine._previousAttack.toCountryId),
						Engine._previousAttack.fromRollArray,
						Engine._previousAttack.toRollArray,
						Engine.getState());				
						Renderer.renderControls();
				}
			}
		}
		
	};
});

