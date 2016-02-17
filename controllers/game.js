var fs = require('fs');
var rwClient = require('../lib/redisWrapper.js');
var logger = require('../lib/logger.js');
var uuid = require('node-uuid');

var Gameinfo = require('../public/js/game/gameinfo');
var Plyer = require('../public/js/ai/plyer.js');
var Greedy = require('../public/js/ai/greedy.js');
var Aggressive = require('../public/js/ai/aggressive.js');
var Human = require('../public/js/ai/human.js');

var AIs = [Human, Plyer, Greedy, Aggressive];


var makePlayerList = function(names, dflt) {
	var options = "";
	names.forEach(function(name, idx) {
		if (name == dflt) {
			options += "<option value='" + name + "' selected>" + name + "</option>";
		} else {
			options += "<option value='" + name + "'>" + name + "</option>";
		}
	});
	return options;
};

module.exports = {
	
	index: function(req, res) { 
		res.render("frontPage", {title: "Dicefire"});
	},
	
	solo: function(req, res) { 
		var playerAry = req.body;
		var playerNames = [];
		Object.keys(playerAry).forEach(function(key) {
			if (playerAry[key] == 'none') {
				return;
			}
			playerNames.push(playerAry[key]);
		});

		if (playerNames.length < 2) {
			res.status(200).send("You need at least 2 players");
			return;	
		}

		res.render("index", {title: "Dicefire", players: playerNames});	    
	},
	
	setupSolo: function(req, res) {
		req.params.type = 'solo';
		module.exports.setup(req, res);
	},

	setup: function(req, res) {
		var type = req.params.type;

		var defaults = [
			Human.getName(),
			Aggressive.getName(),
			Plyer.getName(),
			Greedy.getName(),
			"none",
			"none",
			"none",
			"none"
		];

		var names = [];
		AIs.forEach(function(ai) {
			names.push(ai.getName());
		});
		names.push("none");
		
		var listHTML = "";
		var numberOfPlayers = 8;
		for (var id=0; id < numberOfPlayers; id++) {
			listHTML += "<select class='player_selector' value='" + defaults [id] + "' name='player_" + id + "'>" +
								makePlayerList(names, defaults[id]) +
						"</select>";
		}

		var gameId = uuid.v1();
		var startUrl = "createGame?gameId="+gameId;
		if (type == 'solo') {
			startUrl = "solo";
		}

		res.render("setup", {
			title: "Dicefice - New Game",
			list: listHTML,
			url: startUrl
		});
	},

	
	client: function(req, res) { 
		var gameId = req.query.gameId;
		res.render("client", {
			title: "Dicefire Client", 
			gameId: gameId,
			replay: false,
			scripts: [
				{ path: "/js/controllers/historyController.js" },
				{ path: "/js/util/downloader.js" },
				{ path: "/js/util/history.js" },
				{ path: "/js/network/message.js" },
				{ path: "/js/network/socket.js" },
				{ path: "/js/controllers/socketAIController.js" },
				{ path: "/js/app/client.js" }
			]
		});
	},


	replay: function(req, res) { 
		var gameId = req.query.gameId;
		res.render("client", {
			title: "Dicefire Game Viewer", 
			gameId: gameId,
			replay: true,
			scripts: [
				{ path: "/js/controllers/historyController.js" },
				{ path: "/js/util/downloader.js" },
				{ path: "/js/util/history.js" },
				{ path: "/js/network/message.js" },
				{ path: "/js/network/socket.js" },
				{ path: "/js/controllers/socketAIController.js" },
				{ path: "/js/app/client.js" }
			]
		});
	},
	
	uploadMap: function(req, res) { 
		var gameId = req.query.gameId;
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
		var gameId = req.query.gameId;
		var ratingCode = req.query.ratingCode;
		var results = req.body;
		logger.log("UploadGameInfo", "ratingCode:", ratingCode, logger.LEVEL.DEBUG, logger.CHANNEL.GAME, gameId);
		
		var gameInfo = Gameinfo.deserialize(results);

		rwClient.recordGame(gameId, gameInfo, ratingCode)
		 	.then(function() {
				res.status(200).send("{}");
			}).catch(function(err) {
				if (err) {
					logger.log("ERROR saving gameInfo", err.toString(), logger.LEVEL.ERROR, logger.CHANNEL.GAME, gameId);
					res.status(500).send(err);
				}
			});
	},

	getGameInfo: function(req, res) {
		var gameId = req.query.gameId;

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
		var moveId = req.query.moveId;
		var gameId = req.query.gameId;
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
		var gameId = req.query.gameId;
		
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
		var gameId = req.query.gameId;
		var moveId = req.query.moveId;
		
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
		var gameId = req.query.gameId;

		rwClient.getStateCount(gameId)
			.then(function(count) {
				res.send({'stateCount': count});
			}).catch(function(err) {
				logger.log("Error getting state count", err, logger.LEVEL.ERROR, logger.CHANNEL.GAME, gameId);
				res.status(500).send("Error getting state count " + err);
			});
	},



	// old stuff
	

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
	
};
