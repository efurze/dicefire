var Viewer = function(history, socket) {
	this._socket = socket;
	this._history = history;
	this._historyController = new HistoryController(history);
	this._currentViewState = -1;
	this._playerStatus = {}; // playerId => true iff player is connected
	

	this._socket.on(Message.TYPE.STATE, this.state.bind(this));
	this._socket.on(Message.TYPE.PLAYER_STATUS, this.player_status.bind(this));
};

Viewer.prototype.init = function(canvas, map, gameInfo) {
	var self = this;
	self._map = map;
	self._gameInfo = gameInfo;

	Globals.debug("Initializing renderer", Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT);

	Renderer.init(canvas,
				map,
				gameInfo.getPlayers(),
				{
					mouseOverCountry: Client.mouseOverCountry.bind(Client),
					stateRendered: self.stateRendered.bind(self)
				});

	$('#game').css('display', 'block');

	// render the disconnected players properly
	Object.keys(self._playerStatus).forEach(function(id) {
		if (!self._playerStatus[id]) {
			Renderer.setPlayerName(id, "Disconnected");
		}
	});
};

Viewer.prototype.viewingHistory = function() {
	return this._historyController.viewingHistory();
};

// From socket
// @msg: {stateId:, gameId:}
Viewer.prototype.state = function(sock, msg) {
	var self = this;
	self._historyController.updateStateCount(msg.stateId);
	self._history.getHistory(msg.stateId)
			.then(function(state) {
				self._update();
			});
};

// From socket
// @msg: {playerId: ,connected: ,playerName:}
Viewer.prototype.player_status = function(sock, msg) {
	var self = this;	
	self._playerStatus[msg.playerId] = msg.connected;

	if (msg.connected) {
		Renderer.setPlayerName(msg.playerId, msg.playerName);
	} else {
		Renderer.setPlayerName(msg.playerId, "Disconnected");
	}
};


Viewer.prototype.upToDate = function() {
	return (this._currentViewState == this._history.latestId());
};

// Gets called when a) a render completes OR b) a state is downloaded
Viewer.prototype._update = function() {
	var self = this;
	if (!self._rendering && !self.viewingHistory()) {
		if (!self.upToDate()) {
			var nextState = 0;
			if (self._currentViewState < 0) {
				// this is to handle the case where we're jumping into a game midway (as for a reconnect)
				nextState = self._history.latestId();
			} else {
				nextState = self._currentViewState + 1;
			}
			self._history.getHistory(nextState)
				.then(function(state) {
					self._map.setState(state);
					self._render(state);
				});
		}
	}
};

Viewer.prototype._render = function(state) {
	var self = this;
	if (!state || self._historyController.viewingHistory()) {
		return;
	}

	if (!self._rendering) {
		self._rendering = true;

		Globals.debug("render state", state.stateId(), Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
		Renderer.stateUpdate(state, state.stateId()); // will call back to stateRendered()
	}
};



// from renderer
Viewer.prototype.stateRendered = function(state, id) {
	var self = this;
	// render done
	Globals.debug("state", id, "rendered", Globals.LEVEL.TRACE, Globals.CHANNEL.CLIENT);
	if (!self._firstRender) {
		self._firstRender = true;
		Status.clear();
	}

	self._rendering = false;
	self._currentViewState = state.stateId();

	if (self._historyController.viewingHistory()) {
		$('#end_turn').prop('disabled', true);
	} else {
		$('#end_turn').prop('disabled', false);
		self._historyController.setViewState(self._currentViewState);
		if (!self.upToDate()) {
			self._update();
		}
	}
};