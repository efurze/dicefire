// THIS IS THE SAME AS AGGRESSIVE BUT DOESNT ATTACK ON TIES

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

	var AI = AI || {};
	AI.Passive = function(id) {
		
	};
	
	AI.Passive.getName = function() {
		return "Passive";
	};
	
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	AI.Passive.create = function(playerId, isHumanList) {
		return new AI.Passive(playerId);
	};

	// Called each time the AI has a turn.
	AI.Passive.prototype.startTurn = function(interface) {
		var self = this;
		var state = interface.getState();

		var playerId = state.currentPlayerId();
		var countryIds = state.countryIds();
		for (var i = 0; i < countryIds.length; i++) {
			var countryId = countryIds[i];
			if (state.countryOwner(countryId) == playerId) {
				var possibleAttacks = [];
				var neighbors = interface.adjacentCountries(countryId);
				for(var n=0; n < neighbors.length; n++) {
					var adjacentCountryId = neighbors[n];
					if (state.countryOwner(adjacentCountryId) != playerId && state.countryDice(countryId) > 1 && 
						state.countryDice(countryId) > state.countryDice(adjacentCountryId)) {
						possibleAttacks.push(adjacentCountryId);
					}
				}

				if (possibleAttacks.length > 0) {
					var attackCountryId = possibleAttacks[Math.floor(Math.random() * possibleAttacks.length)];
//					console.log("(aggressive) Attack", playerId, countryId, state.countries[countryId].numDice,
//						attackCountryId, state.countries[attackCountryId].numDice, depth);
					interface.attack(countryId, attackCountryId, self.startTurn.bind(self, interface));
					return;
				}
			}
		}

		interface.endTurn();
	};

