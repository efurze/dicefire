"use strict"
$(function() {

	
	window.Game = {
		
		_mouseOverCountry: null,
	    _selectedCountry: null,
		_canvas: document.getElementById("c"),
		_controller: null,
		
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
			Engine.init(playerCode.map(function(pc){return pc;}));
			Renderer.init(playerCode.length, Game._canvas, playerCode.map(function(pc) {
				if (pc == "human") {
					return "human";
				} else {
					return pc.getName();
				}
			}));
			
			Engine.setup();
			Engine.registerRenderingCallback(Game.update);
			Game._controller = new Gamecontroller();

			Game.update();
			
			$(Game._canvas).mousemove(Game.mouseMove);
            $(Game._canvas).mouseleave(Game.mouseLeave);
            $(Game._canvas).click(Game.click);
			$('#end_turn').click(Game._controller.endTurn.bind(Game._controller));
			$('#back_btn').click(Game._controller.historyBack.bind(Game._controller));
			$('#forward_btn').click(Game._controller.historyForward.bind(Game._controller));
			
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

		update: function(gamestate) {
			gamestate = gamestate || Engine.getState();
			Renderer.render(gamestate);
			if (Game._controller) {
				Game._controller.update();
			}
		},
		
	};
});

