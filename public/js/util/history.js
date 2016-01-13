'use strict'


// @callback: function()
var History = function(gameId, callback) {
	this._array = [];
	this._gameId = gameId;
	this._cb = callback;
	this._downloader = new Downloader;
	this._stateCount = 0;
	this._stateCallbacks = {}; // stateId to array of callbacks
};
	
History.prototype.onStateReceived = function(stateId, cb) {	
	var self = this;
	if (stateId < self._array.length && self._array[stateId]) {
		cb(self._array[stateId]);
	} else {
		if (!self._stateCallbacks.hasOwnProperty(stateId)) {
			self._stateCallbacks[stateId] = [];
		}
	
		self._stateCallbacks[stateId].push(cb);
	}
};

History.prototype.fetchHistory = function() {
	this._downloader.getStateCount(this._gameId, this.gotStateCount.bind(this));
};

History.prototype.gotStateCount = function(success, data) {
	if (success) {
		Globals.debug("gotStateCount:", JSON.stringify(data), Globals.LEVEL.DEBUG, Globals.CHANNEL.CLIENT);
		this.updateStateCount(data['stateCount']);
	} else {
		Globals.debug("error getting stateCount", data, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
	}
};

History.prototype.updateStateCount = function(count) {
	if (count > this._stateCount) {
		Globals.debug("StateCount updated to", count, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
		this._stateCount = count;
	}
	
	var current = this._array.length;
	if (current < this._stateCount && !this._downloader.hasPending()) {
		Globals.debug('Requesting state', current, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
		this._downloader.getState(this._gameId, current, this.gotState.bind(this));
	}
}

History.prototype.gotState = function(success, data) {
	var self = this;
	if (success) {
		var gamestate = Gamestate.deserialize(JSON.parse(data.data));
		var id = parseInt(data.id); // 0-based. First state is state 0.
		if (id == self._array.length) {
			self._array.push(gamestate);
			Globals.debug("Downloaded state", id, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
			
			// inform everyone who's waiting for this state
			if (self._stateCallbacks.hasOwnProperty(id)) {
				var cbs = self._stateCallbacks[id];
				delete self._stateCallbacks[id];
				cbs.forEach(function(cb) { cb(gamestate); });
			}
		} else {
			Globals.debug("Unexpected state id received", id, Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
		}
		
		var current = self._array.length;
		if (current < self._stateCount) {
			self._downloader.getState(self._gameId, current, self.gotState.bind(self));
		} else if (self._cb) {
			self._cb();
		}
	}
};

History.prototype.push = function(state) {
	Globals.ASSERT(state instanceof Gamestate);
	this._array.push(state);
};

History.prototype.length = function() {
	return this._array.length;
};

History.prototype.getState = function(index) {
	if (index >= 0 && index < this._array.length) {
		return this._array[index];
	} else {
		return null;
	}
};

History.prototype.getLatest = function() {
	if (this._array.length) {
		return this._array[this._array.length - 1];
	} else {
		return null;
	}
};

History.prototype.currentPlayerId = function() {
	return this._array[this._array.length-1].currentPlayerId();
};