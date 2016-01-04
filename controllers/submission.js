"use strict"

var Sandbox = require('sandbox');
var Hashes = require('jshashes');
var SHA1 = new Hashes.SHA1();
var bluebird = require('bluebird');
var redis = require('redis');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(); //6379, 'localhost', '');

function validate() {
	
	var code = "replaceThis";
	code += ";create";
	
	try {
		
		var createFn = eval(code);
		var ai = createFn();
		
		if (!ai.__proto__.hasOwnProperty('startTurn') || typeof ai.__proto__.startTurn !== 'function') {
			return "Submitted AI has no startTurn() function";
		}
		
	} catch (e) {
		return ("Your code threw an exception: " + e);
	}
	
	return true;
};

var storeAI = function(codeStr, sha) {
	redisClient.rpushAsync("AI_LIST", sha)
		.then(function(result) {
			return redisClient.set("ai/"+sha, JSON.stringify({code: codeStr}));
		}).catch(function(err) {
			console.log("storeAI error:", err);
		});
};


module.exports = {
	submit: function(req, res) {
		var code = req.body.code.trim();
		code = code.replace(/\n|\r|\t/gm, '');
		var codeHash = SHA1.hex(code);
		
		redisClient.getAsync('ai/'+codeHash)
					.then(function (result) {
						if (result) {
							res.send("Code dupliate");
						} else {
							
							var fnString = validate.toString();
							fnString = fnString.replace("replaceThis", code);
							fnString += ";validate()";

							var s = new Sandbox();
							s.run(fnString, function(result) {
								console.log(result);
								result = result.result;
								if (result === 'true') {
									storeAI(code, codeHash);
									res.send("Submission received!");
								} else {
									res.send("Invalid submission: " + JSON.stringify(result));
								}
							});
							
						}
					}).catch(function(e) {
						console.log("Redis error:", e);
						res.send("Server error:", e);
					});		
	}
};

