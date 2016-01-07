var fs = require('fs');
var Promise = require('bluebird');
var submitter = require('./submission.js');
var aiWorker = fs.readFileSync(__dirname + "/../public/js/game/aiworker.js", 'utf8');
var rwClient = require('../lib/redisWrapper.js');
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

		rwClient.saveMap(gameId, mapData)
			.then(function(reply) {
				res.status(200).send("{}");
			}).catch(function(err) {
				res.status(500).send("Error saving Map data" + err);
			});
	},

	uploadGameInfo: function(req, res) { 
		var gameId = req.query['gameId'];
		var results = req.body;
		console.log("UploadGameInfo for gameId " + gameId, results);
		
		rwClient.saveGameInfo(gameId, JSON.stringify(results))
		 	.then(function(reply) {
				
				if (typeof results.winner === 'undefined') {
					res.status(200).send("{}");
					return;
				}
				
				var uniquePlayers = {};
				// record the win and loss for each player
				return Promise.each(results.players, function(player, idx) {
					uniquePlayers[player] = true;
					if (idx == results.winner) {
						return submitter.recordWin(player);
					} else {
						return submitter.recordLoss(player);
					}
					
				}).then(function() {
					// Add the game to each AI's history
					return Promise.each(Object.keys(uniquePlayers), function(player) {
						return submitter.recordGameForAI(player, gameId);
					});
				}).then(function() {
					// Add the game to the overall history
					return submitter.recordGame(gameId);
				}).then(function() {
					res.status(200).send("{}");
				}).catch(function(err){
					console.log("uploadGameInfo ERROR:", err);
					res.status(500).send(err);
				});
				
				
			}).catch(function(err) {
				if (err) {
					console.log("ERROR saving gameInfo to Redis:", err);
				}
			});
	},

	getGameInfo: function(req, res) {
		var gameId = req.query['gameId'];

		rwClient.getGameInfo(gameId)
			.then(function(reply) {
				if (!reply) {
					res.status(404).send("No game file found for gameId " + gameId);
				} else {
					res.send(reply);
				}
			}).catch(function(err) {
				console.log("Error retrieving GameInfo" + err);
				res.status(500).send("Error retrieving GameInfo" + err);
			});
	},

	uploadState: function(req, res) { 
		var moveId = req.query['moveId'];
		var gameId = req.query['gameId'];
		var stateData = JSON.stringify(req.body);
		
		rwClient.saveState(gameId, moveId, stateData)
			.then(function(reply) {
				res.status(200).send("{}");
			}).catch(function(err) {
				console.log("Error saving state data" + err);
				res.status(500).send("Error saving state data" + err);
			});
	},

	getMap: function(req, res) {
		var gameId = req.query['gameId'];
		
		rwClient.getMap(gameId)
			.then(function(data) {
				if (!data) {
					res.status(404).send("No map file found for gameId " + gameId);
				} else {
					res.send(data);
				}
			}).catch(function(err) {
				console.log("Error retrieving map " + err);
				res.status(500).send("Error retrieving map " + err);
			});
	},

	getState: function(req, res) {
		var gameId = req.query['gameId'];
		var moveId = req.query['moveId'];
		
		rwClient.getState(gameId, moveId)
			.then(function(data) {
				if (!data) {
					res.status(404).send("No statefile found for gameId " + gameId + " moveId " + moveId);
				} else {
					res.send({'data': data, 'id': moveId});
				}
			}).catch(function(err) {
				console.log("Error getting state data " + err);
				res.status(500).send("Error getting state data " + err);
			});
	},
	
	getStateCount: function(req, res) {
		var gameId = req.query['gameId'];

		rwClient.getStateCount(gameId)
			.then(function(filenames) {
				res.send({'stateCount': filenames.length});
			}).catch(function(err) {
				console.log("Error getting state count " + err);
				res.status(500).send("Error getting state count " + err);
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
			console.log("Error retrieving AI list: " + err);
			res.status(500).send("Error retrieving AI list: " + err);
		});
	},
	
	getAIListJSON: function(req, res) {
		submitter.getAIs().then(function(results) {
			var parsedResults = results.map(function(result){return JSON.parse(result);});
			res.send(parsedResults);
		}).catch(function(err) {
			console.log("Error retrieving AI list: " + err);
			res.status(500).send("Error retrieving AI list: " + err);
		});
	},
	
	getAIDetail: function(req, res) {
		var sha = req.params['hash'];
		var dataToRender = {};
		submitter.getAI(sha)
			.then(function(result) {
				// append AI summary
				var info = JSON.parse(result);
				dataToRender.name = info.name;
				dataToRender.wins = info.wins ? info.wins : 0;
				dataToRender.losses = info.losses ? info.losses : 0;
				// get Game history
				return rwClient.getAIGames(sha);
			}).then(function(result) {
				dataToRender.games = result;
				res.render("ai_detail", dataToRender);
			}).catch(function(err) {
				console.log("Error retrieving AI detail: " + err);
				res.status(500).send("Error retrieving AI detail: " + err);
			});
	},
	
	getAICode: function(req, res) {
		var sha = req.params['hash'];
		submitter.getAI(sha)
			.then(function(result) {
				result = JSON.parse(result);
				res.send(result.code);
			}).catch(function(err) {
				console.log("Error retrieving AI: " + err);
				res.status(500).send("Error retrieving AI: " + err);
			});
	},
	
	getAIWorker: function(req, res) {
		var sha = req.params['hash'];
		var replaced = aiWorker.replace('_replaceThisWithAIHash_', sha);
		res.send(replaced);
	},
	
	resetAI: function(req, res) {
		var sha = req.params['hash'];
		submitter.resetAI(sha)
			.then(function(reply) {
				res.send("Reset successful");
			}).catch(function(err) {
				console.log("ERROR resetting AI", err);
				res.status(500).send("Error resetting AI" + err);
			});
	}

};
