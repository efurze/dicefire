"use strict"


	var AI = AI || {};
	AI.Plyer =  function (ply_depth, lookahead) {
		
		this._myId = -1;
		this._MAX_PLIES = ply_depth || 1;
		this._lookahead = lookahead || 1
		this._interface = null;
	};

	AI.Plyer.prototype.init = function(id, iface, state) {
		this._myId = id;
		this._interface = iface;
		this._state = state;
		this.move();
	};

	AI.Plyer.prototype.update = function(update) {
		var self = this;
		var us = false;
		var hexIds = update.hexIds();

		for (var i=0; i < hexIds.length; i++) {
			if (update.ownerId(hexIds[i]) == self._myId) {
				us = true;
				break;
			}
		}

		self._state.merge(update);

		if (us) {
			window.setTimeout(self.move.bind(self), 1000);
		}
	};


	AI.Plyer.prototype.move = function() {
		var self = this;
		var state = self._state;
		
		var move = self.findBestGreedyMove(state, 1);
		if (move.length()) {
			var attack = move.pop();
			self._interface.attack(attack.from(), attack.to());
		}
	};
	
	AI.Plyer.prototype.logEval = function(state) {
		var self = this;
		var scores = state.playerIds().map(function(playerId){
			return self.evalPlayer(state, playerId);
		});
		
		Globals.debug("Player Scores: ", JSON.stringify(scores), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
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
		var lookahead = self._lookahead;
		var moves_ary = [];
		
		var moves = self.findAllMoves(self._myId, state, lookahead)
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
	
	// return array of Move objects
	AI.Plyer.prototype.findAllMoves = function(playerId, state, length) {
		length = length || 1;
		var self = this;
		var moves_ary = [];

		var attacks = self.findAllAttacks(playerId, state);

		attacks.forEach(function(attack) {
			moves_ary.push(new Move(attack));
			if (length > 1) {
				// recurse
				self.findAllMoves(playerId, self.applyAttack(attack, state, true), length-1).forEach(function(nextMove) {
					var move = new Move(attack);
					move.push(nextMove);
					moves_ary.push(move);
				});
			}
		});

		return moves_ary;
	};
	
	/*
	 Loops through all countries owned by forPlayerId.
	 returns a list of all attacks that have at least a @threshold chance of success:
		@return = array of Attack objects
	*/
	AI.Plyer.prototype.findAllAttacks = function(forPlayerId, state, threshold) {
		var threshold = threshold || 0.44;
		var attacks = [];
		var self = this;
		
		// loop over all possible attacks, filter out the ones that are too improbable
		state.playerHexIds(forPlayerId).forEach(function(hexId) {

			var hex = state.getHex(hexId);
			if (!hex || hex.diceCount(hexId) < 2) {
				return;
			}
			// for each country, loop through all adjacent enemies
			var ac = hex.adjacent();
			var neighbors = ac ? (ac.filter(function(neighbor) {
				return (state.ownerId(neighbor) != forPlayerId)
			})) : [];

			neighbors.forEach(function (neighbor) {
				var attack = new Attack(hexId, neighbor);
				if (AI.Util.attackOdds(state, attack) >= threshold) {
					attacks.push(attack);
				}
			});	
		});

		return attacks;
	};
	
	AI.Plyer.prototype.applyMove = function(next, state) {
		Globals.ASSERT(next instanceof Move || next instanceof Attack);
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
				
		return newState;
	};
	
	// updated state is returned
	AI.Plyer.prototype.applyAttack = function(attack, state, success) {
		Globals.ASSERT(attack instanceof Attack);
		
		// deep copy state
		var state = state.clone();
		
		if (attack.isEmpty()) {
			return state;
		}
		var self = this;
				
		var fromPlayer = state.ownerId(attack.from());
		var toPlayer = state.ownerId(attack.to());
		
		Globals.ASSERT(fromPlayer != toPlayer);
		Globals.ASSERT(fromPlayer == self._myId);
		

		if (success) {
			state.setDice(attack.to(), state.diceCount(attack.from()) - 1);
			
			// update country owner
			state.setOwner(attack.to(), fromPlayer);
			
		}
		state.setDice(attack.from(), 1);
		
		return state;
	};
	
	AI.Plyer.prototype.maxIslandSize = function(playerId, state) {
		
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
						if (state.ownerId(adjacentCountry) == playerId) {
							total += traverse(adjacentCountry);
						}
						return total;
					}, 0);
		};

		var playerCountries = state.playerHexIds(playerId);
		Object.keys(playerCountries).forEach(function(countryId) {
			var islandSize = traverse(countryId);

			if (islandSize > maxIslandSize) {
				maxIslandSize = islandSize;
			}
		});
		
		return maxIslandSize;
	};
	
	// not counting stored dice
	AI.Plyer.prototype.totalDice = function(playerId, state) {
		var total = 0;
		var countryIds = state.hexIds();
		countryIds.forEach(function(id){
			if (state.ownerId(id) == playerId) {
				total += state.diceCount(id);
			}
		});
		return total;
	};
	
	AI.Plyer.prototype.totalCountries = function(playerId, state) {
		var total = 0;
		var countryIds = state.hexIds();
		countryIds.forEach(function(id){
			if (state.ownerId(id) == playerId) {
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
		
		var myScore = scores[self._myId];
		
		var others=0;
		for(var i=0; i < scores.length; i++) {
			if (i != self._myId) {
				others += Math.pow(scores[i], 2);
			}
		}
		others = Math.sqrt(others);
		
		return scores[self._myId] - others;
	};
	
	AI.Plyer.prototype.evalPlayer = function(state, playerId) {
		var self = this;
		if (state.playerHexIds(playerId).length == 0) {
			return 0;
		}
		
		var myCountryCount = self.totalCountries(playerId, state);
		var myContiguous = AI.Util.numContiguous(state, playerId);
		var myDice = self.totalDice(playerId, state);
		
		myDice += state.storedDice(playerId);
		
		return ((2*myContiguous) - myCountryCount + myDice);		
	};
	
if (typeof module !== 'undefined' && module.exports) {
	module.exports = AI.Plyer;
}
	