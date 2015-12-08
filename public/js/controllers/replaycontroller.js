"use strict"

var Replaycontroller = function (gameId, engine) {
	this._gameId = gameId;
	this._engine = engine;
	this._historyIndex = -1;
	this._historyLength = 0;
	this._pendingIndex = -1;
	this._updateCb = null;
};

$(function(){

Replaycontroller.prototype.init = function(callback) {
	this._updateCb = callback;
	this._ajaxRequest(0);
};

Replaycontroller.prototype._ajaxRequest = function(moveId) {
	Globals.ASSERT(this._pendingIndex == -1);
	
	var self = this;
	self._pendingIndex = moveId;
	$.get( "/getState?gameId=" + this._gameId + "&moveId=" + (moveId+1)).done(function(data) {
		self.ajaxDone(data);
	}).fail(function(err) {
		self.ajaxFail(err);
	});
};

Replaycontroller.prototype.ajaxDone = function(data) {
	//console.log("Got ajax data: " + (data));
	Globals.ASSERT(this._pendingIndex != -1);
	
	var state = Gamestate.deserialize(data.data);
	this._engine.pushHistory(state);
	this._historyLength = data.moveCount;
	this._historyIndex = this._pendingIndex;
	this._pendingIndex = -1;
	if (this._updateCb) {
		this._updateCb(state);
		this._updateCb = null;
	}
	this.renderHistory(state);
	this.update();
};

Replaycontroller.prototype.ajaxFail = function(err) {
	console.log("Ajax error: " + err.error(), err);
	if (this._updateCb) {
		this._updateCb();
		this._updateCb = null;
	}
}

Replaycontroller.prototype.update = function() {
	if (Globals.suppress_ui) {
		return;
	}
	
	var self = this;
	
	if (self._requestPending()) {
		$('#forward_btn').prop('disabled', true);
		$('#back_btn').prop('disabled', true);
	} else {	
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
	}

	$('#history').html((self._historyIndex+1) + " / " + self._historyLength);
};


Replaycontroller.prototype.historyBack = function (event) {
	if (this._requestPending()) {
		return;
	}
	var self = this;
	if (self._historyIndex > 0) {
		self._historyIndex --;
	}
	
	self.renderHistory(self._engine.getHistory(self._historyIndex));
	self.update();
};

Replaycontroller.prototype.historyForward = function (event) {
	if (this._requestPending()) {
		return;
	}
	var self = this;
	if (self._viewingHistory()) {
		if (self._historyIndex < (self._historyLength-1)) {
			self._historyIndex ++;
		} 
		
		if (self._historyIndex < (self._engine.historyLength()-1)) {
			self.renderHistory(self._engine.getHistory(self._historyIndex));
		} else {
			self._ajaxRequest(self._historyIndex);
		}
	}
	self.update();
};

Replaycontroller.prototype.renderHistory = function (state) {
	var self = this;
	Renderer.render(state);			
};

Replaycontroller.prototype._viewingHistory = function () {
	var self = this;
	return self._historyIndex < (self._historyLength - 1);
};

Replaycontroller.prototype._requestPending = function () {
	return (this._pendingIndex != -1);
};

});