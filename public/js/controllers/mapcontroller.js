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
	Globals.ASSERT(Globals.implements(this, Renderer.iface));

	this._playerId = playerId;
	this._canvas = canvas;
	this._map = map;
	this._iface = mapControllerInterface;
	this._mouseOverCountry = null;
  this._selectedCountry = null;
  $('#canvas_div').click(this.click.bind(this));
}

Mapcontroller.mapControllerInterface = {
	currentPlayerId: function(){},
	update: function(){},
	attack: function(fromId, toId, callback){},
	clickable: function(){}
}

$(function(){

		
	Mapcontroller.prototype.getMouseOverCountry = function() { return this._mouseOverCountry; };
	Mapcontroller.prototype.setMouseOverCountry = function(country) {
		console.log("SetMouseOverCountry", country);
		this._mouseOverCountry = country;
		Renderer.setMouseOverCountry(country ? country.id() : -1);
	};
	Mapcontroller.prototype.selectedCountry = function() { 
		return this._selectedCountry; 
	};
	Mapcontroller.prototype.setSelectedCountry = function(country) {
		console.log("selectCountry", country);
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
		} else {
			//console.log("NOT currently selected country");
		}
		
		// user is choosing a country to attack from
		if (!this.selectedCountry() && country.ownerId() == this._iface.currentPlayerId() && country.numDice() > 1) {
			return true;
		} else {
			if (country.ownerId() != this._iface.currentPlayerId()) {
				console.log("NOT this players' country");
			}
			if (country.numDice() <= 1) {
				console.log("NOT enough dice to attack");
			}
		}
		
		// user is choosing a country to attack
		if (this.selectedCountry() && country.ownerId() !== this._iface.currentPlayerId()) {
			return true;
		} else {
			if (country.ownerId() == this._iface.currentPlayerId()) {
				console.log("IS this players' country");
			}
		}
		
		console.log(country.id(), "NOT clickable");
		return false;
	};
	
	// callback from renderer
	Mapcontroller.prototype.mouseOverCountry = function(id) {
		if (!this._iface.clickable()) {
			return;
		}

		var country = this._map.getCountry(id);
		if (country && this.isCountryClickable(country)) {
		
			if (this.getMouseOverCountry() !== country) {
				this.setMouseOverCountry(country);
				this._canvas.style.cursor = 'pointer';
				this._iface.update();
			}
		} else {
      		if (this.getMouseOverCountry()) {
          		this.setMouseOverCountry(null);
      		}
			this._canvas.style.cursor = 'default';
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
			// current player isn't human
			console.log("current player isn't human");
			if (self.selectedCountry()) {
				var prevCountry = self.selectedCountry();
				self.setSelectedCountry(null);
				self._iface.update();
			}
			return;
		}

			
		var country = self.getMouseOverCountry();

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
				console.log("attack");
				var sel = self.selectedCountry();
				self.setSelectedCountry(null);
				self._iface.attack(sel, country, function() {
				self.setSelectedCountry(null);
				$('#end_turn').prop('disabled', false);
				self._iface.update();
				});
			}
		} else {
			console.log(country ? country.id() : 'null', "Country not clickable");
		}
		           
	};

});

