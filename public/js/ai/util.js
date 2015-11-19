"use strict"

var Attack = function(fromId, toId) {
	if ((typeof fromId !== 'undefined') && (typeof toId !== 'undefined')) {
		this._from = fromId;
		this._to = toId;
	} else {
		this._from = -1;
		this._to = -1;
	}
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
		Object.keys(state.playerCountries()[state.currentPlayerId()]).forEach(function(id) {
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
	
	countriesForPlayers: function(state) {
		Globals.ASSERT(state && state instanceof Gamestate);
		var playerCountries = {};
		var playerIds = state.playerIds();
		playerIds.forEach(function(playerId) {
			var countryIds = state.countryIds();
			countryIds.forEach(function(id){
				if (!playerCountries[state.countryOwner(id)]) {
					playerCountries[state.countryOwner(id)] = {};
				}
				playerCountries[state.countryOwner(id)][id] = Number(id);
			});
		});
		
		return playerCountries;
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
		
		var playerCountries = state.playerCountries();
		
		if (success) {
			
			state.setCountryDice(attack.to(), state.countryDice(attack.from()) - 1);
			// country transfers ownership
			state.setCountryOwner(attack.to(), fromPlayer);
			playerCountries[fromPlayer][attack.to()] = attack.to();
			delete playerCountries[toPlayer][attack.to()];
			
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

		var playerCountries = state.playerCountries();
		Object.keys(playerCountries[playerId]).forEach(function(countryId) {
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
};