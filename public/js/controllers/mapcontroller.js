"use strict"

var Mapcontroller = function(update_cb, engine) {
	this._update_cb = update_cb;
	this._engine = engine;
	this._mouseOverCountry = null;
    this._selectedCountry = null;
	$(Game._canvas).mousemove(this.mouseMove.bind(this));
    $(Game._canvas).mouseleave(this.mouseLeave.bind(this));
    $(Game._canvas).click(this.click.bind(this));
}

$(function(){

		
		Mapcontroller.prototype.mouseOverCountry = function() { return Game._mouseOverCountry; };
		Mapcontroller.prototype.setMouseOverCountry = function(country) {
			Game._mouseOverCountry = country;
			Renderer.setMouseOverCountry(country ? country.id() : -1);
		};
		Mapcontroller.prototype.selectedCountry = function() { return Game._selectedCountry; };
		Mapcontroller.prototype.setSelectedCountry = function(country) {
			Game._selectedCountry = country;
			Renderer.setSelectedCountry(country ? country.id() : -1);
		};
		
		Mapcontroller.prototype.isCountryClickable = function(country) {
			if (!country || !this._engine.isHuman(this._engine.currentPlayerId())) {
				return false;
			}
			
			// can always de-select
			if (this.selectedCountry() && country.id() == this.selectedCountry().id()) {
				return true;
			}
			
			// user is choosing a country to attack from
			if (!this.selectedCountry() && country.ownerId() == this._engine.currentPlayerId() && country.numDice() > 1) {
				return true;
			}
			
			// user is choosing a country to attack
			if (this.selectedCountry() && country.ownerId() !== this._engine.currentPlayerId()) {
				return true;
			}
			
			return false;
		};
		
		Mapcontroller.prototype.mouseMove = function(event) {
			var currentPlayer = this._engine.currentPlayer();
            var hex = this._engine.map().fromMousePos(event.offsetX, event.offsetY);
			var country = hex ? this._engine.map().getCountry(hex.countryId()) : null;
            if (this.isCountryClickable(country)) {
				
				if (this.mouseOverCountry() !== country) {
					this.setMouseOverCountry(country);
					//Game._canvas.style.cursor = 'pointer';
					this._update_cb();
				}
				
            } else {
                if (this.mouseOverCountry()) {
                    this.setMouseOverCountry(null);
                }
                //Game._canvas.style.cursor = 'default';
				this._update_cb();
            }
        };

        Mapcontroller.prototype.mouseLeave = function(event) {
            if (this.mouseOverCountry()) {
                var country = this.mouseOverCountry();
                this.setMouseOverCountry(null);
                this._update_cb();
            }
        };


		Mapcontroller.prototype.click = function(event) {
			var self = this;
			var currentPlayer = self._engine.currentPlayer(); 
			if (!self._engine.isHuman(currentPlayer._id)) {
				if (self.selectedCountry()) {
					var prevCountry = self.selectedCountry();
					self.setSelectedCountry(null);
					self._update_cb();
				}
				return;
			}
            var hex = self._engine.map().fromMousePos(event.offsetX, event.offsetY);
            if (hex) {
                var country = self._engine.map().getCountry(hex.countryId());
                
                if (country) {
                    if (country.ownerId() == currentPlayer.id() && country.numDice() > 1) {  
                        // Select and deselect of countries owned by this user.                  
                        if (self.selectedCountry() == country) {
                            self.setSelectedCountry(null);
                            self._update_cb();
                        } else {
                            var oldCountry = self.selectedCountry();
                            self.setSelectedCountry(country);
                            self._update_cb();
                        }
                    } else {
                        // Attacks.
						self._engine.attack(self.selectedCountry(), country, function(result) {
                            var prevCountry = self.selectedCountry();
                            self.setSelectedCountry(null);
                            $('#end_turn').prop('disabled', false);
							self._update_cb();
                        });
                    }
                }
            }            
        };


});

