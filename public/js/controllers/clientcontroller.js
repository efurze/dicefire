"use strict"
/*
@history = {
	length(),
	getState(id),
	currentPlayerId()
}
*/
var Clientcontroller = function (history, playerId, end_cb) {
	this._history = history;
	this._playerId = playerId;
	this._viewingHistory = false;
	this._endCb = end_cb;
	this._historyIndex = 0;
	this._historyLength = 0;
	this._isAttacking = false;
};

Clientcontroller.prototype.setPlayerId = function(id) {
	this._playerId = id;
};

$(function(){

Clientcontroller.prototype.update = function() {
	if (Globals.suppress_ui) {
		return;
	}
	
	var self = this;
	
	if (self._historyLength < self._history.length()) {
		// history has changed since we last updated. If it's human's turn, assume that it 
		// means that a user-generated attack occured. That means we're not viewing history anymore
		self._historyIndex = self._history.length() - 1;
	}
	
	self._historyLength = self._history.length();
	
	$('#back_btn').prop('disabled', true);
	$('#forward_btn').prop('disabled', true);
	
	if (self._history.currentPlayerId() == self._playerId) {	
		if (self.viewingHistory()) {
			// don't let player end their turn while they're looking at history
			$('#end_turn').prop('disabled', true);
		} else if (self._isAttacking) {
			// can't end turn during an attack
			$('#end_turn').prop('disabled', true);
		} else {
			$('#end_turn').prop('disabled', false);
		} 
		
		$('#history').html((self._historyIndex+1)  + ' / ' + self._historyLength);
		
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


Clientcontroller.prototype.setIsAttacking = function(isAttacking) {
	this._isAttacking = isAttacking;
};


Clientcontroller.prototype.endTurn = function() {
	var self = this;
	self._historyIndex = self._history.length() - 1;
	if (self._endCb) {
		self._endCb(self._playerId);
	}
};

Clientcontroller.prototype.historyBack = function (event) {
	var self = this;
	if (self._historyIndex > 0) {
		self._historyIndex --;
		self._viewingHistory = true;
	}
	
	self.renderHistory(self._history.getState(self._historyIndex));			
	self.update();
};

Clientcontroller.prototype.historyForward = function (event) {
	var self = this;
	if (self.viewingHistory()) {
		if (self._historyIndex < (self._history.length()-1)) {
			self._historyIndex ++;
		} 
		
		if (self._historyIndex == (self._history.length()-1)) {
			self._viewingHistory = false;
		}
					
		self.renderHistory(self._history.getState(self._historyIndex));
		self.update();
	}
};

Clientcontroller.prototype.renderHistory = function (state) {
	var self = this;
	Renderer.render(state);
};

Clientcontroller.prototype.viewingHistory = function () {
	var self = this;
	return self._viewingHistory;
};

});