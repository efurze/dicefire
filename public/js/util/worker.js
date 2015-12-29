'use strict'



/*
 @data = {
		command: 'compute'
		data:  []
		fn: string
		args: [string] // fn argument names
		data_id: // of data. must be passed back in result
		id: // of computation. must be passed back in result
	}
	
	OR
	
	{
	command: 'batch'
	data: array of compute msgs
	id: computation id
	}
*/
onmessage = function(e) {
	var msg = e.data;

	try {
		if (msg.command == 'compute') {
			postMessage(compute(msg));
		} else if (msg.command == 'batch') {
			var results = [];
			msg.data.forEach(function(msg) {
				results.push(compute(msg));
			});
			postMessage({command: 'batch_result', result: results, id: msg.id});
		}
		
	} catch (err) {
		console.log(err);
		postMessage({command: 'error', msg: JSON.stringify(err), data_id: msg.data_id, id: msg.id});
	}
};

var compute = function(msg) {
	if (!Array.isArray(msg.data)) {
		msg.data = [msg.data];
	}
	var fn = new Function(msg.args, msg.fn); 
	//console.log(fn);
	var result = fn.apply(null, msg.data);
	//console.log("result:", result);
	
	return {command: 'result', result: result, data_id: msg.data_id, id: msg.id};
};