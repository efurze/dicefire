"use strict"


	// USAGE: odds[attackingDiceCount - 1, defendingDiceCount - 1] gives the odds that the attacker wins
	var odds = [
		[ 0.4098, 	0.0603, 0.0047, 0, 		0, 		0, 		0, 		0 ], 		// 1 dice attacking
		[ 0.8643, 	0.4368, 0.1184, 0.0182, 0.0024, 0.0002, 0, 		0 ], 		// 2 dice attacking
		[ 0.9874, 	0.8094, 0.4479, 0.1604, 0.0345, 0.007, 	0.0005, 0.0004 ], 	// 3 dice attacking
		[ 0.9995, 	0.9612, 0.7708, 0.4578, 0.1941, 0.0575, 0.0128, 0.0024 ], 	// 4 attacking
		[ 1, 		0.9944, 0.9395, 0.7359, 0.4591, 0.2107, 0.0714, 0.0212 ], 	// 5 attacking
		[ 1, 		0.9997, 0.9877, 0.9129, 0.7275, 0.4626, 0.233, 	0.0923 ], 	// 6 attacking
		[ 1, 		1, 		0.9987, 0.9772, 0.8913, 0.7131, 0.4652, 0.2514 ], 	// 7 attacking
		[ 1, 		1, 		0.9998, 0.9967, 0.9681, 0.8787, 0.6909, 0.466 ] 	// 8 attacking
	];

	
	var SHA1 = new Hashes.SHA1();
	var hashState = function(state) {
		return SHA1.hex(JSON.stringify(state));
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
	
	Attack.isAttack = function(a) {
			return (a !== null) && a.__proto__ == Attack.prototype;
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
				Globals.ASSERT(Attack.isAttack(ary[0]) || Move.isMove(ary[0]));
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
		
	Move.isMove = function(m) {
		return (m !== null && m.hasOwnProperty('_attacks') && m.__proto__ == Move.prototype);
	};
	
	Move.prototype.length = function() {return this._attacks.length;}
	
	// adds to end
	Move.prototype.push = function(next) {
		Globals.ASSERT(Array.isArray(next) || Attack.isAttack(next) || Move.isMove(next));
		if (Array.isArray(next)) {
			this._attacks.push(new Attack(next[0], next[1]));
		} else if (Attack.isAttack(next)){
			this._attacks.push(next);
		} else if (Move.isMove(next) && next.hasMoreAttacks()) {
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
		this._plyDepth = 0; // 0 = 1-ply
		this._MAX_PLIES = 2;
		this._interface = null;
		this._plyTracker = [];
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
		self._memoHash = {};
		var state = iface.getState();
		
		Globals.ASSERT(self._myId == state.currentPlayerId);
		state.playerCountries = self.countriesForPlayers(state);
		
		Globals.debug("I AM PLAYER " + self._myId, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		Globals.debug("Gamestate: ", JSON.stringify(state), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		/*
		Object.keys(state.playerCountries).forEach(function(pid) {
			Globals.debug("Countries for player " + pid + ": " + Object.keys(state.playerCountries[pid]).join(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		})
		*/
		
		//var moveSequence = self.findBestMove(state, self._plyDepth);
		self._plyTracker = [];
		self._plyTracker.length = self._MAX_PLIES;
		var moveSequence = self.bestMoveFromState(state);
		Globals.debug("Positions evaluated at each ply: ", self._plyTracker, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		self.makeMoves(moveSequence);
	};
			
	window.AI.Plyer.prototype.makeMoves = function(move, countriesNotCaptured) {
		var self = this;
		countriesNotCaptured = countriesNotCaptured || {};
		
		// pop first move off - skip over any nonmoves or 
		// moves we can't make because we lost an earlier attack
		var attack = new Attack();
		while (move.hasMoreAttacks() && attack.isEmpty()) {
			attack = move.pop();
			if (countriesNotCaptured[attack.from()]) {
				Globals.debug("Country " + attack.from() + " not captured, skipping move " + attack.toString(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
				attack.clear();
			}
		}
		
		// TODO: I think this is wrong
		if (!move.hasMoreAttacks() && attack.isEmpty()) {
			self.finishTurn();
			return;
		}			
		
		if (!attack.isEmpty()) {
			Globals.debug("Country " + attack.from() + " ATTACKING country " + attack.to(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
			self._interface.attack(attack.from(), attack.to(), function(result) {
				if (!result) {
					Globals.debug("ATTACK FAILED", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
					countriesNotCaptured[attack.to()] = 1;
				} else {
					Globals.debug("ATTACK SUCCEEDED", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
				}
				// recurse
				self.makeMoves(move, countriesNotCaptured);
			});
		} 
	};
	
	window.AI.Plyer.prototype.finishTurn = function() {
		var self = this;
		var state = self._interface.getState();
		state.playerCountries = self.countriesForPlayers(state);
		
		Object.keys(state.playerCountries).forEach(function(pid) {
			Globals.debug("Countries for player " + pid + ": " + Object.keys(state.playerCountries[pid]).join(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		})

		Globals.debug("**ENDING TURN**", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		self._interface.endTurn();
		
		return;
	},
	
	window.AI.Plyer.prototype.countriesForPlayers = function(state) {
		
		var playerCountries = {};
		var playerIds = Object.keys(state.players);
		playerIds.forEach(function(playerId) {
			var countryIds = Object.keys(state.countries);
			countryIds.forEach(function(id){
				if (!playerCountries[state.countries[id].owner]) {
					playerCountries[state.countries[id].owner] = {};
				}
				playerCountries[state.countries[id].owner][id] = Number(id);
			});
		});
		
		return playerCountries;
	};
	
	
	window.AI.Plyer.prototype.doEndOfTurn = function (state) {
		Globals.ASSERT(state);
		Globals.ASSERT(typeof state === "object");
		
		// deep copy state
		state = JSON.parse(JSON.stringify(state));
		
		// add 1 die to each country for currentPlayer
		Object.keys(state.playerCountries[state.currentPlayerId]).forEach(function(id) {
			id = Number(id);
			state.countries[id].numDice ++;
			state.countries[id].numDice = Math.min(state.countries[id].numDice, 8);
		});

		do {
			state.currentPlayerId++;
			state.currentPlayerId = state.currentPlayerId % Object.keys(state.players).length;
		} while (state.players[state.currentPlayerId].hasLost);
		
		return state;
	};
	
	/* 
	Pass in a state, and this will find the best move, within @ply gametree levels
	@returns {move: [[1,2], [2,3]...],
				 score: 34.8}
	*/
	window.AI.Plyer.prototype.bestMoveFromState = function(state, ply) {
		var self = this;
		ply = ply || 0;
		var move = new Move();
		var playerId = state.currentPlayerId;
		
		
		if (ply < self._MAX_PLIES) {
			move = self.constructBestMove(state, ply);
			if (ply == 0) {
				Globals.debug("[PLY " + ply + "] Best move for position: " + move.toString(), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
			}
		}
		
		return move;
	};
	
	window.AI.Plyer.prototype.constructBestMove = function(state, ply) {
		//Globals.debug("[PLY " + ply + "] constructBestMove", Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		var self = this;
		var bestMove = new Move();
		
		// find all 1-step moves from this position
		var nextMoves = self.findAllMoves(state, 1);
		
		// always consider doing nothing
		nextMoves.push(new Move(new Attack()));
		//Globals.debug("Considering these attacks: " + Attack.arrayString(nextMoves), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		//Globals.debug("[PLY " + ply + "] Considering " + nextMoves.length + " attacks", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		
		// score each attack option by looking at all responses (ply deep)
		var attackScores = nextMoves.map(function(move) {
			//Globals.debug("Considering counterattacks to move " + move.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
			Globals.ASSERT(Move.isMove(move));
			
			// Assume move ends after this move. 
			// do all of the other players' counterattacks and evaluate the position
			var nextState = self.applyMove(move, state);
			while ((nextState=self.doEndOfTurn(nextState)).currentPlayerId != state.currentPlayerId) {
				//Globals.debug("Calculating best reply for player " + nextState.currentPlayerId, Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
				var bestResponse = self.bestMoveFromState(nextState, ply+1);
				//Globals.debug("Best response: " + bestResponse.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
				nextState = self.applyMove(bestResponse, nextState);
			}
			
			self._plyTracker[ply] = self._plyTracker[ply] ? self._plyTracker[ply] + 1 : 1;
			var score = self.evalPosition(nextState);
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
			var nextState = self.applyMove(bestAttack, state, true);
			Globals.ASSERT(hashState(state) != hashState(nextState));
			var nextMove = self.constructBestMove(nextState, ply);
			if (nextMove.hasMoreAttacks()) {
				bestMove.push(nextMove);
			}
			//Globals.debug("returning best move: " + bestMove.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
			return bestMove;
		}
	};

	// return array of Move objects
	window.AI.Plyer.prototype.findAllMoves = function(state, length) {
		length = length || 1;
		var self = this;
		var moves_ary = [];
		var attacks = this.findAllAttacks(state);
		
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
	 returns a list of all attacks that have at least a 45% chance of success:
		@return = array of Attack objects
	*/
	window.AI.Plyer.prototype.findAllAttacks = function(state) {
		Globals.ASSERT(state && state.countries);
		//Globals.debug("Find attacks for player " + state.currentPlayerId, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		var self = this;
		var threshold = 0.45;
		var attacks = [];
		
		// loop over all possible attacks, filter out the ones that are too improbable
		Object.keys(state.playerCountries[state.currentPlayerId]).forEach(function(cid) {
			var countryId = Number(cid);
			Globals.ASSERT(state.countries[countryId] && state.countries[countryId].adjacentCountries);
			if (state.countries[countryId].numDice == 1) {
				return;
			}
			// for each country, loop through all adjacent enemies
			var neighbors = state.countries[countryId].adjacentCountries.filter(function(neighbor) {
				return (state.countries[neighbor].owner != state.currentPlayerId)
			});
			//Globals.debug("country " + countryId + " adjacent to: " + JSON.stringify(neighbors), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			neighbors.forEach(function (neighbor) {
				Globals.ASSERT (state.countries[neighbor].owner != state.currentPlayerId);
				
				var attack = new Attack(countryId, neighbor);
				if (self.attackOdds(state, attack) >= threshold) {
					//Globals.debug("possible attack found", attack.toString(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
					attacks.push(attack);
				} else {
					//Globals.debug("attack too improbable", attack.toString(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
				}
			});	
		});
		//Globals.debug("returning attacks ", Attack.arrayString(attacks), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		return attacks;
	};

	// returns odds of success
	// @attack is an Attack object
	window.AI.Plyer.prototype.attackOdds = function(state, attack) {
		Globals.ASSERT(state && state.countries);
		Globals.ASSERT(state.countries.hasOwnProperty(attack.from()) && state.countries.hasOwnProperty(attack.to()));
		if (!attack.isEmpty()) {
			Globals.ASSERT(Attack.isAttack(attack));
			var a = state.countries[attack.from()].numDice;
			var d = state.countries[attack.to()].numDice;
			var o = odds[a - 1][d - 1];
			//Globals.debug("Attack odds for " + a + " vs " + d + " = " + o, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			return o;
		} else {
			return 1;
		}
	};

	
	window.AI.Plyer.prototype.applyMove = function(next, state) {
		Globals.ASSERT(Move.isMove(next) || Attack.isAttack(next));
		if (Attack.isAttack(next)) {
			return this.applyAttack(next, state, true);
		}
		
		if (!next.hasMoreAttacks()) {
			return state;
		}
		
		// deep copy state
		var newState = JSON.parse(JSON.stringify(state));
		
		for (var i=0; i < next.length(); i++) {
			newState = this.applyAttack(next.at(i), newState, true);
		}
		
		var cur = state.currentPlayerId;
		
		Globals.ASSERT(this.totalDice(cur, state) == this.totalDice(cur, newState))
		Globals.ASSERT((Object.keys(state.playerCountries[cur]).length + next.length())
							== Object.keys(newState.playerCountries[cur]).length);
		
		return newState;
	};
	
	// updated state is returned
	window.AI.Plyer.prototype.applyAttack = function(attack, state, success) {
		// deep copy state
		var state = JSON.parse(JSON.stringify(state));
		
		Globals.ASSERT(Attack.isAttack(attack));
		if (attack.isEmpty()) {
			return state;
		}
		var self = this;
		
		var from = state.countries[attack.from()];
		var to = state.countries[attack.to()];
		Globals.ASSERT(from && to);
		Globals.ASSERT(from.id != to.id);
		
		var fromPlayer = from.owner;
		var toPlayer = to.owner;
		Globals.ASSERT(fromPlayer != toPlayer);
		Globals.ASSERT(fromPlayer == state.currentPlayerId);
		
		if (success) {
			to.numDice = from.numDice - 1;
			// country transfers ownership
			to.owner = from.owner;
			state.playerCountries[fromPlayer][to.id] = to.id;
			delete state.playerCountries[toPlayer][to.id];
			
			// update contiguous country count
			state.players[toPlayer].numContiguousCountries = self.maxIslandSize(toPlayer, state);
			state.players[fromPlayer].numContiguousCountries = self.maxIslandSize(fromPlayer, state);
		}
		from.numDice = 1;
		
		return state;
	};
	
	window.AI.Plyer.prototype.maxIslandSize = function(playerId, state) {
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

		Object.keys(state.playerCountries[playerId]).forEach(function(countryId) {
			countryId = Number(countryId);
			var islandSize = traverse(state.countries[countryId]);

			if (islandSize > maxIslandSize) {
				maxIslandSize = islandSize;
			}
		});
		
		return maxIslandSize;
	};

	window.AI.Plyer.prototype.evalMove = function(move, state) {
		Globals.ASSERT(Move.isMove(move));
		Globals.debug("evalMove: ", move.toString(), Globals.LEVEL.TRACE, Globals.CHANNEL.PLYER);
		var self = this;
		var score = 0;
		if (!move.hasMoreAttacks()) {
			score = self.evalPosition(state);
		} else {
			// deep-copy move
			move = JSON.parse(JSON.stringify(move));
			var attack = move.pop();
			var winState = self.applyAttack(attack, state, true);
			var loseState = self.applyAttack(attack, state, false);
			var winOdds = self.attackOdds(state, attack);
			// recurse
			score = ((1 - winOdds) * self.evalPosition(loseState)) + (winOdds * self.evalMove(move, winState));
		}
		
		return score;
	};

	window.AI.Plyer.prototype.evalPosition = function(state) {
		Globals.ASSERT(state && state.players);
		var self = this;
		
		var scores = [];
		
		scores.length = Object.keys(state.players).length;
		Object.keys(state.players).forEach(function(playerId){
			scores[playerId] = self.evalPlayer(state, playerId);
		});
		
		var myScore = scores[state.currentPlayerId];
		
		var others=0;
		for(var i=0; i < scores.length; i++) {
			if (i != state.currentPlayerId) {
				others += Math.pow(scores[i], 2);
			}
		}
		others = Math.sqrt(others);
		
		return scores[state.currentPlayerId] - others;
	};

	window.AI.Plyer.prototype.evalPlayer = function(state, playerId) {
		var self = this;
		
		if (state.players[playerId].hasLost) {
			return 0;
		}
		
		var myCountryCount = self.totalCountries(playerId, state);
		var myContiguous = state.players[playerId].numContiguousCountries;
		var myDice = self.totalDice(playerId, state);
		
		return (2*myContiguous) - myCountryCount;
		
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
	};
	
	window.AI.Plyer.prototype.totalCountries = function(playerId, state) {
		var total = 0;
		
		var countryIds = Object.keys(state.countries);
		countryIds.forEach(function(id){
			if (state.countries[id].owner == playerId) {
				total++;
			}
		});
		return total;
	};

	
	// not counting stored dice
	window.AI.Plyer.prototype.totalDice = function(playerId, state) {
		var total = 0;
		var countryIds = Object.keys(state.countries);
		countryIds.forEach(function(id){
			if (state.countries[id].owner == playerId) {
				total += state.countries[id].numDice;
			}
		});
		return total;
	};
	
	window.AI.Plyer.prototype.totalNeighbors = function(playerId, state) {
		
	};
	
	window.AI.Plyer.prototype.playerHasCountry = function(playerId, state, countryId) {
		return (countryId in state.playerCountries[playerId]);
	};
	
	window.AI.Plyer.prototype.logPlayerCountries = function(playerId, state) {
		Globals.ASSERT(state);
		var countryIds = Object.keys(state.countries);
		countryIds.forEach(function(id){
			if (state.countries[id].owner == playerId) {
				Globals.debug("Country " + id + " has " + state.countries[id].numDice + " dice", Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			}
		});
	};

var testState = "{\"players\":{\"0\":{\"id\":0,\"hasLost\":false,\"storedDice\":0,\"numContiguousCountries\":12},\"1\":{\"id\":1,\"hasLost\":false,\"storedDice\":0,\"numContiguousCountries\":8}},\"countries\":{\"0\":{\"id\":0,\"owner\":1,\"numDice\":1,\"adjacentCountries\":[1,3,4]},\"1\":{\"id\":1,\"owner\":0,\"numDice\":2,\"adjacentCountries\":[0,2,4]},\"2\":{\"id\":2,\"owner\":0,\"numDice\":1,\"adjacentCountries\":[1,17,4,5]},\"3\":{\"id\":3,\"owner\":0,\"numDice\":3,\"adjacentCountries\":[0,10,19,6,4,5]},\"4\":{\"id\":4,\"owner\":0,\"numDice\":3,\"adjacentCountries\":[2,5,1,3,0]},\"5\":{\"id\":5,\"owner\":1,\"numDice\":3,\"adjacentCountries\":[4,8,9,6,17,2,3]},\"6\":{\"id\":6,\"owner\":1,\"numDice\":1,\"adjacentCountries\":[5,3,8,7,10]},\"7\":{\"id\":7,\"owner\":1,\"numDice\":1,\"adjacentCountries\":[6,8,10,14,12,13]},\"8\":{\"id\":8,\"owner\":0,\"numDice\":2,\"adjacentCountries\":[7,6,5,9,13,20]},\"9\":{\"id\":9,\"owner\":0,\"numDice\":2,\"adjacentCountries\":[5,8,17,20]},\"10\":{\"id\":10,\"owner\":1,\"numDice\":1,\"adjacentCountries\":[6,3,7,19,11,12]},\"11\":{\"id\":11,\"owner\":0,\"numDice\":2,\"adjacentCountries\":[10,24,19]},\"12\":{\"id\":12,\"owner\":0,\"numDice\":4,\"adjacentCountries\":[10,7,23,15]},\"13\":{\"id\":13,\"owner\":0,\"numDice\":4,\"adjacentCountries\":[8,7,18,14,20]},\"14\":{\"id\":14,\"owner\":1,\"numDice\":2,\"adjacentCountries\":[13,7,23,25,29,18]},\"15\":{\"id\":15,\"owner\":1,\"numDice\":2,\"adjacentCountries\":[12,23,28,22,16]},\"16\":{\"id\":16,\"owner\":1,\"numDice\":1,\"adjacentCountries\":[15,28,24]},\"17\":{\"id\":17,\"owner\":0,\"numDice\":1,\"adjacentCountries\":[2,9,5]},\"18\":{\"id\":18,\"owner\":1,\"numDice\":1,\"adjacentCountries\":[13,14,31,25,20]},\"19\":{\"id\":19,\"owner\":0,\"numDice\":2,\"adjacentCountries\":[3,10,11,24]},\"20\":{\"id\":20,\"owner\":0,\"numDice\":2,\"adjacentCountries\":[8,18,13,9,21,31]},\"21\":{\"id\":21,\"owner\":0,\"numDice\":4,\"adjacentCountries\":[20,31]},\"22\":{\"id\":22,\"owner\":1,\"numDice\":2,\"adjacentCountries\":[15,29,27,23,28,26]},\"23\":{\"id\":23,\"owner\":0,\"numDice\":2,\"adjacentCountries\":[12,15,14,22,29]},\"24\":{\"id\":24,\"owner\":1,\"numDice\":2,\"adjacentCountries\":[11,16,30,19]},\"25\":{\"id\":25,\"owner\":1,\"numDice\":2,\"adjacentCountries\":[14,18,31]},\"26\":{\"id\":26,\"owner\":1,\"numDice\":2,\"adjacentCountries\":[22,29,27]},\"27\":{\"id\":27,\"owner\":0,\"numDice\":1,\"adjacentCountries\":[26,22,28]},\"28\":{\"id\":28,\"owner\":1,\"numDice\":2,\"adjacentCountries\":[15,16,27,22]},\"29\":{\"id\":29,\"owner\":0,\"numDice\":3,\"adjacentCountries\":[22,23,26,14]},\"30\":{\"id\":30,\"owner\":1,\"numDice\":2,\"adjacentCountries\":[24]},\"31\":{\"id\":31,\"owner\":1,\"numDice\":1,\"adjacentCountries\":[18,21,20,25]}},\"currentPlayerId\":1,\"playerCountries\":{\"0\":{\"1\":1,\"2\":2,\"3\":3,\"4\":4,\"8\":8,\"9\":9,\"11\":11,\"12\":12,\"13\":13,\"17\":17,\"19\":19,\"20\":20,\"21\":21,\"23\":23,\"27\":27,\"29\":29},\"1\":{\"0\":0,\"5\":5,\"6\":6,\"7\":7,\"10\":10,\"14\":14,\"15\":15,\"16\":16,\"18\":18,\"22\":22,\"24\":24,\"25\":25,\"26\":26,\"28\":28,\"30\":30,\"31\":31}}}";
