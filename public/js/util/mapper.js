'use strict'

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
	this._reqs = [];
	
	for (var i=0; i < this._threads; i++) {
		this._workers.push(new Worker("/js/util/worker.js"));
		this._workers[i].onmessage = this._callback.bind(this);
	}
};

// @data = []
// @callback = function(results_ary)
Mapper.prototype.map = function(data, fn, callback) {
	var self = this;
	
	var req = new MapRequest(self._reqs.length, data, callback);
	self._reqs.push(req);
	
	// serialize the fn
	var ser = fn.toString();
	
	// parse fn arguments
	var startArgs = ser.indexOf('(') + 1;
	var endArgs = ser.indexOf(')');
	var args = ser.substr(startArgs, endArgs-startArgs).split(',');
	args = args.map(function(arg) {return arg.trim();});
	
	// parse fn body
	ser = ser.substr(ser.indexOf('{'));
	
	
	var workerId = 0;
	data.forEach(function(datum, idx) {
		if (self._workers[workerId]) {
			self._workers[workerId].postMessage({command: 'compute', data: datum, fn: ser, args: args, data_id: idx, id: req.id});
		}
		workerId ++;
		workerId = workerId % self._workers.length;
	});
};

Mapper.prototype.stop = function() {
	this._workers.forEach(function(worker) {
		//worker.close();
		worker.onmessage = null;
	});
	this._workers.length = 0;
};

// @msg.data = {command: 'result', id: , data_id: , result}
Mapper.prototype._callback = function(msg) {
	var self = this;
	
	var data = msg.data;
	var req = self._reqs[data.id];
	if (data.command == 'result') {
	
		req.results[data.data_id] = data.result;
		req.resultsCount ++;
		if (req.resultsCount == req.dataCount) {
			//self.stop();
			if (req.cb) {
				req.cb(req.results);
			}
		}
	} else if (data.command == 'error') {
		//self.stop();
		req.cb(data.msg);
	}
};