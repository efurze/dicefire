		


	var AI = AI || {};
	AI.Plyer =  function (id, ply_depth, lookahead) {
		
		this._myId = id;
		this._MAX_PLIES = ply_depth || 1;
		this._lookahead = lookahead || 1;
		this._interface = null;
	};
		
	AI.Plyer.getName = function() {
		return "Plyer 1.0";
	};
		
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	AI.Plyer.create = function(playerId, isHumanList) {
		return new AI.Plyer(playerId, 2, 1);
	};

	// Called each time the AI has a turn.
	AI.Plyer.prototype.startTurn = function(iface) {
		Globals.debug("**STARTING TURN**", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		var self = this;
		self._interface = iface;
		var state = iface.getState();
		
		Globals.ASSERT(self._myId == state.currentPlayerId());
		
		Globals.debug("I AM PLAYER " + self._myId, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		Globals.debug("Gamestate: ", JSON.stringify(state), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		self.logEval(state);
		
		var moveSequence = self.bestMove(state, self._MAX_PLIES);
		Globals.debug("Attempting following move: ", JSON.stringify(moveSequence), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		self.makeMoves(moveSequence);
	};
	
	AI.Plyer.prototype.logEval = function(state) {
		var self = this;
		var scores = state.playerIds().map(function(playerId){
			return self.evalPlayer(state, playerId);
		});
		
		Globals.debug("Player Scores: ", JSON.stringify(scores), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
	};
			
	AI.Plyer.prototype.makeMoves = function(move) {
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
	
	AI.Plyer.prototype.finishTurn = function() {
		var self = this;
		var state = self._interface.getState();
		
		Object.keys(state.playerIds()).forEach(function(pid) {
			Globals.debug("Countries for player " + pid + ": " + Object.keys(state.playerCountries(pid)).join(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		});

		Globals.debug("**ENDING TURN**", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		self.logEval(state);
		self._interface.endTurn();
		
		return;
	};
	
	
	AI.Plyer.prototype.bestMove = function(state, ply) {
		var self = this;

		var moves = self.findAllGreedyMoves(state, 10);
		Globals.debug("Found " + moves.length + " moves", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		Globals.debug(moves, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		
		if (ply <= 1) {
			// base case: just evaluate each move and return the best
			return self.pickBest(moves, state);
		} else {
			// find best responses to each move.
			var responseStates = moves.map(function(move) {
				var allPlayerResponses = []; // array of moves
				var nextState = self.applyMove(move, state);
				while((nextState=self.doEndOfTurn(nextState)).currentPlayerId() != state.currentPlayerId()) {
					var response = self.bestMove(nextState, ply-1);
					allPlayerResponses.push(response);
					nextState = self.applyMove(response, nextState);
				}
				// allPlayerResponses now has a move for each other player
				
				// return the state that will exist after every other player goes
				return nextState;
			});
			
			var idx = Globals.indexOfMax(responseStates.map(function(endState) {
				return self.evalPosition(endState, self.evalPlayer.bind(self));
			}));
			
			return moves[idx];
		}		

	};

	
	// return a Move object
	AI.Plyer.prototype.findBestGreedyMove = function(state, length) {
		var self = this;
		var moves = self.findAllGreedyMoves(state, length);
		Globals.ASSERT(moves.length);
		return self.pickBest(moves, state);
		
	};
	
	// @moves: array of Move
	AI.Plyer.prototype.pickBest = function(moves, state) {
		var self = this;
		if(!moves.length) {
			return new Move();
		}
		var scores = moves.map(function(move) {
			return self.evalMove(move, state, self.evalPlayer.bind(self));
		});
		var maxIndex = Globals.indexOfMax(scores);
		return moves[maxIndex];
	};
	
	// return array of Move objects
	AI.Plyer.prototype.findAllGreedyMoves = function(state, length) {
		length = length || 1;
		var self = this;
		var lookahead = state.currentPlayerId() == self._myId ? self._lookahead : 1;
		var moves_ary = [];
		
		var moves = self.findAllMoves(state, lookahead);
		if (!moves || !moves.length) {
			moves_ary.push(new Move());
			return moves_ary;
		}
		
		var idx = Globals.indexOfMax(moves.map(function(move) {
			return self.evalMove(move, state, self.evalPlayer.bind(self));
		}));

		moves_ary.push(moves[idx]);
		if (length > 1) {
			self.findAllGreedyMoves(self.applyMove(moves[idx], state, true), length-lookahead).forEach(function(nextMove) {
				var move = new Move();
				move.push(moves[idx]);
				move.push(nextMove);
				moves_ary.push(move);
			});
		}

		Globals.ASSERT(moves_ary.length);
		return moves_ary;
	};
	
	/*-----------------------------------------------------------------------------------------------*/
	// stuff that used to be in Util
	/*-----------------------------------------------------------------------------------------------*/
	
	AI.Plyer.prototype.doEndOfTurn = function (state) {
		Globals.ASSERT(state && state instanceof Gamestate);
		
		// deep copy state
		state = state.clone();
		
		// add 1 die to each country for currentPlayer
		Object.keys(state.playerCountries(state.currentPlayerId())).forEach(function(id) {
			id = Number(id);
			var numDice = state.countryDice(id) + 1;
			state.setCountryDice(id, Math.min(numDice, 8));
		});

		var current = state.currentPlayerId();
		do {
			current++;
			current = current % Object.keys(state.playerIds()).length;
		} while (state.playerHasLost(current));

		state.setCurrentPlayerId(current);
		return state;
	};
	
	// return array of Move objects
	AI.Plyer.prototype.findAllMoves = function(state, length) {
		length = length || 1;
		var self = this;
		var moves_ary = [];

		var attacks = self.findAllAttacks(state);

		attacks.forEach(function(attack) {
			moves_ary.push(new Move(attack));
			if (length > 1) {
				// recurse
				self.findAllMoves(self.applyAttack(attack, state, true), length-1).forEach(function(nextMove) {
					var move = new Move(attack);
					move.push(nextMove);
					moves_ary.push(move);
				});
			}
		});

		return moves_ary;
	};
	
	/*
	 Loops through all countries owned by @state.currentPlayerId.
	 returns a list of all attacks that have at least a @threshold chance of success:
		@return = array of Attack objects
	*/
	AI.Plyer.prototype.findAllAttacks = function(state, threshold) {
		Globals.ASSERT(state);
		//Globals.debug("Find attacks for player " + state.currentPlayerId, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		threshold = threshold || 0.44;
		var attacks = [];
		var self = this;
		
		// loop over all possible attacks, filter out the ones that are too improbable
		Object.keys(state.playerCountries(state.currentPlayerId())).forEach(function(cid) {
			var countryId = Number(cid);
			Globals.ASSERT(state.countryOwner(countryId) == state.currentPlayerId());

			if (state.countryDice(countryId) < 2) {
				return;
			}
			// for each country, loop through all adjacent enemies
			var ac = self._interface.adjacentCountries(countryId);
			var neighbors = ac ? (ac.filter(function(neighbor) {
				return (state.countryOwner(neighbor) != state.currentPlayerId());
			})) : [];
			Globals.debug("country " + countryId + " adjacent to: " + JSON.stringify(neighbors), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
			neighbors.forEach(function (neighbor) {
				Globals.ASSERT (state.countryOwner(neighbor) != state.currentPlayerId());
				
				var attack = new Attack(countryId, neighbor);
				if (AI.Util.attackOdds(state, attack) >= threshold) {
					Globals.debug("possible attack found", attack.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
					attacks.push(attack);
				} else {
					Globals.debug("attack too improbable", attack.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
				}
			});	
		});
		Globals.debug("returning attacks ", Attack.arrayString(attacks), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
		return attacks;
	};
	
	AI.Plyer.prototype.applyMove = function(next, state) {
		Globals.ASSERT(next instanceof Move || next instanceof Attack);
		Globals.ASSERT(state && state instanceof Gamestate);
		if (next instanceof Attack) {
			return this.applyAttack(next, state, true);
		}
		
		if (!next.hasMoreAttacks()) {
			return state;
		}
		
		// deep copy state
		var newState = state.clone();
		
		for (var i=0; i < next.length(); i++) {
			newState = this.applyAttack(next.at(i), newState, true);
		}
		
		var cur = state.currentPlayerId;
		
		Globals.ASSERT(this.totalDice(cur, state) == this.totalDice(cur, newState));
		
		return newState;
	};
	
	// updated state is returned
	AI.Plyer.prototype.applyAttack = function(attack, state, success) {
		Globals.ASSERT(state && state instanceof Gamestate);
		Globals.ASSERT(attack instanceof Attack);
		
		// deep copy state
		state = state.clone();
		
		if (attack.isEmpty()) {
			return state;
		}
		var self = this;
				
		var fromPlayer = state.countryOwner(attack.from());
		var toPlayer = state.countryOwner(attack.to());
		
		Globals.ASSERT(fromPlayer != toPlayer);
		Globals.ASSERT(fromPlayer == state.currentPlayerId());
		

		if (success) {
			state.setCountryDice(attack.to(), state.countryDice(attack.from()) - 1);
			
			// update country owner
			state.setCountryOwner(attack.to(), fromPlayer);
			
			// update contiguous country count
			state.setNumContiguous(toPlayer, self.maxIslandSize(toPlayer, state));
			state.setNumContiguous(fromPlayer, self.maxIslandSize(fromPlayer, state));
		}
		state.setCountryDice(attack.from(), 1);
		
		return state;
	};
	
	AI.Plyer.prototype.maxIslandSize = function(playerId, state) {
		Globals.ASSERT(state && state instanceof Gamestate);
		
		var alreadySeen = {};
		var maxIslandSize = 0;
		var self = this;

		var traverse = function(countryId) {
			if (alreadySeen[countryId]) {
				return 0;
			}
			alreadySeen[countryId] = true;

			return 1 + 
					self._interface.adjacentCountries(countryId).reduce(function(total, adjacentCountry) {
						if (state.countryOwner(adjacentCountry) == playerId) {
							total += traverse(adjacentCountry);
						}
						return total;
					}, 0);
		};

		var playerCountries = state.playerCountries(playerId);
		Object.keys(playerCountries).forEach(function(countryId) {
			countryId = Number(countryId);
			var islandSize = traverse(countryId);

			if (islandSize > maxIslandSize) {
				maxIslandSize = islandSize;
			}
		});
		
		return maxIslandSize;
	};
	
	// not counting stored dice
	AI.Plyer.prototype.totalDice = function(playerId, state) {
		Globals.ASSERT(state && state instanceof Gamestate);
		var total = 0;
		var countryIds = state.countryIds();
		countryIds.forEach(function(id){
			if (state.countryOwner(id) == playerId) {
				total += state.countryDice(id);
			}
		});
		return total;
	};
	
	AI.Plyer.prototype.totalCountries = function(playerId, state) {
		Globals.ASSERT(state && state instanceof Gamestate);
		var total = 0;
		var countryIds = state.countryIds();
		countryIds.forEach(function(id){
			if (state.countryOwner(id) == playerId) {
				total++;
			}
		});
		return total;
	};
	
	AI.Plyer.prototype.evalMove = function(move, state, evalfxn) {
		Globals.ASSERT(move instanceof Move);
		Globals.debug("evalMove: ", move.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
		var self = this;
		var score = 0;
		if (!move.hasMoreAttacks()) {
			score = self.evalPosition(state, evalfxn);
		} else {
			// deep-copy move
			move = move.clone();
			var attack = move.pop();
			var winState = self.applyAttack(attack, state, true);
			var loseState = self.applyAttack(attack, state, false);
			var winOdds = AI.Util.attackOdds(state, attack);
			// recurse
			score = ((1 - winOdds) * self.evalPosition(loseState, evalfxn)) + (winOdds * self.evalMove(move, winState, evalfxn));
		}
		
		return score;
	};

	AI.Plyer.prototype.evalPosition = function(state, evalfxn) {
		Globals.ASSERT(state);
		var self = this;
		
		var scores = [];
		
		scores.length = Object.keys(state.playerIds()).length;
		Object.keys(state.playerIds()).forEach(function(playerId){
			scores[playerId] = evalfxn(state, playerId);
		});
		
		var myScore = scores[state.currentPlayerId()];
		
		var others=0;
		for(var i=0; i < scores.length; i++) {
			if (i != state.currentPlayerId()) {
				others += Math.pow(scores[i], 2);
			}
		}
		others = Math.sqrt(others);
		
		return scores[state.currentPlayerId()] - others;
	};
	
	AI.Plyer.prototype.evalPlayer = function(state, playerId) {
		Globals.ASSERT(state && state instanceof Gamestate); 
		var self = this;
		if (state.playerHasLost(playerId)) {
			return 0;
		}
		
		Globals.ASSERT(self instanceof AI.Plyer);
		
		var myCountryCount = self.totalCountries(playerId, state);
		var myContiguous = state.numContiguous(playerId);
		var myDice = self.totalDice(playerId, state);
		
		if (state.currentPlayerId() == playerId) {
			// for current player, count on them getting their end-of-turn dice injection
			myDice += Math.min(state.storedDice(playerId) + myContiguous, 64);
		} else {
			myDice += state.storedDice(playerId);
		}
		
		return ((2*myContiguous) - myCountryCount + myDice);		
	};
	
if (typeof module !== 'undefined' && module.exports) {
	module.exports = AI.Plyer;
}
	