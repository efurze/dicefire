"use strict"

var Replaycontroller = function (gameId) {
	this._gameId = gameId;
	this._historyIndex = 0;
	this._historyLength = 0;
};

$(function(){

Replaycontroller.prototype.init = function() {
	
}

Replaycontroller.prototype.update = function() {
	if (Globals.suppress_ui) {
		return;
	}
	
	var self = this;
	
	if (self._historyIndex > 0) {
		$('#back_btn').prop('disabled', false);
	} else {
		$('#back_btn').prop('disabled', true);
	}
	
	if (self._historyIndex < (this._historyLength-1)) {
		$('#forward_btn').prop('disabled', false);
	} else {
		$('#forward_btn').prop('disabled', true);
	}

};


Replaycontroller.prototype.historyBack = function (event) {
	var self = this;
	if (self._historyIndex > 0) {
		self._historyIndex --;
	}
	
	self.renderHistory(Engine.getHistory(self._historyIndex));			
	self.update();
};

Replaycontroller.prototype.historyForward = function (event) {
	var self = this;
	if (self._viewingHistory()) {
		if (self._historyIndex < (self._historyLength-1)) {
			self._historyIndex ++;
		} 
		
		self.renderHistory(Engine.getHistory(self._historyIndex));
		self.update();
	}
};

Replaycontroller.prototype.renderHistory = function (state) {
	var self = this;
	Renderer.render(state);
	Renderer.renderHistoricalAttack(Map.getCountry(state.attack().fromCountryId),
		Map.getCountry(state.attack().toCountryId),
		state.attack().fromRollArray,
		state.attack().toRollArray,
		state);				
};

Replaycontroller.prototype._viewingHistory = function () {
	var self = this;
	return self._historyIndex < (self._historyLength - 1);
};

});