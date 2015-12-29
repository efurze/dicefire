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
*/
onmessage = function(e) {
	var msg = e.data;

	if (msg.command != 'compute') {
		return;
	}
	
	try {
		
		//console.log("data", msg.data);
		
		if (!Array.isArray(msg.data)) {
			msg.data = [msg.data];
		}
		var fn = new Function(msg.args, msg.fn); 
		//console.log(fn);
		var result = fn.apply(null, msg.data);
	
		//console.log("result:", result);
		
		postMessage({command: 'result', result: result, data_id: msg.data_id, id: msg.id});
	} catch (err) {
		console.log(err);
		postMessage({command: 'error', msg: JSON.stringify(err), data_id: msg.data_id, id: msg.id});
	}
};