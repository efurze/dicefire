"use strict"

	if (typeof module !== 'undefined' && module.exports) {
		var Globals = require('../globals.js');
		var Gamestate = require('../game/gamestate.js');
		var util = require('./util.js');
		var Hashes = require('../jshashes');
		var Move = util.Move;
		var Attack = util.Attack;
		var window = {};
	} else {
		var util = window.AI.Util;
		var SHA1 = new Hashes.SHA1();
	}
	
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
	window.AI.Plyer =  function (id, ply_depth, lookahead) {
		
		this._myId = id;
		this._MAX_PLIES = ply_depth || 1;
		this._lookahead = lookahead || 1
		this._interface = null;
	};
		
	window.AI.Plyer.getName = function() {
		return "Plyer 1.0";
	};
		
	// Factory method. Called when the AI is first started. Tells the AI its player number
	// and the list of other players, so it can know who is human and where
	// in the turn order this AI shows up.
	window.AI.Plyer.create = function(playerId, isHumanList) {
		return new window.AI.Plyer(playerId, 2, 1);
	};

	// Called each time the AI has a turn.
	window.AI.Plyer.prototype.startTurn = function(iface) {
		Globals.debug("**STARTING TURN**", Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		var self = this;
		self._interface = iface;
		var state = iface.getState();
		util.iface = iface;
		
		Globals.ASSERT(self._myId == state.currentPlayerId());
		
		Globals.debug("I AM PLAYER " + self._myId, Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
		Globals.debug("Gamestate: ", JSON.stringify(state), Globals.LEVEL.DEBUG, Globals.CHANNEL.PLYER);
		self.logEval(state);
		
		var moveSequence = self.bestMove(state, self._MAX_PLIES);
		Globals.debug("Attempting following move: ", JSON.stringify(moveSequence), Globals.LEVEL.INFO, Globals.CHANNEL.PLYER);
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
	
	
	window.AI.Plyer.prototype.bestMove = function(state, ply) {
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
				var nextState = util.applyMove(move, state);
				while((nextState=util.doEndOfTurn(nextState)).currentPlayerId() != state.currentPlayerId()) {
					var response = self.bestMove(nextState, ply-1);
					allPlayerResponses.push(response);
					nextState = util.applyMove(response, nextState);
				}
				// allPlayerResponses now has a move for each other player
				
				// return the state that will exist after every other player goes
				return nextState;
			});
			
			var idx = util.indexOfMax(responseStates.map(function(endState) {
				return util.evalPosition(endState, util.evalPlayer);
			}));
			
			return moves[idx];
		}		

	};

	
	// return a Move object
	window.AI.Plyer.prototype.findBestGreedyMove = function(state, length) {
		var self = this;
		self.findAllGreedyMoves(state, length);
		//Globals.ASSERT(self.foobar && self.foobar.length);
		
		var moves = self.findAllGreedyMoves(state, length);
		Globals.ASSERT(moves.length);
		return self.pickBest(moves, state);
		
	},
	
	// @moves: array of Move
	window.AI.Plyer.prototype.pickBest = function(moves, state) {
		if(!moves.length) {
			return new Move();
		}
		var scores = moves.map(function(move) {
			return util.evalMove(move, state, util.evalPlayer);
		});
		var maxIndex = util.indexOfMax(scores);;
		return moves[maxIndex];
	},
	
	// return array of Move objects
	window.AI.Plyer.prototype.findAllGreedyMoves = function(state, length) {
		length = length || 1;
		var self = this;
		var lookahead = state.currentPlayerId() == self._myId ? self._lookahead : 1;
		var moves_ary = [];
		
		var moves = util.findAllMoves(state, lookahead)
		if (!moves || !moves.length) {
			moves_ary.push(new Move());
			return moves_ary;
		}
		
		var idx = util.indexOfMax(moves.map(function(move) {
			return util.evalMove(move, state, util.evalPlayer);
		}));

		moves_ary.push(moves[idx]);
		if (length > 1) {
			self.findAllGreedyMoves(util.applyMove(moves[idx], state, true), length-lookahead).forEach(function(nextMove) {
				var move = new Move();
				move.push(moves[idx]);
				move.push(nextMove);
				moves_ary.push(move);
			});
		}

		Globals.ASSERT(moves_ary.length);
		return moves_ary;
	};
	
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = window.AI.Plyer;
	}
	