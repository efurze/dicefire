'use strict'

var Sandbox = require('sandbox');


function validate(code) {
	var ret = {
		valid: false,
		error: "",
		ai: null
	};
	
	
	code += "create";
	
	try {
		//var js = eval("var create = function(){console.log('hello from create');};");
		var create = eval(code);
		console.log("eval produces:", create);
		var ai = create();
/*
		if (!js.hasOwnProperty('create') || typeof js.create !== 'function') {
			ret.error = "Submitted AI has no create() function";
			return ret;
		} 
		var ai = js.create(0);
		console.log(ai);
*/	
		
		if (!ai.hasOwnProperty('startTurn') || typeof ai.startTurn !== 'function') {
			ret.error = "Submitted AI has no startTurn() function";
			return ret;
		}
	
		ret.ai = ai;
		ret.valid = true;
		
	} catch (e) {
		ret.error = "Your code threw an exception: " + e;
		ret.valid = false;
	}
	
	return ret;
};

function hello(){var msg='foobar';return msg;};

var SubmissionHandler = (function() {

	return {
		submit: function(req, res) {
			var code = decodeURI(req.body.code).trim();
			var result = validate(code);
			
			if (result.valid) {
				res.send("Submission received!");
			} else {
				res.send("Invalid submission: " + result.error);
			}
			
		}
	};
	
})();


module.exports = SubmissionHandler;