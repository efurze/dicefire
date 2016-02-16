
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
	AI.Aggressive = function (id) {
		
	};
	
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	AI.Aggressive.create = function(playerId, isHumanList) {
		return new AI.Aggressive(playerId);
	};

	AI.Aggressive.getName = function() {
		return "Aggressive";
	};
	
	// Called each time the AI has a turn.
	AI.Aggressive.prototype.startTurn = function(interface, depth) {
		depth = depth || 0;
		var self = this;
		var state = interface.getState();

		var playerId = state.currentPlayerId();
		var countryIds = state.countryIds();
		for (var i = 0; i < countryIds.length; i++) {
			var countryId = countryIds[i];
			if (state.countryOwner(countryId) == playerId) {
				var possibleAttacks = [];
				interface.adjacentCountries(countryId).forEach(function(adjacentCountryId) {
					if (state.countryOwner(adjacentCountryId) != playerId && state.countryDice(countryId) > 1 && 
						state.countryDice(countryId) >= state.countryDice(adjacentCountryId)) {
						possibleAttacks.push(adjacentCountryId);
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


if (typeof module !== 'undefined' && module.exports) {
	module.exports = AI.Aggressive;
}
;
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
;"use strict"
	
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
};
	
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
;// THIS IS THE SAME AS AGGRESSIVE BUT DOESNT ATTACK ON TIES

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
	AI.Passive.prototype.startTurn = function(interface, depth) {
		depth = depth || 0;
		var self = this;
		var state = interface.getState();

		var playerId = state.currentPlayerId();
		var countryIds = state.countryIds();
		for (var i = 0; i < countryIds.length; i++) {
			var countryId = countryIds[i];
			if (state.countryOwner(countryId) == playerId) {
				var possibleAttacks = [];
				interface.adjacentCountries(countryId).forEach(function(adjacentCountryId) {
					if (state.countryOwner(adjacentCountryId) != playerId && state.countryDice(countryId) > 1 && 
						state.countryDice(countryId) > state.countryDice(adjacentCountryId)) {
						possibleAttacks.push(adjacentCountryId);
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

;"use strict"

		
	
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
	AI.Plyer =  function (id, ply_depth, lookahead) {
		
		this._myId = id;
		this._MAX_PLIES = ply_depth || 1;
		this._lookahead = lookahead || 1
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
		})

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
		
	},
	
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
	},
	
	// return array of Move objects
	AI.Plyer.prototype.findAllGreedyMoves = function(state, length) {
		length = length || 1;
		var self = this;
		var lookahead = state.currentPlayerId() == self._myId ? self._lookahead : 1;
		var moves_ary = [];
		
		var moves = self.findAllMoves(state, lookahead)
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
		var state = state.clone();
		
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
		var threshold = threshold || 0.44;
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
				return (state.countryOwner(neighbor) != state.currentPlayerId())
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
		
		Globals.ASSERT(this.totalDice(cur, state) == this.totalDice(cur, newState))
		
		return newState;
	};
	
	// updated state is returned
	AI.Plyer.prototype.applyAttack = function(attack, state, success) {
		Globals.ASSERT(state && state instanceof Gamestate);
		Globals.ASSERT(attack instanceof Attack);
		
		// deep copy state
		var state = state.clone();
		
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
	;"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Gamestate = require('../game/gamestate.js');
	var window = {};
}


var AI = AI || {};
AI.Util =  {
	
	// USAGE: ODDS_ARRAY[attackingDiceCount - 1, defendingDiceCount - 1] gives the odds that the attacker wins
	ODDS_ARRAY: [
		[ 0.4098, 	0.0603, 0.0047, 0, 		0, 		0, 		0, 		0 ], 		// 1 dice attacking
		[ 0.8643, 	0.4368, 0.1184, 0.0182, 0.0024, 0.0002, 0, 		0 ], 		// 2 dice attacking
		[ 0.9874, 	0.8094, 0.4479, 0.1604, 0.0345, 0.007, 	0.0005, 0.0004 ], 	// 3 dice attacking
		[ 0.9995, 	0.9612, 0.7708, 0.4578, 0.1941, 0.0575, 0.0128, 0.0024 ], 	// 4 attacking
		[ 1, 		0.9944, 0.9395, 0.7359, 0.4591, 0.2107, 0.0714, 0.0212 ], 	// 5 attacking
		[ 1, 		0.9997, 0.9877, 0.9129, 0.7275, 0.4626, 0.233, 	0.0923 ], 	// 6 attacking
		[ 1, 		1, 		0.9987, 0.9772, 0.8913, 0.7131, 0.4652, 0.2514 ], 	// 7 attacking
		[ 1, 		1, 		0.9998, 0.9967, 0.9681, 0.8787, 0.6909, 0.466 ] 	// 8 attacking
	],

		
	// returns odds of success
	// @attack is an Attack object
	attackOdds: function(state, attack) {
		Globals.ASSERT(state && state instanceof Gamestate);
		if (!attack.isEmpty()) {
			Globals.ASSERT(attack instanceof Attack);
			var a = state.countryDice(attack.from());
			var d = state.countryDice(attack.to());
			if (a > 0 && d > 0) {
				var o = AI.Util.ODDS_ARRAY[a - 1][d - 1];
				//Globals.debug("Attack odds for " + a + " vs " + d + " = " + o, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
				return o;
			} else {
				return 0;
			}
		} else {
			return 1;
		}
	},

};

var Attack = function(fromId, toId) {
	if ((typeof fromId !== 'undefined') && (typeof toId !== 'undefined')) {
		this._from = fromId;
		this._to = toId;
	} else {
		this._from = -1;
		this._to = -1;
	}
};

Attack.prototype.clone = function() {
	return new Attack(this._from, this._to);
};

Attack.prototype.clear = function() {
	this._from = -1;
	this._to = -1;
};
Attack.prototype.from = function() {return this._from};
Attack.prototype.to = function() {return this._to};
Attack.prototype.isEmpty = function() {return ((this._from < 0) || (this._to < 0))};
Attack.prototype.toString = function() {
	if (this.isEmpty()) {
		return "()";
	} else {
		return "(" + this._from + "," + this._to + ")";
	}
};

Attack.arrayString = function(ary) {
	var str = "[";
	if (Array.isArray(ary)) {
		if (!ary.length) {
			return "[]";
		} else {
			Globals.ASSERT(ary[0] instanceof Attack || ary[0] instanceof Move);
			for (var i=0; i < ary.length; i++) {
				if (ary[i]){
					str += ary[i].toString();
				} else {
					Globals.ASSERT(false);
				}
			}
		}
	}
	str += "]";
	return str;
};

var Move = function(attack) {
	this._attacks = [];
	if (typeof attack !== 'undefined') {
		this._attacks.push(attack);
	}
};

Move.prototype.clone = function() {
	var copy = new Move();
	for(var i=0; i < this._attacks.length; i++) {
		copy.push(this._attacks[i].clone());
	}
	return copy;
}	

Move.prototype.length = function() {return this._attacks.length;}

// adds to end
Move.prototype.push = function(next) {
	Globals.ASSERT(Array.isArray(next) || next instanceof Attack || next instanceof Move);
	if (Array.isArray(next)) {
		this._attacks.push(new Attack(next[0], next[1]));
	} else if (next instanceof Attack){
		this._attacks.push(next);
	} else if (next instanceof Move && next.hasMoreAttacks()) {
		this._attacks = this._attacks.concat(next._attacks);
	}
	this._attacks.forEach(function(item) {
		Globals.ASSERT(item);
	})
};
// removes first attack and returns it
Move.prototype.pop = function() {
	return (this._attacks.shift() || new Attack());
};
Move.prototype.at = function(index) {
	Globals.ASSERT(index >= 0 && index < this._attacks.length);
	return this._attacks[index];
};
Move.prototype.isEmpty = function() {
	return (!this._attacks.length || this._attacks[0].isEmpty());
};
Move.prototype.hasMoreAttacks = function() {
	return !this.isEmpty();
};
Move.prototype.toString = function() {
	var str = '[';
	for (var i=0; i < this._attacks.length; i++) {
		str += this._attacks[i].toString();
	}
	str += ']';
	return str;
};


if (typeof module !== 'undefined' && module.exports) {
	AI.Util.Move = Move;
	AI.Util.Attack = Attack;
	module.exports = AI.Util;
};"use strict"


$(function() {

	// initialize the AI name-to-class mapping
	var AIs = [
		AI.Plyer,
		AI.Greedy,
		AI.Aggressive
	];
	var AIMap = {};
	AIs.forEach(function(ai) {
		AIMap[ai.getName()] = ai;
	});
	
	window.onerror = function(msg, url, lineNum) {
		Globals.debug("Uncaught exception", msg, url, lineNum, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT, Client._gameId);
	};

	
	window.Client = {
		
		_canvas: document.getElementById("c"),
		_socket: null,
		_downloader: null,
		_history: null,
		_gameId: null,	
		_initialized: false,
		_watch: false,

		_map: null,
		_gameInfo: null,
		_players: {}, // playerId => Engine::PlayerInterface
		_playerStatus: {}, // playerId => true iff player is connected

		_rendererInitialized: false,
		_currentViewState: -1,
		_rendering: false,
		_historyController: null,

		_playerId: -1,
		_isMyTurn: false,
		_mapController: null,

		init: function (gameId, watch) {
			Client._gameId = gameId;
			Client._watch = watch;
			Globals.debug("gameId:", gameId, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);

			var uploader = new Uploader();
			Globals.initLogger(gameId, uploader.uploadLogDump.bind(uploader));

			// initialize the history controller
			Client._history = new History(gameId);
			Client._historyController = new HistoryController(Client._history, gameId);

			// get game info for rendering purposes
			Client._downloader = new Downloader();
			Client._downloader.getGameInfo(gameId, Client.gameInfoCB);

			// connect socket
			var socketPath = "";
			if (watch) {
				Globals.debug("Connecting as watcher", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				socketPath = window.location.hostname + ":5001/watch/" + gameId;
			} else {
				socketPath = window.location.hostname + ":5001/" + gameId;
			}

			Client._socket = new SocketWrapper(io.connect(socketPath), gameId);
			Client._socket.on('error', Client.socket_error);
			Client._socket.on('disconnect', Client.disconnect);
			Client._socket.on('connect', Client.connect);
			Client._socket.on(Message.TYPE.STATE, Client.state);
			Client._socket.on(Message.TYPE.PLAYER_STATUS, Client.player_status);

			if (!watch) {
				Client._socket.on(Message.TYPE.CREATE_BOT, Client.create_bot);
				Client._socket.on(Message.TYPE.CREATE_HUMAN, Client.create_human);
				Client._socket.on(Message.TYPE.START_TURN, Client.start_turn);
			}
		},


		setInitialized: function() {
			// initialize renderer
			if (!Client._rendererInitialized) {
				Globals.debug("Initializing renderer", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				if (!Client._watch) {
					// don't needs a map controller if we're only watching
					Globals.ASSERT(Client._mapController);
				}
				$('#game').css('display', 'block');
				Client._rendererInitialized = true;
				Renderer.init(Client._canvas,
							Client._map,
							Client._gameInfo.getPlayers(),
							Client);

				// render the disconnected players properly
				Object.keys(Client._playerStatus).forEach(function(id) {
					if (!Client._playerStatus[id]) {
						Renderer.setPlayerName(id, "Disconnected");
					}
				});

				Client.processNextState();
			}
			if (!Client._initialized && !Client._watch) {
				Client._initialized = true;
				// tell the server we're initialized
				Client._socket.sendPlayerInitialized(Client._playerId);
			}
		},

		upToDate: function() {
			return (Client._currentViewState == Client._history.latestId());
		}, 

		processNextState: function() {
			if (Client._rendererInitialized && !Client._rendering && !Client._historyController.viewingHistory()) {
				if (!Client.upToDate()) {
					var nextState = 0;
					if (Client._currentViewState < 0) {
						nextState = Client._history.latestId();
					} else {
						nextState = Client._currentViewState + 1;
					}
					Client._history.getState(nextState, function(state) {
						if (Client._map) {
							Client._map.setState(state);
						}
						Client.render(state);
					});
				}
			}
		},  

		render: function(state) {
			if (!Client._rendererInitialized || !state || Client._historyController.viewingHistory()) {
				return;
			}

			if (!Client._rendering) {
				Client._rendering = true;

				Globals.debug("render state", state.stateId(), Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
				Renderer.stateUpdate(state, state.stateId()); // will call back to stateRendered()
			}
		},

		// from renderer
		stateRendered: function(state, id) {
			// render done
			Globals.debug("state", id, "rendered", Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
			Client._rendering = false;
			Client._currentViewState = state.stateId();

			if (!Client._historyController.viewingHistory()) {
				Client._historyController.setViewState(Client._currentViewState);
				if (!Client.upToDate()) {
					Client.processNextState();
				}
			}
		},

		// from renderer
		mouseOverCountry: function(id) {
			if (Client._mapController) {
				Client._mapController.mouseOverCountry(id);
			}
		},


		endTurnClicked: function() {
			Globals.debug("End Turn clicked", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);

			if (Client._isMyTurn && Client.upToDate()) {
				Client._isMyTurn = false;
				Client._socket.sendEndTurn(Client._playerId);
			} else if (!Client._isMyTurn) {
				Globals.debug("End Turn clicked when it's not my turn", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);				
			} else if (!Client.upToDate()) {
				Globals.debug("End Turn clicked when client isn't up to date", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
			}
		},


		//====================================================================================================
		// MapcontrollerInterface
		//====================================================================================================
		
		MapControllerInterface: {

			currentPlayerId: function() { return Client._history.getState(Client._currentViewState).currentPlayerId();},

			
			attack: function(from, to, callback){
				if (Client._isMyTurn) {
					//Globals.debug("<= attack", from.id(), "to", to.id(), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
					Client._socket.sendAttack(from.id(), to.id(), Client._playerId);
				}
			},
			
			clickable: function() {
				if (Client._rendering || !Client._isMyTurn || Client._historyController.viewingHistory()) {
					return false;
				}

				return true;
			}
		},


		//====================================================================================================
		// Socket events
		//====================================================================================================
		socket_error: function(sock, err) {
			Globals.debug("=> Socket ERROR:", err, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT_SOCKET);
		},

		disconnect: function(sock) {
			Globals.debug("=> Socket DISCONNECT", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);

			// tell all the AI's to chill
			Object.keys(Client._players).forEach(function(id) {
				if (Client._players[id]) {
					Client._players[id].turnEnded();
				}
			});

			Client._isMyTurn = false;
		},

		connect: function(sock) {
			Globals.debug("=> Socket CONNECT", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			if (Client._initialized && !Client._watch) {
				// tell the server we're initialized
				Client._socket.sendPlayerInitialized(Client._playerId);
			}
		},

		// @msg: {playerId: ,connected: ,playerName:}
		player_status: function(sock, msg) {
			
			Client._playerStatus[msg.playerId] = msg.connected;

			if (msg.connected) {
				Renderer.setPlayerName(msg.playerId, msg.playerName);
			} else {
				Renderer.setPlayerName(msg.playerId, "Disconnected");
			}
		},


		// @msg: {stateId:, gameId:}
		state: function(sock, msg) {
			Client._historyController.updateStateCount(msg.stateId);
			Client._history.getState(msg.stateId, function(state) {
				Client.processNextState();
			});
		},

		// @msg: {name: AI.getName(), playerId: <int>}
		create_bot: function(sock, msg) {
			var aiName = msg['name'];
			if (AIMap.hasOwnProperty(aiName)) {
				var id = parseInt(msg['playerId']);
				Globals.debug("Initializing new bot", aiName, "with playerId:", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
				if (Client._players.hasOwnProperty(id)) {
					Globals.debug("Already have a player", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					if (Client._players[id].getName() == aiName) {
						Globals.debug("Same AI, not re-initializing", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
						Client._players[id].turnEnded();
						return;
					} else {
						Globals.debug("Different AI", Client._players[id].getName(), 
							"re-initializing player", id, Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
						Client._players[id].stop();
						Client._players[id] = null;
					}
				}

				Client._players[id] = new SocketAIController(Client._socket, Client._history, AIMap[aiName], id); 
				if (Client._map) {
					Client._players[id].start();
				}
				
			} else {
				Globals.debug("Unknown AI requested:", aiName, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
		
		// @msg: {playerId:, name:}
		create_human: function(sock, msg) {
			if (Client._playerId != msg.playerId) {
				Client._playerId = msg.playerId;
				Client._players[msg.playerId] = Engine.PlayerInterface;
				if (Client._mapController) {
					Client._mapController.setPlayerId(Client._playerId);
				}
				$('#end_turn').click(Client.endTurnClicked);
				$('#game_controls').css('display', 'block');
			}
		},

		// @msg: {playerId:, stateId:}
		start_turn: function(sock, msg) {
			if (msg.playerId == Client._playerId) {
				Client._history.getState(msg.stateId, function(state) {
					Client._isMyTurn = true;
				});
			}
		},

		
		// END: Socket events ---------------


		//====================================================================================================
		// HTTP callbacks
		//====================================================================================================
		mapDataCB: function(success, data) {
			if (success) {
				if (!Client._map) {
					Globals.debug("Got map from server", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					Client._map = new Map();
					Client._map.deserializeHexes(data);

					// start all the AI's
					Object.keys(Client._players).forEach(function(id) {
						Globals.ASSERT(Client._players[id]);
						Client._players[id].start();
					});

					if (!Client._watch && !Client._mapController) {
						// create map controller
						Client._mapController = new Mapcontroller(Client._playerId, Client._map, Client.MapControllerInterface);
					}

					Client.setInitialized();					

				} else {
					Globals.debug("Got map when we already had one", Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
				}
			} else {
				Globals.debug("Get Map error", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},

		gameInfoCB: function(success, data) {
			if (success) {
				if (!Client._gameInfo) {
					Globals.debug("Got gameInfo from server", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);
					Client._gameInfo = Gameinfo.deserialize(data);
				}

				if (!Client._map) {
					Client._downloader.getMap(Client._gameId, Client.mapDataCB);
				}
			} else {
				Globals.debug("Get gameInfo error", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
			}
		},
	};


});

;"use strict"


$(function() {

	window.onerror = function(msg, url, lineNum) {
		Globals.debug("Uncaught exception", msg, url, lineNum, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT, Game._gameId);
	};


	window.Game = {
		
		_canvas: document.getElementById("c"),
		_controller: null,
		_mapController: null,
		_gameId: null,
		_currentState: null,
		_uploader: null,
		_engine: null,
		_aiHash: null,
		_aiIdx: -1,
		
		
		// @players = ['human', 'Aggressive', 'Plyer 1.0']
		init: function (gameId, players, aiHash, test) {
			Game._gameId = gameId;
			Game._aiHash = aiHash;
			Game._test = test;
			Game._uploader = new Uploader();
			Globals.initLogger(gameId, Game._uploader.uploadLogDump.bind(Game._uploader));

			if (typeof players == 'string') {
				players = players.trim().split(',');
			}

			var aiClassName = 'ai' + aiHash;

			// map player names to AI classes
			Game.start(players.map(function(name, idx) {
					name = name.trim();
					if (name === AI.Human.getName()) {
						return AI.Human;
					}  
					if (name === AI.Plyer.getName()) {
						return AI.Plyer;
					} 
					if (name === AI.Greedy.getName()) {
						return AI.Greedy;
					} 
					if (name === AI.Aggressive.getName()) {
						return AI.Aggressive;
					}
					if (name === aiHash) {
						Game._aiIdx = idx;
						return eval(aiClassName);
					}
				}));
		},
		
		start: function(playerCode) {
			console.log("playerCode", playerCode);
			
			$('#game').css('display', 'block');
			$('#game_controls').css('display', 'block');

			Game._engine = new Engine();
			// create the PlayerWrappers
			var pws = [];
			var playerNames = [];
			
			
			playerCode.forEach(function(player, idx) {
				if (player.getName() == 'human') {
					pws.push(Engine.PlayerInterface);
				} else if (idx == Game._aiIdx) {
					pws.push(new AIWrapper(Game._aiHash, Game._engine, pws.length, Game._test, player.getName()));
				} else {
					pws.push(new AIWrapper(player, Game._engine, pws.length, false));
				}
			});
			
			Game._engine.init(pws);
			Game._engine.registerGameCallback(Game.gameOver);
			Game._engine.registerStateCallback(Renderer.stateUpdate.bind(Renderer));
			
			playerCode.forEach(function(pc) {
				playerNames.push(pc.getName());
			});
			
			
			Game._controller = new Gamecontroller(0, Game._engine);
			Game._mapController = new Mapcontroller(0, Game._engine.map(), Game.mapConInterface);
			Renderer.init(Game._canvas, Game._engine.map(), playerNames, Game);
			Game._engine.setup();
			
			$('#end_turn').click(Game._controller.endTurn.bind(Game._controller));
			$('#back_btn').click(Game._controller.historyBack.bind(Game._controller));
			$('#forward_btn').click(Game._controller.historyForward.bind(Game._controller));
			
			Game._engine.startTurn(0);
		},
		
		gameOver: function(winningAI, winningID) {
		},
		
		// from renderer
		stateRendered: function(gamestate, stateId) {
			if (!Game._controller.viewingHistory()) {
				Game._currentState = gamestate;
				if (Game._controller) {
					Game._controller.update(gamestate);
				}
			}
		},
		
		// from renderer
		mouseOverCountry: function(id) {
			Game._mapController.mouseOverCountry(id);
		},

		
		mapConInterface: {
			currentPlayerId: function() {
				return Game._currentState ? Game._currentState.currentPlayerId() : -1;
			},

			attack: function(from, to, callback) {
				Game._engine.attack(from, to, callback);
			},
			
			clickable: function() {
				return !Game._controller.viewingHistory();
			}
		}
		
	};
});

;"use strict"

//--------------------------------------------------------------------------------------
//	GameRunner
//--------------------------------------------------------------------------------------


var GameRunner = function(AIs) {
	this._engine = new Engine();
	this._players = AIs.map(function(p){return p;});
	this._callback = null;
	
	if (this._players.length < 2) {
		debug("Not enough players: " + self.players);
	}
};

// @gameOver_cb = function(){}
GameRunner.prototype.start = function(gameOver_cb) {
	var self = this;
	if (this._players.length > 1) {
		this._callback = gameOver_cb;
		
		// create the PlayerWrappers
		var pws = this._players.map(function(player, idx) {
			return new AIWrapper(player.hash, self._engine, idx, false, player.name);
		});
		
		this._engine.init(pws);
		this._engine.setEnforceTime(true);
		this._engine.registerGameCallback(this.gameDone.bind(this));
		this._engine.registerStateCallback(this.engineUpdate.bind(this));
		this._engine.setup();
		
		
		this._gameId = uuid.v1();
		this._uploader = new Uploader();
		this._uploader.uploadMap(this._gameId, this._engine.serializeMap());
	
		debug("Beginning game " + this._gameId + ": " + pws.map(function(p) {return p.getName();}));
		this._engine.startTurn(0);
	} else {
		debug("Not enough players to play: " + JSON.stringify(this._players));
		this._callback = null;
		this._gameId = "";
		this._engine = null;
		this._players = null;
		this._uploader = null;
		if (gameOver_cb) {
			gameOver_cb();
		}
	}
};

GameRunner.prototype.stop = function() {
	if (this._engine) {
		this._engine.registerStateCallback(null);
		delete this._engine;
		this._engine = null;
	}
};

GameRunner.prototype.engineUpdate = function(gamestate, stateId) {
	var self = this;
	self._uploader.uploadState(self._gameId, stateId, gamestate.toString());


	var html = "Move number: " + gamestate.stateId() + "<br><br>Scores:<br>";
	var count = self._engine.playerCount();
	for (var i=0; i < count; i++) {
		var player = self._engine.getPlayer(i);
		if (player) {
			html += "Player " + i + ": " + player.countryCount() + ", " + player.timePerTurn() + "ms <br>";
		}
	}
	$('#score').html(html);

	if (gamestate.attack()) {
		window.setTimeout(function() {
			self._engine.finishAttack(gamestate.attack());
		}, 0);
	}
};

GameRunner.prototype.makeTable = function (table, data) {
    $.each(data, function(rowIndex, r) {
        var row = $("<tr/>");
        $.each(r, function(colIndex, c) { 
			if (rowIndex == 0) {
				row.append($("<th/>").text(c));
			} else {
				row.append($("<td id='" + (rowIndex) + (colIndex) + "'/>").text(c));
			}
            
        });
        table.append(row);
    });
	return table;
};

GameRunner.prototype.gameDone = function(winner, id) {
	var self = this;
	console.log("Game finished, winnerId", id);

	var times = [];
	var count = self._engine.playerCount();
	for (var i=0; i < count; i++) {
		var player = self._engine.getPlayer(i);
		if (player) {
			times.push(player.timePerTurn());
		}
	}

	var results = new Gameinfo(self._players.map(function(p, idx){return {id: p.hash, avgTime: times[idx]};}), id);
	
	self._uploader.uploadGameInfo(self._gameId, results.toString(), "ARENA");
	
	var cb = this._callback;
	
	this._engine = null;
	this._gameId = "";
	this._players = null;
	this._uploader = null;
	this._callback = null;
	
	if (cb) {
		cb();
	}
};

var debug = function(msg) {
	console.log(msg);
}


//--------------------------------------------------------------------------------------
//	RandomRunner
//--------------------------------------------------------------------------------------

// @AI = array of {hash: , name: }
var RandomRunner = function(AIs, max) {
	this._count = 0;
	this._stop = false;
	this._max = max || -1;
	this._players = AIs;
	
};

RandomRunner.prototype.setMax = function(max) {
	this._max = max;
};

RandomRunner.prototype.start = function() {
	
	// construct a random list of players
	var players = [];
	var numPlayers = 1 + Math.ceil(Math.random() * 7);

	var pool = Globals.shuffleArray(this._players);

	while (pool.length && players.length < numPlayers) {
		players.push(pool.shift());
	}
	
	this._count++;
	this._runner = new GameRunner(players);
	console.log("game " + this._count + " starting");
	$('#counter').html("Currently playing game " + this._count + " out of " + this._max);
	$('#status').html("Current Game: " + JSON.stringify(players.map(function(p){return p.name;})));
	this._runner.start(this.done.bind(this));
};

RandomRunner.prototype.stop = function() {
	this._stop = true;
	if (this._runner) {
		this._runner.stop();
		delete this._runner;
		this._runner = null;

		$('#status').html("Stopped");
	}
};

RandomRunner.prototype.done = function() {
	console.log("game over");
	this._runner = null;
	if (this._stop || (this._max > 0 && this._count >= this._max)) {
		console.log("Exiting Thunderdome");
		$('#status').html("Done");
		$('#stop_btn').prop('disabled', true);
		$('#start_btn').prop('disabled', false);
		this._count = 0;
	} else {
		setTimeout(this.start.bind(this), 0);
	}
};


//--------------------------------------------------------------------------------------
//	Thunderdome
//--------------------------------------------------------------------------------------


$(function() {

	
	window.Thunderdome = {
		
		_AIs: [], // array of {hash: , name: }
		_runner: null,
		_downloader: null,
		
		init: function () {
			Thunderdome._downloader = new Downloader();
			Thunderdome._downloader.getAIs(Thunderdome.aiListReceived);
			
			$('#stop_btn').prop('disabled', true);
			$('#start_btn').prop('disabled', true);
			
			$('#start_btn').click(Thunderdome.start);
			$('#stop_btn').click(Thunderdome.stop);
		},
		
		aiListReceived: function(success, data) {
			if (success) {
				
				if (data && data.length) {
					$('#stop_btn').prop('disabled', true);
					$('#start_btn').prop('disabled', false);
					Thunderdome._AIs = data;
					Thunderdome._runner = new RandomRunner(Thunderdome._AIs, 1);
				}
				
			} else {
				console.log("ERROR retrieving AI list", data);
			}
		},
		
		start: function() {
			$('#stop_btn').prop('disabled', false);
			$('#start_btn').prop('disabled', true);
			var count = $('#count').val();
			Thunderdome._runner.setMax(parseInt(count));
			Thunderdome._runner.start();			
		},
		
		stop: function() {
			$('#stop_btn').prop('disabled', true);
			$('#start_btn').prop('disabled', false);
			Thunderdome._runner.stop();
		},


	};
});

;"use strict"

var Gamecontroller = function (playerId, engine) {
	this._playerId = playerId;
	this._historyIndex = 0;
	this._historyLength = 0;
	this._engine = engine;
	this._lastState = null;
};

$(function(){

Gamecontroller.prototype.update = function(state) {
	if (Globals.suppress_ui) {
		return;
	}

	var self = this;

	if (state) {
		if (!self.viewingHistory()) {
			self._historyIndex = state.stateId()
		}
		self._lastState = state;
		self._historyLength = self._lastState.stateId() + 1;
	}
	
	
	$('#back_btn').prop('disabled', true);
	$('#forward_btn').prop('disabled', true);
	
	if (self._playerId == self._lastState.currentPlayerId()) {	

		if (self.viewingHistory()) {
			// don't let player end their turn while they're looking at history
			$('#end_turn').prop('disabled', true);
		} else if (self._lastState.attack()) {
			// can't end turn during an attack
			$('#end_turn').prop('disabled', true);
		} else {
			$('#end_turn').prop('disabled', false);
		} 

		$('#history').html((self._historyIndex+1)  + ' / ' + self._historyLength);
		
		if (self.viewingHistory()) {
			$('#forward_btn').prop('disabled', false);
		}
		
		if (self._historyIndex > 0) {
			$('#back_btn').prop('disabled', false);
		}

	} else {
		$('#end_turn').prop('disabled', true);
	}

};

Gamecontroller.prototype.endTurn = function() {
	var self = this;
	Globals.ASSERT(self._lastState.stateId() == self._engine.getState().stateId());

	self._historyIndex = self._lastState.stateId();
	self._engine.endTurn();
};

Gamecontroller.prototype.historyBack = function (event) {
	var self = this;
	if (self._historyIndex > 0) {
		self._historyIndex --;
	}
	
	self.renderHistory(self._engine.getHistory(self._historyIndex));			
	self.update();
};

Gamecontroller.prototype.historyForward = function (event) {
	var self = this;
	if (self.viewingHistory()) {
		if (self._historyIndex < (self._engine.historyLength()-1)) {
			self._historyIndex ++;
		} 
					
		self.renderHistory(self._engine.getHistory(self._historyIndex));
		self.update();
	}
};

Gamecontroller.prototype.renderHistory = function (state) {
	var self = this;
	Renderer.renderHistory(state);
};

Gamecontroller.prototype.viewingHistory = function () {
	var self = this;
	if (self._lastState) {
		return self._historyIndex < self._lastState.stateId();
	} else {
		return false;
	}
};

});;"use strict"

var HistoryController = function (history, playerId) {
	this._history = history;
	this._playerId = playerId;
	this._viewingHistory = false;
	this._currentlyViewing = 0;
	this._latestStateId = 0;

	$('#back_btn').click(this.historyBack.bind(this));
	$('#forward_btn').click(this.historyForward.bind(this));
};

$(function(){

HistoryController.prototype.updateStateCount = function(stateId) {
	this._latestStateId = stateId;
	this.update();
};

HistoryController.prototype.setViewState = function(stateId) {
	this._currentlyViewing = stateId;
	this.update();
};

HistoryController.prototype.update = function() {
	var self = this;
	
	$('#back_btn').prop('disabled', self._currentlyViewing == 0);
	$('#forward_btn').prop('disabled', self._currentlyViewing == self._latestStateId);
	$('#history').html((self._currentlyViewing)  + ' / ' + self._latestStateId);
	
};


HistoryController.prototype.historyBack = function (event) {
	var self = this;
	if (self._currentlyViewing > 0) {
		self._currentlyViewing --;
		self._viewingHistory = true;

		self._history.getState(self._currentlyViewing, self.renderHistory.bind(self));
		// TODO: FIXME: have a UI for 'loading state'
		self.update();
	}
};

HistoryController.prototype.historyForward = function (event) {
	var self = this;
	if (self.viewingHistory()) {
		if (self._currentlyViewing < self._latestStateId) {
			self._currentlyViewing ++;
		} 
		
		if (self._currentlyViewing == self._latestStateId) {
			self._viewingHistory = false;
		}
					
		self._history.getState(self._currentlyViewing, self.renderHistory.bind(self));
		// TODO: FIXME: have a UI for 'loading state'
		self.update();
	}
};

HistoryController.prototype.renderHistory = function (state) {
	var self = this;
	Renderer.renderHistory(state);
};

HistoryController.prototype.viewingHistory = function () {
	var self = this;
	return self._viewingHistory;
};

});;"use strict"


/*
	@mapControllerInterface = {
			currentPlayerId(),
			attack(fromId, toId, callback(result_bool)),
			isThisPlayer(playerId),
			clickable(),
	}
*/
var Mapcontroller = function(playerId, map, mapControllerInterface) {
	Globals.ASSERT(Globals.implements(mapControllerInterface, Mapcontroller.mapControllerInterface));

	this._playerId = playerId;
	this._canvas = $('#c')[0];
	this._map = map;
	this._iface = mapControllerInterface;
	this._mouseOverCountry = null;
  	this._selectedCountry = null;

  	$('#canvas_div').click(this.click.bind(this));
  	$('#canvas3d_div').click(this.click.bind(this));
}

Mapcontroller.mapControllerInterface = {
	currentPlayerId: function(){},
	attack: function(fromId, toId, callback){},
	clickable: function(){}
}

$(function(){

	Mapcontroller.prototype.setPlayerId = function(id) { 
		this._playerId = id;
	};	
	Mapcontroller.prototype.getMouseOverCountry = function() { return this._mouseOverCountry; };
	Mapcontroller.prototype.setMouseOverCountry = function(country) {
		Globals.debug("SetMouseOverCountry", country ? country.id() : -1, Globals.LEVEL.INFO, Globals.CHANNEL.MAP_CONTROLLER);
		this._mouseOverCountry = country;
		Renderer.setMouseOverCountry(country ? country.id() : -1);
	};
	Mapcontroller.prototype.selectedCountry = function() { 
		return this._selectedCountry; 
	};
	Mapcontroller.prototype.setSelectedCountry = function(country) {
		Globals.debug("setSelectedCountry", country ? country.id() : -1, Globals.LEVEL.INFO, Globals.CHANNEL.MAP_CONTROLLER);
		this._selectedCountry = country;
		Renderer.setSelectedCountry(country ? country.id() : -1);
	};
	
	Mapcontroller.prototype.canAttack = function(country1, country2) {
		var self = this;
		if (!country1 || !country2 || country1.ownerId() == country2.ownerId()) {
			return false;
		}

		var neighborIds = self._map.adjacentCountries(country1.id());
		for (var i=0; i < neighborIds.length; i++) {
			if (neighborIds[i] == country2.id()) {
				return true;
			}
		};
		return false;
	};

	Mapcontroller.prototype.isCountryClickable = function(country) {
		if (!country || this._playerId != this._iface.currentPlayerId()) {
			return false;
		}
		
		// can always de-select
		if (this.selectedCountry() && country.id() == this.selectedCountry().id()) {
			return true;
		} else {
			//console.log("NOT currently selected country");
		}
		
		// user is choosing a country to attack from
		if (!this.selectedCountry() && country.ownerId() == this._iface.currentPlayerId() && country.numDice() > 1) {
			return true;
		} else {
			if (country.ownerId() != this._iface.currentPlayerId()) {
				Globals.debug("NOT this players' country", Globals.LEVEL.DEBUG, Globals.CHANNEL.MAP_CONTROLLER);
			}
			if (country.numDice() <= 1) {
				Globals.debug("NOT enough dice to attack", Globals.LEVEL.DEBUG, Globals.CHANNEL.MAP_CONTROLLER);
			}
		}
		
		// user is choosing a country to attack
		if (this.canAttack(this.selectedCountry(), country)) {
			return true;
		} 
		
		Globals.debug(country.id(), "NOT clickable", Globals.LEVEL.DEBUG, Globals.CHANNEL.MAP_CONTROLLER);
		return false;
	};
	
	// callback from renderer
	Mapcontroller.prototype.mouseOverCountry = function(id) {
		if (!this._iface.clickable()) {
			return;
		}

		var country = this._map.getCountry(id);
		if (country && this.isCountryClickable(country)) {
		
			if (this.getMouseOverCountry() !== country) {
				this.setMouseOverCountry(country);
				this._canvas.style.cursor = 'pointer';
				//this._iface.update();
			}
		} else {
      		if (this.getMouseOverCountry()) {
          		this.setMouseOverCountry(null);
      		}
			this._canvas.style.cursor = 'default';
			//this._iface.update();
		}
	};

	Mapcontroller.prototype.click = function(event) {
		if (!this._iface.clickable()) {
			return;
		}
		
		var self = this;
		var currentPlayerId = self._iface.currentPlayerId(); 
		if ( self._playerId != currentPlayerId) {
			// current player isn't human
			Globals.debug("current player isn't human", Globals.LEVEL.DEBUG, Globals.CHANNEL.MAP_CONTROLLER);
			if (self.selectedCountry()) {
				var prevCountry = self.selectedCountry();
				self.setSelectedCountry(null);
			}
			return;
		}

			
		var country = self.getMouseOverCountry();

		if (country && self.isCountryClickable(country)) {
			if (country.ownerId() == currentPlayerId && country.numDice() > 1) {  
				// Select and deselect of countries owned by this user.                  
				if (self.selectedCountry() == country) {
						self.setSelectedCountry(null);
				} else {
					var oldCountry = self.selectedCountry();
					self.setSelectedCountry(country);
				}
			} else {
				// Attacks.
				Globals.debug("attack issued", Globals.LEVEL.INFO, Globals.CHANNEL.MAP_CONTROLLER);
				var sel = self.selectedCountry();
				self.setSelectedCountry(null);
				self.setMouseOverCountry(null);
				self._iface.attack(sel, country, function() {
				self.setSelectedCountry(null);
				$('#end_turn').prop('disabled', false);
				});
			}
		} else {
			Globals.debug(country ? country.id() : 'null', "Country not clickable", Globals.LEVEL.DEBUG, Globals.CHANNEL.MAP_CONTROLLER);
		}
		           
	};

});

;'use strict'

/*========================================================================================================================================*/
	// SocketAIController: 	Implements Engine.ControllerInterface so AIWrapper can connect to it.
	// 						Implelments Engine.PlayerInterface so client can use it
	/*========================================================================================================================================*/

	var SocketAIController = function(socket, history, ai, playerId) {
		this._socket = socket;
		this._ai = ai;
		this._id = playerId;
		this._history = history;
		this._started = false;
		this._isMyTurn = false;
		this._startTurnPending = false;
		this._startTurnPendingStateId = -1;
		this._attackPending = false;
		this._aiWrapper = null;

		this.initAI();

		socket.on(Message.TYPE.START_TURN, this.start_turn.bind(this));
		socket.on(Message.TYPE.ATTACK_RESULT, this.attack_result.bind(this));

		Globals.ASSERT(Globals.implements(this, Engine.PlayerWrapper));
		Globals.ASSERT(Globals.implements(this, Engine.ControllerInterface));
	};

	SocketAIController.prototype.initAI = function() {
		if (this._aiWrapper) {
			this._aiWrapper.stop();
			this._aiWrapper = null;
		}
		this._aiWrapper = new AIWrapper(this._ai, this, this._id, false);
	};

	//
	// socket events
	//

	// @msg: {playerId:, stateId:}
	SocketAIController.prototype.start_turn = function(sock, msg) {
		if (msg.playerId == this._id) {
			this.startTurn(msg.stateId);
		} 
	};

	// @msg: {playerId:, success:, stateId:}
	SocketAIController.prototype.attack_result = function(sock, msg) {
		var self = this;
		if (msg.playerId == self._id && self._attackPending) {
			self._history.getState(msg.stateId, function(state) {
				self.attackDone(msg.success, msg.stateId);
			});
		}
	};

	//
	// Implementing the Engine::PlayerWrapper interface. These are called by Client.
	//

	SocketAIController.prototype.getName = function(){return this._aiWrapper.getName();};
	SocketAIController.prototype.isHuman = function(){return false;};
	SocketAIController.prototype.start = function(){
		if (!this._started) {
			this._started = true;
			this._aiWrapper.start();
			if (this._startTurnPending) {
				this._startTurnPending = false;
				this.startTurn(this._startTurnPendingStateId);
				this._startTurnPendingStateId = -1;
			}
		}
	};
	SocketAIController.prototype.stop = function(){
		this._started = false;
		this._isMyTurn = false;

		this._socket.removeListener(Message.TYPE.START_TURN, this.start_turn);
		this._socket.removeListener(Message.TYPE.ATTACK_RESULT, this.attack_result);
		
		this._aiWrapper.stop();
	};
	SocketAIController.prototype.startTurn = function(state_id){
		
		// The AI can't start until the map is downloaded, and sometimes the first
		// start_turn event from the server comes first. This is an attempt
		// to deal with that
		var self = this;
		if (self._started) {
			self._history.getState(state_id, function(state) {
				if (self._isMyTurn) {
					Globals.debug("Got startTurn when it was already our turn", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
				}
				self._isMyTurn = true;
				try {
					self._aiWrapper.startTurn(state);
				} catch (err) {
					// try to re-initialize AI
					Globals.debug("AIWrapper.startTurn exception. Attempting to re-initialize", err, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
					self.initAI();
					self._aiWrapper.start();
					self._aiWrapper.startTurn(state);
				}
			});
		} else {
			self._startTurnPending = true;
			self._startTurnPendingStateId = state_id;
		}
	};

	SocketAIController.prototype.attackDone = function(success, state_id){
		if (this._attackPending) {
			this._attackPending = false;
			try {
				this._aiWrapper.attackDone(success);
			} catch (err) {
				Globals.debug("AIWrapper.attackDone exception. Attempting to re-initialize", err, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
				self.initAI();
				self._aiWrapper.start();
				self.startTurn(state_id);
			}
		}
	};
	SocketAIController.prototype.turnEnded = function() {
		this._attackPending = false;
		this._isMyTurn = false;
		this._aiWrapper.turnEnded();
	};
	SocketAIController.prototype.loses = function(){this._aiWrapper.loses();};

	// Implementing the AIController interface. These functions are called by AIWrapper

	SocketAIController.prototype.map = function() {
		Globals.ASSERT(Client._map);
		return Client._map;
	};
		
	SocketAIController.prototype.getState = function() {
		return Client._history.getLatest();
	};

	SocketAIController.prototype.endTurn = function(playerId){
		if (this._isMyTurn) {
			this._isMyTurn = false;
			this._socket.sendEndTurn(this._id);
		} else {
			Globals.debug("AI tried to end turn when it wasn't our turn", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
		}
	};

	// @callback: function(success){}
	SocketAIController.prototype.attack = function(from, to, callback) {
		if (this._isMyTurn) {
			this._attackPending = true;
			this._socket.sendAttack(from.id(), to.id(), this._id);
		} else {
			Globals.debug("AI tried to attack when it wasn't our turn", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
		}
	};
;'use strict'

//--------------------------------------------------------------------------------------------------------------------
// AIWorker - this is a WebWorker that runs user-submitted code. It is loaded by an AIWrapper. The way it's specialized
// for a particular AI is a little unusual - I'm not sure if it's clever or just janky. Say the name of the AI class
// that we want to load is 'AIFoo'. The AIWrapper will create a WebWorker with the path "/aiworker/AIFoo", which
// is a route (currently) handled on the server by userAI.getAIWorker(). Before serving this file back, the server 
// does a String Replace of "_replaceThisWithAIHash_" (you'll see that string below) with "AIFoo". So you should
// obviously NEVER EDIT THE STRING '_replaceThisWithAIHash_'
//--------------------------------------------------------------------------------------------------------------------

if( 'function' === typeof importScripts) {

importScripts('/js/globals.js');
importScripts('/js/game/gamestate.js');
importScripts('/js/ai/util.js');
importScripts('/_replaceThisWithAIHash_'); /* NEVER EDIT THIS LINE */



var createAIByName = function(name, playerId) {
	return eval('ai'+name).create(playerId);
}

var adjacencyList = null;
var state = null;
var ai = null;
var attackCallback = null;


onmessage = function(e) {
	var data = e.data;

	switch (data.command) {
		case 'init':
			adjacencyList = data.adjacencyList;
			var playerId = data.playerId;
			ai = createAIByName(data.ai, playerId);
			break;
		case 'startTurn':
			state = Gamestate.deserialize(data.state);
			ai.startTurn(AIInterface());
			break;
		case 'attackResult':
			state = Gamestate.deserialize(data.state);
			attackCallback(data.result);
			break;
	}
	
}


var AIInterface = function() {
	return {
		adjacentCountries: function(countryId) { return adjacencyList[countryId];},
		getState: function() { return state; },
		attack: function(fromCountryId, toCountryId, callback) { 
			attackCallback = callback;	
			postMessage({command: 'attack', from: fromCountryId, to: toCountryId});
		},
		endTurn: function() { 
			postMessage({command: 'endTurn'});
		}
	};
};

};;if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Gamestate = require('./gamestate.js');
}

/*-----------------------------------------------------------------------------------------------
AIInterface - this is what gets passed to all AIs. 
-----------------------------------------------------------------------------------------------*/
var AIInterface = function(aiwrapper) {
	var controller = aiwrapper._controller;
	return {
		adjacentCountries: function(countryId) { return controller.map().adjacentCountries(countryId);},
		getState: function() { return controller.getState(); },
		attack: function(fromCountryId, toCountryId, callback) { 	
			aiwrapper.attack(fromCountryId, toCountryId, callback);
		},
		endTurn: function() { 
			aiwrapper.endTurn(); 
		}
	};
};


//--------------------------------------------------------------------------------------------------------------------
//	AIWrapper - implements Engine::PlayerInterface, which allows the engine to control us. This is an adapter class
//	between engine (or Client) and bots.
// 
// @ai: EITHER an AI class OR a string representing the id (hash) of an AI stored on the server. 
//		If it's a hash, then @name must be defined, and it will automatically assumed to be untrusted, 
//		regardless of the value of @trusted
//
// @test: true only if we're testing a submitted AI
//
// @controller: what this class calls back into to attack or end a turn. must implement Engine.ControllerInterface
//--------------------------------------------------------------------------------------------------------------------
var AIWrapper = function(ai, controller, playerId, test, name) {
	Globals.debug("AIWrapper()", (typeof ai == 'string') ? ai : ai.getName(), playerId, test, name, Globals.LEVEL.INFO, Globals.CHANNEL.AI_WRAPPER);
	Globals.ASSERT(Globals.implements(controller, Engine.ControllerInterface));
	this._test = test;
	this._isMyTurn = false;
	this._controller = controller;
	this._id = playerId;
	
	if (typeof ai === 'string') {
		Globals.ASSERT(name);
		this._trusted = false;
		this._ai = null;
		this._aiHash = ai;
		this._name = name;
	} else {
		this._trusted = true;
		this._name = ai.getName();
	}
	
	if (this._trusted) {
		this._ai = ai.create(playerId);
	}

	Globals.ASSERT(Globals.implements(this, Engine.PlayerInterface));
};



AIWrapper.prototype.getName = function() {
	return this._name;
};

AIWrapper.prototype.isHuman = function() {
	return false;
};

// from engine
AIWrapper.prototype.start = function() {
	Globals.debug("AIWrapper.start()", this._name, Globals.LEVEL.INFO, Globals.CHANNEL.AI_WRAPPER);
	if (!this._trusted) {

		// the difference between an AIWorker and a BotWorker is that user-submitted code must be run
		// in an AIWorker.

		if (this._aiHash) {
			// grab a specialized worker
			var workerPath = (this._test ? "/testworker/" : "/aiworker/") + this._aiHash;
			Globals.debug("Downloading new aiworker", workerPath, Globals.LEVEL.INFO, Globals.CHANNEL.AI_WRAPPER);
			this._worker = new Worker(workerPath);
		} else {
			Globals.debug("Creating new botworker", Globals.LEVEL.INFO, Globals.CHANNEL.AI_WRAPPER);
			this._worker = new Worker("/js/game/botworker.js");
		}
		
		this._worker.onmessage = this.callback.bind(this);
		this._worker.postMessage({
								command: 'init', 
								adjacencyList: this._controller.map().adjacencyList(), 
								ai: this._aiHash ? this._aiHash : this._name, 
								playerId: this._id});
	}
};

// from engine
AIWrapper.prototype.stop = function() {
	if (!this._trusted && this._worker) {
		this._worker.terminate();
		this._worker = null;
	}
};

// from engine
AIWrapper.prototype.startTurn = function(state) {
	Globals.ASSERT(!this._isMyTurn);
	this._isMyTurn = true;
	if (this._trusted) {
		Globals.ASSERT(this._ai);
		this._ai.startTurn(AIInterface(this));
	} else {
		Globals.ASSERT(this._worker);
		this._worker.postMessage({command: 'startTurn', state: state.serialize()});
	}
};

// from engine
AIWrapper.prototype.attackDone = function(success) {
	if (this._trusted) {
		this._aiCallback(success);
	} else {
		Globals.ASSERT(this._worker);
		this._worker.postMessage({command: 'attackResult', result: success, state: this._controller.getState().serialize()})
	}
};

// from engine
AIWrapper.prototype.turnEnded = function() {
	this._isMyTurn = false;
};

// from engine
AIWrapper.prototype.loses = function() {
	if (this._trusted) {
		this._ai = null;
	} else {
		this._worker.close();
		this._worker = null;
	}
};

// from AI
AIWrapper.prototype.endTurn = function() {
	if (this._isMyTurn) {
		this._isMyTurn = false;
		this._controller.endTurn();
	}
};

// from AI
AIWrapper.prototype.attack = function(from, to, callback) {
	if (this._isMyTurn) {
		this._aiCallback = callback;
		this._controller.attack(this._controller.map().getCountry(from), this._controller.map().getCountry(to), this.attackDone.bind(this));
	}
}

// from BotWorker
AIWrapper.prototype.callback = function(e) {
	if (this._isMyTurn) {
		var data = e.data;
		switch (data.command) {
			case 'attack':
				var from = parseInt(data.from);
				var to = parseInt(data.to);
				this._controller.attack(this._controller.map().getCountry(from), this._controller.map().getCountry(to), this.attackDone.bind(this));
				break;
			case 'endTurn':
				this._isMyTurn = false;
				this._controller.endTurn();
				break;
		}
	}
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = AIWrapper;
};'use strict'

//--------------------------------------------------------------------------------------------------------------------
// BotWorker - this is a WebWorker that runs the standard AI bots (not user-submitted code). It's only able to run
// classes that are specified in the 'importScripts' directives below.
//--------------------------------------------------------------------------------------------------------------------


if( 'function' === typeof importScripts) {

importScripts('/js/globals.js');
importScripts('/js/game/gamestate.js');
importScripts('/js/ai/util.js');
importScripts('/js/ai/plyer.js');
importScripts('/js/ai/greedy.js');
importScripts('/js/ai/aggressive.js');

var initAIs = function() {
	aiMap[AI.Plyer.getName()] = AI.Plyer;
	aiMap[AI.Greedy.getName()] = AI.Greedy;
	aiMap[AI.Aggressive.getName()] = AI.Aggressive;
};

var createAIByName = function(name, playerId) {
	return aiMap[name].create(playerId);
}

var adjacencyList = null;
var state = null;
var ai = null;
var attackCallback = null;
var aiMap = {};

initAIs();

onmessage = function(e) {
	var data = e.data;

	switch (data.command) {
		case 'init':
			adjacencyList = data.adjacencyList;
			var playerId = data.playerId;
			ai = createAIByName(data.ai, playerId);
			break;
		case 'startTurn':
			state = Gamestate.deserialize(data.state);
			ai.startTurn(AIInterface());
			break;
		case 'attackResult':
			state = Gamestate.deserialize(data.state);
			attackCallback(data.result);
			break;
	}
	
}


var AIInterface = function() {
	return {
		adjacentCountries: function(countryId) { return adjacencyList[countryId];},
		getState: function() { return state; },
		attack: function(fromCountryId, toCountryId, callback) { 
			attackCallback = callback;	
			postMessage({command: 'attack', from: fromCountryId, to: toCountryId});
		},
		endTurn: function() { 
			postMessage({command: 'endTurn'});
		}
	};
};

};;"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Hex = require('./hex.js');
}

var Country = function(id) {
        this._id = id; 
        this._hexIds = [];
        this._ownerId = -1;
        
        this._numDice = 1;

		Globals.debug("Constructed country", this, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        
    };

Country.MAX_HEXES = 100;
Country.MIN_HEXES = 30;

Country.prototype.clone = function() {
	var newCopy = new Country(this._id);
	newCopy._hexIds = JSON.parse(JSON.stringify(this._hexIds));
	newCopy._ownerId = this._ownerId;
	newCopy._numDice = this._numDice;
	return newCopy;
};

Country.prototype.getState = function() {
	var state = {
		id : this._id,
		owner: this._ownerId,
		numDice: this.numDice()
	};
	
	return state;
};

Country.prototype.setState = function(gamestate, id) {
	this._ownerId = gamestate.countryOwner(id);
	this.setNumDice(gamestate.countryDice(id));
};



Country.prototype.setOwner = function(ownerId) { 
	Globals.ASSERT(typeof ownerId !== 'object');
	this._ownerId = ownerId;
};
Country.prototype.setNumDice = function(num) { 
	Globals.ASSERT(num > 0 && num <= 8);
	this._numDice = num;
};

Country.prototype.id = function() { return this._id; };
Country.prototype.ownerId = function() { return this._ownerId; };
Country.prototype.hexes = function() { return this._hexIds; };
Country.prototype.isLake = function() { return this._isLake; };
Country.prototype.numDice = function() { return this._numDice; };


// Adds a die to the country.
Country.prototype.addDie = function() {
	if (this._numDice < 8) {
    	this._numDice++;
	}
};

Country.prototype.removeDie = function() {
	if (this._numDice > 1) {
    	this._numDice--;
	}
}




if (typeof module !== 'undefined' && module.exports){
	module.exports = Country;
}

;if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
	var Hex = require('./hex.js');
}


var Dir = {
        obj: {
            NW:     0,
            N:      1,
            NE:     2,
            SE:     3,
            S:      4,
            SW:     5,
        },

        array: [
            "NW", "N", "NE", "SE", "S", "SW"
        ],

        // Can the move be legally made? Do this separately from nextHex because the rules are somewhat complex
        // and different. Basically, it boils down to checking if it goes off an edge of the board (which means,
        // for example, NE and SE are the same).
        isLegal: function(hex, dir) {
            switch (dir) {
                case Dir.obj.N:
                case "N":
                    return hex.id() - (2 * Hex.NUM_WIDE) >= 0;

                case Dir.obj.NE:
                case "NE":
                case Dir.obj.SE:
                case "SE":
                    return ((hex.id() + 1) % (Hex.NUM_WIDE * 2));

                case Dir.obj.S:
                case "S":
                    return hex.id() + (2 * Hex.NUM_WIDE) < Hex.TOTAL_HEXES;

                case Dir.obj.NW:
                case "NW":
                case Dir.obj.SW:
                case "SW":
                    return (hex.id() % (Hex.NUM_WIDE * 2));

                default:
                    return false;
            }
        },

        // What is the hex you reach when you move a given direction from the current hex?
        nextHex: function(hex, dir, map) {

            // Is it an illegal direction? If so, just return null.
            if (!Dir.isLegal(hex, dir)) {
                return null;
            }

            var x = hex.x();
            var y = hex.y();

            var oldHexId = hex.id();
            var newHexId;

            // This is complicated because it has to look for edge conditions both N-S and E-W. The E-W direction
            // depends a bit on which row you're in. Only every other row can even have a problem.
            switch (dir) {
                case Dir.obj.NW: 
                case "NW":
                    newHexId = Math.floor(oldHexId / Hex.NUM_WIDE) % 2 ? oldHexId - Hex.NUM_WIDE : oldHexId - Hex.NUM_WIDE - 1;
                    break;

                case Dir.obj.N:
                case "N":
                    newHexId = oldHexId - (2 * Hex.NUM_WIDE);
                    break;

                case Dir.obj.NE:
                case "NE":
                    newHexId = Math.floor(oldHexId / Hex.NUM_WIDE) % 2 ? oldHexId - Hex.NUM_WIDE + 1 : oldHexId - Hex.NUM_WIDE;
                    break;

                case Dir.obj.SE:
                case "SE":
                    newHexId = Math.floor(oldHexId / Hex.NUM_WIDE) % 2 ? oldHexId + Hex.NUM_WIDE + 1 : oldHexId + Hex.NUM_WIDE;
                    break;

                case Dir.obj.S:
                case "S":
                    newHexId = oldHexId + (2 * Hex.NUM_WIDE);
                    break;

                case Dir.obj.SW:
                case "SW":
                    newHexId = Math.floor(oldHexId / Hex.NUM_WIDE) % 2 ? oldHexId + Hex.NUM_WIDE : oldHexId + Hex.NUM_WIDE - 1;
                    break;    

            }
            return map.getHex(newHexId);
        }
    };

	if (typeof module !== 'undefined' && module.exports){
		module.exports = Dir;
	};"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Map = require('./map.js');
	var Country = require('./country.js');
	var Player = require('./player.js');
	var Gamestate = require('./gamestate.js');
	var AIWrapper = require('./aiwrapper.js');
}

var MOVE_TIME_BUDGET = 2000; // each player gets 2 seconds per turn

var Engine = function() {
	this._AIs = null;
	this._currentPlayerId = 0;
	this._gameOver = false;
	this._history = [];
	this._players = [];
	this._gameCallback = null; 	// called when game is over
	this._stateCallback = null;	// called whenever the state updates
	this._attackCallback = null; // call AIs back with attack results
	this._keepHistory = true;
	this._stateCount = 0;
	this._initialized = false;
	this._map = null;
	this._enforceTimeLimits = false;

	Globals.ASSERT(Globals.implements(this, Engine.ControllerInterface))
};

// This is what must be passed into init(). This interface allows the Engine to control bots
// and human players
Engine.PlayerInterface = {
	getName: function(){return "human";},
	isHuman: function(){return true;},
	start: function(){},
	stop: function(){},
	startTurn: function(state){},
	attackDone: function(success, stateId){},
	turnEnded: function() {},
	loses: function(){}
};

// Engine implements this. This allows bots to call back into the Engine.
Engine.ControllerInterface = {
	map: function(){},
	getState: function(){},
	endTurn: function(){},
	attack: function(from, to, callback){} // callback: function(success){}
};
        
Engine.prototype.map = function() { return this._map; };
Engine.prototype.getPlayer = function(id) { return this._players[id]; };
Engine.prototype.currentPlayer = function() { return this._players[this._currentPlayerId]; };
Engine.prototype.currentPlayerId = function() { return this._currentPlayerId; };
Engine.prototype.isInitialized = function() {return this._initialized;};
Engine.prototype.setKeepHistory = function(keep) { this._keepHistory = keep;};	
Engine.prototype.setEnforceTime = function(enforce) { this._enforceTimeLimits = enforce;};	
Engine.prototype.currentStateId = function() {
	if (this._history.length) {
		return this._history[this._history.length-1].stateId();
	} else {
		return 0;
	}
};

Engine.prototype.setCurrentPlayer = function(id) {
	Globals.debug("Current player set to " + id, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
	this._currentPlayerId = id;
};


// @players =  array[object] of PlayerInterface
Engine.prototype.init = function(players, initialMap /*optional*/) {
	console.time("DICEFIRE");
	players.forEach(function(ai) {
		Globals.ASSERT(Globals.implements(ai, Engine.PlayerInterface));
	});
	Globals.debug("Engine init", players.map(function(player) {return player.getName();}), Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	
	self._history = [];
	self._stateCount = 0;
	self.setCurrentPlayer(0);
	self._gameOver = false;
	self._gameCallback = null;
	self._stateCallback = null;
	if (self._AIs){
		self._AIs.forEach(function(ai) {
			ai.stop();
		});
	}
	self._AIs = [];
	self._AIs.length = players.length;
	
	self._players = [];
	for (var i=0; i < players.length; i++) {
		self._players.push(new Player(i, self));
		self._AIs[i] = players[i];
	}


	self._map = new Map();
	if (initialMap) {
		Globals.debug("Using provided map", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
		self._map.deserializeHexes(initialMap);
	} else {
		self._map.generateMap();
		Globals.debug("Map: " + self._map.serializeHexes(), Globals.LEVEL.TRACE, Globals.CHANNEL.ENGINE);
	}
	self._map.assignCountries(self._players);

	
	self._initialized = true;	
};
		
// @cb: function(gamestate, index){}
Engine.prototype.registerStateCallback = function(cb) {
	this._stateCallback = cb;
};

// @callback = function(winningAI, winningID), called when game is over
Engine.prototype.registerGameCallback = function(cb) {
	this._gameCallback = cb;
};

// if an initialState is passed in, the engine will broadcast an initial 0-dice state when
// this fn is called. So be sure to call registerStateCallback() first if you're
// interested in it.
Engine.prototype.setup = function(initialState /*optional*/) {
	Globals.debug("Engine setup", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	
	// start the AIs - this has to happen after the map is initialized
	self._AIs.forEach(function(ai) {
		ai.start();
	});
	
	if (initialState) {
		Globals.debug("Using provided initial state", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
		self.deserialize(JSON.parse(initialState));
	} else {

		// send out a pre-dice state
		self.pushHistory();
		
		// assign initial dice
		self._players.forEach(function(player) {
			self.addDiceToPlayer(player, Globals.startingDice);
		});
	}
		
	self._players.forEach(function(player) {
		player.updateStatus(self._map);
	});
};

// @attack (optional):  {
//	fromCountryId: fromCountry._id,
//	toCountryId: toCountry._id,
//	fromRollArray: fromRollArray,
//	toRollArray: toRollArray
// } 
Engine.prototype.pushHistory = function(attack){
	var self = this;
	var stateId = self._stateCount;
	self._stateCount ++;
	var state = new Gamestate(self._players, self._map._countryArray, self._currentPlayerId, stateId);
	if (attack) {
		state.setAttack(attack);
	}
	
	if (self._keepHistory) {
		self._history.push(state);
	} else {
		self._history = [state];
	}
	
	if (self._stateCallback) {
		self._stateCallback(state, stateId);
	}
};


// Give dice to a player. In all cases, the dice go to random
// countries
Engine.prototype.addDiceToPlayer = function(player, num) {
	
	var self = this;
	
	// Make stored dice available for distribution.
	num += player._storedDice;
	player._storedDice = 0;

	var countriesWithSpace;
	for (var i = 0; i < num; i++) {
		// Have to do this again and again because countries may fill up.
 		countriesWithSpace = player.countriesWithSpace(self._map);
 		if (countriesWithSpace.length == 0) {
 			player._storedDice += num - i;
 			if (player._storedDice > Globals.maxStoredDice) {
 				player._storedDice = Globals.maxStoredDice;
 			}
 			break;
 		}
 		var country = countriesWithSpace[Math.floor(Math.random() * countriesWithSpace.length)];
		country.addDie();
	}
};

Engine.prototype.isHuman = function(playerId) {
	return this._AIs[playerId].isHuman();
};

Engine.prototype.startTurn = function(playerId, callback) {
	Globals.debug("Player " + playerId + " starting turn", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	self.setCurrentPlayer(playerId);
	self.pushHistory();

	self._timeout(function() {
		if (!self.isHuman(playerId) && self._enforceTimeLimits) {
			self._players[playerId].setTimeBudget(MOVE_TIME_BUDGET);
			self._startClock(playerId);
		}
		self._AIs[self._currentPlayerId].startTurn(self.getState())
		self._players[self._currentPlayerId].turnStarted();
	}, 0);

};

Engine.prototype.endTurn = function() {
	Globals.debug("Player " + this._currentPlayerId + " ending turn", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	var self = this;
	self._stopClock(self._currentPlayerId);
	var cur = self._currentPlayerId;
	var player = self._players[self._currentPlayerId];
	self.addDiceToPlayer(player, player._numContiguousCountries);
	self._players[self._currentPlayerId].turnEnded();
	
	// go to the next player that hasn't lost
	do {
		cur++;
		if (cur >= self._AIs.length) {
			cur = 0;
		}
	} while (this._players[cur].hasLost() && cur !== self._currentPlayerId);

	if (cur == self._currentPlayerId) {
		self.gameOver(player);
	} else {
		self.startTurn(cur);
	}
};


Engine.prototype.attack = function(fromCountry, toCountry, callback) {
	var self = this;
	
	if (typeof fromCountry === 'number') {
		fromCountry = self._map.getCountry(fromCountry); 
	}
	if (typeof toCountry === 'number') {
		toCountry = self._map.getCountry(toCountry); 
	}
	
	var fromPlayer = self._players[fromCountry.ownerId()];
	var toPlayer = self._players[toCountry.ownerId()];

	if (fromPlayer.id() != self._currentPlayerId) {
		Globals.debug("Attacking player not current player", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		if (self._attackCallback) {
			self._attackCallback(false, self.currentStateId());
		}
		return;
	}

	Globals.debug("Attack FROM", fromCountry._id, "TO", toCountry._id, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
	
	self._stopClock(self._currentPlayerId);

	self._attackCallback = callback;
	
	// make sure the 2 countries are next to each other
	var neighbors = self._map.adjacentCountries(fromCountry.id());
	var ok = false;
	for (var i=0; i < neighbors.length; i++) {
		if (neighbors[i] == toCountry.id()) {
			// countries aren't neighbors
			ok = true;
			break;
		}
	}
	
	// make sure attacker has at least 2
	if (fromCountry.numDice() < 2) {
		Globals.debug("Attacking country has too few dice", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		ok = false;
	}
	
	if (fromCountry.ownerId() == toCountry.ownerId()) {
		Globals.debug("Player attacking itself", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		ok = false;
	}
	
	if (fromCountry.id() == toCountry.id()) {
		Globals.debug("Country attacking itself", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		ok = false;
	}

	if (!ok) {
		//Globals.ASSERT(false);
		Globals.debug("Illegal attack", fromCountry.id(), toCountry.id(), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		if (self._attackCallback) {
			self._attackCallback(false, self.currentStateId());
		}		
		self._startClock(self._currentPlayerId);
		
	} else {
		var fromNumDice = fromCountry.numDice();
		var toNumDice = toCountry.numDice();
		var fromRollArray = Player.rollDice(fromNumDice);
		var toRollArray = Player.rollDice(toNumDice);

		Globals.ASSERT(fromRollArray && fromRollArray.length > 1);
		Globals.ASSERT(fromNumDice == fromRollArray.length);
		
		Globals.debug("Attack roll", fromRollArray, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		Globals.debug("Defend roll", toRollArray, Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);

		var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; }, 0);
		var toRoll = toRollArray.reduce(function(total, die) { return total + die; }, 0);

		var attack = {
			fromCountryId: fromCountry._id,
			toCountryId: toCountry._id,
			fromRollArray: fromRollArray,
			toRollArray: toRollArray
		}
	
		self.pushHistory(attack);
	
		// Note that ties go to the toCountry. And, no matter what happens, the fromCountry
		// goes down to 1 die.
		fromCountry.setNumDice(1);

		if (fromRoll > toRoll) {
			Globals.debug("Attacker wins", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
			var oldOwner = self._players[toCountry.ownerId()];
			toCountry.setNumDice(fromNumDice - 1);
			fromPlayer.addCountry(toCountry);
			oldOwner.loseCountry(toCountry);
			oldOwner.updateStatus(self._map);
			fromPlayer.updateStatus(self._map);
			
			Globals.debug("Losing player has " + oldOwner.countryCount() + " countries left", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
			
			if (oldOwner.hasLost()) {
				Globals.debug("Player " + oldOwner.id() + " has lost and can no longer play", Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
			}
			

			if (fromPlayer.countryCount() == self._map.countryCount()) {
				self.gameOver(fromPlayer);
				return;
			}
		} else {
			Globals.debug("Attacker loses", Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);
		}
		
		// attack is done, save to history
		self.pushHistory();
		self._startClock(self._currentPlayerId);
		if (self._attackCallback) {
			var temp = self._attackCallback;
			self._attackCallback = null;
			temp(fromRoll > toRoll, self.currentStateId());
		}
	}
};

Engine.prototype.penalizePlayer = function(id) {
	var self = this;
	if (!self._enforceTimeLimits) {
		return;
	}

	if (id == self._currentPlayerId) {
		if (!self._AIs[id].isHuman()) {
			if (Globals.timePenalties) {
				Globals.debug("Penalizing player", id, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
				var player = self._players[id];

				// remove stored dice first
				if (player.storedDice()) {
					player.removeStoredDie();
				} else {
					// get list of countries for this player that have at least 2 die
					var countries = player.countries().map(function(countryId) {
						return self._map.getCountry(countryId);
					}).filter(function(country) {
						return (country.numDice() > 1);
					});

					if (countries.length) {
						// randomly pick a country
						var idx = Math.floor(countries.length * Math.random());
						Globals.debug("Removing die from country", countries[idx].id(), Globals.LEVEL.DEBUG, Globals.CHANNEL.ENGINE);		
						countries[idx].removeDie();
					} else {
						Globals.debug("Player has no more dice to remove", id, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);	
						self._AIs[id].turnEnded();
						self.endTurn();	
					}
				}
			} else {
				Globals.debug("Player over time limit - ending turn", id, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);	
				self._AIs[id].turnEnded();
				self.endTurn();	
			}
		}

	} else {
		Globals.debug("PenalizePlayer called for non-current player", id, Globals.LEVEL.WARN, Globals.CHANNEL.ENGINE);
	}
};

// Called when an attack ends the game.
Engine.prototype.gameOver = function(winner) {
	var self = this;
	if (!self._gameOver) {
		console.log("GAME OVER");
		self.pushHistory();
		self._gameOver = true;
		console.timeEnd("DICEFIRE");
		
		// shut down all of the AIs
		self._AIs.forEach(function(ai) {
			if (ai && ai instanceof AIWrapper) {
				ai.stop();
			}
		});
	
		if (self._gameCallback) {
			self._gameCallback(self._AIs[winner.id()].getName(), winner.id());
		}
	}
};

Engine.prototype.isGameOver = function() {
	return this._gameOver;
};

Engine.prototype.deserialize = function(state) {	
	var gamestate = Gamestate.deserialize(state);
	this.setState(gamestate);
};

Engine.prototype.serializeMap = function() {
	return this._map.serializeHexes();
};

Engine.prototype.historyLength = function() {
	return this._history.length;
};

Engine.prototype.getHistory = function(index) {
	if (index >= 0 && index < this._history.length) {
		return this._history[index];
	} else {
		return new Gamestate();
	}
};
	
Engine.prototype.getState = function() {
	if (this._history.length) {
		return this._history[this._history.length-1];
	} else {
		return null;
	}
};

Engine.prototype.setState = function(gamestate) {
	var self = this;
	self._map.setState(gamestate);
	
	self._players = [];
	self._players.length = gamestate.playerIds().length;
	gamestate.playerIds().forEach(function(playerId) {
		var player = new Player(playerId, self);
		player._countries = [];
		gamestate.countryIds().forEach(function(countryId) {
			var country = self._map.getCountry(countryId);
			if (country.ownerId() == playerId) {
				player._countries.push(countryId);
			}
		});
		player._storedDice = gamestate.storedDice(playerId);
		player._numContiguousCountries = gamestate.numContiguous(playerId);
		self._players[playerId] = player;
		Globals.debug("Deserialized player", playerId, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	});
	
	self._stateCount = gamestate.stateId();
	self.setCurrentPlayer(gamestate.currentPlayerId());
};

// unittest accessors
Engine.prototype.playerCount = function() {
	return this._players ? this._players.length : 0;
};

Engine.prototype.playerCountryCount = function(id) {
	return this._players[id]._countries.length;
};

Engine.prototype.totalCountryCount = function() {
	return this._map.countryCount();
};

Engine.prototype._timeout = function(callback, interval) {
	if (typeof module !== 'undefined' && module.exports) {
		return setTimeout(callback, interval);
	} else {
		return window.setTimeout(callback, interval);
	}
};

Engine.prototype._startClock = function(playerId) {
	var self = this;
	if (self._enforceTimeLimits && !self._AIs[playerId].isHuman()) {
		self._players[playerId].startClock();
	}
};

Engine.prototype._stopClock = function(playerId) {
	var self = this;
	if (self._enforceTimeLimits && !self._AIs[playerId].isHuman()) {
		self._players[playerId].stopClock();
	}
};


if (typeof module !== 'undefined' && module.exports) {
	module.exports = Engine;
};"use strict"

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals');
};


// @playerInfos = array[{id: , avgTime:, }]
var Gameinfo = function(playerInfos, winnerId) {

	Globals.ASSERT(playerInfos[0] instanceof Object);
	Globals.ASSERT(playerInfos[0].hasOwnProperty('id'));
	var self = this;

	if (typeof winnerId !== 'undefined') {
		self.winner = winnerId;
	}

	self.players = [];
	self.playerMap = {}; // playerId to array index
	playerInfos.forEach(function(info, idx) {
		self.players.push(JSON.parse(JSON.stringify(info)));
		self.playerMap[info.id] = idx;
	});
};

Gameinfo.prototype.getWinner = function() {
	return this.winner;
};

Gameinfo.prototype.setPlayerName = function(id, name) {
	if (id < this.players.length) {
		this.players[id].id = name;
	}
};

Gameinfo.prototype.getPlayers = function() {
	return this.players.map(function(info) {
		return info.id;
	});
};

Gameinfo.prototype.avgTime = function(playerIdx) {
	return this.players[playerIdx].avgTime;
};

Gameinfo.prototype.setTimestamp = function(time) {
	this.timestamp = time;
};

Gameinfo.prototype.getTimestamp = function() {
	return this.timestamp; 
};

Gameinfo.prototype.setEloPreRating = function(playerId, rating) {
	var idx = this.playerMap[playerId];
	if (typeof idx == 'number' && this.players[idx]) {
		this.players[idx].eloPreRating = rating;
	}
};

Gameinfo.prototype.setEloPostRating = function(playerId, rating) {
	var idx = this.playerMap[playerId];
	if (typeof idx == 'number' && this.players[idx]) {
		this.players[idx].eloPostRating = rating;
	}
};

Gameinfo.prototype.getEloPostRating = function(playerId) {
	var idx = this.playerMap[playerId];
	if (typeof idx == 'number' && this.players[idx]) {
		return this.players[idx].eloPostRating;
	}
};

Gameinfo.prototype.hasBeenRated = function() {
	return (this.players[0] && this.players[0].eloPostRating);
};

Gameinfo.prototype.serialize = function() {
	var ret = {
		winner: this.winner,
		players: JSON.parse(JSON.stringify(this.players)),
		timestamp: this.timestamp ? this.timestamp : 0,
	};
	return ret;
};

Gameinfo.deserialize = function(obj) {
	if (obj && obj.players) {
		var gi = new Gameinfo(obj.players, obj.winner);
		gi.timestamp = obj.timestamp ? obj.timestamp : 0;
		return gi;
	} else {
		return null;
	}
};

Gameinfo.prototype.toString = function() {
	return JSON.stringify(this.serialize());
};

Gameinfo.fromString = function(str) {
	return Gameinfo.deserialize(JSON.parse(str));
};

if (typeof module !== 'undefined' && module.exports){
	module.exports = Gameinfo;
};;"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Hashes = require('jshashes');
}

if (Hashes) {
	var SHA1 = new Hashes.SHA1();
}

var Gamestate = function(players, countries, currentPlayerId, stateId, attack) {
	var self = this;
	self._currentPlayerId = typeof currentPlayerId === 'undefined' ? -1 : currentPlayerId;
	self._players = {};
	self._countries = {};
	self._stateId = stateId;
	self._attack = null;
	if (players) {
		players.forEach(function(player) {
			self._players[player.id()] = {
				id: player.id(),
				hasLost: player.hasLost(),
				storedDice: player.storedDice(),
				numContiguousCountries: player.numContiguousCountries()
			};
		});
	}
	if (countries) {
		countries.forEach(function(country) {
			self._countries[country.id()] = {
				id: country.id(),
				owner: country.ownerId(),
				numDice: country.numDice()
			};
		});
	}
	if (attack) {
		Globals.ASSERT(attack.fromCountryId >= 0);
		self._attack = attack;
	}
};

Gamestate.prototype.serialize = function() {
	return JSON.parse(this.toString());
};

Gamestate.deserialize = function(state) {
	var gamestate = Gamestate.prototype.clone.call(state);
	return gamestate;
};

Gamestate.prototype.clone = function() {
	var copy = new Gamestate();
	copy._currentPlayerId = this._currentPlayerId;
	copy._stateId = this._stateId;
	copy._players = JSON.parse(JSON.stringify(this._players));
	copy._countries = JSON.parse(JSON.stringify(this._countries));
	copy._attack = this._attack ? JSON.parse(JSON.stringify(this._attack)) : null;
	
	if (copy._players) {
		Object.keys(copy._players).forEach(function(player) {
			if (player.hasLost === "true") {
				player.hasLost = true;
			} else if (player.hasLost === "false") {
				player.hasLost = false;
			}
		});
	}
	return copy;
};

Gamestate.prototype.toString = function() {
	return JSON.stringify(this);
};



Gamestate.prototype.playerCountries = function(playerId) {
	var self = this;
	var ret = {};
	var last = -1;
	Object.keys(self._countries).forEach(function(countryId) {
		countryId = Number(countryId);
		Globals.ASSERT(last < countryId);
		last = countryId;
		if (self._countries[countryId].owner == playerId) {
			ret[countryId] = countryId;
		};
	});
	return ret;
};

Gamestate.prototype.playerIds = function() {return Object.keys(this._players);};
Gamestate.prototype.players = function() {return this._players;};

Gamestate.prototype.stateId = function() {return this._stateId;};

Gamestate.prototype.currentPlayerId = function() {return this._currentPlayerId;};
Gamestate.prototype.setCurrentPlayerId = function(id) {this._currentPlayerId = id;};

Gamestate.prototype.playerHasLost = function(id) {return this._players[id].hasLost;};
Gamestate.prototype.setPlayerHasLost = function(id, lost) {this._players[id].hasLost = lost;};

Gamestate.prototype.storedDice = function(playerId) {return this._players[playerId].storedDice;};
Gamestate.prototype.setPlayerHasLost = function(playerId, count) {this._players[playerId].storedDice = count;};

Gamestate.prototype.storedDice = function(playerId) {return this._players[playerId].storedDice;};
Gamestate.prototype.setPlayerHasLost = function(playerId, count) {this._players[playerId].storedDice = count;};

Gamestate.prototype.numContiguous = function(playerId) {return this._players[playerId].numContiguousCountries;};
Gamestate.prototype.setNumContiguous = function(playerId, count) {this._players[playerId].numContiguousCountries = count;};


Gamestate.prototype.countryIds = function() {return Object.keys(this._countries);};
Gamestate.prototype.countries = function() {
	if (!this._countries) {
		this._countries = {};
	} 
	
	return JSON.parse(JSON.stringify(this._countries));
};

Gamestate.prototype.countryOwner = function(countryId) {
	Globals.ASSERT(this._countries[countryId]);
	return this._countries[countryId].owner;
};
Gamestate.prototype.setCountryOwner = function(countryId, owner) {
	this._countries[countryId].owner = owner;
};

Gamestate.prototype.countryDice = function(countryId) { return this._countries[countryId].numDice;};
Gamestate.prototype.setCountryDice = function(countryId, count) {
	//Globals.ASSERT(count > 0 && count <= 8);
	this._countries[countryId].numDice = count;
};

Gamestate.prototype.setAttack = function(attack) {
	Globals.ASSERT(attack.fromCountryId >= 0);
	this._attack = attack;
}
Gamestate.prototype.attack = function() {
	if (this._attack) {
		return JSON.parse(JSON.stringify(this._attack));
	} else {
		return null;
	}
};

Gamestate.prototype.playerHash = function(playerId) {
	if (this._players && this._players[playerId] && SHA1) {
		return SHA1.hex(JSON.stringify(this._players[playerId]));
	} else {
		return -1;
	}
};


Gamestate.prototype.countryHash = function(countryId) {
	if (this._countries[countryId] && SHA1) {
		return SHA1.hex(JSON.stringify(this._countries[countryId]));
	} else {
		return -1;
	}
};

Gamestate.prototype.countriesHash = function() {
	return SHA1 ? SHA1.hex(JSON.stringify(this._countries)) : -1;
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Gamestate;
};"use strict"

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
}


var Hex = function(id, x, y, countryId, edgeDirections) {    
		this._id = id;
        this._x = this._id % Hex.NUM_WIDE;
        this._y = Math.floor(this._id / Hex.NUM_WIDE);
        this._countryId = -1;
        this._pruned = false;
        this._countryEdgeDirections = [];
		if (typeof x !== 'undefined') {
			this._x = x;
		}
		if (typeof y !== 'undefined') {
			this._y = y;
		}
		if (typeof countryId !== 'undefined') {
			this._countryId = countryId;
		}
		if (typeof edgeDirections !== 'undefined') {
			this._countryEdgeDirections = edgeDirections;
		}
		Globals.debug("Constructed hex", this, Globals.LEVEL.TRACE, Globals.CHANNEL.HEX);
    };


Hex.BORDER_THICKNESS = 3;
Hex.EDGE_LENGTH = 8;
Hex.HEIGHT = Hex.EDGE_LENGTH * Math.sqrt(3);
Hex.TOP_LEFT_X = 10;
Hex.TOP_LEFT_Y = 10;
Hex.NUM_WIDE = 40;
Hex.NUM_HIGH = 80;
Hex.TOTAL_HEXES = Hex.NUM_WIDE * Hex.NUM_HIGH;
// The fudge was selected to make it look nice :-)
Hex.FUDGE = 0.5;


Hex.prototype.clone = function() { 
	var newCopy = new Hex(this._id, this._x, this._y, JSON.parse(JSON.stringify(this._countryEdgeDirections)));
	newCopy._countryId = this._countryId;
	return newCopy;
};
Hex.prototype.id = function() { return this._id; };
Hex.prototype.x = function() { return this._x; };
Hex.prototype.y = function() { return this._y; };
Hex.prototype.hasCountry = function() { return (this._countryId != -1); };

Hex.prototype.setCountry = function(country) { 
	Globals.debug("Set country for hex", this, country, Globals.LEVEL.TRACE, Globals.CHANNEL.HEX);
	this._countryId = country ? country._id : -1;
};

Hex.prototype.countryId = function() {return this._countryId;};

// The directions which are boundaries between this cell and another country or the edge of the board.
Hex.prototype.setCountryEdgeDirections = function(array) { 
	Globals.debug("Set countryEdgeDirections", this, array, Globals.LEVEL.TRACE, Globals.CHANNEL.HEX);
	this._countryEdgeDirections = array; 
};
Hex.prototype.countryEdgeDirections = function() { return this._countryEdgeDirections; };


Hex.prototype.isInterior = function() {
    return this._countryEdgeDirections.length === 0;
};

Hex.prototype.isExterior = function() {
    return this._countryEdgeDirections.length > 0;
};




Hex.prototype.center = function() {
    var pos = this.upperLeft();
    pos[0] += Math.floor(Hex.EDGE_LENGTH / 2);
    pos[1] += Math.floor(Hex.HEIGHT / 2);
    return pos;
}



Hex.prototype.upperLeft = function() {
    var upperLeftX, upperLeftY;
    var y;

    if (this._y % 2) {
        y = Math.floor(this._y / 2);
        upperLeftX = Hex.TOP_LEFT_X + (Hex.EDGE_LENGTH * ((this._x + 0.5) * 3));
        upperLeftY = Hex.TOP_LEFT_Y + (y + 0.5) * Hex.HEIGHT;

    } else {
        y = this._y / 2;
        upperLeftX = Hex.TOP_LEFT_X + (Hex.EDGE_LENGTH * this._x * 3);
        upperLeftY = Hex.TOP_LEFT_Y + y * Hex.HEIGHT;
    }

    return [upperLeftX, upperLeftY];
}

if (typeof module !== 'undefined' && module.exports){
	module.exports = Hex;
};"use strict"

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
	var Dir = require('./dir.js');
	var Hex = require('./hex.js');
	var Country = require('./country.js');
}

var Map = function() {
	this._hexArray = [];
	this._countryArray = [];
	this._adjacencyList = {}; // countryId: [neighborId, ...]
};

Map.prototype.clone = function() {
	var newCopy = new Map();
	newCopy._hexArray = this._hexArray.map(function(h){return h.clone();});
	newCopy._countryArray = this._hexArray.map(function(c){return c.clone();});
	newCopy._adjacencyList = JSON.parse(JSON.stringify(this._adjacencyList));
	return newCopy;
};


Map.prototype.getHex = function(id) {
	if (id < 0 || id >= this._hexArray.length) {
		return null;
	}
	if (this._hexArray[id] === null) {
		Globals.debug("Nonexistant hex requested", id, Globals.LEVEL.WARN, Globals.CHANNEL.MAP);
		return null;
	}
	
	return this._hexArray[id];
};

Map.prototype.countryHexes = function(countryId) {
	var country = this.getCountry(countryId);
	if (country) {
		return country.hexes();
	} else {
		return [];
	}
};

Map.prototype.getCountry = function(id) {
	if (id < 0 || id >= this._countryArray.length) {
		return null;
	}
	if (this._countryArray[id] === null) {
		Globals.debug("Nonexistant country requested", id, Globals.LEVEL.WARN, Globals.CHANNEL.MAP);
		return null;
	}
	
	return this._countryArray[id];
};

Map.prototype.countryCount = function() {
	return this._countryArray.length;
};

Map.prototype.adjacentCountries = function(countryId) {
	return this._adjacencyList[countryId];
};

Map.prototype.adjacencyList = function() {
	return this._adjacencyList;
};

Map.prototype.serializeHexes = function() {
	// only save hexes which are assigned to countries
	return JSON.stringify(this._hexArray.filter(function(hex){
		return (hex.countryId() >= 0);
	}));
};

Map.prototype.deserializeHexes = function(json) {
	var self = this;
	
	self._countryArray = [];
	self._hexArray = [];
	
	var temp = {};
	var hexes = JSON.parse(json);
	var hexMap = {};
	hexes.forEach(function(h) {
		if (h && h.hasOwnProperty('_id')) {
			hexMap[h._id] = h;
		}
	});
	
	for (var i = 0; i < Hex.TOTAL_HEXES; i++) {
		var hex;
		if (hexMap.hasOwnProperty(i)) {
			var h = hexMap[i];
			hex = new Hex(h._id, h._x, h._y, h._countryId, h._countryEdgeDirections);
		} else {
        	hex = new Hex(i);
		}
		self._hexArray[i] = hex;
		
		if (hex.countryId() >= 0) {
			if (!temp[hex.countryId()]) {
				temp[hex.countryId()] = new Country(hex.countryId());
			}
			temp[hex.countryId()].hexes().push(hex.id());
		}
    }
	
	self._countryArray.length = Object.keys(temp).length;
	Object.keys(temp).forEach(function(id) {
		self._countryArray[id] = temp[id];
	});
	
	self._countryArray.forEach(function(country) {
		self.setupCountryEdges(country);
	});
};

Map.prototype.getState = function() {
	var state = [];
	this._countryArray.forEach(function(country) {
		state.push(country.getState());
	});
	return state;
};

Map.prototype.setState = function(gamestate) {
	var self = this;
	gamestate.countryIds().forEach(function(countryId) {
		self._countryArray[countryId].setState(gamestate, countryId);
	});
};
	
Map.prototype.generateMap = function(players) {
	var self = this;
	for (var i=0; i < this._countryArray.length; i++) {
		this._countryArray[i]._hexIds = [];
		delete this._countryArray[i];
	}
	for (var i=0; i < this._hexArray.length; i++) {
		delete this._hexArray[i];
	}
	this._adjacencyList = {};
	this._countryArray = [];
	this._hexArray = [];
	
    for (var i = 0; i < Hex.TOTAL_HEXES; i++) {
        this._hexArray.push(new Hex(i));
    }
    Globals.debug("Created hexes ", JSON.stringify(this._hexArray), Globals.LEVEL.TRACE, Globals.CHANNEL.MAP);
	
    this.pruneEdges();

	var country = new Country(this._countryArray.length);
	this._countryArray.push(country);
	var startHex = null;
	while(!startHex || startHex._pruned) {
		startHex = this._hexArray[Math.floor(Math.random() * this._hexArray.length)];
	}
	this.landGrab(startHex, country);

	for (var i = 0; i < Globals.numCountries - 1; i++) {
		var countryStart = Math.floor(Math.random() * this._countryArray.length);
		var adjacentHex;

		for (var j = 0; j < this._countryArray.length; j++) {
			var country = this._countryArray[(j + countryStart) % this._countryArray.length];
			if (country.isLake()) {
				continue;
			}
			adjacentHex = self.findAdjacentHex(country);
			if (adjacentHex) {
				break;
			}
		}
		if (!adjacentHex) {
			Globals.debug("RAN OUT OF SPACE! ", i, "recursing", Globals.LEVEL.WARN, Globals.CHANNEL.MAP);
			// this happens pretty rarely. just try again.
			return self.generateMap(players);
		}
		var newCountry = new Country(this._countryArray.length);
		this._countryArray.push(newCountry);
		this.landGrab(adjacentHex, newCountry);
		if (newCountry.isLake()) {
			i--;
		}
	}

	Globals.debug("Created countries ", JSON.stringify(this._countryArray), Globals.LEVEL.TRACE, Globals.CHANNEL.MAP);		

	// Finds all hexes which are alone and absorbs them into a nearby country. Do this because
	// they look kind of bad.
	self._hexArray.forEach(function(hex) {
        if (!hex.hasCountry()) {
            for (var i = 0; i < Dir.array.length; i++) {
                var nextHex = Dir.nextHex(hex, Dir.array[i], self);
                if (!nextHex || !nextHex.hasCountry() || self.getCountry(nextHex.countryId()).isLake()) {
                    return;
                }
            }
            // If it got here, the hex is not on the edge and it has countries all around it.
            self.moveToAdjacentCountry(hex);
        } 
    });
	
	this.pruneLakes();
	//this.validate();
	Globals.debug("Map adjacency list: " + JSON.stringify(this._adjacencyList), Globals.LEVEL.TRACE, Globals.CHANNEL.MAP)
};



// this is designed to make the map more interesting. The idea is to prune out big chunks of real estate
// before putting the countries down.
Map.prototype.pruneEdges = function() {
	var width = Hex.NUM_WIDE, height = Hex.NUM_HIGH;
	// top row
	this.makeBlob(Math.floor(width/4 + (Math.random() * width/2)), 0, 100 + Math.floor(Math.random() * 200));

	// bottom row
	this.makeBlob(Math.floor(width/4 + (Math.random() * width/2)), height-1, 100 + Math.floor(Math.random() * 200));

	// left
	this.makeBlob(0, Math.floor(Math.random() * height), 100 + Math.floor(Math.random() * 200));
	
	// right
	this.makeBlob(width-1, Math.floor(Math.random() * height), 100 + Math.floor(Math.random() * 200));
};

Map.prototype.findAdjacentUnpruned = function(hexes) {
	var self = this;
	var startIdx = Math.floor(Math.random() * hexes.length); 
    for (var i = 0; i < hexes.length; i++) {
        
        var hex = hexes[(startIdx + i) % hexes.length];

        //Iterate over directions from the hex again randomly to see if one works.
        var startDir = Math.floor(Math.random() * Dir.array.length);
        for ( var j = 0; j < Dir.array.length; j++) {
            var dir = Dir.array[(startDir + j) % Dir.array.length];
            var newHex = Dir.nextHex(hex, dir, self);
            if (newHex && !newHex._pruned) {
                return newHex;
            }
        }
    }

    return null;

};

Map.prototype.makeBlob = function(startX, startY, size) {
	var self = this;
	var hexes = [];
	var boundaryX = Hex.NUM_WIDE/2;
	var boundaryY = Hex.NUM_HIGH/2;
	var thisBlob = {};

	hexes.push(self._hexArray[(startY * Hex.NUM_WIDE) + startX]);
	hexes[0]._pruned = true;
	thisBlob[hexes[0].id()] = true;
	var count = 1, 
		tries=0; // this is just to make sure we don't get stuck in a corner or something

	while (count < size && tries < size*2) {
		tries++;
		var next = self.findAdjacentUnpruned(hexes);
		if (!next) { continue; }

		if (startY < boundaryY && next.y() >= boundaryY) {
			continue;
		} else if (startY >= boundaryY && next.y() <= boundaryY) {
			continue;
		} else if (startX < boundaryX && next.x() >= boundaryX) {
			continue;
		} else if (startX >= boundaryX && next.x() <= boundaryX) {
			continue;
		}

		var tooClose = false;
		for ( var j = 0; j < Dir.array.length; j++) {
            var neighbor = Dir.nextHex(next, Dir.array[j], self);
            if (neighbor && neighbor._pruned && !thisBlob[neighbor.id()]) {
            	tooClose = true;
            	break;
            }
		}

		if (!tooClose) {
			count ++;
			next._pruned = true;
			thisBlob[next.id()] = true;
			hexes.push(next);
		}
	}

};

Map.prototype.oldpruneEdges = function() {
	var self = this;

	// map borders are:
	// top row: hex.id < Hex.NUM_WIDE
	// left column: multiples of Hex.NUM_WIDE
	// right column: (multiples of Hex.NUM_WIDE) - 1
	// bottom row: (TOTAL_HEXES - NUM_WIDE) to TOTAL_HEXES

	var rows = {
		TOP: 0,
		RIGHT: 1,
		BOTTOM: 2,
		LEFT: 3
	}

	var numPruned = 0;
	while (numPruned < 1200) {
		// pick an edge
		var edge = rows.BOTTOM;//Math.round(Math.random() * 3);
		var x = 0, y = 0;
		var id = 0;
		if (edge == rows.TOP) {
			y = 0;
			x = Math.floor(Math.random() * Hex.NUM_WIDE);
			id = (y * Hex.NUM_WIDE) + x;
			while (self._hexArray[id]._pruned && y < Hex.NUM_HIGH/2) {
				y++;
				id = (y * Hex.NUM_WIDE) + x;
			}

			if (y < Hex.NUM_HIGH/2) {
				self._hexArray[id]._pruned = true;
				numPruned++;
			}

		} else if (edge == rows.RIGHT) {
			x = Hex.NUM_WIDE - 1;
			y = Math.floor(Math.random() * Hex.NUM_HIGH);
			id = (y * Hex.NUM_WIDE) + x;
			while (self._hexArray[id]._pruned && x > Hex.NUM_WIDE/2) {
				x--;
				id = (y * Hex.NUM_WIDE) + x;
			}

			if (x > Hex.NUM_WIDE/2) {
				self._hexArray[id]._pruned = true;
				numPruned++;
			}

		} else if (edge == rows.BOTTOM) {
			y = Hex.NUM_HIGH - 1;
			x = Math.floor(Math.random() * Hex.NUM_WIDE);
			id = (y * Hex.NUM_WIDE) + x;
			while (self._hexArray[id]._pruned && y > Hex.NUM_HIGH/2) {
				y--;
				id = (y * Hex.NUM_WIDE) + x;
			}

			if (y > Hex.NUM_HIGH/2) {
				self._hexArray[id]._pruned = true;
				numPruned++;
			}

		} else if (edge == rows.LEFT) {
			x = 0;
			y = Math.floor(Math.random() * Hex.NUM_HIGH);
			id = (y * Hex.NUM_WIDE) + x;
			while (self._hexArray[id]._pruned && x < Hex.NUM_WIDE/2) {
				x++;
				id = (y * Hex.NUM_WIDE) + x;
			}

			if (x < Hex.NUM_WIDE/2) {
				self._hexArray[id]._pruned = true;
				numPruned++;
			}
		}
	}
};

// makes sure that the countries and hexes agree about who owns what
Map.prototype.validate = function() {
	var self = this;
	self._countryArray.forEach(function(country, idx) {
		Globals.ASSERT(country.id() == idx);
		var hexes = country.hexes();
		Globals.ASSERT(hexes.length);
		hexes.forEach(function(hexId) {
			Globals.ASSERT(self._hexArray[hexId]);
			if (self._hexArray[hexId].countryId() !== country.id()) {
				console.log("HexId " + hexId + " assigned to country " + self._hexArray[hexId].countryId() + 
						" should be assigned to " + country.id());
			}
		})
	});
};

Map.prototype.isConnected = function(countryId1, countryId2) {
    for (var i = 0; i < this._adjacencyList[countryId1].length; i++) {
        if (this._adjacencyList[countryId1][i] == countryId2) {
            return true;
        }
    }
    return false;
};

// Removes lakes from the country list to simplify things.
Map.prototype.pruneLakes = function() {
	var self = this;
    this._countryArray = this._countryArray.filter(function(country) {
        if (!country.isLake()) {
            return true;
        } else {
            country.hexes().forEach(function(hexId) {
				var hex = self.getHex(hexId);
                hex.setCountry(null);
                hex.setCountryEdgeDirections(null);
            });
            return false;
        }
    });
    // Redo country ids to eliminate holes
    this._countryArray = this._countryArray.map(function(elem, index) {
        self.setCountryId(index, elem);
        return elem;
    });
};

Map.prototype.assignCountries = function(players) {
	// Use a shuffled countries list to randomize who gets what.
	var self = this;
	var shuffledCountries = Globals.shuffleArray(this._countryArray);
	var currPlayer = 0;
	shuffledCountries.forEach(function(country) {
		players[currPlayer].addCountry(country);
		self.setupCountryEdges(country);
		currPlayer++;
		if (currPlayer >= players.length) {
			currPlayer = 0;
		}
	});
};

// Once the map is setup, this function puts together the adjacency information the country
// needs, both to paint itself and to know what is next door.
// Marks hexes as internal or external. Also identifies which edges need border stroking for the hex.
Map.prototype.setupCountryEdges = function(country) {
	var self = this;
    var adjacentCountryHexes = {};  // Holds the first hex of adjacent countries, to avoid double-insertion.
	self._adjacencyList[country.id()] = [];
	
    country.hexes().forEach(function(hexId) {
		var hex = self.getHex(hexId);
        var countryEdges = [];
        for (var i = 0; i < Dir.array.length; i++) {
            var newHex = Dir.nextHex(hex, i, self);
            if (!newHex || newHex.countryId() != country.id()) {
                countryEdges.push(i);             
            }
            if (newHex && newHex.countryId() >= 0 && newHex.countryId() != country.id() && 
                !adjacentCountryHexes[newHex.countryId()]) {
				Globals.ASSERT(newHex.countryId() >= 0);
                adjacentCountryHexes[newHex.countryId()] = true;
                self._adjacencyList[country.id()].push(newHex.countryId());
            } 
        }
        hex.setCountryEdgeDirections(countryEdges);
    });
};

Map.prototype.moveToAdjacentCountry = function(hex) {
	var self = this;
    for (var i = 0; i < Dir.array.length; i++) {
        var newHex = Dir.nextHex(hex, i, self);
        if (newHex && newHex.hasCountry() && !self.getCountry(newHex.countryId()).isLake()) {
            var newCountry = self.getCountry(newHex.countryId());
            hex.setCountry(newCountry);
			Globals.ASSERT(self.getCountry(newCountry.id()));
            newCountry.hexes().push(hex.id());                
            return;
        }
    }
    Globals.debug("Can't find an adjacent country", Globals.LEVEL.ERROR, Globals.CHANNEL.MAP);
};

Map.prototype.countryCenter = function(countryId) {
	var self = this;
    var center = [0, 0];
	var hexIds = this.countryHexes(countryId);
    hexIds.forEach(function(hexId) {
		var hex = self.getHex(hexId);
        var hexCenter = hex.center();
        center[0] += hexCenter[0];
        center[1] += hexCenter[1];            
    })

    center[0] /= hexIds.length;
    center[1] /= hexIds.length;

    return center;
};

Map.prototype.fromMousePos = function(x, y) {
	var self = this;
    var oldX = x; var oldY = y;
    y -= Hex.TOP_LEFT_Y;
    var total_height = Hex.NUM_HIGH * Hex.HEIGHT;
    // Note that there are 2 rows per row, to allow distinguishing the upper and lower halves
    // of the hexes.
    var row = Math.floor((y / total_height) * (Hex.NUM_HIGH * 2));

    x -= Hex.TOP_LEFT_X;
    // This is a little tricky. It's because the width of the full thing is determined by
    // the edge length of a hex, not by the width of a full individual hex. If confused,
    // look at the drawing below.
    var total_width = Hex.NUM_WIDE * (Hex.EDGE_LENGTH * 3);

    // If it's beyond the left edge, just bail.
    if (x >= total_width) {
        return null;
    }

    var col = Math.floor((x / total_width) * (6 * Hex.NUM_WIDE));

    var newCol = Math.floor(((x - Hex.EDGE_LENGTH / 2) / total_width) * Hex.NUM_WIDE);
    var newRow = Math.floor(((y - Hex.HEIGHT / 2) / total_height) * Hex.NUM_HIGH);

    var topLeftHex = newRow * (Hex.NUM_WIDE * 2) + newCol;
    var topRightHex = topLeftHex + 1;
    var bottomLeftHex = topLeftHex + (Hex.NUM_WIDE * 2);
    var bottomRightHex = bottomLeftHex + 1;    
    var middleMiddleHex = topLeftHex + Hex.NUM_WIDE;
    var topMiddleHex = middleMiddleHex - (Hex.NUM_WIDE * 2);
    var bottomMiddleHex = middleMiddleHex + (Hex.NUM_WIDE * 2); 

    var nearbyHexes = [topLeftHex, topRightHex, bottomLeftHex, bottomRightHex, middleMiddleHex, topMiddleHex, bottomMiddleHex];
    var closestDistanceSquared = Infinity;
    var closestHex = null;

    nearbyHexes.forEach(function(hexId) {
        if (hexId >= 0 && hexId < Hex.TOTAL_HEXES) {
            var hex = self.getHex(hexId);
            var center = hex.center();
            var distanceSquared = Math.pow(center[0] - oldX, 2) + Math.pow(center[1] - oldY, 2);
            if (distanceSquared < closestDistanceSquared) {
                closestDistanceSquared = distanceSquared;
                closestHex = hex;
            }
        }
    });

    return closestHex;
};

// Find a hex that is adjacent to this country but is not occupied by this country.
// This can be used to grow this country or to find a new place to start a country.
Map.prototype.findAdjacentHex = function(country) {
	var self = this;
    // Pick a starting hex randomly. Then iterate through until one is hopefully found.
    // var startingHexPos = Math.floor(Math.random() * this._hexIds.length);
    for (var i = 0; i < country._hexIds.length; i++) {
        // Try to find a neighboring spot that works.
        var hex = Math.floor(Math.random() * country._hexIds.length);

        //Iterate over directions from the hex again randomly to see if one works.
        for ( var j = 0; j < Dir.array.length; j++) {
            var dir = Dir.array[Math.floor(Math.random() * Dir.array.length)];
            var newHex = Dir.nextHex(self.getHex(country._hexIds[hex]), dir, self);
            if (newHex && newHex.countryId() == -1 && !newHex._pruned) {
                return newHex;
            }

        }
    }

    return null;

};

Map.prototype.growCountry = function(country) {
	var self = this;
    if (country._hexIds.length >= country._numHexes) {
        return;
    }

    var hex = self.findAdjacentHex(country);

    if (!hex) {
        Globals.debug("Couldn't find a new spot for a hex!", Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        
        return;
    }

    hex.setCountry(country);
	Globals.ASSERT(self.getCountry(country.id()));
    country._hexIds.push(hex.id());

	Globals.debug("growCountry", country, hex, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);        

    // Tail recursion to get the right number.
    self.growCountry(country);

};

Map.prototype.landGrab = function(starthex, country) {
	var self = this;
	country._hexIds = [starthex.id()];
    starthex.setCountry(country);
	Globals.ASSERT(self.getCountry(country.id()));
	country._numHexes = Math.floor(Math.random() * (Country.MAX_HEXES - Country.MIN_HEXES + 1)) + 
        Country.MIN_HEXES;

	self.growCountry(country);
	if (country._numHexes != country._hexIds.length) {
		// Mark it as a lake still so we can make enough countries. If it's a small lake,
		// let it get absorbed into another country. If it's a big lake, it will remain
		// and be pruned (in actual gameplay, all isLake() countries are gone)
		country._isLake = true;
		if (country._hexIds.length <= 5) {
			self.absorbLake(country);
				return;
			} 
		}
};


// Absorbs a lake into an adjacent country.
Map.prototype.absorbLake = function(country) {
	var self = this;
    var newCountry = null;
    country._hexIds.forEach(function(hexId) {
        self.moveToAdjacentCountry(self.getHex(hexId));
    })
    country._hexIds = [];
};

Map.prototype.setCountryId = function(id, country) {
	Globals.debug("Changine country id from "+ country._id + " to " + id, country, Globals.LEVEL.TRACE, Globals.CHANNEL.COUNTRY);
	var self = this;
	country._id = id;
	if (self.getCountry(id) != country) {
		Globals.debug("Country id set to value which doesn't match Map array", country, Globals.LEVEL.WARN, Globals.CHANNEL.COUNTRY);
	}
	country._hexIds.forEach(function(hexId) {
		self.getHex(hexId).setCountry(country);
		Globals.ASSERT(self.getCountry(country.id()));
	});
};





if (typeof module !== 'undefined' && module.exports){
	module.exports = Map;
};"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Country = require('./country.js');
}

var PENALTY_TIMEOUT = 100;

var Player = function(id, engine) {
	this._id = id;
	this._engine = engine;
	this._countries = []; // array of countryIds
	this._storedDice = 0;
	this._numContiguousCountries = 0;		
	this._timeBudget = -1;
	this._timerId = -1;
	this._inPenalty = false;
	this._turnCount = 0;
	this._totalTime = 0;
};


Player.rollDie = function() {
	return Math.floor(Math.random() * 6) + 1;
}

Player.rollDice = function(num) {
	var array = [];
	for (var i = 0; i < num; i++) {
		array.push(Player.rollDie());
	}
	return array;
}



Player.prototype.id = function() { return this._id; };
Player.prototype.hasLost = function() { return this._countries.length == 0; };
Player.prototype.storedDice = function() { return this._storedDice; };
Player.prototype.removeStoredDie = function() { if (this._storedDice) {this._storedDice --;} };
Player.prototype.countries = function() {return this._countries;};
Player.prototype.countryCount = function() {return this._countries.length;};
Player.prototype.numContiguousCountries = function() { return this._numContiguousCountries; };

Player.prototype.turnStarted = function() {  };
Player.prototype.turnEnded = function() { 
	this._turnCount ++;
	this._totalTime -= this._timeBudget;
};
Player.prototype.timePerTurn = function() {
	return this._turnCount ? Math.round(this._totalTime / this._turnCount) : 0;
}

Player.prototype.setTimeBudget = function(millis) {
	var self = this;
	self._timeBudget = millis;
	this._totalTime += millis;
	self._inPenalty = false;
	if (self._timerId >= 0) {
		self._cancelTimer(self._timerId);
		self._timerId = -1;
	}
	Globals.debug("setTimeBudget", self._timeBudget, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
};

Player.prototype.startClock = function() {
	var self = this;
	if (self._timerId == -1) {
		self._timerId = self._setTimer(self.timeout.bind(self), self._timeBudget);
		self._mark = Date.now();
		Globals.debug("startClock playerId=", self._id, self._timeBudget, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
	} else {
		Globals.debug("starClock called with no timerId >= 0", Globals.LEVEL.WARN, Globals.CHANNEL.PLAYER);
	}
};

Player.prototype.stopClock = function() {
	var self = this;
	if (self._timerId >= 0) {
		self._cancelTimer(self._timerId);
		self._timeBudget -= Math.max(Date.now() - self._mark, 0);
		self._timerId = -1;
		Globals.debug("stopClock playerId=", self._id, self._timeBudget, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
	} else {
		Globals.debug("stopClock called with timerId=-1", Globals.LEVEL.WARN, Globals.CHANNEL.PLAYER);
	}
};

Player.prototype.timeout = function() {
	var self = this;
	self._timerId = -1;

	if (Globals.timePenalties) {
		self._timeBudget = PENALTY_TIMEOUT;
		self._totalTime += PENALTY_TIMEOUT;
		self.startClock();

		if (!self._inPenalty) {
			Globals.debug("Player", self._id, "entering penalty", Globals.LEVEL.INFO, Globals.CHANNEL.PLAYER);
			self._inPenalty = true;
		} else {
			self.penalize();
		}
	} else {
		self.penalize();
	}
};

Player.prototype.penalize = function() {
	var self = this;
	if (self._engine) {
		self._engine.penalizePlayer(self._id);
	}
};

// Take ownership of a country.
Player.prototype.addCountry = function(country) {
	country.setOwner(this.id());
	this._countries.push(country.id());
	Globals.debug("Player " + this._id + " added country " + country.id(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLAYER);
	Globals.debug("New country count: " + this._countries.length, Globals.LEVEL.TRACE, Globals.CHANNEL.PLAYER);
};

// Take away the country from this player.
Player.prototype.loseCountry = function(country) {
	var self = this;
	Globals.debug("Player " + self._id + " lost country " + country.id(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLAYER);
	this._countries = this._countries.filter(function(elem) {
		return elem != country.id();
	})
};

// Pick all the countries which have some space in them.
Player.prototype.countriesWithSpace = function(map) {
	return this._countries.filter(function(countryId) {
		return map.getCountry(countryId).numDice() < Globals.maxDice;
	}).map(function(countryId) {
		return map.getCountry(countryId);
	});
};

// Update the information for this player.
Player.prototype.updateStatus = function(map) {
	var self = this;

	// Did this player lose?
	if (this.hasLost()) {
 		return;
	}


	var alreadySeen = {};
	var maxIslandSize = 0;

	var traverse = function(country) {
		if (alreadySeen[country.id()]) {
			return 0;
		}
		alreadySeen[country.id()] = true;
	
		return 1 + 
				map.adjacentCountries(country.id()).reduce(function(total, adjacentCountryId) {
					var adjacentCountry = map.getCountry(adjacentCountryId);
					Globals.ASSERT(adjacentCountry);
					if (adjacentCountry.ownerId() == self.id()) {
						total += traverse(adjacentCountry);
					}
					return total;
				}, 0);
	};

	this._countries.forEach(function(countryId) {
		var islandSize = traverse(map.getCountry(countryId));

		if (islandSize > maxIslandSize) {
			maxIslandSize = islandSize;
		}
	});

	this._numContiguousCountries = maxIslandSize;
};

Player.prototype._setTimer = function(callback, interval) {
	if (typeof module !== 'undefined' && module.exports) {
		return setTimeout(callback, interval);
	} else {
		return window.setTimeout(callback, interval);
	}
};

Player.prototype._cancelTimer = function(id) {
	if (typeof module !== 'undefined' && module.exports) {
		return clearTimeout(id);
	} else {
		return window.clearTimeout(id);
	}
};



if (typeof module !== 'undefined' && module.exports){
	module.exports = Player;
};"use strict"

var logBuffer = [];
var BUFFER_LENGTH = 100;

var uploadFn = null;
var GAME_ID = "";

var redirectFn = null;

var Globals = {

		initLogger: function(game_id, logUploadFn) {
			GAME_ID = game_id;
			uploadFn = logUploadFn;
		},
		
		setLogRedirect: function(fn) {
			redirectFn = fn;
		},
	
		// USAGE: debug("my msg", foo, bar, Globals.LEVEL.INFO, Globals.CHANNEL.ENGINE);
	    debug: function(title) {
				if (redirectFn) {
					redirectFn.apply(null, arguments);
				} else {
					var argc = arguments.length;

					var gameId = "";
					var gameIdx = argc-1;
					if (typeof arguments[gameIdx] == 'string') {
						gameIdx = argc - 1;
						gameId = arguments[gameIdx];
					} else {
						gameIdx = argc;
						gameId = GAME_ID;
					}

					var channelIdx = gameIdx - 1;
					var levelIdx = channelIdx - 1;
		
					if (levelIdx >= 1 
						&& (typeof arguments[channelIdx]) == 'number'
						&& (typeof arguments[levelIdx]) == 'number'
						&& arguments[channelIdx] < Globals.channelNames.length
						) {
				
						var channel = arguments[channelIdx];
						var level = arguments[levelIdx];
				
						var msg = ""
						var args = arguments;
						Object.keys(arguments).forEach(function(key, idx) {
							if (idx < levelIdx) {
								msg += args[key] + " ";
							}
						});
				
						if (level < Globals.errorReportLevels[channel]) {
							logBuffer.unshift({
								channel: channel,
								level: level,
								gameId: GAME_ID,
								msg: msg.substring(0, 150)
							});
				
							if (logBuffer.length > BUFFER_LENGTH) {
								logBuffer.pop();
							}
				
							if (uploadFn && level == Globals.LEVEL.ERROR) {
								uploadFn(GAME_ID, logBuffer);
							}
						}
				
						if (level <= Globals.channels[channel]) {
							console.log(msg);
						}
				
					} else {
			        	console.log(title, arguments);
					}
				}
	    },
	
		ASSERT: function (condition) {
			if (!condition) {
				console.log("ASSERTION FAILURE");
				try {
					var err = new Error('assertion');
					console.log(err.stack);
				} catch (e) {}
				debugger;
				throw new Error("Assertion Failure");
			}
		},
		
		showNumbers: false,
		showCountryIds: false,
		markHexCenters: false,
		markCountryCenters: false,
		drawCountryConnections: false,
		maxPlayers: 8,
		maxDice: 8,
		maxStoredDice: 64,
		startingDice: 10,
		numCountries: 32,
		timeout: 150,
		play_sounds: 0,
		suppress_ui: 0,
		uploadGame: false,
		timePenalties: false,
	};

Globals.LEVEL = {
	"NONE" 	: 0,
	"ERROR" : 1,
	"WARN" 	: 2,
	"INFO" 	: 3,
	"DEBUG" : 4,
	"TRACE" : 5 
}

Globals.levelNames = [];
Object.keys(Globals.LEVEL).forEach(function(name, idx) {
	Globals.levelNames[idx] = name;
});

// The order in CHANNEL and channels must match. DON'T CHANGE THESE NUMBERS. To change the loglevel, see Globals.channels below
Globals.CHANNEL = {
	"ENGINE" : 0,
	"MAP" : 1,
	"HEX" : 2,
	"COUNTRY" : 3,
	"PLAYER" : 4,
	"PLYER" : 5,
	"RENDERER" : 6,
	"GREEDY" : 7,
	"CLIENT" : 8,
	"CLIENT_SOCKET" : 9,
	"AI_WRAPPER" : 10,
	"MAP_CONTROLLER" : 11,
	"DOWNLOADER": 12,

	"SERVER": 13,
	"SERVER_SOCKET" : 14,
	"USER_AI": 15,
	"GAME": 16,
	"ADMIN": 17,
	"RATER": 18,
	"DEFAULT": 19,
};

Globals.channelNames = [];
Object.keys(Globals.CHANNEL).forEach(function(name, idx) {
	Globals.channelNames[idx] = name;
});

// Loglevel for each channel. 
Globals.channels = [];
Globals.channels.length = Object.keys(Globals.CHANNEL).length;

Globals.channels[Globals.CHANNEL.ENGINE] 			= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.MAP] 				= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.HEX] 				= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.COUNTRY] 			= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.PLAYER] 			= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.PLYER] 			= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.RENDERER] 			= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.GREEDY] 			= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.CLIENT] 			= Globals.LEVEL.INFO;
Globals.channels[Globals.CHANNEL.CLIENT_SOCKET] 	= Globals.LEVEL.INFO;
Globals.channels[Globals.CHANNEL.AI_WRAPPER] 		= Globals.LEVEL.INFO;
Globals.channels[Globals.CHANNEL.MAP_CONTROLLER] 	= Globals.LEVEL.WARN;
Globals.channels[Globals.CHANNEL.DOWNLOADER] 		= Globals.LEVEL.WARN;

// Error report Loglevel for each channel. Determines the detail of error reports
Globals.errorReportLevels = [];
Globals.errorReportLevels.length = Object.keys(Globals.CHANNEL).length;

Globals.errorReportLevels[Globals.CHANNEL.ENGINE] 			= Globals.LEVEL.DEBUG;
Globals.errorReportLevels[Globals.CHANNEL.MAP] 				= Globals.LEVEL.DEBUG;
Globals.errorReportLevels[Globals.CHANNEL.HEX] 				= Globals.LEVEL.DEBUG;
Globals.errorReportLevels[Globals.CHANNEL.COUNTRY] 			= Globals.LEVEL.DEBUG;
Globals.errorReportLevels[Globals.CHANNEL.PLAYER] 			= Globals.LEVEL.DEBUG;
Globals.errorReportLevels[Globals.CHANNEL.PLYER] 			= Globals.LEVEL.WARN;
Globals.errorReportLevels[Globals.CHANNEL.RENDERER] 		= Globals.LEVEL.WARN;
Globals.errorReportLevels[Globals.CHANNEL.GREEDY] 			= Globals.LEVEL.WARN;
Globals.errorReportLevels[Globals.CHANNEL.CLIENT] 			= Globals.LEVEL.TRACE;
Globals.errorReportLevels[Globals.CHANNEL.CLIENT_SOCKET] 	= Globals.LEVEL.TRACE;
Globals.errorReportLevels[Globals.CHANNEL.AI_WRAPPER] 		= Globals.LEVEL.TRACE;
Globals.errorReportLevels[Globals.CHANNEL.MAP_CONTROLLER] 	= Globals.LEVEL.INFO;
Globals.errorReportLevels[Globals.CHANNEL.DOWNLOADER] 		= Globals.LEVEL.DEBUG;


Globals.shuffleArray = function(inArray) {
	// Copy the array to avoid changing it.
	var array = inArray.map(function(elem) { return elem; });

    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
};

Globals.implements = function(obj, iface) {
	for (var func in iface) {
		if (typeof iface[func] === 'function') {
			if ((!obj.hasOwnProperty(func) && !obj.__proto__.hasOwnProperty(func)) || typeof obj[func] !== 'function') {
				return false;
			}
		}
	}
	return true;
};

Globals.indexOfMax = function(ary) {
	var max = ary[0];
	var idx = 0;
	for (var i=1; i < ary.length; i++) {
		if (ary[i] > max) {
			idx = i;
			max = ary[i];
		}
	}
	return idx;
};

if (typeof module !== 'undefined' && module.exports){
	module.exports = Globals;
}
;/**
 * @author Alexander Manzyuk <admsev@gmail.com>
 * Copyright (c) 2012 Alexander Manzyuk - released under MIT License
 * https://github.com/admsev/jquery-play-sound
 * Usage: $.playSound('http://example.org/sound.mp3');
**/

(function($){

  $.extend({
    playSound: function(){
      return $("<embed src='"+arguments[0]+".mp3' hidden='true' autostart='true' loop='false' class='playSound'>" + "<audio autoplay='autoplay' style='display:none;' controls='controls'><source src='"+arguments[0]+".mp3' /><source src='"+arguments[0]+".ogg' /></audio>").appendTo('body');
    }
  });

})(jQuery);
;'use strict'

var Message = {

	TYPE: {
		'PLAYER_STATUS': 'player_status',
		'PLAYER_INITIALIZED': 'player_initialized',
		'STATE': 'state_update',
		'CREATE_BOT': 'create_bot',
		'CREATE_HUMAN': 'create_human',
		'START_TURN': 'start_turn',
		'ATTACK_RESULT': 'attack_result',
		'TURN_ENDED': 'turn_ended',

		'ATTACK': 'attack',
		'END_TURN': 'end_turn',
	},

	playerStatus: function(playerId, connected, playerName) {
		return {
			playerId: playerId,
			connected: connected,
			playerName: playerName
		};
	},

	playerInitialized: function() {
		return {};
	},

	createBot: function(name, playerId) {
		return {
			name: name,
			playerId: playerId
		};
	},

	createHuman: function(name, playerId) {
		return {
			name: name,
			playerId: playerId
		};
	},

	state: function(stateId, gameId) {
		return {
			stateId: stateId,
			gameId: gameId,
		};
	},

	startTurn: function(playerId, stateId) {
		return {
			playerId: playerId,
			stateId: stateId
		};
	},

	attackResult: function(playerId, success, stateId) {
		return {
			playerId: playerId,
			success: success,
			stateId: stateId
		};
	},



	attack: function(fromId, toId, playerId) {
		return {
			playerId: playerId,
			from: fromId,
			to: toId
		};
	},

	endTurn: function(playerId) {
		return {
			playerId: playerId
		};
	},

	turnEnded: function(playerId, stateId) {
		return {
			playerId: playerId,
			stateId: stateId
		};
	}
};


if (typeof module !== 'undefined' && module.exports){
	module.exports = Message;
};'use strict'

var log = null;
var CHANNEL;

if (typeof module !== 'undefined' && module.exports){
	var Globals = require('../globals.js');
	var logger = require('../../../lib/logger.js');
	var Message = require('./message');
	log = logger.log;
	CHANNEL = logger.CHANNEL.SERVER_SOCKET;
} else {
	log = Globals.debug;
	CHANNEL = Globals.CHANNEL.CLIENT_SOCKET;
}


/*========================================================================================================================================*/
// SocketWrapper: wraps a Socket.IO socket
/*========================================================================================================================================*/
var SocketWrapper = function(socket, gameId) {
	this._socket = socket;
	this._gameId = gameId;
	this._id = socket.id;
	this._callbacks = {}; // map from event => array of {fn: , context: }
};

SocketWrapper.prototype.id = function() {return this._id;}

SocketWrapper.prototype.ip= function() {
	if (this._socket) {
		return this._socket.handshake.address;
	} 
}

/*
	this can be called EITHER like this:
		on('foo', myFunc.bind(this))
	OR:
		on('foo', myFunc, this)

	use the second if you want removeListener() to work.
*/
SocketWrapper.prototype.on = function(event, callback, context /*optional*/) {
	var self = this;

	if (self._callbacks.hasOwnProperty(event)) {
		// add this callback to the list for this event
		self._callbacks[event].push({fn: callback, context: context});
	} else {
		// create a callback list for this event
		self._callbacks[event] = [{fn: callback, context: context}];

		// start listening for this event
		self._socket.on(event, function() {
			log("=>", event, JSON.stringify(arguments), Globals.LEVEL.INFO, CHANNEL, self._gameId);
			
			// marshall the callback arguments
			var args = [];
			args.push(self);
			var count = Object.keys(arguments).length;
			for (var i=0; i < count; i++) {
				args.push(arguments[i]);
			}

			// callback everyone who's listening
			self._callbacks[event].forEach(function(cb) {
				cb.fn.apply(cb.context, args);
			});
		});
	}
};

SocketWrapper.prototype._emit = function(event, data) {
	log("<=", event, JSON.stringify(data), Globals.LEVEL.INFO, CHANNEL, this._gameId);
	this._socket.emit(event, data);
};


SocketWrapper.prototype.removeAll = function() {
	var self = this;
	if (self._socket) {
		Object.keys(self._callbacks).forEach(function(event) {
			self._socket.removeAllListeners(event);
		});
	}
	self._callbacks = {};
};

SocketWrapper.prototype.removeAllListeners = function(event) {
	if (this._socket) {
		this._socket.removeAllListeners(event);
	}

	delete this._callbacks[event];
};

SocketWrapper.prototype.removeListener = function(event, listener, context /*optional*/) {
	var self = this;
	var cbs = self._callbacks[event];
	if (cbs) {
		cbs.forEach(function(cb, idx) {
			if (listener == cb.fn && context == cb.context) {
				self._callbacks[event].splice(idx, 1);
			}
		});
	}
};

SocketWrapper.prototype.disconnect = function() {
	var self = this;
	this._callbacks = {};
	if (self._socket) {
		self._socket.disconnect();
		delete self._socket;
		self._socket = null;
	}
};

SocketWrapper.prototype.sendPlayerStatus = function(playerId, connected, name) {
	this._emit(Message.TYPE.PLAYER_STATUS, Message.playerStatus(playerId, connected, name));
};

SocketWrapper.prototype.sendPlayerInitialized = function(playerId) {
	this._emit(Message.TYPE.PLAYER_INITIALIZED, Message.playerInitialized(playerId));
};

SocketWrapper.prototype.sendCreateBot = function(name, playerId) {
	this._emit(Message.TYPE.CREATE_BOT, Message.createBot(name, playerId));
};

SocketWrapper.prototype.sendCreateHuman = function(name, playerId) {
	this._emit(Message.TYPE.CREATE_HUMAN, Message.createHuman(name, playerId));
};

SocketWrapper.prototype.sendState = function(stateId, gameId) {
	this._emit(Message.TYPE.STATE, Message.state(stateId, gameId));
};

SocketWrapper.prototype.sendStartTurn = function(playerId, stateId) {
	this._emit(Message.TYPE.START_TURN, Message.startTurn(playerId, stateId));
};

SocketWrapper.prototype.sendAttack = function(fromId, toId, playerId) {
	this._emit(Message.TYPE.ATTACK, Message.attack(fromId, toId, playerId));
};


SocketWrapper.prototype.sendAttackResult = function(playerId, success, stateId) {
	this._emit(Message.TYPE.ATTACK_RESULT, Message.attackResult(playerId, success, stateId));
};

SocketWrapper.prototype.sendEndTurn = function(playerId) {
	this._emit(Message.TYPE.END_TURN, Message.endTurn(playerId));
};

SocketWrapper.prototype.sendTurnEnded = function(playerId, stateId) {
	this._emit(Message.TYPE.TURN_ENDED, Message.turnEnded(playerId, stateId));
};

if (typeof module !== 'undefined' && module.exports){
	module.exports = SocketWrapper;
};//'use strict'

var ANIMATE = false;
var DRAW_DICE = true;
var SKY = true;
var SHADOW = false;
var DRAW_BORDERS = true;

var GLrenderer = {
		WIDTH: 1080,
		HEIGHT: 580,
		DICE_SIZE: 2,
		
		X: 0, Y:1, Z: 2,
		_context: null,
		_initialized: false,
		_highlightedCountry: -1,
		_selectedCountry: -1,
		_mouseOverCountry: -1,
		_names: [],
		_map: null,
		_playerColors: [
			0xff0000,
			0x0000ff,
			0x00ff00,
			0xffff00,
			0xff9000,
			0x900090,
			0x804030,
			0xb09080
		],
		_mapCenterX: 0,
		_mapCenterY: 0,
		_angleY: 0,
		_angleX: 0,
		_angleZ: Math.PI/2,
		_theta: Math.PI/4,
		_elevation: 35,
		_radius: 75,
		_mouseDown: false,
		_lastMouseX: -1,
		_lastMouseY: -1,
		_lastRenderTime: -1,
		_diceGraph: [], // array of Cube
		_cylinders: {},
		_dice: {},
		_canvasHeight: 0,
		_canvasWidth: 0,
		_mouseVector: null,
		_raycaster: null,
		_listener: null,
		
		init: function(canvas, map, playerNames, listener) {
			var self = this;

			Globals.ASSERT(Globals.implements(listener, Renderer.iface));
			this._listener = listener;
			this._mouseVector = new THREE.Vector2();
			this._raycaster = new THREE.Raycaster();

			this._map = map;
			this._names = playerNames || [];
			this._initialized = true;

			var maxX=-1, minX=10000, minY=10000, maxY=-1;
			map._hexArray.forEach(function(hex) {
				var ul = hex.upperLeft();
				maxX = Math.max(maxX, ul[0]);
				minX = Math.min(minX, ul[0]);
				maxY = Math.max(maxY, ul[1]);
				minY = Math.min(minY, ul[1]);
			});
			self._mapCenterX = (maxX - minX)/(2 * Hex.EDGE_LENGTH);
			self._mapCenterY = (maxY - minY)/(2 * Hex.EDGE_LENGTH);

			this._scene = new THREE.Scene();
			this._camera = new THREE.PerspectiveCamera( 75, c.width / c.height, 1, 1000 );
			this._camera.up = new THREE.Vector3(0,0,1);

			var xyProjection = self._radius * Math.cos(self._theta);
			self._camera.position.z = self._radius * Math.sin(self._theta);
			self._camera.position.y = xyProjection * Math.sin(self._angleZ);
			self._camera.position.x = xyProjection * Math.cos(self._angleZ);

			self._camera.position.y += self._mapCenterY;
			self._camera.position.x += self._mapCenterX;

			this._camera.lookAt(new THREE.Vector3(self._mapCenterX, self._mapCenterY, 0));

			var ambientLight = new THREE.AmbientLight( 0x000000 );
			this._scene.add( ambientLight );

			var lights = [];
			lights[0] = new THREE.SpotLight( 0xffffff, 1, 0 );
			lights[1] = new THREE.SpotLight( 0xffffff, 1, 0 );
			lights[2] = new THREE.SpotLight( 0xffffff, 1, 0 );
			lights[3] = new THREE.SpotLight( 0xffffff, 1, 0 );
			
			lights[0].position.set( -200, 200, 100 );
			lights[1].position.set( 200, 200, 100 );
			lights[2].position.set( -200, -200, 100 );
			lights[3].position.set( -200, 200, 100 );

			if (SHADOW) {
				lights[1].castShadow = true;
				lights[1].shadowDarkness = 1;
			}

			this._scene.add( lights[0] );
			this._scene.add( lights[1] );
			this._scene.add( lights[2] );				


			this._renderer = new THREE.WebGLRenderer({ antialias: true });
			if (SHADOW) {
				this._renderer.shadowMap.enabled = true;
			}
			this._renderer.setSize(this.WIDTH, this.HEIGHT);
			$('#canvas3d_div').append(this._renderer.domElement);
			$(this._renderer.domElement).on('mousedown', GLrenderer.mouseDown.bind(this));
			$(this._renderer.domElement).on('mouseup', GLrenderer.mouseUp.bind(this));
			$(this._renderer.domElement).on('mousemove', GLrenderer.mouseMove.bind(this));
			$(this._renderer.domElement).on('mouseleave', GLrenderer.mouseLeave.bind(this));
			$(document).keydown(GLrenderer.keyDown.bind(this));

			var canvas = $(this._renderer.domElement);
			this._canvasWidth = canvas.width();
			this._canvasHeight = canvas.height();
			
			if (DRAW_DICE) {
				this._texture = new THREE.TextureLoader().load('/public/images/dice6-red.png', function() {
					self.update();
				});
			}


			if (SKY) {
				new THREE.CubeTextureLoader().load(['/public/images/sky.jpg',
											'/public/images/sky.jpg',
											'/public/images/sky.jpg',
											'/public/images/sky.jpg',
											'/public/images/sky.jpg',
			 								'/public/images/sky.jpg'], function(texture) {

			 		var shader = THREE.ShaderLib['cube'];
			 		shader.uniforms['tCube'].value = texture;

					var skyBoxMaterial = new THREE.ShaderMaterial( {
					  fragmentShader: shader.fragmentShader,
					  vertexShader: shader.vertexShader,
					  uniforms: shader.uniforms,
					  depthWrite: false,
					  side: THREE.BackSide
					});

					// create skybox mesh
					var skybox = new THREE.Mesh(
					  new THREE.CubeGeometry(1000, 1000, 1000),
					  skyBoxMaterial
					);

					self._scene.add(skybox);
					self.update();
				});
			}

			self._initializeRollingDice();

		},

		setMouseOverCountry: function(id) {
			if (!this._isRendering) {
				Globals.debug("setMouseOverCountry", id, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
				var old = this._highlightedCountry
				this._highlightedCountry = id;
				if (old != -1) {
					this._drawCountry(old, this._lastRenderedState, false);
				}
				if (id != -1) {
					this._drawCountry(id, this._lastRenderedState, false);
				}
				this.update();
			}
		},
		
		setSelectedCountry: function(id) {
			if (!this._isRendering) {
				Globals.debug("setSelectedCountry", id, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
				var old = this._selectedCountry;
				this._selectedCountry = id;

				if (old != -1) {
					this._drawCountry(old, this._lastRenderedState, false);
				}
				if (id != -1) {
					this._drawCountry(id, this._lastRenderedState, false);
				}
				this.update();
			}
		},

		setPlayerName: function(id, name) {

		},

		render: function(state, callback) {
			var self = this;
			if (!state || self._isRendering) {
				Globals.debug("previous state rendering, render aborted", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
				if (callback) {
					//callback();
				}
				return;
			}
			self._isRendering = true;
			Globals.debug("render()", state.stateId(), Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			if (state.attack()) {
				this._renderAttack(state)
					.then(function() {
						self.update();
						self._lastRenderedState = state;
						self._lastRenderTime = Date.now();
						self._isRendering = false;
						if (callback) {
							callback(state, state.stateId());
						}
					});
			} else {
				this._drawMap(state, callback)
					.then(function() {
						self.update();
						self._lastRenderedState = state;
						self._lastRenderTime = Date.now();
						self._isRendering = false;
						if (callback) {
							callback(state, state.stateId());
						}
					});
			}
		},

		/*
			@callback: function stateRendered(state, id){}
		*/
		_renderAttack: function(state) {
		
			if (Globals.suppress_ui || !this._initialized || !state) {
				return;
			}

			var self = this;

			return new Promise(function(resolve) {
				Globals.debug("renderAttack", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			
				var fromCountry = state.attack().fromCountryId;
				var fromPlayerId = state.countryOwner(fromCountry);
				
				var toCountry = state.attack().toCountryId;
				
				var fromNumDice = state.attack().fromRollArray.length;
				var toNumDice = state.attack().toRollArray.length;
				
				var fromRoll = state.attack().fromRollArray.reduce(function(total, die) { return total + die; }, 0);
		    	var toRoll = state.attack().toRollArray.reduce(function(total, die) { return total + die; }, 0);
				
		
				// roll attacker
				Globals.debug("render attacker", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
				self._drawCountry(fromCountry, state, true);
				self.update();
		        
				if (Globals.play_sounds) {
		            $.playSound('/sounds/2_dice_throw_on_table');
		        }

				var timeout =  Globals.timeout;
		        window.setTimeout(function(){renderAttackRoll(state);}, timeout);
		
				function renderAttackRoll(state) {
					Globals.debug("render defender", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
					self._drawCountry(toCountry, state, true);
					self.update();
					window.setTimeout(function(){renderDefendRoll(state);}, timeout);
					/*
					if (DRAW_DICE) {
						var ary = [];
						ary.length = fromNumDice;
						return animateAttackDice(fromCountry);
					} else {
			            window.setTimeout(function(){renderDefendRoll(state);}, timeout);
			        }
			        */
				}


				function animateAttackDice(countryId) {
					self._camera.updateMatrix();
					self._camera.updateMatrixWorld();

					var count = state.countryDice(countryId);

					for (var diceId=1; diceId <= count; diceId++) {
						self._rollAttackDie(diceId, 5);
					}
				}
				
				function renderDefendRoll(state) {
					Globals.debug("render defense roll", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
		            window.setTimeout(function(){renderVerdict(state);}, timeout);
				}
				
				function renderVerdict(state) {
					Globals.debug("render verdict", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
		        	if (fromRoll > toRoll) {
						// attacker wins
		                if (Globals.play_sounds) {
		                    $.playSound('/sounds/clink_sound');
		                }
		        	} else {
						// defender wins
		                if (Globals.play_sounds) {                
		                    $.playSound('/sounds/wood_hit_brick_1');               
		                }
		            }
					resolve();
				}
			});
		},


		
		_drawMap: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("drawMap", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			var self = this;
			return Promise.mapSeries(state.countryIds(), function(countryId) {
				return self._animateCountry(countryId, state);
			});

			
		},

		_animateCountry: function(countryId, state) {
			var self = this;

			var toDice = state.countryDice(countryId);
			var fromDice = self._lastRenderedState ? self._lastRenderedState.countryDice(countryId) : toDice;


			Globals.debug("animateCountry", countryId, "from", fromDice, "to", toDice, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);

			if (!ANIMATE || fromDice == toDice || (DRAW_DICE && (state.attack() || self._lastRenderedState.attack()))) {
				return self._drawCountry(countryId, state, false);
			}

			Globals.debug("animating", toDice, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);

			var STEP = (fromDice < toDice) ? 0.5 : -0.5;
			if (DRAW_DICE) {
				STEP = (fromDice < toDice) ? 1 : -1;
			}
			state.setCountryDice(countryId, fromDice);

			return new Promise(function(resolve) {

				var animateCountryCB = function() {

					if (state.countryDice(countryId) != toDice) {
						state.setCountryDice(countryId, state.countryDice(countryId) + STEP);
						self._drawCountry(countryId, state, false);
						self.update();
						requestAnimationFrame(animateCountryCB);
					} else {
						state.setCountryDice(countryId, toDice);
						self._drawCountry(countryId, state, false);
						resolve();
					}
				};

				requestAnimationFrame(animateCountryCB);
			});
		},
		
		_drawCountry: function (countryId, state, isFighting) {
			if (Globals.suppress_ui || !this._initialized) {
	        	return;
			}

			var self = this;
			isFighting = isFighting || false;
			
			if (!self.stateHash.hasCountryChanged(countryId, isFighting, state.countryHash(countryId))) {
				return;
			}
			
			Globals.debug("drawCountry " + countryId, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
			
			self._map.countryHexes(countryId).forEach(function(hexId) {
				self._drawHex(self._map.getHex(hexId), state, isFighting);
			});

			// draw dice
			if (DRAW_DICE) {
				self._drawDice(countryId, state);
			}

		},


		_drawHex: function(hex, state, isFighting) {
			var self = this;					
			var countryId = hex.countryId();
			var start = hex.upperLeft();
			var cylinder;
			if (!self._hexGeometry && DRAW_DICE) {
				self._hexGeometry = new THREE.CylinderGeometry( 1, 1, 1, 6);
			}
			

			if (!self._cylinders[hex.id()]) {
				var color = self._playerColors[state.countryOwner(countryId)];
				var geometry = DRAW_DICE ? self._hexGeometry : new THREE.CylinderGeometry( 1, 1, 4 * state.countryDice(countryId), 6);
				var material = new THREE.MeshPhongMaterial({color: color, 
					specular: 0x111111, 
					shininess: 30, 
					shading: THREE.FlatShading});
				cylinder = new THREE.Mesh(geometry, material);
				cylinder.rotation.x = Math.PI / 2;
				cylinder.rotation.y = Math.PI / 6;
				cylinder.position.x = start[0]/Hex.EDGE_LENGTH;
				cylinder.position.y = start[1]/Hex.EDGE_LENGTH;
				cylinder.userData['hexId'] = hex.id();
				if (SHADOW) {
					cylinder.receiveShadow = true;
				}
				self._scene.add(cylinder);
				self._cylinders[hex.id()] = cylinder;

				// draw map borders
				self._drawBorder(hex, cylinder);
				
				
			} else {
				cylinder = self._cylinders[hex.id()];
				// update color:
				cylinder.material.color = self._getCountryColor(countryId, state, isFighting);

				// resize cylinder height
				if (!DRAW_DICE && cylinder.geometry.height != state.countryDice(countryId) * 4)
				{
					self._scene.remove(cylinder);
					cylinder.geometry.dispose();
					cylinder.geometry = null;
					cylinder.geometry = new THREE.CylinderGeometry( 1, 1, state.countryDice(countryId) * 4, 6);
					if (SHADOW) {
						cylinder.receiveShadow = true;
					}
					self._scene.add(cylinder);
				}
			}
		},

		_drawBorder: function(hex, cylinder) {
			if (!DRAW_BORDERS) {
				return;
			}
			var self = this;
			if (hex._countryEdgeDirections.length) {
				cylinder.updateMatrixWorld();

				if (!self._lineMaterial) {
					self._lineMaterial = new THREE.LineBasicMaterial({
						color: 0x000000
					});
				}

				
				hex._countryEdgeDirections.forEach(function(dir) {
					
					var nextHex = Dir.nextHex(hex, dir, self._map);
					if (!nextHex || !nextHex.hasCountry()) {
						// don't draw lines if it's on the edge of the map
						return;
					}

					var g = new THREE.Geometry();

					if (dir == Dir.obj.NE) {
						var vertex = cylinder.geometry.vertices[0].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	

						vertex = cylinder.geometry.vertices[1].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	
					} 
					if (dir == Dir.obj.SE) {
						var vertex = cylinder.geometry.vertices[1].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	

						vertex = cylinder.geometry.vertices[2].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	
					} 
					if (dir == Dir.obj.S) {
						var vertex = cylinder.geometry.vertices[2].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	

						vertex = cylinder.geometry.vertices[3].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);
					}
					if (dir == Dir.obj.SW) {
						var vertex = cylinder.geometry.vertices[3].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	

						vertex = cylinder.geometry.vertices[4].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	
					}
					if (dir == Dir.obj.NW) {
						var vertex = cylinder.geometry.vertices[4].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	

						vertex = cylinder.geometry.vertices[5].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	
					}
					if (dir == Dir.obj.N) {
						var vertex = cylinder.geometry.vertices[5].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	

						vertex = cylinder.geometry.vertices[0].clone();
						cylinder.localToWorld(vertex);
						g.vertices.push(vertex);	
					} 
					g.vertices.forEach(function(v) {
						v.z += 0.01;
					})
					var line = new THREE.Line(g, self._lineMaterial);
					self._scene.add(line);
				});
			}
		},

		_getCountryColor: function(countryId, state, isFighting) {
			var self = this;
			isFighting = isFighting || false;
			var color = new THREE.Color(self._playerColors[state.countryOwner(countryId)]);

			if (isFighting) {
				color = new THREE.Color("rgb(50, 50, 50)");
			} else if (countryId == self._highlightedCountry) {
				if (countryId == self._selectedCountry) {
					color = new THREE.Color("rgb(75, 75, 75)");
				} else {
					color = new THREE.Color("rgb(100, 100, 100)");
				}
			} else {
				if (countryId == self._selectedCountry) {
					color = new THREE.Color("rgb(50, 50, 50)");
				} 
			}

			return color;
		},
		
		_drawDice: function (countryId, state) {
			var self = this;

			if (!self._dice[countryId + ':' + 1]) {
				self._initializeDice(countryId);
			}

			for (var i=1; i < 9; i++) {
				if (i <= state.countryDice(countryId)) {
					self._dice[countryId + ':' + i].visible = true;
				} else {
					self._dice[countryId + ':' + i].visible = false;
				}
			}
		},

		_initializeDice: function (countryId) {
			var self = this;

			var center = self._map.countryCenter(countryId);
			var x = center[0]/Hex.EDGE_LENGTH;
			var y = center[1]/Hex.EDGE_LENGTH;
			var z = self.DICE_SIZE;
			var angle = 0;

			// we add 8 dice to every country and just hide/show them as needed
			for (var i=1; i < 9; i++) {
				var cube = new THREE.Mesh( self._diceGeometry, self._diceMaterial);
				cube.position.x = x;
				cube.position.y = y;
				cube.position.z = z;
				cube.rotation.z = angle;
				if (SHADOW) {
					cube.castShadow = true;
				}
				self._dice[countryId + ':' + i] = cube;
				self._scene.add(cube);

				z += self.DICE_SIZE;
				angle += Math.PI/10;

				if (i == 4) {
					z = 2;
					angle = 0;
					y += self.DICE_SIZE + 0.1;
				}
			}
		},

		_initializeRollingDice: function() {
			var self = this;
			self._diceGeometry = new THREE.BoxGeometry( self.DICE_SIZE, self.DICE_SIZE, self.DICE_SIZE );				

			loader = new THREE.TextureLoader();
			var materials = [
				new THREE.MeshBasicMaterial({map: loader.load('/public/images/dice1.png')}),
				new THREE.MeshBasicMaterial({map: loader.load('/public/images/dice2.png')}),
				new THREE.MeshBasicMaterial({map: loader.load('/public/images/dice3.png')}),
				new THREE.MeshBasicMaterial({map: loader.load('/public/images/dice4.png')}),
				new THREE.MeshBasicMaterial({map: loader.load('/public/images/dice5.png')}),
				new THREE.MeshBasicMaterial({map: loader.load('/public/images/dice6.png')}),
			];
			self._diceMaterial = new THREE.MultiMaterial(materials);

			self._attackDice = [];
			self._defendDice = [];
			var cube;
			for (var i=0; i < 8; i++) {
				cube = new THREE.Mesh( self._diceGeometry, self._diceMaterial);
				cube.visible = false;
				self._attackDice.push(cube);
				self._scene.add(cube);

				cube = new THREE.Mesh( self._diceGeometry, self._diceMaterial);
				cube.visible = false;
				self._defendDice.push(cube);
				self._scene.add(cube);
			}
		},
		

		mouseLeave: function(event) {
			this._lastMouseX = -1;
			this._lastMouseY = -1;
			if (this._listener && this._mouseOverCountry != -1) {
				this._mouseOverCountry = -1;
				this._listener.mouseOverCountry(-1);
			}
		},


		mouseMove: function(event) {
			var self = this;
			
			self._mouseVector.x = 2 * (event.offsetX / self._canvasWidth) - 1;
			self._mouseVector.y = 1 - 2 * ( event.offsetY / self._canvasHeight );

			var hexes = [];
			Object.keys(self._cylinders).forEach(function(id) {
				hexes.push(self._cylinders[id]);
			});

			self._raycaster.setFromCamera(self._mouseVector, self._camera);
			var intersects = self._raycaster.intersectObjects(hexes);

			var cylinder = intersects[0];
			var countryId = -1;
			if (cylinder) {
				var hex = self._map.getHex(cylinder.object.userData.hexId);
				if (hex) {
					countryId = hex.countryId();
				}
			}

			if (self._mouseOverCountry != countryId) {
				self._mouseOverCountry = countryId;
				if (self._listener) {
					Globals.debug("detected mouse over country", countryId, Globals.LEVEL.TRACE, Globals.CHANNEL.RENDERER);
					self._listener.mouseOverCountry(countryId);
				}
			}
		},

		mouseDown: function() {
			this._mouseDown = true;
		},
		
		mouseUp: function() {
			this._mouseDown = false;
			this._lastMouseX = -1;
			this._lastMouseY = -1;
		},
		
		keyDown: function(event) {
			
			var self = this;
			var handled = false;

			switch (event.which) {
				case 37: // left
				case 65: // a
					self._angleZ -= .1;
					handled = true;
					break;
				case 38: // up
				case 87: // w
					self._theta += .1;
					self._theta = Math.min(self._theta, Math.PI/2);
					handled = true;
					break;
				case 39: // right
				case 68: // d
					self._angleZ += .1;
					handled = true;
					break;
				case 40: // down
				case 83: // s
					self._theta -= .1;
					self._theta = Math.max(self._theta, 0);
					handled = true;
					break;
				case 81: // q
					self._radius -= 5;
					self._radius = Math.max(self._radius, 0);
					handled = true;
					break;
				case 90: // z
					self._radius += 5;
					handled = true;
					break;
			}

			var xyProjection = self._radius * Math.cos(self._theta);
			self._camera.position.z = self._radius * Math.sin(self._theta);
			self._camera.position.y = xyProjection * Math.sin(self._angleZ);
			self._camera.position.x = xyProjection * Math.cos(self._angleZ);
			self._camera.position.y += self._mapCenterY;
			self._camera.position.x += self._mapCenterX;


			self._camera.lookAt(new THREE.Vector3(self._mapCenterX, self._mapCenterY, 0));

			self.update();
			return !handled;
		},

		update: function() {
			var self = this;
			Globals.debug("update()", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			requestAnimationFrame(self.renderEngineCallback.bind(self));
		},

		renderEngineCallback: function() {
			//Globals.debug("renderEngineCallback", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			var self = this;	
			console.time("RenderTime");
			self._renderer.render(self._scene, self._camera);
			console.timeEnd("RenderTime");
		},

		// this is to keep track of which countries have changed since we last drew them.
		// If the hash of a country's state hasn't changed, we don't redraw it.
		stateHash: {
	
			_players: {},
			_countries: {},
			
			reset: function() {
				this._players = {};
				this._countries = {};
			},
			
			hasPlayerChanged: function(playerId, hash) {
				if (this._players[playerId] === hash) {
					return false;
				} else {
					this._players[playerId] = hash;
					return true;
				}
			},
			
			hasCountryChanged: function(countryId, isFighting, hash) {
				if (isFighting) {
					hash += 1;
				}
				if (countryId == GLrenderer._highlightedCountry) {
					hash += 2;
				}
				if (countryId == GLrenderer._selectedCountry) {
					hash += 4;
				}
				if (this._countries[countryId] === hash) {
					return false;
				} else {
					this._countries[countryId] = hash;
					return true;
				}
			}
		}

		/*
				// @id = 1 to 8
		_rollAttackDie(id, value) {
			var self = this;
			var pos = new THREE.Vector3(-2,0,-15);
			pos.x -= (id % 5)* self.DICE_SIZE;
			if (id > 4) {
				pos.y += self.DICE_SIZE;
			}
			self._camera.localToWorld(pos);

			var die = self._attackDice[id-1];
			die.position.x = pos.x;
			die.position.y = pos.y;
			die.position.z = pos.z;

			self._camera.worldToLocal(pos);
			pos.y = 0;
			self._camera.localToWorld(pos);
			die.lookAt(pos);

			die.visible = true;
		},

		_sendDieTo: function(die, dest) {
			var self = this;
			var step = 0;
			var stepCount = 1;
			var stepX = (dest.x - die.position.x)/stepCount;
			var stepY = (dest.y - die.position.y)/stepCount;
			var stepZ = (dest.z - die.position.z)/stepCount;

			var lookAt = dest.clone();
			self._camera.worldToLocal(lookAt);
			lookAt.y = 0;
			self._camera.localToWorld(lookAt);

			return new Promise(function(resolve) {
				var animateCallback = function() {

					self._renderer.render(self._scene, self._camera);
					step++;
					
					if (step < stepCount) {
						die.position.x += stepX;
						die.position.y += stepY;
						die.position.z += stepZ;
						requestAnimationFrame(animateCallback);
					} else {
						die.position.x = dest.x;
						die.position.y = dest.y;
						die.position.z = dest.z;

						die.lookAt(lookAt);
						self.update();
						resolve();
					}
				}
				requestAnimationFrame(animateCallback);
			});
		}
		*/

	};
	

;'use strict'

$(function() {

	window.PlayerStatus = {

		_playerColors: [
			"red",
			"blue",
			"green",
			"yellow",
			"orange",
			"purple",
			"brown",
			"tan"
		],

		init: function(players) {
			this._players = players;
			this._setupPlayerDivs(this._players.length);
		},

		setPlayerName: function(id, name) {
			if (this._players[id]) {
				this._players[id] = name;
			}
		},

		_setupPlayerDivs: function(playerCount) {

			var self = this;
			
			$('#players').html('');
			
			// add a "country count" div for each player
			for (var id=0; id < playerCount; ++id) {
				
				$('#players').append(
		    		"<div id='player" + id + "' class='col-sm-2 player-box'><div id='colorblock" + id + "' class='color-block'></div>"
					+ ((self._players && self._players[id]) ? ("<div id='name" + id + "' class='name-box'>" + self._players[id] + "</div>") : "")
		    		+ "<div id='dice" + id + "' class='dice-box'>1</div>"
		    		+ "<div id='stored" + id + "' class='stored-box'>0</div></div>"
		    	);

		    	$('#colorblock' + id).css( 
			    	{		
			    		'background-color': self._playerColors[id]
			    	}
		    	);

				$('#stored' + id).css(
			    	{
						'color': self._playerColors[id]
			    	}
		    	);
			}
		},

		renderPlayers: function(state) {
			var self = this;
			state.playerIds().forEach(function(playerId){
				self._renderPlayer(playerId, state);
			});
		},
		
		_renderPlayer: function(playerId, state) {
			Globals.debug("renderPlayer " + playerId, Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			if (state.playerHasLost(playerId)) {
				$('#player' + playerId).hide();
			} else {				
				$('#player' + playerId).show();
				
				// Highlight the player's status box
				if (playerId == state.currentPlayerId()) {
					$('#player' + playerId).addClass("current-player");
				} else {
					$('#player' + playerId).removeClass("current-player");
				}
				
				// update stats
				$('#dice' + playerId).html(state.numContiguous(playerId));
		    	$('#stored' + playerId).html(state.storedDice(playerId));
			}
		},
			

	};

});;$(function(){

	$('#radio_2d').change(function() {
		if($('#radio_2d').prop("checked")){
			Renderer._init2d.apply(Renderer);
    	}
	});

	$('#radio_3d').change(function() {
		if($('#radio_3d').prop("checked")){
			Renderer._init3d.apply(Renderer);
    	}
	});

	window.Renderer = {

		iface: {
			mouseOverCountry: function(id){},
			stateRendered: function(state, id){}
		},

		_renderer: null,
		_history: [], // array of gamestates
		_rendering: false,
		_lastState: null,
		_renderCallback: null,
		_listener: null,
		_canvas: null,
		_map: null,
		_playerNames: [],

		_initialized2d: false,
		_initialized3d: false,

		init: function(canvas, map, playerNames, iface) {
			Globals.ASSERT(Globals.implements(iface, Renderer.iface));
			this._renderCallback = iface.stateRendered;
			iface.stateRendered = this._stateRendered.bind(this);
			this._listener = iface;
			this._canvas = canvas;
			this._map = map;
			this._playerNames = playerNames;

			if($('#radio_3d').attr("checked")){
				Renderer._init3d();
    		} else {
    			Renderer._init2d();
    		}

    		PlayerStatus.init(playerNames);
		},

		setPlayerName: function(id, name) {
			PlayerStatus.setPlayerName(id, name);
		},

		stateUpdate: function(state, id) {
			this._lastState = state;
			this._history.push(state);
			this._renderNext();
		},

		renderHistory: function(state) {
			this._renderer.render(state, this._renderCallback);
		},
		
		setMouseOverCountry: function(id) {
			this._renderer.setMouseOverCountry(id);
		},
		
		setSelectedCountry: function(id) {
			this._renderer.setSelectedCountry(id);
		},

		_init2d: function() {
			$('#radio_2d').prop('checked', true);
			$('#canvas3d_div').hide();
			$('#c').show();

			this._renderer = Renderer2d;
			if (!this._initialized2d) {
				this._initialized2d = true;
				this._renderer.init(this._canvas, this._map, this._playerNames, this._listener);
			}
			if (this._lastState) {
				this.stateUpdate(this._lastState, this._lastState.stateId());
			}
		},

		_init3d: function(playerCount, canvas, map, playerNames, iface) {
			$('#radio_3d').prop('checked', true);
			$('#c').hide();
			$('#canvas3d_div').show();

			this._renderer = GLrenderer;
			if (!this._initialized3d) {
				this._initialized3d = true;
				this._renderer.init(this._canvas, this._map, this._playerNames, this._listener);
			}
			if (this._lastState) {
				this.stateUpdate(this._lastState, this._lastState.stateId());
			}
		},

		_render: function(state, callback) {
			this._renderer.render(state, callback);
		},

		_stateRendered: function(state, id) {
			this._rendering = false;
			this._renderCallback(state, id);
			this._renderNext();
		},

		_renderNext: function() {
			if (!this._rendering && this._history.length) {
				var state = this._history.shift();
				this._rendering = true;
				this._render(state, this._stateRendered.bind(this));
				PlayerStatus.renderPlayers(state);
			}
		}

	};

});;"use strict"





var Renderer2d = {
		
		_canvas: null,
		_context: null,
		_initialized: false,
		_isRendering: false,
		_highlightedCountry: -1,
		_selectedCountry: -1,
		_mouseOverCountry: -1,
		_names: [],
		_map: null,
		_playerColors: [
			"red",
			"blue",
			"green",
			"yellow",
			"orange",
			"purple",
			"brown",
			"tan"
		],
		_lastRenderedState: null,
		_listener: null,
		
		init: function(canvas, map, playerNames, listener) {
			if (!Globals.suppress_ui) {
				Globals.ASSERT(Globals.implements(listener, Renderer.iface));
				this._canvas = canvas;
				if (!canvas) {
					return;
				}
				this._context = this._canvas.getContext('2d');
				this.clearAll();
				this._context.lineJoin = "straight";
				this._map = map;
				this._names = playerNames || [];
				this._listener = listener;

				$(canvas).mousemove(this.mouseMove.bind(this));
    			$(canvas).mouseleave(this.mouseLeave.bind(this));
				
				this._initialized = true;

                this._setupRollDivs();
			}			
		},

		clearAll: function() {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}							
			Globals.debug("clearAll", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			this._context.clearRect(0,0,2000,2000);
			this.stateHash.reset();
		},

		mouseMove: function(event) {
			if (this._listener) {
				var hex = this._map.fromMousePos(event.offsetX, event.offsetY);
				var countryId = hex ? hex.countryId() : -1;
				if (countryId != this._mouseOverCountry) {
					this._mouseOverCountry = countryId;
					this._listener.mouseOverCountry(countryId);
				}
			}
		},

		mouseLeave: function(event) {
			if (this._listener) {
				if (this._mouseOverCountry != -1) {
					this._mouseOverCountry = -1;
					this._listener.mouseOverCountry(-1);	
				}
			}
		},
		
		setMouseOverCountry: function(id) {
			if (!this._isRendering) {
				Renderer2d._highlightedCountry = id;
				this.render(this._lastRenderedState, null);
			}
		},
		
		setSelectedCountry: function(id) {
			if (!this._isRendering) {
				Renderer2d._selectedCountry = id;
				this.render(this._lastRenderedState, null);
			}
		},
		

		render: function(state, callback) {
			var self = this;
			if (self._isRendering) {
				Globals.debug("previous state rendering, render aborted", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
				callback();
				return;
			}
			Globals.debug("render()", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			
			self._renderMap(state);
			self._lastRenderedState = state;

			if (state.attack()) {
				self._renderAttack(state, callback);
			} else {
				if (callback) {
					callback(state, state.stateId());
				}
			}
		},
		
		/*
			@callback: function done(){}
		*/
		_renderAttack: function(state, callback) {
		
			if (Globals.suppress_ui || !this._initialized || !state) {
				callback();
				return;
			}
			Globals.debug("renderAttack", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			
			var self = this;
			var fromCountry = state.attack().fromCountryId;
			var fromPlayerId = state.countryOwner(fromCountry);
			
			var toCountry = state.attack().toCountryId;
			
			var fromNumDice = state.attack().fromRollArray.length;
			var toNumDice = state.attack().toRollArray.length;
			
			var fromRoll = state.attack().fromRollArray.reduce(function(total, die) { return total + die; }, 0);
	    	var toRoll = state.attack().toRollArray.reduce(function(total, die) { return total + die; }, 0);
			
			self._resetRollDivs(state,
				fromCountry, 
				toCountry, 
				state.attack().fromRollArray, 
				state.attack().toRollArray);
	
			// roll attacker
			Globals.debug("render attacker", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			self._renderCountry(fromCountry, state, true);
	        
			if (Globals.play_sounds && callback) {
	            $.playSound('/sounds/2_dice_throw_on_table');
	        }

	        self._isRendering = true;

			var timeout = callback ? Globals.timeout : 0;
	        window.setTimeout(function(){renderAttackRoll(state);}, timeout);
	
			function renderAttackRoll(state) {
				$('#lefttotal').html(fromRoll);
	            $('#leftroll').show();

				self._renderCountry(toCountry, state, true);
	            window.setTimeout(function(){renderDefendRoll(state);}, timeout);
			}
			
			function renderDefendRoll(state) {
				Globals.debug("render defender", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
				$('#righttotal').html(toRoll);
	            $('#rightroll').show();
	            window.setTimeout(function(){renderVerdict(state);}, timeout);
			}
			
			function renderVerdict(state) {
				Globals.debug("render verdict", Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
	        	if (fromRoll > toRoll) {
					// attacker wins
	                if (Globals.play_sounds && callback) {
	                    $.playSound('/sounds/clink_sound');
	                }
	        	} else {
					// defender wins
	                if (Globals.play_sounds && callback) {                
	                    $.playSound('/sounds/wood_hit_brick_1');               
	                }
	            }

	            self._isRendering = false;
				if (callback) {
					callback(state, state.stateId());
				}
			}
		
		},
		

		_renderMap: function(state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			Globals.debug("renderMap", Globals.LEVEL.INFO, Globals.CHANNEL.RENDERER);
			Globals.ASSERT(state instanceof Gamestate);
			var self = this;
			
			state.countryIds().forEach(function(countryId) {
				self._renderCountry(countryId, state)
			});
		},
		
		
		_renderCountry: function (countryId, state, isFighting) {
			if (Globals.suppress_ui || !this._initialized) {
	        	return;
			}
			
			if (!this.stateHash.hasCountryChanged(countryId, isFighting, state.countryHash(countryId))) {
				return;
			}
			
			Globals.debug("renderCountry " + countryId, Globals.LEVEL.DEBUG, Globals.CHANNEL.RENDERER);
			
			var self = this;
			isFighting = isFighting || false;
			
	        self._map.countryHexes(countryId).forEach(function(hexId) {
	            self._renderHex(self._map.getHex(hexId), state, isFighting);
	        });

	        var ctr = self._map.countryCenter(countryId);

	        self._renderNumberBox(countryId, state);

	        if (Globals.markCountryCenters) {
	            var path = new Path2D();
	            path.moveTo(ctr[0] - 4, ctr[1] - 4);
	            path.lineTo(ctr[0] + 4, ctr[1] + 4);
	            path.closePath();
	            self._context.strokeStyle = "black";
	            self._context.lineWidth = 2;
	            self._context.stroke(path);

	            path = new Path2D();
	            path.moveTo(ctr[0] - 4, ctr[1] + 4);
	            path.lineTo(ctr[0] + 4, ctr[1] - 4);
	            path.closePath();
	            self._context.strokeStyle = "black";
	            self._context.lineWidth = 2;
	            self._context.stroke(path);
	        }

	        if (Globals.drawCountryConnections) {
	            self._map.adjacentCountries(countryId).forEach(function(country) {
	                var otherCenter = self._map.countryCenter(country.id());
	                var path = new Path2D();
	                path.moveTo(ctr[0], ctr[1]);
	                path.lineTo(otherCenter[0], otherCenter[1]);
	                path.closePath();
	                self._context.strokeStyle = "black";
	                self._context.lineWidth = 1;
	                self._context.stroke(path);
	            });
	        }
	
			// number boxes can overlap between adjacent countries. Redraw
			// them for all our neighbors
			self._map.adjacentCountries(countryId).forEach(function(neighborId) {
				self._renderNumberBox(neighborId, state);
			});
		},
		
		
		
		
		_resetRollDivs: function(state, fromCountry, toCountry, fromRollArray, toRollArray) {
			
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this
	
			// clear previous attack info
	        $('#leftroll').hide();
	        $('#rightroll').hide();

			if (!fromCountry || !toCountry || !fromRollArray || !toRollArray) {
				return;
			}
	
			var fromNumDice = fromRollArray.length;
			var toNumDice = toRollArray.length;
			
			var fromRoll = fromRollArray.reduce(function(total, die) { return total + die; });
	    	var toRoll = toRollArray.reduce(function(total, die) { return total + die; });
	
			// style a div for each die both countries have
			for (var i = 0; i < Globals.maxDice; i++) {
				$('#leftdie' + i).css({
					'background-color': self._playerColors[state.countryOwner(fromCountry)]
				});

				if (i < fromNumDice) {
					$('#leftdie' + i).html(fromRollArray[i]);
					$('#leftdie' + i).show();
				} else {
					$('#leftdie' + i).hide();
				}

				$('#rightdie' + i).css({
					'background-color': self._playerColors[state.countryOwner(toCountry)]
				});

				if (i < toNumDice) {
					$('#rightdie' + i).html(toRollArray[i]);
					$('#rightdie' + i).show();
				} else {
					$('#rightdie' + i).hide();
				}
	    	}
		},
		
		
		_renderNumberBox: function (countryId, state) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this;
			var ctr = self._map.countryCenter(countryId);
			
			// Draw the number box.
	        var boxSize = 10;
			if (Globals.showCountryIds) {
				boxSize = 12;
			}
	        self._context.fillStyle = "white";
	        self._context.fillRect(ctr[0] - boxSize, ctr[1] - boxSize * 1.6, boxSize * 2, boxSize * 2);
	        self._context.rect(ctr[0] - boxSize, ctr[1] - boxSize * 1.6, boxSize * 2, boxSize * 2);
			if (!Globals.showCountryIds) {
	        	self._context.lineWidth = 1;
	        	self._context.strokeStyle = "black";
	        	self._context.stroke();
			}

	        self._context.fillStyle = "black";
	        self._context.font = "bold 18px sans-serif";
			if (Globals.showCountryIds) {
	        	self._context.textAlign = "right";
			} else {
	        	self._context.textAlign = "center";
			}
			self._context.fillText(state.countryDice(countryId), ctr[0], ctr[1]);
			
			if (Globals.showCountryIds) {
	        	self._context.fillStyle = "black";
				self._context.textAlign = "left";
	        	self._context.font = "10px sans-serif";
	        	self._context.fillText(countryId, ctr[0], ctr[1]);
			}
		},
		


		_renderHex: function (hexToPaint, state, isFighting) {
			if (Globals.suppress_ui || !this._initialized) {
				return;
			}
			
			var self = this;
			var countryId = hexToPaint.countryId();
			var upperLeft = hexToPaint.upperLeft();
	        var upperLeftX = upperLeft[0], upperLeftY = upperLeft[1];

	        var path = new Path2D();
	        path.moveTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
	        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY - Hex.FUDGE);
	        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	        path.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
	        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY + Hex.HEIGHT + Hex.FUDGE);
	        path.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
	        path.lineTo(upperLeftX - Hex.FUDGE, upperLeftY - Hex.FUDGE);
	        path.closePath();


	        self._context.fillStyle = Renderer2d._countryDrawColor(countryId, state, isFighting);
	        if (hexToPaint._color) {
	            self._context.fillStyle = hexToPaint._color;
	        }
	        self._context.fill(path);


            hexToPaint._countryEdgeDirections.forEach(function(dir) {
                var edgePath = new Path2D();
                switch(dir) {
                    case Dir.obj.NW: 
                    case "NW":
                        edgePath.moveTo(upperLeftX, upperLeftY);
                        edgePath.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
                        break;

                    case Dir.obj.N:
                    case "N":
                        edgePath.moveTo(upperLeftX, upperLeftY);
                        edgePath.lineTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY);
                        break;

                    case Dir.obj.NE:
                    case "NE":
                        edgePath.moveTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY);
                        edgePath.lineTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
                        break;

                    case Dir.obj.SE:
                    case "SE":
                        edgePath.moveTo(upperLeftX + Hex.EDGE_LENGTH + Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
                        edgePath.lineTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY + Hex.HEIGHT);
                        break;

                    case Dir.obj.S:
                    case "S":
                        edgePath.moveTo(upperLeftX + Hex.EDGE_LENGTH, upperLeftY + Hex.HEIGHT);
                        edgePath.lineTo(upperLeftX, upperLeftY + Hex.HEIGHT);
                        break;

                    case Dir.obj.SW:
                    case "SW":
                        edgePath.moveTo(upperLeftX, upperLeftY + Hex.HEIGHT);
                        edgePath.lineTo(upperLeftX - Hex.EDGE_LENGTH / 2, upperLeftY + Hex.HEIGHT / 2);
                        break;                    
					}

                edgePath.closePath();
                self._context.strokeStyle = isFighting ? "red" : "black";
                self._context.lineWidth = hexToPaint.BORDER_THICKNESS;

                self._context.stroke(edgePath);
	        });
	
			if (Globals.showNumbers) {
	            self._context.lineWidth = 1;
	            self._context.font = "11px sans-serif";
	            self._context.strokeText(hexToPaint._id, upperLeftX, upperLeftY + hexToPaint.HEIGHT / 2);
	        }

	        if (Globals.markHexCenters) {
	            var ctr = hexToPaint.center();
	            var path = new Path2D();
	            path.moveTo(ctr[0] - 2, ctr[1] - 2);
	            path.lineTo(ctr[0] + 2, ctr[1] + 2);
	            path.closePath();
	            self._context.strokeStyle = "black";
	            self._context.lineWidth = 1;
	            self._context.stroke(path);

	            path = new Path2D();
	            path.moveTo(ctr[0] - 2, ctr[1] + 2);
	            path.lineTo(ctr[0] + 2, ctr[1] - 2);
	            path.closePath();
	            self._context.strokeStyle = "black";
	            self._context.lineWidth = 1;
	            self._context.stroke(path);
	        }
			
		},
		
		_countryDrawColor: function(countryId, state, isFighting) {
			var self = this;
			var ownerId = state.countryOwner(countryId);
			if (isFighting) {
				return "black";
			} else if (countryId == self._highlightedCountry) {
		        if (countryId == self._selectedCountry) {
		            return "gray";
		        } else {
		            return "lightgray";
		        }
		    } else {
		        if (countryId == self._selectedCountry) {
		            return "black";
		        } else {
		            return self._playerColors[ownerId];
		        }
		    }
		},
		
		_setupRollDivs: function() {
	        $('#leftroll').hide();
	        $('#rightroll').hide();

            var diceDivIds = [];
            for (var i = 0; i < Globals.maxDice; i++) {
                $('#leftroll').append(
                    "<div id='leftdie" + i + "' class='roll-die'>5</div>"
                );

                diceDivIds.push('#leftdie' + i);

                $('#rightroll').append(
                    "<div id='rightdie" + i + "' class='roll-die'>5</div>"
                );

                diceDivIds.push('#rightdie' + i);
            }



            $('#leftroll').append(
                "<div id='lefttotal' class='roll-total'>35</div>"                    
            );


            $('#rightroll').append(
                "<div id='righttotal' class='roll-total'>35</div>"                    
            );

        },

        stateHash: {
	
			_players: {},
			_countries: {},
			
			reset: function() {
				this._players = {};
				this._countries = {};
			},
			
			hasPlayerChanged: function(playerId, hash) {
				if (this._players[playerId] === hash) {
					return false;
				} else {
					this._players[playerId] = hash;
					return true;
				}
			},
			
			hasCountryChanged: function(countryId, isFighting, hash) {
				if (isFighting) {
					hash += 1;
				}
				if (countryId == Renderer2d._highlightedCountry) {
					hash += 2;
				}
				if (countryId == Renderer2d._selectedCountry) {
					hash += 4;
				}
				if (this._countries[countryId] === hash) {
					return false;
				} else {
					this._countries[countryId] = hash;
					return true;
				}
			}
		}
	};
;"use strict"

var MAX_RETRIES = 5;

var Downloader = function() {
	this._array = [];
	this._retryCount = 0;
	this._pending = false;
	this._timeout = 10;
};

Downloader.prototype.hasPending = function() {
	return this._pending;
};

// @callback: function(success, msg) - if success == true, msg = http response. if success == false, msg = err
Downloader.prototype.get = function(url, callback) {
	Globals.debug("Push url", url, Globals.LEVEL.DEBUG, Globals.CHANNEL.DOWNLOADER);
	this._array.push({url: url, cb: callback});
	this._doNext();
};

Downloader.prototype.getGameInfo = function(gameId, callback) {
	var url = "/getGameInfo?gameId="+gameId;
	this.get(url, callback);
};

Downloader.prototype.getMap = function(gameId, callback) {
	var url = "/getMap?gameId="+gameId;
	this.get(url, callback);
};

Downloader.prototype.getState = function(gameId, stateId, callback) {
	var url = "/getState?gameId="+gameId+"&moveId="+stateId;
	this.get(url, callback);
};

Downloader.prototype.getStateCount = function(gameId, callback) {
	var url = "/getStateCount?gameId="+gameId;
	this.get(url, callback);
};

Downloader.prototype.getAIs = function(callback) {
	var url = "/aisjson";
	this.get(url, callback);
};

Downloader.prototype._doNext = function() {
	var self = this;
	if (!self._pending && self._array.length) {
		
		self._pending = true;
		
		window.setTimeout(function() {
			var url = self._array[0].url;
			Globals.debug("Download url", url, Globals.LEVEL.INFO, Globals.CHANNEL.DOWNLOADER);
			$.get(url)
			.done(function(d) {
				self.ajaxDone(d);
			}).fail(function(err) {
				self.ajaxFail(err);
			});
			
		}, self._timeout);
	}
};

Downloader.prototype.ajaxDone = function(data) {
	Globals.ASSERT(this._pending);
	var self = this;
	self._timeout = 10;
	self._retryCount = 0;
	var req = self._array.shift();
	Globals.debug("Got url", req.url, Globals.LEVEL.INFO, Globals.CHANNEL.DOWNLOADER);
	self._pending = false;
	if (req && req.cb) {
		req.cb(true, data);
	}
	self._doNext();
};

Downloader.prototype.ajaxFail = function(err) {
	Globals.debug("DOWNLOAD FAILURE: ", err.error(), JSON.stringify(err), Globals.LEVEL.WARN, Globals.CHANNEL.DOWNLOADER);
	var self = this;
	self._retryCount++;
	if (self._retryCount > MAX_RETRIES) {
		self._retryCount = 0;
		self._timeout = 10;
		var req = self._array.shift();
		if (req && req.cb) {
			req.cb(false, err);
		}
	} else {
		if (self._timeout < 10000) {
			self._timeout = self._timeout * 5;
		}
		self._pending = false;
		self._doNext();
	}
};;'use strict'


var History = function(gameId) {
	this._states = {};
	this._gameId = gameId;
	this._downloader = new Downloader();
	this._mostRecentStateId = -1;
	this._stateCallbacks = {}; // stateId to array of callbacks
};
	
// @callback: function(gamestate){}
History.prototype.getState = function(id, callback /*optional*/) {
	Globals.ASSERT(typeof id == 'number');
	var self = this;
	if (self._states[id]) {
		if (callback) {
			callback(self._states[id]);
		}
		return self._states[id];
	} else {
		if (callback) {
			self.onStateReceived(id, callback);
		}
		self._downloader.getState(self._gameId, id, self._stateDownload.bind(self));

		return null;
	}
};

History.prototype.latestId = function() {
	return this._mostRecentStateId;
};

History.prototype.getLatest = function() {
	var self = this;
	return self._states[self._mostRecentStateId];
};

History.prototype._stateDownload = function(success, data) {
	var self = this;
	if (success) {
		var gamestate = Gamestate.deserialize(JSON.parse(data.data));
		var id = parseInt(data.id); // 0-based. First state is state 0.
		Globals.debug("Downloaded state", id, Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);

		if (id > self._mostRecentStateId) { self._mostRecentStateId = id; }

		if (self._states.hasOwnProperty(id)) {
			Globals.debug("Downloaded state we already have", id, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
		} else {
			self._states[id] = gamestate;

			// inform everyone who's waiting for this state
			if (self._stateCallbacks.hasOwnProperty(id)) {
				var cbs = self._stateCallbacks[id];
				delete self._stateCallbacks[id];
				cbs.forEach(function(cb) { cb(gamestate); });
			}
		}
	} else {
		Globals.debug("Error downloading state data", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
	}
};

History.prototype.onStateReceived = function(stateId, cb) {	
	var self = this;
	if (self._states.hasOwnProperty(stateId)) {
		cb(self._states[stateId]);
	} else {
		if (!self._stateCallbacks.hasOwnProperty(stateId)) {
			self._stateCallbacks[stateId] = [];
		}
		self._stateCallbacks[stateId].push(cb);
	}
};

;'use strict'

var MapRequest = function(id, data, callback) {
	this.id = id;
	this.data = data;
	this.cb = callback;
	this.dataCount = data.length;
	this.resultsCount = 0;
	this.results = [];
	this.results.length = data.length;
};


var Mapper = function(threads) {
	this._threads = threads || 4;
	this._workers = [];
	this._reqs = {};
	this._nextReqId = 0;
	
	for (var i=0; i < this._threads; i++) {
		this._workers.push(new Worker("/js/util/worker.js"));
		this._workers[i].onmessage = this._callback.bind(this);
	}
};

// @data = []
// @callback = function(results_ary)
Mapper.prototype.map = function(data, fn, callback) {
	var self = this;
	
	var req = new MapRequest(self._nextReqId++, data, callback);
	self._reqs[req.id] = req;
	
	// serialize the fn
	var ser = fn.toString();
	
	// parse fn arguments
	var startArgs = ser.indexOf('(') + 1;
	var endArgs = ser.indexOf(')');
	var args = ser.substr(startArgs, endArgs-startArgs).split(',');
	args = args.map(function(arg) {return arg.trim();});
	
	// parse fn body
	ser = ser.substr(ser.indexOf('{'));
	
	var batchSize = 100;
	
	var workerId = 0;
	var batch = [];
	for (var idx=0; idx < data.length; idx++) {
		batch.push({command: 'compute', data: data[idx], fn: ser, args: args, data_id: idx, id: req.id});
		if (batch.length >= batchSize || idx == data.length-1) {
			if (self._workers[workerId]) {
				self._workers[workerId].postMessage({command: 'batch', data: batch, id: req.id});
				batch = [];
			}
			workerId ++;
			workerId = workerId % self._workers.length;
		}
	}
};

Mapper.prototype.stop = function() {
	this._workers.forEach(function(worker) {
		//worker.close();
		worker.onmessage = null;
	});
	this._workers.length = 0;
};

// @e.data = {command: 'result', id: , data_id: , result}
Mapper.prototype._callback = function(e) {
	var self = this;
	
	var msg = e.data;
	var req = self._reqs[msg.id];
	if (req) {
		if (msg.command == 'result') {
			self.receiveResult(req, msg);
		} else if (msg.command == 'batch_result') {
			msg.result.forEach(function(result) {
				self.receiveResult(req, result);
			});
		} else if (msg.command == 'error') {
			req.cb(msg.msg);
		}
	}
};

Mapper.prototype.receiveResult = function(req, msg) {
	var self = this;
	req.results[msg.data_id] = msg.result;
	req.resultsCount ++;
	if (req.resultsCount == req.dataCount) {
		delete self._reqs[req.id];
		if (req.cb) {
			req.cb(req.results);
		}
	}
};;"use strict"


var Uploader = function() {
	this._array = []; // array of {url: , data:}
	this._pending = false;
	this._timeout = 10;
	this._retryCount = 0;
};

Uploader.MAX_RETRIES = 4;

Uploader.prototype.push = function(url, data) {
	this._array.push({url: url, data: data});
	this._doNext();
};

Uploader.prototype.uploadMap = function(gameId, mapData) {
	var url = '/uploadMap?gameId=' + gameId;
	this.push(url, mapData);
};

Uploader.prototype.uploadState = function(gameId, stateId, stateData) {
	var url = '/uploadState?gameId=' + gameId + '&moveId=' + stateId;
	this.push(url, stateData);
};

Uploader.prototype.uploadGameInfo = function(gameId, data, ratingCode) {
	var url = '/uploadGameInfo?gameId=' + gameId;
	if (ratingCode) {
		url += '&ratingCode=' + ratingCode;
	}
	this.push(url, data);
};

// @buffer = array of {channel:, level:, msg:, gameId:}
Uploader.prototype.uploadLogDump = function(gameId, buffer) {
	var url = '/uploadErrorReport?gameId=' + gameId;
	this.push(url, JSON.stringify(buffer));
};

Uploader.prototype._doNext = function() {
	var self = this;
	if (!self._pending && self._array.length) {
		
		self._pending = true;
		
		window.setTimeout(function() {
			var req = self._array[0];
			
			$.ajax({
					url: req.url,
					type: 'POST',
					dataType: "json",
					contentType: "application/json; charset=utf-8",
					data: req.data,
					success: self.ajaxDone.bind(self),
					failure: self.ajaxFail.bind(self)
				});
			
		}, self._timeout);
	}
};

Uploader.prototype.ajaxDone = function(data) {
	Globals.ASSERT(this._pending);
	var self = this;
	self._timeout = 10;
	self._retryCount = 0;
	
	self._array.shift();
	self._pending = false;
	self._doNext();
};

Uploader.prototype.ajaxFail = function(err) {
	console.log("UPLOAD FAILURE: ", err.error(), JSON.stringify(err));
	var self = this;
	if (self._retryCount >= Uploader.MAX_RETRIES) {
		self.ajaxDone();
	} else {
		self._retryCount ++;
		if (self._timeout < 10000) {
			self._timeout = self._timeout * 10;
		}
		self._pending = false;
		self._doNext();
	}
};;'use strict'



/*
 @data = {
		command: 'compute'
		data:  []
		fn: string
		args: [string] // fn argument names
		data_id: // of data. must be passed back in result
		id: // of computation. must be passed back in result
	}
	
	OR
	
	{
	command: 'batch'
	data: array of compute msgs
	id: computation id
	}
*/
onmessage = function(e) {
	var msg = e.data;

	try {
		if (msg.command == 'compute') {
			postMessage(compute(msg));
		} else if (msg.command == 'batch') {
			var results = [];
			msg.data.forEach(function(msg) {
				results.push(compute(msg));
			});
			postMessage({command: 'batch_result', result: results, id: msg.id});
		}
		
	} catch (err) {
		console.log(err);
		postMessage({command: 'error', msg: JSON.stringify(err), data_id: msg.data_id, id: msg.id});
	}
};

var compute = function(msg) {
	if (!Array.isArray(msg.data)) {
		msg.data = [msg.data];
	}
	var fn = new Function(msg.args, msg.fn); 
	//console.log(fn);
	var result = fn.apply(null, msg.data);
	//console.log("result:", result);
	
	return {command: 'result', result: result, data_id: msg.data_id, id: msg.id};
};