
	
	if (typeof module !== 'undefined' && module.exports) {
		var Globals = require('../globals.js');
		var window = {};
	}

	var AI = AI || {};
	AI.Human = function (id){
		
	};
	
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	AI.Human.create = function(playerId, isHumanList) {
		return new AI.Human(playerId);
	};

	AI.Human.getName = function() {return "human";};

	// Called each time the AI has a turn.
	AI.Human.prototype.startTurn = function(interface) {
	};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = AI.Human;
	}
