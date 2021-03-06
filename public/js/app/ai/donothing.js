
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
	
	if (typeof module !== 'undefined' && module.exports) {
		var Globals = require('../globals.js');
		var window = {};
	}

	var AI = AI || {};
	AI.DoNothing = function (id){
		
	};
	
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	AI.DoNothing.create = function(playerId, isHumanList) {
		return new AI.DoNothing(playerId);
	};

	AI.DoNothing.getName = function() {return "DoNothing";};

	// Called each time the AI has a turn.
	AI.DoNothing.prototype.startTurn = function(interface) {
		interface.endTurn();
	};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = AI.DoNothing;
	}
