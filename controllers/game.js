var fs = require('fs');
var Promise = require('bluebird');
var submitter = require('./submission.js');
var aiWorker = fs.readFileSync(__dirname + "/../public/js/game/aiworker.js", 'utf8');
var rwClient = require('../lib/redisWrapper.js');
var logger = require('../lib/logger.js');
var uuid = require('node-uuid');


module.exports = {
	
	index: function(req, res) { 
		res.render("frontPage", {title: "Dicefire"});
	},
	
	solo: function(req, res) { 
		res.render("index", {title: "Dicefire"});	    
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
				{ path: "/js/util/history.js" },
				{ path: "/js/message.js" },
				{ path: "/js/client/socketAIController.js" },
				{ path: "/js/client/client.js" }
			]
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

	replay: function(req, res) { 
		var gameId = req.query['gameId'];
		res.render("client", {
			title: "Dicefire Game Viewer", 
			gameId: gameId,
			replay: true,
			scripts: [
				{ path: "/js/controllers/clientcontroller.js" },
				{ path: "/js/util/downloader.js" },
				{ path: "/js/util/history.js" },
				{ path: "/js/message.js" },
				{ path: "/js/client/socketAIController.js" },
				{ path: "/js/client/client.js" }
			]
		});
	},
	
	uploadMap: function(req, res) { 
		var gameId = req.query['gameId'];
		var mapData = JSON.stringify(req.body);
		logger.log("UploadMap", logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);

		rwClient.saveMap(gameId, mapData)
			.then(function(reply) {
				res.status(200).send("{}");
			}).catch(function(err) {
				res.status(500).send("Error saving Map data" + err);
			});
	},

	uploadGameInfo: function(req, res) { 
		var gameId = req.query['gameId'];
		var ratingCode = req.query['ratingCode'];
		var results = req.body;
		results.timestamp = Date.now();
		logger.log("UploadGameInfo", "ratingCode:", ratingCode, logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);
		
		rwClient.saveGameInfo(gameId, JSON.stringify(results), ratingCode)
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
					if (ratingCode == "ARENA") {
						// mark this game as an arena game for rating purposes
						logger.log("Adding arena result", logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);
						return rwClient.addArenaGame(gameId);
					}
				}).then(function() {
					res.status(200).send("{}");
				}).catch(function(err){
					logger.log("UploadGameInfo ERROR", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME, gameId);
					res.status(500).send(err);
				});
				
				
			}).catch(function(err) {
				if (err) {
					logger.log("ERROR saving gameInfo to Redis", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME, gameId);
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
				logger.log("Error retrieving GameInfo", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME, gameId);
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
				logger.log("Error saving state data", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME, gameId);
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
				logger.log("Error retrieving map", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME, gameId);
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
				logger.log("Error getting state data", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME, gameId);
				res.status(500).send("Error getting state data " + err);
			});
	},
	
	getStateCount: function(req, res) {
		var gameId = req.query['gameId'];

		rwClient.getStateCount(gameId)
			.then(function(count) {
				res.send({'stateCount': count});
			}).catch(function(err) {
				logger.log("Error getting state count", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME, gameId);
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
			logger.log("Error retrieving AI list", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME);
			res.status(500).send("Error retrieving AI list: " + err);
		});
	},
	
	getAIListJSON: function(req, res) {
		submitter.getAIs().then(function(results) {
			var parsedResults = results.map(function(result){return JSON.parse(result);});
			res.send(parsedResults);
		}).catch(function(err) {
			logger.log("Error retrieving AI list JSON", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME);
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
				logger.log("Error retrieving AI detail", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME);
				res.status(500).send("Error retrieving AI detail: " + err);
			});
	},
		
	getAIWorker: function(req, res) {
		var sha = req.params['hash'];
		var replaced = aiWorker.replace('_replaceThisWithAIHash_', sha);
		res.send(replaced);
	},
	
};
