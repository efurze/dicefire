'use strict'


var History = function(gameId) {
	this._states = {};
	this._gameId = gameId;
	this._downloader = new Downloader();
	this._stateCallbacks = {}; // stateId to array of callbacks
};
	

History.prototype.getState = function(id, callback /*optional*/) {
	var self = this;
	if (self._states[id]) {
		return self._states[id];
	} else {
		if (callback) {
			self.onStateReceived(id, callback);
		}
		self._downloader.getState(self._gameId, current, self._stateDownload.bind(self));

		return null;
	}
};

History.prototype._stateDownload = function(success, data) {
	var self = this;
	if (success) {
		var gamestate = Gamestate.deserialize(JSON.parse(data.data));
		var id = parseInt(data.id); // 0-based. First state is state 0.
		Globals.debug("Downloaded state", id, Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);

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

History.prototype.onStateReceived = function(stateId, cb) {	
	var self = this;
	if (self._states.hasOwnProperty(stateId)) {
		cb(self._states[stateId]);
	} else {
		if (!self._stateCallbacks.hasOwnProperty(stateId)) {
			self._stateCallbacks[stateId] = [];
		}
		self._stateCallbacks[stateId].push(cb);
	}
};

