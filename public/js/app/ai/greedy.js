	
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
	


	AI.Greedy = function(){};
		
	AI.Greedy.getName = function() {
		return "Greedy 1.0";
	};
		
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	AI.Greedy.create = function(playerId, isHumanList) {
		return new AI.Plyer(playerId, 1);
	};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = AI.Greedy;
}