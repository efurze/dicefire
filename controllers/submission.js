"use strict"

var Sandbox = require('sandbox');
var Hashes = require('jshashes');
var SHA1 = new Hashes.SHA1();
var rwClient = require('../lib/redisWrapper.js');

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
	return rwClient.pushAI(sha, name)
				.then(function(result) {
					return rwClient.saveAI(sha, JSON.stringify({name: name, code: codeStr, wins: 0, losses: 0}));
				});
};

// erases AI's game history and win-loss record
var resetAI = function(hash) {
	return rwClient.delAIGames(hash)
				.then(function(){
					return rwClient.getAI(hash);
				}).then(function(reply) {
					var info = JSON.parse(reply);
					info.wins = 0;
					info.losses = 0;
					return rwClient.saveAI(hash, JSON.stringify(info));
				});
};

// returns a promise
var getAIs = function() {
	return rwClient.getAIList();
};

var getAI = function(hash) {
	return rwClient.getAI(hash);
};

// adds entry to global game list "games"
var recordGame = function(gameId) {
	console.log("recordGame", gameId);
	return rwClient.pushGame(gameId)
		.catch(function(err) {
			console.log("ERROR recording game to redis:", err);
		});
};

// adds entry to game list for given AI
var recordGameForAI = function(hash, gameId) {
	console.log("recordGameForAI", hash, gameId);
	return rwClient.pushAIGame(hash, gameId)
		.catch(function(err) {
			console.log("ERROR recording AI game to redis:", err);
		});
};

var recordWin = function(hash, gameId) {
	console.log("recordWin", hash);
	return rwClient.getAI(hash)
				.then(function(str) {
					var info = JSON.parse(str);
					if (!info.hasOwnProperty('wins')) {
						info.wins = 0;
					}
					info.wins ++;
					return rwClient.saveAI(hash, JSON.stringify(info));
			
				}).catch(function(err) {
					console.log("ERROR recording win:", err);
				});
};

var recordLoss = function(hash) {
	console.log("recordLoss", hash);
	return rwClient.getAI(hash)
				.then(function(str) {
					var info = JSON.parse(str);
					if (!info.hasOwnProperty('losses')) {
						info.losses = 0;
					}
					info.losses ++;
					return rwClient.saveAI(hash, JSON.stringify(info));
			
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
						// TODO: FIXME: handle the returned promise and check for errors
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

