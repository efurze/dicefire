/* globals: Globals, Message */

	/*========================================================================================================================================*/
	// SocketAIController: 	Implements Engine.ControllerInterface so AIWrapper can connect to it.
	// 						Implelments Engine.PlayerInterface so client can use it
	/*========================================================================================================================================*/

	var SocketAIController = function(socket, history, ai, playerId) {
		this._socket = socket;
		this._ai = ai;
		this._id = playerId;
		this._history = history;
		this._started = false;
		this._isMyTurn = false;
		this._startTurnPending = false;
		this._startTurnPendingStateId = -1;
		this._attackPending = false;
		this._aiWrapper = null;

		this.initAI();

		socket.on(Message.TYPE.START_TURN, this.start_turn.bind(this));
		socket.on(Message.TYPE.ATTACK_RESULT, this.attack_result.bind(this));

		Globals.ASSERT(Globals.implements(this, Engine.PlayerWrapper));
		Globals.ASSERT(Globals.implements(this, Engine.ControllerInterface));
	};

	SocketAIController.prototype.initAI = function() {
		if (this._aiWrapper) {
			this._aiWrapper.stop();
			this._aiWrapper = null;
		}
		this._aiWrapper = new AIWrapper(this._ai, this, this._id, false);
	};

	//
	// socket events
	//

	// @msg: {playerId:, stateId:}
	SocketAIController.prototype.start_turn = function(sock, msg) {
		if (msg.playerId == this._id) {
			this.startTurn(msg.stateId);
		} 
	};

	// @msg: {playerId:, success:, stateId:}
	SocketAIController.prototype.attack_result = function(sock, msg) {
		var self = this;
		if (msg.playerId == self._id && self._attackPending) {
			self._history.getState(msg.stateId)
					.then( function(state) {
						self.attackDone(msg.success, msg.stateId);
					});
		}
	};

	//
	// Implementing the Engine::PlayerWrapper interface. These are called by Client.
	//

	SocketAIController.prototype.getName = function(){return this._aiWrapper.getName();};
	SocketAIController.prototype.isHuman = function(){return false;};
	SocketAIController.prototype.start = function(){
		if (!this._started) {
			this._started = true;
			this._aiWrapper.start();
			if (this._startTurnPending) {
				this._startTurnPending = false;
				this.startTurn(this._startTurnPendingStateId);
				this._startTurnPendingStateId = -1;
			}
		}
	};
	SocketAIController.prototype.stop = function(){
		this._started = false;
		this._isMyTurn = false;

		this._socket.removeListener(Message.TYPE.START_TURN, this.start_turn);
		this._socket.removeListener(Message.TYPE.ATTACK_RESULT, this.attack_result);
		
		this._aiWrapper.stop();
	};
	SocketAIController.prototype.startTurn = function(state_id){
		
		// The AI can't start until the map is downloaded, and sometimes the first
		// start_turn event from the server comes first. This is an attempt
		// to deal with that
		var self = this;
		if (self._started) {
			self._history.getState(state_id)
					.then( function(state) {
						if (self._isMyTurn) {
							Globals.debug("Got startTurn when it was already our turn", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
						}
						self._isMyTurn = true;
						try {
							self._aiWrapper.startTurn(state);
						} catch (err) {
							// try to re-initialize AI
							Globals.debug("AIWrapper.startTurn exception. Attempting to re-initialize", err, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
							self.initAI();
							self._aiWrapper.start();
							self._aiWrapper.startTurn(state);
						}
					});
		} else {
			self._startTurnPending = true;
			self._startTurnPendingStateId = state_id;
		}
	};

	SocketAIController.prototype.attackDone = function(success, state_id){
		if (this._attackPending) {
			this._attackPending = false;
			try {
				this._aiWrapper.attackDone(success);
			} catch (err) {
				Globals.debug("AIWrapper.attackDone exception. Attempting to re-initialize", err, Globals.LEVEL.ERROR, Globals.CHANNEL.CLIENT);
				self.initAI();
				self._aiWrapper.start();
				self.startTurn(state_id);
			}
		}
	};
	SocketAIController.prototype.turnEnded = function() {
		this._attackPending = false;
		this._isMyTurn = false;
		this._aiWrapper.turnEnded();
	};
	SocketAIController.prototype.loses = function(){this._aiWrapper.loses();};

	// Implementing the AIController interface. These functions are called by AIWrapper

	SocketAIController.prototype.map = function() {
		Globals.ASSERT(Client._map);
		return Client._map;
	};
		
	SocketAIController.prototype.getState = function() {
		return Client._history.getLatest();
	};

	SocketAIController.prototype.endTurn = function(playerId){
		if (this._isMyTurn) {
			this._isMyTurn = false;
			this._socket.sendEndTurn(this._id);
		} else {
			Globals.debug("AI tried to end turn when it wasn't our turn", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
		}
	};

	// @callback: function(success){}
	SocketAIController.prototype.attack = function(from, to, callback) {
		if (this._isMyTurn) {
			this._attackPending = true;
			this._socket.sendAttack(from.id(), to.id(), this._id);
		} else {
			Globals.debug("AI tried to attack when it wasn't our turn", Globals.LEVEL.WARN, Globals.CHANNEL.CLIENT);
		}
	};
