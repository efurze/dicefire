"use strict"

var Gamecontroller = function () {
	this._historyIndex = 0;
	this._historyLength = 0;
};

$(function(){

Gamecontroller.prototype.update = function() {
	if (Globals.suppress_ui) {
		return;
	}
	
	var self = this;
	
	if (self._historyLength < Engine.historyLength()) {
		// history has changed since we last updated. If it's human's turn, assume that it 
		// means that a user-generated attack occured. That means we're not viewing history anymore
		self._historyIndex = Engine.historyLength() - 1;
	}
	
	self._historyLength = Engine.historyLength();
	
	$('#back_btn').prop('disabled', true);
	$('#forward_btn').prop('disabled', true);
	
	
	if (Engine.isHuman(Engine.currentPlayerId())) {	
		if (self._viewingHistory()) {
			// don't let player end their turn while they're looking at history
			$('#end_turn').prop('disabled', true);
		} else {
			$('#end_turn').prop('disabled', false);
		} 
		
		$('#history').html((self._historyIndex+1)  + ' / ' + self._historyLength);
		
		if (self._viewingHistory()) {
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
	self._historyIndex = Engine.historyLength() - 1;
	Engine.endTurn();
};

Gamecontroller.prototype.historyBack = function (event) {
	var self = this;
	if (self._historyIndex > 0) {
		self._historyIndex --;
	}
	
	self.renderHistory(Engine.getHistory(self._historyIndex));			
	self.update();
};

Gamecontroller.prototype.historyForward = function (event) {
	var self = this;
	if (self._viewingHistory()) {
		if (self._historyIndex < (Engine.historyLength()-1)) {
			self._historyIndex ++;
		} 
					
		self.renderHistory(Engine.getHistory(self._historyIndex));
		self.update();
	}
};

Gamecontroller.prototype.renderHistory = function (state) {
	var self = this;
	Renderer.render(state);
	Renderer.renderHistoricalAttack(Map.getCountry(state.previousAttack().fromCountryId),
		Map.getCountry(state.previousAttack().toCountryId),
		state.previousAttack().fromRollArray,
		state.previousAttack().toRollArray,
		state);				
};

Gamecontroller.prototype._viewingHistory = function () {
	var self = this;
	return self._historyIndex < (Engine.historyLength()-1);
};

});