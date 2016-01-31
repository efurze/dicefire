'use strict'


var Engine = function() {

};

// @playerAry: array of Engine.PlayerInterface
Engine.prototype.init = function(playersAry) {
	var self = this;
	self._state = new WorldState();
	self._players = playersAry;
};

Engine.prototype.start = function(state) {
	var self = this;
	if (state) {
		self._state = state;
	}

	self._setTimer(self._tick.bind(self), 1000)
};

Engine.prototype._tick = function() {

};


Engine.prototype.attack = function(from, to, playerId) {
	var self = this;

	var fromHex = self._state.getHex(from);
	var toHex = self._state.getHex(to);

	var fromRoll = Engine.rollDice(fromHex.diceCount());
	var toRoll = Engine.rollDice(toHex.diceCount());

	var fromTotal = fromRoll.reduce(function(total, die) { return total + die; }, 0);
	var toTotal = toRoll.reduce(function(total, die) { return total + die; }, 0);

	if (fromTotal > toTotal) {

		return true;
	} else {


		return false;
	}
};


Engine.rollDie = function() {
	return Math.floor(Math.random() * 6) + 1;
};

Engine.rollDice = function(num) {
	var array = [];
	for (var i = 0; i < num; i++) {
		array.push(Engine.rollDie());
	}
	return array;
};

Engine.prototype._setTimer = function(callback, interval) {
	if (typeof module !== 'undefined' && module.exports) {
		return setTimeout(callback, interval);
	} else {
		return window.setTimeout(callback, interval);
	}
};

Engine.EngineInterface = function(playerId, engine) {
	return {
		attack: function(from, to) {
			return engine.attack(from, to, playerId);
		}
	};
};

Engine.PlayerInterface = {
	init: function(engineInterface, worldState){},
	update: function(hexState){}
};