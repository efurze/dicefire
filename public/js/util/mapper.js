/* jslint browser: true */
/* global: Globals */

var MapRequest = function(id, data, callback) {
	this.id = id;
	this.data = data;
	this.cb = callback;
	this.dataCount = data.length;
	this.resultsCount = 0;
	this.results = [];
	this.results.length = data.length;
};


var Mapper = function(threads) {
	this._threads = threads || 4;
	this._workers = [];
	this._reqs = {};
	this._nextReqId = 0;
	
	for (var i=0; i < this._threads; i++) {
		this._workers.push(new Worker("/js/util/worker.js"));
		this._workers[i].onmessage = this._callback.bind(this);
	}
};

// @data = []
// @callback = function(results_ary)
Mapper.prototype.map = function(data, fn, callback) {
	var self = this;
	
	var req = new MapRequest(self._nextReqId++, data, callback);
	self._reqs[req.id] = req;
	
	// serialize the fn
	var ser = fn.toString();
	
	// parse fn arguments
	var startArgs = ser.indexOf('(') + 1;
	var endArgs = ser.indexOf(')');
	var args = ser.substr(startArgs, endArgs-startArgs).split(',');
	args = args.map(function(arg) {return arg.trim();});
	
	// parse fn body
	ser = ser.substr(ser.indexOf('{'));
	
	var batchSize = 100;
	
	var workerId = 0;
	var batch = [];
	for (var idx=0; idx < data.length; idx++) {
		batch.push({command: 'compute', data: data[idx], fn: ser, args: args, data_id: idx, id: req.id});
		if (batch.length >= batchSize || idx == data.length-1) {
			if (self._workers[workerId]) {
				self._workers[workerId].postMessage({command: 'batch', data: batch, id: req.id});
				batch = [];
			}
			workerId ++;
			workerId = workerId % self._workers.length;
		}
	}
};

Mapper.prototype.stop = function() {
	this._workers.forEach(function(worker) {
		//worker.close();
		worker.onmessage = null;
	});
	this._workers.length = 0;
};

// @e.data = {command: 'result', id: , data_id: , result}
Mapper.prototype._callback = function(e) {
	var self = this;
	
	var msg = e.data;
	var req = self._reqs[msg.id];
	if (req) {
		if (msg.command == 'result') {
			self.receiveResult(req, msg);
		} else if (msg.command == 'batch_result') {
			msg.result.forEach(function(result) {
				self.receiveResult(req, result);
			});
		} else if (msg.command == 'error') {
			req.cb(msg.msg);
		}
	}
};

Mapper.prototype.receiveResult = function(req, msg) {
	var self = this;
	req.results[msg.data_id] = msg.result;
	req.resultsCount ++;
	if (req.resultsCount == req.dataCount) {
		delete self._reqs[req.id];
		if (req.cb) {
			req.cb(req.results);
		}
	}
};