"use strict"

var Uploader = function(gameId) {
	this._count = 1;
	this._gameId = gameId;
	this._array = [];
	this._pending = false;
	this._timeout = 10;
};

Uploader.prototype.push = function(data) {
	this._array.push(data);
	this._doNext();
};

Uploader.prototype._doNext = function() {
	var self = this;
	if (!self._pending && self._array.length) {
		
		self._pending = true;
		
		window.setTimeout(function() {
			var data = self._array[0];
			var url = '';
			if (data instanceof Gamestate) {
				$.post('/uploadState?gameId=' + self._gameId + "&moveId=" + self._count, 
							data.serialize()).done(function(d) {
						self.ajaxDone(d);
					}).fail(function(err) {
						self.ajaxFail(err);
					});
			} else {
				$.ajax({
							url: '/uploadMap?gameId=' + self._gameId,
							type: 'POST',
							dataType: "json",
							contentType: "application/json; charset=utf-8",
							data: data,
							success: self.ajaxDone.bind(self),
							failure: self.ajaxFail.bind(self)
						});
			}
			
		}, self._timeout);
	}
};

Uploader.prototype.ajaxDone = function(data) {
	Globals.ASSERT(this._pending);
	var self = this;
	self._timeout = 10;
	
	var data = self._array.shift();
	if (data instanceof Gamestate) {
		self._count++;
	}
	self._pending = false;
	self._doNext();
};

Uploader.prototype.ajaxFail = function(err) {
	console.log("UPLOAD FAILURE: ", err.error(), JSON.stringify(err));
	var self = this;
	if (self._timeout < 10000) {
		self._timeout = self._timeout * 10;
	}
	self._pending = false;
	self._doNext();
};