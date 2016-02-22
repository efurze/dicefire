/* jslint browser: true */
/* global: Globals */

var History = function(gameId) {
	this._states = {};
	this._gameId = gameId;
	this._downloader = new Downloader();
	this._mostRecentStateId = -1;
	this._stateCallbacks = {}; // stateId to array of promises
};
	
// returns a promise that resolves to a gamestate object
History.prototype.getHistory = function(id) {
	Globals.ASSERT(typeof id == 'number');
	var self = this;
	if (self._states[id]) {
		return new Promise(function(resolve) {
			resolve(self._states[id]);
		});
	} else {
		self._downloader.getState(self._gameId, id, self._stateDownload.bind(self));
		return self.onStateReceived(id);
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

// returns promise
History.prototype.onStateReceived = function(stateId) {	
	var self = this;
	if (self._states.hasOwnProperty(stateId)) {
		return self._states[stateId];
	} else {
		var resolver = null;
		var p = new Promise(function(resolve){resolver = resolve;});
		if (!self._stateCallbacks.hasOwnProperty(stateId)) {
			self._stateCallbacks[stateId] = [];
		}
		self._stateCallbacks[stateId].push(resolver);
		return p;
	}
};

