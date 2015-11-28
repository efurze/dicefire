"use strict"

if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Gamestate = require('../game/gamestate.js');
	var Map = require('../game/Map.js');
	var window = {};
}


window.AI = window.AI || {};
window.AI.Util =  {
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

	doEndOfTurn: function (state) {
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
	},
		
	// returns odds of success
	// @attack is an Attack object
	attackOdds: function(state, attack) {
		Globals.ASSERT(state && state instanceof Gamestate);
		if (!attack.isEmpty()) {
			Globals.ASSERT(attack instanceof Attack);
			var a = state.countryDice(attack.from());
			var d = state.countryDice(attack.to());
			Globals.ASSERT(a > 0 && d > 0);
			var o = AI.Util.ODDS_ARRAY[a - 1][d - 1];
			//Globals.debug("Attack odds for " + a + " vs " + d + " = " + o, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			return o;
		} else {
			return 1;
		}
	},
	
	// return array of Move objects
	findAllMoves: function(state, length) {
		length = length || 1;
		var self = this;
		var moves_ary = [];

		var attacks = window.AI.Util.findAllAttacks(state);

		attacks.forEach(function(attack) {
			moves_ary.push(new Move(attack));
			if (length > 1) {
				// recurse
				self.findAllMoves(window.AI.Util.applyAttack(attack, state, true), length-1).forEach(function(nextMove) {
					var move = new Move(attack);
					move.push(nextMove);
					moves_ary.push(move);
				});
			}
		});

		return moves_ary;
	},
	
	/*
	 Loops through all countries owned by @state.currentPlayerId.
	 returns a list of all attacks that have at least a @threshold chance of success:
		@return = array of Attack objects
	*/
	findAllAttacks: function(state, threshold) {
		Globals.ASSERT(state);
		//Globals.debug("Find attacks for player " + state.currentPlayerId, Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		var threshold = threshold || 0.44;
		var attacks = [];
		
		// loop over all possible attacks, filter out the ones that are too improbable
		Object.keys(state.playerCountries(state.currentPlayerId())).forEach(function(cid) {
			var countryId = Number(cid);
			Globals.ASSERT(state.countryOwner(countryId) == state.currentPlayerId());

			if (state.countryDice(countryId) < 2) {
				return;
			}
			// for each country, loop through all adjacent enemies
			var ac = Map.adjacentCountries(countryId);
			var neighbors = ac ? (ac.filter(function(neighbor) {
				return (state.countryOwner(neighbor) != state.currentPlayerId())
			})) : [];
			//Globals.debug("country " + countryId + " adjacent to: " + JSON.stringify(neighbors), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
			neighbors.forEach(function (neighbor) {
				Globals.ASSERT (state.countryOwner(neighbor) != state.currentPlayerId());
				
				var attack = new Attack(countryId, neighbor);
				if (window.AI.Util.attackOdds(state, attack) >= threshold) {
					//Globals.debug("possible attack found", attack.toString(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
					attacks.push(attack);
				} else {
					//Globals.debug("attack too improbable", attack.toString(), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
				}
			});	
		});
		//Globals.debug("returning attacks ", Attack.arrayString(attacks), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		return attacks;
	},
	
	applyMove: function(next, state) {
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
	},
	
	// updated state is returned
	applyAttack: function(attack, state, success) {
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
	},
	
	maxIslandSize: function(playerId, state) {
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
					Map.adjacentCountries(countryId).reduce(function(total, adjacentCountry) {
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
	},
	
	// not counting stored dice
	totalDice: function(playerId, state) {
		Globals.ASSERT(state && state instanceof Gamestate);
		var total = 0;
		var countryIds = state.countryIds();
		countryIds.forEach(function(id){
			if (state.countryOwner(id) == playerId) {
				total += state.countryDice(id);
			}
		});
		return total;
	},
	
	totalCountries: function(playerId, state) {
		Globals.ASSERT(state && state instanceof Gamestate);
		var total = 0;
		var countryIds = state.countryIds();
		countryIds.forEach(function(id){
			if (state.countryOwner(id) == playerId) {
				total++;
			}
		});
		return total;
	},
	
	evalMove: function(move, state, evalfxn) {
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
			var winState = window.AI.Util.applyAttack(attack, state, true);
			var loseState = window.AI.Util.applyAttack(attack, state, false);
			var winOdds = window.AI.Util.attackOdds(state, attack);
			// recurse
			score = ((1 - winOdds) * self.evalPosition(loseState, evalfxn)) + (winOdds * self.evalMove(move, winState, evalfxn));
		}
		
		return score;
	},

	evalPosition: function(state, evalfxn) {
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
	},
	
	evalPlayer: function(state, playerId) {
		Globals.ASSERT(state && state instanceof Gamestate); 
		var self = this;
		if (state.playerHasLost(playerId)) {
			return 0;
		}
		
		var myCountryCount = window.AI.Util.totalCountries(playerId, state);
		var myContiguous = state.numContiguous(playerId);
		var myDice = window.AI.Util.totalDice(playerId, state);
		
		if (state.currentPlayerId() == playerId) {
			// for current player, count on them getting their end-of-turn dice injection
			myDice += Math.min(state.storedDice(playerId) + myContiguous, 64);
		} else {
			myDice += state.storedDice(playerId);
		}
		
		return ((2*myContiguous) - myCountryCount + myDice);		
	},
	
	indexOfMax: function(ary) {
		var max = ary[0];
		var idx = 0;
		for (var i=1; i < ary.length; i++) {
			if (ary[i] > max) {
				idx = i;
				max = ary[i];
			}
		}
		return idx;
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
	window.AI.Util.Move = Move;
	window.AI.Util.Attack = Attack;
	module.exports = window.AI.Util;
}