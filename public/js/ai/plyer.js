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
	window.AI.Plyer =  function (id) {
		
		this._myId = id;
		this._MAX_PLIES = 1;
		this._interface = null;
		this._plyTracker = [];
	};
		
	window.AI.Plyer.getName = function() {
		return "Plyer";
	};
		
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	window.AI.Plyer.create = function(playerId, isHumanList) {
		return new window.AI.Plyer(playerId);
	};

	// Called each time the AI has a turn.
	window.AI.Plyer.prototype.startTurn = function(iface) {
		Globals.debug("**STARTING TURN**", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		var self = this;
		self._interface = iface;
		var state = iface.getState();
		
		Globals.ASSERT(self._myId == state.currentPlayerId());
		
		Globals.debug("I AM PLAYER " + self._myId, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		Globals.debug("Gamestate: ", JSON.stringify(state), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		self.logEval(state);
		
		self._plyTracker = [];
		self._plyTracker.length = self._MAX_PLIES;
		var moveSequence = self.bestMove(state);
		//Globals.debug("Positions evaluated at each ply: ", self._plyTracker, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		self.makeMoves(moveSequence);
	};
	
	window.AI.Plyer.prototype.logEval = function(state) {
		var self = this;
		var scores = state.playerIds().map(function(playerId){
			return util.evalPlayer(state, playerId);
		});
		
		Globals.debug("Player Scores: ", JSON.stringify(scores), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
	};
			
	window.AI.Plyer.prototype.makeMoves = function(move) {
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
	
	window.AI.Plyer.prototype.finishTurn = function() {
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
	
	
	window.AI.Plyer.prototype.bestMove = function(state) {
		var self = this;

		var moves = self.findAllGreedyMoves(state, 10);
		Globals.debug("Found " + moves.length + " moves", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		Globals.debug(moves, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		
		// find best responses to each move
		var responses = moves.map(function(move) {
			return self.findBestResponse(move, state);
		});
		
		var maxIndex = 0;
		var scores = moves.reduce(function(best, move, idx) {
			var score = util.evalMove(move, state, util.evalPlayer);
			if (score > best) {
				maxIndex = idx;
				return score;
			} else {
				return best;
			}
		}, -1000);
		
		return moves[maxIndex];
	};
	
	
	window.AI.Plyer.prototype.findBestResponse = function(move, state) {
		
	};

	
	

	
	// return array of Move objects
	window.AI.Plyer.prototype.findAllGreedyMoves = function(state, length) {
		length = length || 1;
		var self = this;
		var lookahead = 1;
		var moves_ary = [];
		
		var moves = util.findAllMoves(state, lookahead)
		if (!moves || !moves.length) {
			return moves_ary;
		}
		
		var max = -1000;
		var idx = 0;
		for (var i=0; i < moves.length; i++) {
			var score = util.evalMove(moves[i], state, util.evalPlayer);
			Globals.debug("Score for move " + moves[i].toString() + " = " + score, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
			if (score > max) {
				max = score;
				idx = i;
			}
		}
		//Globals.debug("Hi score is " + max + " for attack " + attacks[idx].toString(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		moves_ary.push(moves[idx]);
		if (length > 1) {
			self.findAllGreedyMoves(util.applyMove(moves[idx], state, true), length-lookahead).forEach(function(nextMove) {
				var move = new Move();
				move.push(moves[idx]);
				move.push(nextMove);
				moves_ary.push(move);
			});
		}

		return moves_ary;
	};
	

	

	
	
	/* 
	Pass in a state, and this will find the best move, within @ply gametree levels
	@returns {move: [[1,2], [2,3]...],
				 score: 34.8}
	*/
	window.AI.Plyer.prototype.bestMoveFromState = function(state, ply, maxMoveLength) {
		var self = this;
		ply = ply || 0;
		maxMoveLength = maxMoveLength || 5;
		var move = new Move();
		var playerId = state.currentPlayerId();
		
		
		if (ply < self._MAX_PLIES) {
			move = self.constructBestMove(state, ply, maxMoveLength);
			if (ply == 0) {
				Globals.debug("[PLY " + ply + "] Best move for position: " + move.toString(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
			}
		}
		
		return move;
	};
	
	window.AI.Plyer.prototype.constructBestMove = function(state, ply, maxMoveLength) {
		//Globals.debug("[PLY " + ply + "] constructBestMove", Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		var self = this;
		var bestMove = new Move();
		
		// find all 1-step moves from this position
		var nextMoves = util.findAllMoves(state, 1);
		
		// always consider doing nothing
		nextMoves.push(new Move(new Attack()));
		//Globals.debug("Considering these attacks: " + Attack.arrayString(nextMoves), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		if (ply == 0) {
			Globals.debug("[PLY " + ply + "] Considering " + nextMoves.length + " attacks", Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		}

		//var nextMoves = self.BestNMoves(nextMoves, 10);
		
		// score each attack option by looking at all responses (ply deep)
		var attackScores = nextMoves.map(function(move) {
			//Globals.debug("Considering counterattacks to move " + move.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
			Globals.ASSERT(move instanceof Move);
			
			// Assume move ends after this move. 
			// do all of the other players' counterattacks and evaluate the position
			var nextState = util.applyMove(move, state);
			while ((nextState=util.doEndOfTurn(nextState)).currentPlayerId() != state.currentPlayerId()) {
				//Globals.debug("Calculating best reply for player " + nextState.currentPlayerId, Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
				var bestResponse = self.bestMoveFromState(nextState, ply+1, 1);
				//Globals.debug("Best response: " + bestResponse.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
				nextState = util.applyMove(bestResponse, nextState);
			}
			
			self._plyTracker[ply] = self._plyTracker[ply] ? self._plyTracker[ply] + 1 : 1;
			var score = util.evalPosition(nextState, util.evalPlayer);
			//Globals.debug((self._MAX_PLIES-ply-1) + "-Ply score for move " + move.toString() + " = " + score, Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
			return score;
		});
		
		// find best score
		var maxIndex = 0;
		var max = attackScores[0];
		for (var i=0; i < attackScores.length; i++) {
			if (attackScores[i] > max) {
				max = attackScores[i];
				maxIndex = i;
			}
		}
		var bestAttack = nextMoves[maxIndex];
		
		
		if (bestAttack.isEmpty()) {
			// best move was to do nothing
			Globals.debug("Best attack is to do nothing", Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
			return bestMove;
		} else {
			//Globals.debug("Adding attack to bestMove: " + bestAttack.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
			bestMove.push(bestAttack);
			var nextState = util.applyMove(bestAttack, state, true);
			var nextMove = self.constructBestMove(nextState, ply, maxMoveLength);
			if (nextMove.hasMoreAttacks()) {
				bestMove.push(nextMove);
			}
			//Globals.debug("returning best move: " + bestMove.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
			return bestMove;
		}
	};
	
	