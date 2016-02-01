
	
	var AI = AI || {};
	AI.Aggressive = function () {
		this._playerId = -1;
	};

	AI.Aggressive.prototype.id = function() {
		return this._playerId;
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
		var hexIds = update.hexIds();

		for (var i=0; i < hexIds.length; i++) {
			if (update.ownerId(hexIds[i]) == self._playerId) {
				us = true;
				break;
			}
		}

		self._state.merge(update);

		if (us) {
			window.setTimeout(self.move.bind(self), 1000);
		}
	};
	

	
	AI.Aggressive.prototype.move = function() {
		var self = this;

		var playerId = self._playerId;
		var hexIds = self._state.playerHexIds(playerId);
		for (var i = 0; i < hexIds.length; i++) {
			var hex = self._state.getHex(hexIds[i]);

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


