"use strict"

	var util = window.AI.Util;
	
	
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

	window.AI.Greedy = function(){};
		
	window.AI.Greedy.getName = function() {
		return "Greedy";
	};
		
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	window.AI.Greedy.create = function(playerId, isHumanList) {
		return new window.AI.Plyer(playerId, 1);
	};



	
	