"use strict"


/*
	@engineInterface = {
			currentPlayerId(),
			attack(fromId, toId, callback(result_bool)),
			isThisPlayer(playerId),
			clickable(),
	}
*/
var Mapcontroller = function(playerId, canvas, map, mapControllerInterface) {
	Globals.ASSERT(Globals.implements(mapControllerInterface, Mapcontroller.mapControllerInterface));

	this._playerId = playerId;
	this._canvas = canvas;
	this._map = map;
	this._iface = mapControllerInterface;
	this._mouseOverCountry = null;
    this._selectedCountry = null;
	$(canvas).mousemove(this.mouseMove.bind(this));
    $(canvas).mouseleave(this.mouseLeave.bind(this));
    $(canvas).click(this.click.bind(this));
}

Mapcontroller.mapControllerInterface = {
	currentPlayerId: function(){},
	update: function(){},
	attack: function(fromId, toId, callback){},
	clickable: function(){}
}

$(function(){

		
		Mapcontroller.prototype.mouseOverCountry = function() { return this._mouseOverCountry; };
		Mapcontroller.prototype.setMouseOverCountry = function(country) {
			this._mouseOverCountry = country;
			Renderer.setMouseOverCountry(country ? country.id() : -1);
		};
		Mapcontroller.prototype.selectedCountry = function() { return this._selectedCountry; };
		Mapcontroller.prototype.setSelectedCountry = function(country) {
			this._selectedCountry = country;
			Renderer.setSelectedCountry(country ? country.id() : -1);
		};
		
		Mapcontroller.prototype.isCountryClickable = function(country) {
			if (!country || this._playerId != this._iface.currentPlayerId()) {
				return false;
			}
			
			// can always de-select
			if (this.selectedCountry() && country.id() == this.selectedCountry().id()) {
				return true;
			}
			
			// user is choosing a country to attack from
			if (!this.selectedCountry() && country.ownerId() == this._iface.currentPlayerId() && country.numDice() > 1) {
				return true;
			}
			
			// user is choosing a country to attack
			if (this.selectedCountry() && country.ownerId() !== this._iface.currentPlayerId()) {
				return true;
			}
			
			return false;
		};
		
		Mapcontroller.prototype.mouseMove = function(event) {
			if (!this._iface.clickable()) {
				return;
			}
			
            var hex = this._map.fromMousePos(event.offsetX, event.offsetY);
			var country = hex ? this._map.getCountry(hex.countryId()) : null;
            if (this.isCountryClickable(country)) {
				
				if (this.mouseOverCountry() !== country) {
					this.setMouseOverCountry(country);
					this._canvas.style.cursor = 'pointer';
					this._iface.update();
				}
				
            } else {
                if (this.mouseOverCountry()) {
                    this.setMouseOverCountry(null);
                }
                this._canvas.style.cursor = 'default';
				this._iface.update();
            }
        };

        Mapcontroller.prototype.mouseLeave = function(event) {
			if (!this._iface.clickable()) {
				return;
			}
            if (this.mouseOverCountry()) {
                var country = this.mouseOverCountry();
                this.setMouseOverCountry(null);
                this._iface.update();
            }
        };


		Mapcontroller.prototype.click = function(event) {
			if (!this._iface.clickable()) {
				return;
			}
			
			var self = this;
			var currentPlayerId = self._iface.currentPlayerId(); 
			if ( self._playerId != currentPlayerId) {
				if (self.selectedCountry()) {
					var prevCountry = self.selectedCountry();
					self.setSelectedCountry(null);
					self._iface.update();
				}
				return;
			}
            var hex = self._map.fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = self._map.getCountry(hex.countryId());
                
                if (country && self.isCountryClickable(country)) {
                    if (country.ownerId() == currentPlayerId && country.numDice() > 1) {  
                        // Select and deselect of countries owned by this user.                  
                        if (self.selectedCountry() == country) {
                            self.setSelectedCountry(null);
                            self._iface.update();
                        } else {
                            var oldCountry = self.selectedCountry();
                            self.setSelectedCountry(country);
                            self._iface.update();
                        }
                    } else {
                        // Attacks.
                        var sel = self.selectedCountry();
                        self.setSelectedCountry(null);
						self._iface.attack(sel, country, function() {
                            self.setSelectedCountry(null);
                            $('#end_turn').prop('disabled', false);
							self._iface.update();
                        });
                    }
                }
            }            
        };


});

