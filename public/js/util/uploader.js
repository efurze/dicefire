"use strict"

var MAX_RETRIES = 3;

var Uploader = function() {
	this._array = []; // array of {url: , data:}
	this._pending = false;
	this._timeout = 10;
	this._retryCount = 0;
};

Uploader.prototype.push = function(url, data) {
	this._array.push({url: url, data: data});
	this._doNext();
};

Uploader.prototype.uploadMap = function(gameId, mapData) {
	var url = '/uploadMap?gameId=' + gameId;
	this.push(url, mapData);
};

Uploader.prototype.uploadState = function(gameId, stateId, stateData) {
	var url = '/uploadState?gameId=' + gameId + '&moveId=' + stateId;
	this.push(url, stateData);
};

Uploader.prototype.uploadGameInfo = function(gameId, data) {
	var url = '/uploadGameInfo?gameId=' + gameId;
	this.push(url, data);
};

Uploader.prototype._doNext = function() {
	var self = this;
	if (!self._pending && self._array.length) {
		
		self._pending = true;
		
		window.setTimeout(function() {
			var req = self._array[0];
			
			$.ajax({
					url: req.url,
					type: 'POST',
					dataType: "json",
					contentType: "application/json; charset=utf-8",
					data: req.data,
					success: self.ajaxDone.bind(self),
					failure: self.ajaxFail.bind(self)
				});
			
		}, self._timeout);
	}
};

Uploader.prototype.ajaxDone = function(data) {
	Globals.ASSERT(this._pending);
	var self = this;
	self._timeout = 10;
	self._retryCount = 0;
	
	self._array.shift();
	self._pending = false;
	self._doNext();
};

Uploader.prototype.ajaxFail = function(err) {
	console.log("UPLOAD FAILURE: ", err.error(), JSON.stringify(err));
	var self = this;
	if (self._retryCount >= MAX_RETRIES) {
		self.ajaxDone();
	} else {
		self._retryCount ++;
		if (self._timeout < 10000) {
			self._timeout = self._timeout * 10;
		}
		self._pending = false;
		self._doNext();
	}
};