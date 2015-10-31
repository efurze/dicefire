$(function() {

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


	window.DoNothingAI = {
		// Called when the AI is first started. Tells the AI its player number
		// and the list of other players, so it can know who is human and where
		// in the turn order this AI shows up.
		init: function(playerId, isHumanList) {
		},

		// Called each time the AI has a turn.
		startTurn: function(interface) {
			interface.endTurn();
		}	
	};

});