var fs = require('fs');
var bluebird = require('bluebird');
var redis = require('redis');
var submitter = require('./submission.js');
var aiWorker = fs.readFileSync(__dirname + "/../public/js/game/aiworker.js", 'utf8');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(); //6379, 'localhost', '');
var uuid = require('node-uuid');


module.exports = {
	index: function(req, res) { 
		res.render("index", {
			title: "Dicefire",
			gameId: uuid.v1()
		});	    
	},
	
	setup: function(req, res) {
		res.render("setup", {
			title: "Dicefice - New Game",
			scripts: [
				{ path: "/js/controllers/setupcontroller.js"},
				{ path: "/node-uuid/uuid.js" },
				{ path: "/js/app/creategame.js"}
			]
		})
	},

	
	client: function(req, res) { 
		var gameId = req.query['gameId'];
		res.render("client", {
			title: "Dicefire Client", 
			gameId: gameId,
			replay: false,
			scripts: [
				{ path: "/js/controllers/clientcontroller.js" },
				{ path: "/js/util/downloader.js" },
				{ path: "/js/app/client.js" }
			]
		});
	},

	submit: function(req, res) {
		res.render("submit", {
			title: "AI Submission"
		});
	},

	data: function(req, res) { 
		var filename = req.url.trim().split("/").slice(2).join("/");
		fs.readFile(__dirname + "/public/" + filename + ".json", 'utf8', function (err, data) {
			if (err) {
				res.send({});
			} else {
		  		res.send("var MapData=" + data + ";");
			}
		});
	},

	unit: function(req, res) { 
		res.render("unittest", {
			title: "Mocha",
			scripts: [
				{ path: "https://cdn.rawgit.com/Automattic/expect.js/0.3.1/index.js" },
				{ path: "https://cdn.rawgit.com/mochajs/mocha/2.2.5/mocha.js" },
				{ path: "http://chaijs.com/chai.js" },
				{ path: "/data/testmaps/testmap" },
				{ path: "/test/enginetests.js" }
			],
			csses: [
				{ path: "https://cdn.rawgit.com/mochajs/mocha/2.2.5/mocha.css" }
			]
		});
	},

	test: function(req, res) { 
	    res.render("ai_tester", {
	    	title: "AI Test",
	    	scripts: [
	    		{ path: "/js/app/ai_tester.js" },
	    		{ path: "//www.google.com/jsapi?autoload={'modules':[{'name':'visualization','version':'1','packages':['corechart']}]}" }
	    	]
	    });
	},

	thunderdome: function(req, res) { 
	    res.render("thunderdome", {
	    	title: "Welcome to Thunderdome",
	    	scripts: [
				{ path: "/node-uuid/uuid.js" },
				{ path: "/js/app/thunderdome.js" }
	    	]
	    });
	},

	replay: function(req, res) { 
		var gameId = req.query['gameId'];
		res.render("client", {
			title: "Dicefire Game Viewer", 
			gameId: gameId,
			replay: true,
			scripts: [
				{ path: "/js/controllers/clientcontroller.js" },
				{ path: "/js/util/downloader.js" },
				{ path: "/js/app/client.js" }
			]
		});
	},


	uploadMap: function(req, res) { 
		var gameId = req.query['gameId'];
		var mapData = JSON.stringify(req.body);
		console.log("UploadMap for gameId " + gameId);
		var filename = gameId + "/map.json";

		redisClient.set(filename, mapData, function(err, reply) {
			res.status(200).send("{}");
		});
	},

	uploadGameInfo: function(req, res) { 
		var gameId = req.query['gameId'];
		var resultsData = JSON.stringify(req.body);
		console.log("UploadGameInfo for gameId " + gameId);
		var filename = gameId + "/game.json";

		redisClient.set(filename, resultsData, function(err, reply) {
			res.status(200).send("{}");
			if (err) {
				console.log("ERROR saving gameInfo to Redis:", err);
			}
		});
	},

	getGameInfo: function(req, res) {
		var gameId = req.query['gameId'];
		var filename = gameId + '/game.json';

		redisClient.get(filename, function(err, data) {
			if (!data) {
				res.status(404).send("No game file found for gameId " + gameId);
			} else {
				res.send(data);
			}
		});
	},

	uploadState: function(req, res) { 
		var moveId = req.query['moveId'];
		var gameId = req.query['gameId'];
		var stateData = JSON.stringify(req.body);
		
		var filename = gameId + "/state_" + moveId + ".json";
		console.log("Saving state file " + filename);
		redisClient.set(filename, stateData, function(err, reply) {
			res.status(200).send("{}");
		});
	},

	getMap: function(req, res) {
		var gameId = req.query['gameId'];
		var filename = gameId + '/map.json';

		redisClient.get(filename, function(err, data) {
			if (!data) {
				res.status(404).send("No map file found for gameId " + gameId);
			} else {
				res.send(data);
			}
		});
	},

	getState: function(req, res) {
		var gameId = req.query['gameId'];
		var moveId = req.query['moveId'];
		
		var filename =  gameId + '/state_' + moveId + '.json';
		redisClient.get(filename, function(err, data) {
			if (!data) {
				res.status(404).send("No statefile found for gameId " + gameId + " moveId " + moveId);
			} else {
				res.send({'data': data, 'id': moveId});
			}
		});
	
	},
	
	getStateCount: function(req, res) {
		var gameId = req.query['gameId'];

		redisClient.keys(gameId + '*', function(err, reply) {
			var filenames = reply;
			var stateCount = filenames.filter(function(name) {
				return (name.indexOf("state_") != -1);
			}).length;

			res.send({'stateCount': stateCount});

		});
	},
	
	
	getAIList: function(req, res) {
		submitter.getAIs().then(function(results) {
			var parsedResults = results.map(function(result){return JSON.parse(result);});
			res.render("ai_list", {
				title: "AIs",
				ais: parsedResults
			});
		}).catch(function(err) {
			res.status(500).send("Error retrieving AI list: " + err);
		});
	},
	
	getAIListJSON: function(req, res) {
		submitter.getAIs().then(function(results) {
			var parsedResults = results.map(function(result){return JSON.parse(result);});
			res.send(parsedResults);
		}).catch(function(err) {
			res.status(500).send("Error retrieving AI list: " + err);
		});
	},
	
	getAI: function(req, res) {
		var sha = req.query['hash'];
		submitter.getAI(sha)
			.then(function(result) {
				res.send(result);
			}).catch(function(err) {
				res.status(500).send("Error retrieving AI: " + err);
			});
	},
	
	getAICode: function(req, res) {
		var sha = req.params['hash'];
		submitter.getAI(sha)
			.then(function(result) {
				result = JSON.parse(result);
				res.send(result.code);
			}).catch(function(err) {
				res.status(500).send("Error retrieving AI: " + err);
			});
	},
	
	getAIWorker: function(req, res) {
		var sha = req.params['hash'];
		var replaced = aiWorker.replace('_replaceThisWithAIHash_', sha);
		res.send(replaced);
	}

};
