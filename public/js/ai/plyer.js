


	// USAGE: odds[attackingDiceCount - 1, defendingDiceCount - 1] gives the odds that the attacker wins
	var odds = [
		[ 0.4098, 0.0603, 0.0047, 0, 0, 0, 0, 0 ], // 1 dice attacking
		[ 0.8643, 0.4368, 0.1184, 0.0182, 0.0024, 0.0002, 0, 0 ], // 2 dice attacking
		[ 0.9874, 0.8094, 0.4479, 0.1604, 0.0345, 0.007, 0.0005, 0.0004 ], // 3 dice attacking
		[ 0.9995, 0.9612, 0.7708, 0.4578, 0.1941, 0.0575, 0.0128, 0.0024 ], // 4 attacking
		[ 1, 0.9944, 0.9395, 0.7359, 0.4591, 0.2107, 0.0714, 0.0212 ], // 5 attacking
		[ 1, 0.9997, 0.9877, 0.9129, 0.7275, 0.4626, 0.233, 0.0923 ], // 6 attacking
		[ 1, 1, 0.9987, 0.9772, 0.8913, 0.7131, 0.4652, 0.2514 ], // 7 attacking
		[ 1, 1, 0.9998, 0.9967, 0.9681, 0.8787, 0.6909, 0.466 ] // 8 attacking
	];

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
	window.AI.Plyer = {
		
		_myId: -1,
		_plyDepth: 0, // 0 = 1-ply
		_interface: null,
		
		
		// Called when the AI is first started. Tells the AI its player number
		// and the list of other players, so it can know who is human and where
		// in the turn order this AI shows up.
		init: function(playerId, isHumanList) {
			this._myId = playerId;
		},

		// Called each time the AI has a turn.
		startTurn: function(interface) {
			
			var self = this;
			self._interface = interface;
			var state = interface.getState();
			
			Globals.ASSERT(self._myId == state.currentPlayerId);
			
			state.playerCountries = {};
			var playerIds = Object.keys(state.players);
			playerIds.forEach(function(playerId) {
				state.playerCountries[playerId] = self.countriesForPlayer(playerId, state);
			});
			
			var moveSequence = self.findBestMove(state, self._plyDepth);
			self.makeMoves(moveSequence);

			interface.endTurn();
		},	
		
		makeMoves: function(move, countriesNotCaptured) {
			var self = this;
			countriesNotCaptured = countriesNotCaptured || {};
			if (!move || !move.length) {
				return;
			}
			
			countriesNotCaptured = countriesNotCaptured || {};
			
			// pop first move off - skip over any nonmoves or 
			// moves we can't make because we lost an earlier attack
			var attack = null;
			while (move.length && (!attack || !attack.length)) {
				attack = move.shift();
				if (countriesNotCaptured[attack[0]]) {
					Globals.debug("Country " + attack[0] + " not captured, skipping move " + JSON.stringify(attack), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
					move = null;
				}
			}
			
			if (attack && attack.length) {
				Globals.debug("Attacking country " + attack[1] + " from country " + attack[0], Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
				self._interface.attack(attack[0], attack[1], function(result) {
					if (!result) {
						countriesNotCaptured[attack[1]] = 1;
					}
					// recurse
					self.makeMoves(move, countriesNotCaptured);
				});
			}
		},
		
		countriesForPlayer: function(playerId, state) {
			var countries = {};
			var countryIds = Object.keys(state.countries);
			countryIds.forEach(function(id){
				if (state.countries[id].owner == playerId) {
					countries[id] = id;
				}
			});
			return countries;
		},
		
		findBestMove: function(state, ply) {
			
			var self = this;
			var attackChain = [];
			var playerId = state.currentPlayerId;
	
			
			/*			
			 an attack is a 2-element array: [23, 34] which specifies that country 23 attacks 34
			 a 'move' is a series of 0 or more attacks. so possible moves looks like:
			[
				[[]], 					// don't do anything
				[[23, 34]],				// one-attack move
				[[23, 34], [34, 43]]    // two-attack move
			]
			*/
			var possibleMoves = this.allReasonableMoves(state);
			Globals.debug("Found "+possibleMoves.length+" moves for this position", Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			
			
			// always consider doing nothing (zero-length attack chain)
			//attackChain.push([[[]]]);
			
			if (ply == 0) {
				var spreads = possibleMoves.map(function(move) {
											// move is an array of 2-element arrays:
											// move[0] = [attackingId, defendingId] for first attack
											
											// we have to consider 2 possible outcomes for each move: attack wins and
											// attack loses.
											Globals.debug("Evaluating possible move", move, Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
											return [self.applyMove(move, state, true), self.applyMove(move, state, false)];
										}).map(function(state) {
											// state is now a 2-element array
											var ret = [self.evalPosition(state[0]), self.evalPosition(state[1])];
											Globals.debug("Evaluation: "+ret[0]+" / "+ret[1], Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
											return ret;
										});
										
				// spreads is now a 2-d array of width 2:
				// spreads[n, 0] has success option for possibleMoves[n], spreads[n, 1] has failure option for that move
				Globals.debug("Move evals", spreads, Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
				
				//reduce each success/failure pair to a probabilistically weighted avg
				var scores = spreads.map(function(spread) {
					return spread.reduce(function(successScore, failureScore, i) {
						var odds = self.moveOdds(state, possibleMoves[i]);
						return ((odds * successScore) +
						 		((1 - odds) * failureScore) );
					});
				});
				
				var max = scores[0];
				var maxIndex = 0;
				scores.forEach(function(score, i) {
					Globals.debug("Move " + i + " score " + score, Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
					if (score > max) {
						max = score;
						maxIndex = i;
					}
				});
				
				Globals.debug("Selected move " + maxIndex + " with a score of " + max, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
				Globals.debug("Move " + maxIndex, JSON.stringify(possibleMoves[maxIndex]), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
				return possibleMoves[maxIndex];
				
			} else {
				Globals.ASSERT(false);
				/*
				// for each possible move, calculate the best response by each other player			
				var responseScores = possible.map(function(move) {
					// permute current state by every possible move
					var nextState = applyMove(move, state);
					var playerIds = Object.keys(state.players);
					return playerIds.map(function(pid) {
						if (pid == playerId) {
							return 0;
						}
						return findBestMove(pid, nextState, ply-1);
					});
				});
				*/
			}
		},
		
	
		/* 
		returns a list of all possible move sequences which are possible by 
		recursively considering allReasonableAttacks from current @state
		
		@return = [
			[[]],
			[[1, 2]]
			[[1, 2], [2, 3]]
			...]
		
		*/
		allReasonableMoves: function(state, depth) {
			var self = this;
			depth = depth || 0;
			var allMoves = [];
			
			if (depth > 3) {
				return null;
			}
			
			// find all 1-step moves from this position
			var attackOptions = self.allReasonableAttacks(state);
			
			
			//Globals.debug("attack options from position at depth " + depth, attackOptions, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			
			// for each possible move from this position, apply that move and recurse
			for (var i=0; i < attackOptions.length; i++) {
				var thisAttack = attackOptions[i];
				Globals.ASSERT(Array.isArray(thisAttack) && thisAttack.length == 2 && typeof thisAttack[0] === 'number');
				
				// always consider stopping the move after this attack
				Globals.debug("Pushing attack", thisAttack, Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
				allMoves.push([thisAttack]);
				
				
				// assume attack succeeds. Find allResonableMoves for the resulting game state
				var permutedState = self.applyMove([thisAttack], state, true);
				
				// recurse off of each potential next attack
				var potentialNextMoves = self.allReasonableMoves(permutedState, depth+1);
				
				if (potentialNextMoves) {
					potentialNextMoves.forEach(function(nextMove){
						// nextMove should be an array of attacks: [[1,2], [2,3]...]
						if (!nextMove || !nextMove.length || !nextMove[0].length) {
							// only add non-empty moves
							return;
						}
						var compoundMove = [thisAttack].concat(nextMove);
						Globals.debug("Pushing move", JSON.stringify(compoundMove), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
						Globals.ASSERT(Array.isArray(compoundMove) && compoundMove.length && compoundMove[0].length == 2)
						allMoves.push(compoundMove);
					});
				} 
				
			}
			
			Globals.debug("returning move list", JSON.stringify(allMoves), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
			
			return allMoves;
		},
		
		/*
		 Loops through all countries owned by @state.currentPlayerId.
		 returns a list of all attacks that have at least a 45% chance of success:
			@return = [
						[1,2],
						[4,3],
					 	... ]
		*/
		allReasonableAttacks: function(state) {
			Globals.ASSERT(state && state.countries);
			var self = this;
			var threshold = 0.45;
			var attacks = [];
			
			// loop over all possible attacks, filter out the ones that are too improbable
			Object.keys(state.playerCountries[state.currentPlayerId]).forEach(function(cid) {
				countryId = Number(cid);
				Globals.ASSERT(state.countries[countryId] && state.countries[countryId].adjacentCountries);
				// for each country, loop through all adjacent enemies
				state.countries[countryId].adjacentCountries.forEach(function (neighbor) {
					if (state.countries[neighbor].owner == state.currentPlayerId) {
						return;
					}
					
					var attack = [countryId, neighbor];
					if (self.attackOdds(state, attack) >= threshold) {
						Globals.debug("possible attack found", attack, Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
						attacks.push(attack);
					}
				});	
			});
			//Globals.debug("returning attacks ", attacks, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			return attacks;
		},
	
		// returns odds of success
		// @attack is [attackingCountryId, defendingCountryId]
		attackOdds: function(state, attack) {
			if (attack && attack.length == 2) {
				Globals.ASSERT(!Array.isArray(attack[0]));
				var a = state.countries[attack[0]].numDice;
				var d = state.countries[attack[1]].numDice;
				var o = odds[a - 1][d - 1];
				//Globals.debug("Attack odds for " + a + " vs " + d + " = " + o, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
				return o;
			} else {
				return 1;
			}
		},
		
		// returns odds of success
		// @move is [[attackingCountryId1, defendingCountryId1], [from2, to2] ... ]
		moveOdds: function(state, move) {
			if (!move || move.length == 0) {
				return 1;
			}
			
			Globals.ASSERT(Array.isArray(move[0]))
			
			var self = this;
			var prob = 1;
			
			move.forEach(function (attack) {
				Globals.ASSERT(Array.isArray(attack))
				prob *= self.attackOdds(state, attack);
				state = self.applyMove([attack], state, true);
			});
			
			return prob;
		},
		
		applyMove: function(move, state, success) {
			if (!move || !move.length || !move[0].length) {
				return state;
			}
			
			Globals.ASSERT(Array.isArray(move[0]));
			
			// deep copy state
			var state = JSON.parse(JSON.stringify(state));
			
			for (var i=0; i < move.length; i++) {
				this.applyAttack(move[i], state, success);
			}
			return state;
		},
		
		// no return value. Parameter @state is MODIFIED IN PLACE
		applyAttack: function(attack, state, success) {
			if (!attack || !attack.length) {
				return state;
			}
			
			Globals.ASSERT(Array.isArray(attack));
			Globals.ASSERT(attack.length == 2);
			
			var from = state.countries[attack[0]];
			var to = state.countries[attack[1]];
			Globals.ASSERT(from && to);
			
			var fromPlayer = from.owner;
			var toPlayer = to.owner;
			
			if (success) {
				to.numDice = from.numDice - 1;
				// country transfers ownership
				to.owner = from.owner;
				state.playerCountries[fromPlayer][to.id] = to.id;
				delete state.playerCountries[toPlayer][to.id];
			}
			from.numDice = 1;
			
		},
		
		maxIslandSize: function(playerId, state) {
			var alreadySeen = {};
			var maxIslandSize = 0;

			var traverse = function(country) {
				if (alreadySeen[country.id]) {
					return 0;
				}
				alreadySeen[country.id] = true;

				return 1 + 
						country.adjacentCountries.reduce(function(total, adjacentCountry) {
							if (state.countries[adjacentCountry].owner == playerId) {
								total += traverse(state.countries[adjacentCountry]);
							}
							return total;
						}, 0);
			};

			state.playerCountries[playerId].forEach(function(countryId) {
				countryId = Number(countryId);
				var islandSize = traverse(state.countries[countryId]);

				if (islandSize > maxIslandSize) {
					maxIslandSize = islandSize;
				}
			});
			
			return maxIslandSize;
		},
	
		evalPosition: function(state) {
			Globals.ASSERT(state && state.players);
			var self = this;
			var scores = [];
			
			scores.length = Object.keys(state.players).length;
			Object.keys(state.players).forEach(function(playerId){
				scores[playerId] = self.evalPlayer(state, playerId);
			});
			
			var myScore = scores[self._myId];
			scores.sort();
			
			if (myScore == scores[scores.length-1]) {
				myScore = myScore - scores[scores.length-2];
			} else {
				myScore = myScore - scores[scores.length-1];
			}
			
			return scores[self._myId];
		},
	
		evalPlayer: function(state, playerId) {
			var myCountryCount = AI.Plyer.totalCountries(playerId, state);
			var myContiguous = state.players[playerId].numContiguousCountries;
			var myDice = AI.Plyer.totalDice(playerId, state);
			
			//Globals.debug("Total dice for PlayerId", playerId, "=", myDice, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			
			if (state.currentPlayerId == playerId) {
				// for current player, count on them getting their end-of-turn dice injection
				myDice += Math.min(state.players[playerId].storedDice + myContiguous, 64);
			} else {
				myDice += state.players[playerId].storedDice;
			}
			
			var myAvg = myDice/myCountryCount;
			
			var score = myAvg * myContiguous + myContiguous;
			
			Globals.debug("PlayerId", playerId, "countries", myCountryCount, "contiguous", myContiguous,
			 				"diceDensity", myAvg, "SCORE", score, Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);

			return score;
		},
		
		totalCountries: function(playerId, state) {
			var total = 0;
			
			var countryIds = Object.keys(state.countries);
			countryIds.forEach(function(id){
				if (state.countries[id].owner == playerId) {
					total++;
				}
			});
			return total;
		},
		
		contiguousCountries: function(playerId, state) {
			
		},
		
		// not counting stored dice
		totalDice: function(playerId, state) {
			var total = 0;
			var countryIds = Object.keys(state.countries);
			countryIds.forEach(function(id){
				if (state.countries[id].owner == playerId) {
					total += state.countries[id].numDice;
				}
			});
			return total;
		},
		
		totalNeighbors: function(playerId, state) {
			
		},
		
		logPlayerCountries: function(playerId, state) {
			Globals.ASSERT(state);
			var countryIds = Object.keys(state.countries);
			countryIds.forEach(function(id){
				if (state.countries[id].owner == playerId) {
					Globals.debug("Country " + id + " has " + state.countries[id].numDice + " dice", Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
				}
			});
		}
	};
