
	
	var AI = AI || {};
	AI.Aggressive = function () {
	};

	AI.Aggressive.prototype.init = function(id, interface, state) {
		this._playerId = id;
		this._iface = interface;
		this._state = state;
		this.move();
	};

	AI.Aggressive.prototype.update = function(update) {
		var self = this;
		var us = false;
		var hexes = update.hexes();

		for (var i=0; i < hexes.length; i++) {
			if (hexes[i].ownerId() == self._playerId) {
				us = true;
				break;
			}
		}

		self._state.merge(update);

		if (us) {
			self.move();
		}
	};
	

	
	AI.Aggressive.prototype.move = function() {
		var self = this;

		var playerId = self._playerId;
		var hexes = self._state.playerHexes(playerId);
		for (var i = 0; i < hexes.length; i++) {
			var hex = hexes[i];

			var possibleAttacks = [];
			hex.adjacent().forEach(function(adjacentCountryId) {
				if (self._state.ownerId(adjacentCountryId) != playerId 
					&& hex.diceCount() > 1
					&& hex.diceCount() >= self._state.diceCount(adjacentCountryId)) {
					possibleAttacks.push(adjacentCountryId);
				}
			});


			if (possibleAttacks.length > 0) {
				var attackCountryId = possibleAttacks[Math.floor(Math.random() * possibleAttacks.length)];
				self._iface.attack(hex.id(), attackCountryId);
				return;
			}
		
		}

	};


