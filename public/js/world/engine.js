'use strict'


var Engine = function() {
	this._listeners = [];
};


// @playerAry: array of Engine.PlayerInterface
Engine.prototype.init = function(playersAry) {
	var self = this;
	self._state = new WorldState();
	self._players = playersAry;
};

Engine.prototype.setup = function(state) {
	var self = this;
	if (state) {
		self._state = state;
	}

};

// @callback: function(state){}
Engine.prototype.registerListener = function(callback) {
	if (this._state) {
		callback(this._state.clone());
	}
	this._listeners.push(callback);
};

Engine.prototype.start = function() {
	var self = this;

	self._players.forEach(function(player, idx) {
		player.init(idx, Engine.EngineInterface(idx, self), self._state.clone());
	});

	self._setTimer(self._tick.bind(self), 1000)
};

Engine.prototype._tick = function() {

};


Engine.prototype.attack = function(from, to, playerId) {
	var self = this;

	console.log("Attack", JSON.stringify(from), JSON.stringify(to))	;

	var fromHex = self._state.getHex(from);
	var toHex = self._state.getHex(to) || new HexState(to);

	var fromRoll = Engine.rollDice(fromHex.diceCount());
	var toRoll = Engine.rollDice(toHex.diceCount());

	var fromTotal = fromRoll.reduce(function(total, die) { return total + die; }, 0);
	var toTotal = toRoll.reduce(function(total, die) { return total + die; }, 0);

	var fromDice = fromHex.diceCount();
	fromHex.setDice(1);

	var update = new WorldState();
	update.setHex(from, fromHex);

	if (fromTotal > toTotal) {
		toHex.setOwner(playerId);
		toHex.setDice(fromDice-1);
		update.setHex(to, toHex);
		self._sendUpdate(update);
		return true;
	} else {
		self._sendUpdate(update);
		return false;
	}
};

Engine.prototype._sendUpdate = function(updates) {
	var self = this;

	Object.keys(updates._hexMap).forEach(function(key) {
		console.log(key, updates._hexMap[key].diceCount());
	});

	self._state.merge(updates);

	self._players.forEach(function(player) {
		self._setTimer(function() { player.update(updates); }, 0);
	});

	self._listeners.forEach(function(listener) {
		self._setTimer(function() { listener(updates); }, 0);
	});
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
	update: function(stateUpdate){}
};