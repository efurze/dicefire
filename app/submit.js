'use strict'

var Sandbox = require('sandbox');
var redis = require('redis');
var redisClient = redis.createClient(); //6379, 'localhost', '');

function validate() {
	
	var code = "replaceThis";
	code += ";create";
	
	try {
		
		var createFn = eval(code);
		var ai = createFn();
		
		if (!ai.hasOwnProperty('startTurn') || typeof ai.startTurn !== 'function') {
			return "Submitted AI has no startTurn() function";
		}
		
	} catch (e) {
		return ("Your code threw an exception: " + e);
	}
	
	return true;
};

var SubmissionHandler = (function() {

	return {
		submit: function(req, res) {
			var code = decodeURI(req.body.code).trim();
			
			var fnString = validate.toString();
			fnString = fnString.replace("replaceThis", code);
			fnString += ";validate()";

			var s = new Sandbox();
			s.run(fnString, function(result) {
				console.log(result);
				result = result.result;
				if (result === 'true') {
					res.send("Submission received!");
				} else {
					res.send("Invalid submission: " + JSON.stringify(result));
				}
			});
		}
	};
	
})();


module.exports = SubmissionHandler;