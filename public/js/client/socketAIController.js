'use strict'

/*========================================================================================================================================*/
	// SocketAIController: 	Implements AIController so AIWrapper can connect to it.
	// 						Implelments Engine::PlayerWrapper so client can use it
	/*========================================================================================================================================*/
	
	var SocketAIController = function(socket, history, ai, playerId, trusted) {
		this._aiWrapper = new AIWrapper(ai, this, playerId, trusted);
		this._socket = socket;
		this._id = playerId;
		this._history = history;
		this._started = false;
		this._startTurnPending = false;
		this._startTurnPendingStateId = -1;
		this._attackPending = false;

		socket.on(Message.TYPE.START_TURN, this.start_turn.bind(this));
		socket.on(Message.TYPE.ATTACK_RESULT, this.attack_result.bind(this));

		Globals.ASSERT(Globals.implements(this, Engine.PlayerWrapper));
		Globals.ASSERT(Globals.implements(this, AIWrapper.ControllerInterface));
	};

	//
	// socket events
	//

	// @msg: {playerId:, stateId:}
	SocketAIController.prototype.start_turn = function(msg) {
		if (msg.playerId == this._id) {
			Globals.debug("=> start_turn", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			this.startTurn(msg.stateId);
		} 
	};

	// @msg: {playerId:, success:, stateId:}
	SocketAIController.prototype.attack_result = function(msg) {
		var self = this;
		if (msg.playerId == self._id && self._attackPending) {
			Globals.debug("=> attack_result", JSON.stringify(msg), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
			self._history.getState(msg.stateId, function(state) {
				self.attackDone(msg.success);
			});
		}
	};

	//
	// Implementing the Engine::PlayerWrapper interface
	//

	SocketAIController.prototype.getName = function(){return this._aiWrapper.getName();};
	SocketAIController.prototype.isHuman = function(){return false;};
	SocketAIController.prototype.start = function(){
		if (!this._started) {
			this._started = true;
			this._aiWrapper.start();
			if (this._startTurnPending) {
				this.startTurn(this._startTurnPendingStateId);
				this._startTurnPending = false;
				this._startTurnPendingStateId = -1;
			}
		}
	};
	SocketAIController.prototype.stop = function(){
		this._started = false;

		// these remove calls don't work. It's a socket.io bug.
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
			self._history.getState(state_id, function(state) {
				self._aiWrapper.startTurn(state);
			});
		} else {
			self._startTurnPending = true;
			self._startTurnPendingStateId = state_id;
		}
	};

	SocketAIController.prototype.attackDone = function(success){
		if (this._attackPending) {
			this._attackPending = false;
			this._aiWrapper.attackDone(success);
		}
	};
	SocketAIController.prototype.turnEnded = function() {
		this._attackPending = false;
		this._aiWrapper.turnEnded();
	};
	SocketAIController.prototype.loses = function(){this._aiWrapper.loses();};
	
	// Implementing the AIController interface
	
	SocketAIController.prototype.map = function() {
		Globals.ASSERT(Client._map);
		return Client._map;
	};
		
	SocketAIController.prototype.getState = function() {
		return Client._history.getLatest();
	};
	
	SocketAIController.prototype.endTurn = function(playerId){
		this._socket.emit(Message.TYPE.END_TURN, Message.endTurn(playerId));
	};
	
	// @callback: function(success){}
	SocketAIController.prototype.attack = function(from, to, callback){
		Globals.debug("<= attack", from.id(), "to", to.id(), Globals.LEVEL.INFO, Globals.CHANNEL.CLIENT_SOCKET);
		this._attackPending = true;
		this._socket.emit(Message.TYPE.ATTACK, Message.attack(from.id(), to.id()));
	};
