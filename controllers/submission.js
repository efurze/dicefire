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
	code += ";replaceWithClassName";
	
	try {
		
		var submittedClass = eval(code);
		if (!submittedClass.hasOwnProperty('create') || typeof submittedClass.create !== 'function') {
			return "Submitted AI missing create() method - create() must be a class method, not an instance method.";
		}
		
		if (!submittedClass.hasOwnProperty('getName') || typeof submittedClass.getName !== 'function') {
			return "Submitted AI missing getName() method - getName() must be a class method, not an instance method. ";
		}
		
		var ai = submittedClass.create();
		
		if (!ai.__proto__.hasOwnProperty('startTurn') || typeof ai.__proto__.startTurn !== 'function') {
			return "Submitted AI has no startTurn() method";
		}
		
	} catch (e) {
		return ("Your code threw an exception: " + e);
	}
	
	return true;
};

var storeAI = function(codeStr, sha, name) {
	redisClient.rpushAsync("AI_LIST", JSON.stringify({hash:sha, name: name}))
		.then(function(result) {
			return redisClient.set("ai/"+sha, JSON.stringify({name: name, code: codeStr}));
		}).catch(function(err) {
			console.log("storeAI error:", err);
		});
};

// returns a promise
var getAIs = function() {
	return redisClient.lrangeAsync("AI_LIST", 0, -1);
};

var getAI = function(hash) {
	return redisClient.getAsync("ai/"+hash);
};


var submit = function(req, res) {
	var name = req.body.name.trim();
	var code = req.body.code.trim();
	code = code.replace(/\n|\r|\t/gm, '');
	code = code.replace(/"/gm, "'");
	var codeHash = SHA1.hex(code);
	
	getAI(codeHash)
		.then(function (result) {
			if (result) {
				res.send("Code dupliate");
			} else {
				
				var fnString = validate.toString();
				fnString = fnString.replace("replaceThis", code);
				fnString = fnString.replace("replaceWithClassName", name);
				console.log(fnString);
				fnString += ";validate()";

				var s = new Sandbox();
				s.run(fnString, function(result) {
					console.log(result);
					result = result.result;
					if (result === 'true') {
						storeAI(code, codeHash, name);
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
};

module.exports = {
	submit: submit,
	getAIs: getAIs,
	getAI: getAI
};

