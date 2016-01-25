"use strict"

var Gamecontroller = function (playerId, engine) {
	this._playerId = playerId;
	this._historyIndex = 0;
	this._historyLength = 0;
	this._engine = engine;
	this._lastState = null;
};

$(function(){

Gamecontroller.prototype.update = function(state) {
	if (Globals.suppress_ui) {
		return;
	}

	var self = this;

	self._lastState = state;

	self._historyLength = self._lastState.stateId() + 1;
	if (!self.viewingHistory()) {
		self._historyIndex = self._lastState.stateId()
	}
	
	$('#back_btn').prop('disabled', true);
	$('#forward_btn').prop('disabled', true);
	$('#history').html((self._historyIndex+1)  + ' / ' + self._historyLength);
	
	if (self._playerId == self._lastState.currentPlayerId()) {	

		if (self.viewingHistory()) {
			// don't let player end their turn while they're looking at history
			$('#end_turn').prop('disabled', true);
		} else if (self._lastState.attack()) {
			// can't end turn during an attack
			$('#end_turn').prop('disabled', true);
		} else {
			$('#end_turn').prop('disabled', false);
		} 
		
		if (self.viewingHistory()) {
			$('#forward_btn').prop('disabled', false);
		}
		
		if (self._historyIndex > 0) {
			$('#back_btn').prop('disabled', false);
		}

	} else {
		$('#end_turn').prop('disabled', true);
	}

};

Gamecontroller.prototype.endTurn = function() {
	var self = this;
	Globals.ASSERT(self._lastState.stateId() == self._engine.getState().stateId());

	self._historyIndex = self._lastState.stateId();
	self._engine.endTurn();
};

Gamecontroller.prototype.historyBack = function (event) {
	var self = this;
	if (self._historyIndex > 0) {
		self._historyIndex --;
	}
	
	self.renderHistory(self._engine.getHistory(self._historyIndex));			
	self.update();
};

Gamecontroller.prototype.historyForward = function (event) {
	var self = this;
	if (self.viewingHistory()) {
		if (self._historyIndex < (self._engine.historyLength()-1)) {
			self._historyIndex ++;
		} 
					
		self.renderHistory(self._engine.getHistory(self._historyIndex));
		self.update();
	}
};

Gamecontroller.prototype.renderHistory = function (state) {
	var self = this;
	Renderer.render(state);
};

Gamecontroller.prototype.viewingHistory = function () {
	var self = this;
	if (self._lastState) {
		return self._historyIndex < self._lastState.stateId();
	} else {
		return false;
	}
};

});