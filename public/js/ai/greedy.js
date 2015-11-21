"use strict"

	var util = window.AI.Util;
	
	var SHA1 = new Hashes.SHA1();
	var hashState = function(state) {
		return SHA1.hex(JSON.stringify(state));
	};

	
	
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
	window.AI.Greedy =  function (id) {
		
		this._myId = id;
		this._interface = null;

	};
		
	window.AI.Greedy.getName = function() {
		return "Greedy";
	};
		
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	window.AI.Greedy.create = function(playerId, isHumanList) {
		return new window.AI.Greedy(playerId);
	};

	// Called each time the AI has a turn.
	window.AI.Greedy.prototype.startTurn = function(iface) {
		Globals.debug("**STARTING TURN**", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		var self = this;
		self._interface = iface;
		var state = iface.getState();
		
		Globals.ASSERT(self._myId == state.currentPlayerId());
		
		Globals.debug("I AM PLAYER " + self._myId, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		Globals.debug("Gamestate: ", JSON.stringify(state), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		self.logEval(state);

		var moveSequence = self.bestMove(state);
		self.makeMoves(moveSequence);
	};
	
	window.AI.Greedy.prototype.logEval = function(state) {
		var self = this;
		var scores = state.playerIds().map(function(playerId){
			return util.evalPlayer(state, playerId);
		});
		
		Globals.debug("Player Scores: ", JSON.stringify(scores), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
	};
			
	window.AI.Greedy.prototype.makeMoves = function(move) {
		var self = this;
		var state = self._interface.getState();
		
		// pop first move off - skip over any nonmoves or 
		// moves we can't make because we lost an earlier attack
		var attack = new Attack();
		while (move && move.hasMoreAttacks() && attack.isEmpty()) {
			attack = move.pop();
			if (state.countryOwner(attack.from()) != self._myId) {
				Globals.debug("Country " + attack.from() + " doesn't belong to us, skipping move " + attack.toString(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
				attack.clear();
			}
		}
		
		// TODO: I think this is wrong
		if (!move || (!move.hasMoreAttacks() && attack.isEmpty())) {
			self.finishTurn();
			return;
		}			
		
		if (!attack.isEmpty()) {
			Globals.debug("Country " + attack.from() + " ATTACKING country " + attack.to(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			self._interface.attack(attack.from(), attack.to(), function(result) {
				if (!result) {
					Globals.debug("ATTACK FAILED", Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
				} else {
					Globals.debug("ATTACK SUCCEEDED", Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
				}
				// recurse
				self.makeMoves(move);
			});
		} 
	};
	
	window.AI.Greedy.prototype.finishTurn = function() {
		var self = this;
		var state = self._interface.getState();
		
		Object.keys(state.playerIds()).forEach(function(pid) {
			Globals.debug("Countries for player " + pid + ": " + Object.keys(state.playerCountries(pid)).join(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		})

		Globals.debug("**ENDING TURN**", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		self.logEval(state);
		self._interface.endTurn();
		
		return;
	};
	
	
	window.AI.Greedy.prototype.bestMove = function(state) {
		var self = this;
		self._stateHash = {};
		self._duplicates = 0;
		var moves = self.findAllMovesGreedy(state, 10);
		Globals.debug("Found " + moves.length + " moves", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		Globals.debug(moves, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		

		var maxIndex = 0;
		var scores = moves.reduce(function(best, move, idx) {
			var score = util.evalMove(move, state, util.evalPlayer);
			if (score > best) {
				maxIndex = idx;
				return score;
			} else {
				return best;
			}
		}, -1);
		
		return moves[maxIndex];
	};
	
	
	// return array of Move objects
	window.AI.Greedy.prototype.findAllMovesGreedy = function(state, length) {
		length = length || 1;
		var self = this;
		var moves_ary = [];
		
		var attacks = util.findAllAttacks(state);
		if (!attacks || !attacks.length) {
			return moves_ary;
		}
		
		var max = -1000;
		var idx = 0;
		for (var i=0; i < attacks.length; i++) {
			var score = util.evalMove(new Move(attacks[i]), state, util.evalPlayer);
			Globals.debug("Score for attack " + attacks[i].toString() + " = " + score, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
			if (score > max) {
				max = score;
				idx = i;
			}
		}
		//Globals.debug("Hi score is " + max + " for attack " + attacks[idx].toString(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		moves_ary.push(new Move(attacks[idx]));
		if (length > 1) {
			self.findAllMovesGreedy(util.applyAttack(attacks[idx], state, true), length-1).forEach(function(nextMove) {
				var move = new Move(attacks[idx]);
				move.push(nextMove);
				moves_ary.push(move);
			});
		}

		return moves_ary;
	};
	

	
	