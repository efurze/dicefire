"use strict"

var Uploader = function(gameId) {
	this._count = 1;
	this._gameId = gameId;
	this._array = [];
	this._pending = false;
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

			$.post('/uploadState?gameId=' + self._gameId + "&moveId=" + self._count,
				data).done(function(d) {
					self.ajaxDone(d);
				}).fail(function(err) {
					self.ajaxFail(err);
				});
		}, 10);
	}
};

Uploader.prototype.ajaxDone = function(data) {
	Globals.ASSERT(this._pending);
	var self = this;
	self._array.shift();
	self._count++;
	self._pending = false;
	self._doNext();
};

Uploader.prototype.ajaxFail = function(err) {
	console.log("UPLOAD FAILURE: ", err.error(), JSON.stringify(err));
	this._pending = false;
	this._doNext();
};