"use strict"

var Sandbox = require('sandbox');
var Hashes = require('jshashes');
var SHA1 = new Hashes.SHA1();
var bluebird = require('bluebird');
var redis = require('redis');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(); //6379, 'localhost', '');

/*
	validate() - THIS CODE IS VERY FRAGILE. Don't edit it without reading the comment below.
	
	This function validates that submitted AI code meets the submission requirements. In order to safely run
	untrusted code, we jump through some hoops. Validate() is run in a sandbox by toString()-ing it and passing the
	string to the sandbox. In order to incorporate the AI code, we paste it into the stringified body of validate() over the 
	"replaceMe" comment below. DO NOT REMOVE OR ALTER THIS COMMENT or the whole thing will stop working. Additionally, the
	name of the AI class is copied over the "replaceWithClassName" string below. Don't alter that string either.
*/
function validate() {
	
	/*replaceMe*/
	
	try {
		
		var submittedClass = "replaceWithClassName";
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
	return redisClient.rpushAsync("AI_LIST", JSON.stringify({hash:sha, name: name}))
				.then(function(result) {
					return redisClient.setAsync("ai/"+sha, JSON.stringify({name: name, code: codeStr}));
				}).catch(function(err) {
					console.log("storeAI error:", err);
				});
};

// erases AI's game history and win-loss record
var resetAI = function(hash) {
	return redisClient.delAsync("aigames/"+hash)
				.then(function(){
					return redisClient.getAsync("ai/"+hash);
				}).then(function(reply) {
					var info = JSON.parse(reply);
					info.wins = 0;
					info.losses = 0;
					return redisClient.setAsync("ai/"+hash, JSON.stringify(info));
				});
};

// returns a promise
var getAIs = function() {
	return redisClient.lrangeAsync("AI_LIST", 0, -1);
};

var getAI = function(hash) {
	return redisClient.getAsync("ai/"+hash);
};

var recordGame = function(gameId) {
	console.log("recordGame", gameId);
	var key = "games";
	return redisClient.rpushAsync(key, gameId)
		.catch(function(err) {
			console.log("ERROR recording game to redis:", err);
		});
};

var recordGameForAI = function(hash, gameId) {
	console.log("recordGameForAI", hash, gameId);
	var key = "aigames/" + hash;
	return redisClient.rpushAsync(key, gameId)
		.catch(function(err) {
			console.log("ERROR recording AI game to redis:", err);
		});
};

var recordWin = function(hash, gameId) {
	console.log("recordWin", hash);
	var key = "ai/"+hash;
	return redisClient.getAsync(key)
				.then(function(str) {
					var info = JSON.parse(str);
					if (!info.hasOwnProperty('wins')) {
						info.wins = 0;
					}
					info.wins ++;
					return redisClient.setAsync(key, JSON.stringify(info));
			
				}).catch(function(err) {
					console.log("ERROR recording win:", err);
				});
};

var recordLoss = function(hash) {
	console.log("recordLoss", hash);
	var key = "ai/"+hash;
	return redisClient.getAsync(key)
				.then(function(str) {
					var info = JSON.parse(str);
					if (!info.hasOwnProperty('losses')) {
						info.losses = 0;
					}
					info.losses ++;
					return redisClient.setAsync(key, JSON.stringify(info));
			
				}).catch(function(err) {
					console.log("ERROR recording loss:", err);
				});
};

var submit = function(req, res) {
	var name = req.body.name.trim();
	var code = req.body.code.trim();
	var codeHash = SHA1.hex(code);
	
	getAI(codeHash)
		.then(function (result) {
			if (result) {
				res.send("Code duplicate");
			} else {
				
				var fnString = validate.toString();
				fnString = fnString.replace("/*replaceMe*/", code);
				fnString = fnString.replace("\"replaceWithClassName\"", name);
				//console.log(fnString);
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
	getAI: getAI,
	recordGame: recordGame,
	recordGameForAI: recordGameForAI,
	recordWin: recordWin,
	recordLoss: recordLoss,
	resetAI: resetAI
};

