/* jslint browser: true */
/* global: Globals */

var MAX_RETRIES = 5;

var Downloader = function() {
	this._array = [];
	this._retryCount = 0;
	this._pending = false;
	this._timeout = 10;
};

Downloader.prototype.hasPending = function() {
	return this._pending;
};

// @callback: function(success, msg) - if success == true, msg = http response. if success == false, msg = err
Downloader.prototype.get = function(url, callback) {
	Globals.debug("Push url", url, Globals.LEVEL.DEBUG, Globals.CHANNEL.DOWNLOADER);
	this._array.push({url: url, cb: callback});
	this._doNext();
};

Downloader.prototype.getGameInfo = function(gameId, callback) {
	var url = "/getGameInfo?gameId="+gameId;
	this.get(url, callback);
};

Downloader.prototype.getMap = function(gameId, callback) {
	var url = "/getMap?gameId="+gameId;
	this.get(url, callback);
};

Downloader.prototype.getState = function(gameId, stateId, callback) {
	var url = "/getState?gameId="+gameId+"&moveId="+stateId;
	this.get(url, callback);
};

Downloader.prototype.getStateCount = function(gameId, callback) {
	var url = "/getStateCount?gameId="+gameId;
	this.get(url, callback);
};

Downloader.prototype.getAIs = function(callback) {
	var url = "/aisjson";
	this.get(url, callback);
};

Downloader.prototype._doNext = function() {
	var self = this;
	if (!self._pending && self._array.length) {
		
		self._pending = true;
		
		window.setTimeout(function() {
			var url = self._array[0].url;
			Globals.debug("Download url", url, Globals.LEVEL.INFO, Globals.CHANNEL.DOWNLOADER);
			$.get(url)
			.done(function(d) {
				self.ajaxDone(d);
			}).fail(function(err) {
				self.ajaxFail(err);
			});
			
		}, self._timeout);
	}
};

Downloader.prototype.ajaxDone = function(data) {
	Globals.ASSERT(this._pending);
	var self = this;
	self._timeout = 10;
	self._retryCount = 0;
	var req = self._array.shift();
	Globals.debug("Got url", req.url, Globals.LEVEL.INFO, Globals.CHANNEL.DOWNLOADER);
	self._pending = false;
	if (req && req.cb) {
		req.cb(true, data);
	}
	self._doNext();
};

Downloader.prototype.ajaxFail = function(err) {
	Globals.debug("DOWNLOAD FAILURE: ", err.error(), JSON.stringify(err), Globals.LEVEL.WARN, Globals.CHANNEL.DOWNLOADER);
	var self = this;
	self._retryCount++;
	if (self._retryCount > MAX_RETRIES) {
		self._retryCount = 0;
		self._timeout = 10;
		var req = self._array.shift();
		if (req && req.cb) {
			req.cb(false, err);
		}
	} else {
		if (self._timeout < 10000) {
			self._timeout = self._timeout * 5;
		}
		self._pending = false;
		self._doNext();
	}
};