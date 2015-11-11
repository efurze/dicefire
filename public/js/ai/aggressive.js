
	/*
		Here is what the interface contains:

		getState() 
			Returns the game state:
				{
					players


					countries


					currentPlayerId
						The id of the player who is playing right now.

				}
       	
       	attack(fromCountryId, toCountryId) 
			Called by the AI when it wants to attack a country.
			Returns a result

        endTurn()
			Called by the AI when its turn is over
	*/

	window.AI = window.AI || {};
	window.AI.Aggressive = function (id) {
		
	};
	
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	window.AI.Aggressive.create = function(playerId, isHumanList) {
		return new window.AI.Aggressive(playerId);
	};

	// Called each time the AI has a turn.
	window.AI.Aggressive.prototype.startTurn = function(interface, depth) {
		depth = depth || 0;
		var self = this;
		var state = interface.getState();

		var playerId = state.currentPlayerId;
		var countryIds = Object.keys(state.countries);
		for (var i = 0; i < countryIds.length; i++) {
			var countryId = countryIds[i];
			var country = state.countries[countryId];
			if (country.owner == playerId) {
				var possibleAttacks = [];
				country.adjacentCountries.forEach(function(adjacentCountryId) {
					var adjacentCountry = state.countries[adjacentCountryId];
					if (adjacentCountry.owner != playerId && country.numDice > 1 && 
						country.numDice >= adjacentCountry.numDice) {
						possibleAttacks.push(adjacentCountry.id);
					}
				});

				if (possibleAttacks.length > 0) {
					var attackCountryId = possibleAttacks[Math.floor(Math.random() * possibleAttacks.length)];
//					console.log("(aggressive) Attack", playerId, countryId, state.countries[countryId].numDice,
//						attackCountryId, state.countries[attackCountryId].numDice, depth);
					interface.attack(countryId, attackCountryId, function(result) {
						self.startTurn(interface, depth + 1);	// Continue attacking.							
					});
					return;
				}
			}
		}

		interface.endTurn();
	};
	

