"use strict"

var Sandbox = require('sandbox');
var Hashes = require('jshashes');
var Promise = require('bluebird');
var SHA1 = new Hashes.SHA1();
var fs = require('fs');
var aiWorker = fs.readFileSync(__dirname + "/../public/js/game/aiworker.js", 'utf8');
var rwClient = require('../lib/redisWrapper.js');
var logger = require('../lib/logger.js');

/*
	validate() - THIS CODE IS VERY FRAGILE. Don't edit it without reading the comment below.
	
	This function validates that submitted AI code meets the submission requirements. In order to safely run
	untrusted code, we jump through some hoops. Validate() is run in a sandbox by toString()-ing it and passing the
	string to the sandbox. In order to incorporate the AI code, we paste it into the stringified body of validate() over the 
	"replaceMe" comment below. DO NOT REMOVE OR ALTER THIS COMMENT or the whole thing will stop working. Additionally, the
	name of the AI class is copied over the "replaceWithClassName" string below. Don't alter that string either.
*/
function validate() {

	try {

		/*replaceMe*/
		
		if (!create || typeof create !== 'function') {
			return "Submitted AI missing create() method";
		}

		var submittedClass = "replaceWithClassName";

		if (!submittedClass.hasOwnProperty('create') || typeof submittedClass.create !== 'function') {
			return "Server Error: Scoped constructor missing create() method. This is not a problem with your code.";
		}
		
		if (!submittedClass.hasOwnProperty('getName') || typeof submittedClass.getName !== 'function') {
			return "Server Error: Scoped consturctor missing getName() method. This is not a problem with your code.";
		}

		var name = submittedClass.getName();
		if (!name || typeof name !== 'string' || name.trim().length == 0) {
			return "Server Error: getName() function must return a string. This is not a problem with your code.";
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

// promisifies sandbox.run
var runInSandbox = function(fnString) {
	var s = new Sandbox();
	return new Promise(function (resolve, reject) {
		s.run(fnString, function(result) {
			resolve(result);
		});
	});
};

var submissionForm = function(req, res) {
	res.render("submit/submit", {
		title: "AI Submission"
	});
};

var testAI = function(req, res) {
	var aiHash = req.query['ai'];
	var aiPath = '/aicode/'+aiHash;
	res.render("submit/test", {
					ai_path: aiPath,
					ai_hash: aiHash,
					scripts: [
						{ path: "/js/app/ai_test.js"},
						{ path: aiPath }
					]
				}
		)
};

var playAI = function(req, res) {
	var aiHash = req.query['ai'];
	var aiPath = '/aicode/'+aiHash;
	res.render("submit/play", {
					ai_path: aiPath,
					ai_hash: aiHash,
					scripts: [
						{ path: "/js/app/ai_test.js"},
						{ path: aiPath }
					]
				}
		)
};


var submitForTest = function(req, res) {
	doSubmit(req, res, true);
};

var submit = function(req, res) {
	doSubmit(req, res, false);
};

var doSubmit = function(req, res, test) {
	test = (typeof test == 'undefined') ? false : test;
	var name = req.body.name.trim();
	var code = req.body.code.trim();
	var codeHash = SHA1.hex(code);

	/* 
		Append the following to the submitted code. It creates namespaced factory
		and getName() methods:

		var ai23248aed328 = {};
		ai23248aed328.create = function(id){return create(id);};
		ai23248aed328.getName = function(){return 'name';};
	*/
	var className = "ai" + codeHash;
	code += "var " + className + "={};";
	code += className +".create=function(id){return create(id);};";
	code += className +".getName=function(){return '" + name + "';};";


	rwClient.getAI(codeHash)
		.then(function (result) {
			if (result) {
				return Promise.reject("Code duplicate");
			} else {

				var fnString = validate.toString();
				fnString = fnString.replace("/*replaceMe*/", code);
				fnString = fnString.replace("\"replaceWithClassName\"", className);
				fnString += ";validate()";

				return runInSandbox(fnString);
			}
		})
		.then(function(result) {
				logger.log("validate result", result, logger.LEVEL.DEBUG, logger.CHANNEL.SUBMIT);
				result = result.result;
				if (result === 'true') { // NOTE: must be single quotes
					storeAI(code, codeHash, name, test)
						.then(function(reply) {
							if (test) {
								res.redirect('/aitest?ai='+codeHash+'&name='+name);
							} else {
								res.status(200).render('submit/received', {hash: codeHash});
							}
						}).catch(function(err) {
							res.status(500).render('submit/error', {error_message: err});
						});
				} else if (result.startsWith("Server Error")) {
					logger.log("Server vaidate error", result, logger.LEVEL.ERROR, logger.CHANNEL.SUBMIT);
					return Promise.reject(result);
				} else if (result === "TimeoutError") {
					logger.log("validate timeout", logger.LEVEL.DEBUG, logger.CHANNEL.SUBMIT);
					return Promise.reject("Your code took too long to run. Do you have an infinite loop somewhere?");
				} else {
					return Promise.reject(result);
				}
		})
		.catch(function(err) {
				res.send("Submission error: " + err + "<br><br>Invalid Sumbission");
		});
};

var storeAI = function(codeStr, sha, name, temporary) {
	return rwClient.saveAI(sha, JSON.stringify({name: name, code: codeStr, wins: 0, losses: 0}))
				.then(function(reply) {
					if (temporary) {
						return rwClient.expireAI(sha, 3600);
					} else {
						return rwClient.pushAI(sha, name);
					}
				});
};

// erases AI's game history and win-loss record
var resetAI = function(hash) {
	
};


var getAIList = function(req, res) {
	rwClient.getAIList().then(function(results) {
		var parsedResults = results.map(function(result){return JSON.parse(result);});
		res.render("ai_list", {
			title: "AIs",
			ais: parsedResults
		});
	}).catch(function(err) {
		logger.log("Error retrieving AI list", err, logger.LEVEL.ERROR, logger.CHANNEL.SUBMIT);
		res.status(500).send("Error retrieving AI list: " + err);
	});
};

var getAIListJSON = function(req, res) {
	rwClient.getAIList().then(function(results) {
		var parsedResults = results.map(function(result){return JSON.parse(result);});
		res.send(parsedResults);
	}).catch(function(err) {
		logger.log("Error retrieving AI list JSON", err, logger.LEVEL.ERROR, logger.CHANNEL.SUBMIT);
		res.status(500).send("Error retrieving AI list: " + err);
	});
};

var getAIDetail = function(req, res) {
	var sha = req.params['hash'];
	var dataToRender = {};
	rwClient.getAI(sha)
		.then(function(result) {
			// append AI summary
			var info = JSON.parse(result);
			dataToRender.name = info.name;
			dataToRender.aiHash = sha;
			dataToRender.wins = info.wins ? info.wins : 0;
			dataToRender.losses = info.losses ? info.losses : 0;
			// get Game history
			return rwClient.getAIGames(sha);
		}).then(function(result) {
			dataToRender.games = result;
			res.render("ai_detail", dataToRender);
		}).catch(function(err) {
			logger.log("Error retrieving AI detail", err, logger.LEVEL.ERROR, logger.CHANNEL.SUBMIT);
			res.status(500).send("Error retrieving AI detail: " + err);
		});
};

var getAIWorker = function(req, res) {
	var sha = req.params['hash'];
	var replaced = aiWorker.replace('_replaceThisWithAIHash_', sha);
	res.send(replaced);
};




module.exports = {
	submissionForm: submissionForm,
	submit: submit,
	submitForTest: submitForTest,
	testAI: testAI,
	playAI: playAI,
	getAIList: getAIList,
	getAIListJSON: getAIListJSON,
	getAIDetail: getAIDetail,
	getAIWorker: getAIWorker,
	resetAI: resetAI
};

