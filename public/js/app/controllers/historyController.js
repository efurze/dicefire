
var HistoryController = function (history, playerId) {
	this._history = history;
	this._playerId = playerId;
	this._viewingHistory = false;
	this._currentlyViewing = 0;
	this._latestStateId = 0;

	$('#back_btn').click(this.historyBack.bind(this));
	$('#forward_btn').click(this.historyForward.bind(this));
};

$(function(){
	"use strict";

HistoryController.prototype.updateStateCount = function(stateId) {
	this._latestStateId = stateId;
	this.update();
};

HistoryController.prototype.setViewState = function(stateId) {
	this._currentlyViewing = stateId;
	this.update();
};

HistoryController.prototype.update = function() {
	var self = this;
	
	$('#back_btn').prop('disabled', self._currentlyViewing === 0);
	$('#forward_btn').prop('disabled', self._currentlyViewing == self._latestStateId);
	$('#history').html((self._currentlyViewing)  + ' / ' + self._latestStateId);
	
};


HistoryController.prototype.historyBack = function (event) {
	var self = this;
	if (self._currentlyViewing > 0) {
		self._currentlyViewing --;
		self._viewingHistory = true;

		self._history.getState(self._currentlyViewing)
			.then(self.renderHistory.bind(self));
		// TODO: FIXME: have a UI for 'loading state'
		self.update();
	}
};

HistoryController.prototype.historyForward = function (event) {
	var self = this;
	if (self.viewingHistory()) {
		if (self._currentlyViewing < self._latestStateId) {
			self._currentlyViewing ++;
		} 
		
		if (self._currentlyViewing == self._latestStateId) {
			self._viewingHistory = false;
		}
					
		self._history.getState(self._currentlyViewing)
			.then(self.renderHistory.bind(self));
		// TODO: FIXME: have a UI for 'loading state'
		self.update();
	}
};

HistoryController.prototype.renderHistory = function (state) {
	var self = this;
	Renderer.renderHistory(state);
};

HistoryController.prototype.viewingHistory = function () {
	var self = this;
	return self._viewingHistory;
};

});