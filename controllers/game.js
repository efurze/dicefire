var fs = require('fs');
var redis = require('redis');
var redisClient = redis.createClient(); //6379, 'localhost', '');
var uuid = require('node-uuid');


module.exports = {

	index: function(req, res) { 
		res.render("index", {
			title: "Dicefire",
			gameId: uuid.v1()
		});	    
	},

	client: function(req, res) { 
		res.render("client", {
			title: "Dicefire Client", 
			gameId: uuid.v1(),
			scripts: [
				{ path: "/js/controllers/clientcontroller.js" },
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

	// FIXME: This shouldn't work like this
	unit: function(req, res) { 
	    res.sendFile(__dirname + "/views/unittest.html");
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
	    res.render("replay", {
	    	'gameId' : gameId,
	    	scripts: [
	    		{ path: "/js/controllers/replaycontroller.js" },
	    		{ path: "/js/app/replay.js" }
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
		console.log("UploadResults for gameId " + gameId);
		var filename = gameId + "/game.json";

		redisClient.set(filename, resultsData, function(err, reply) {
			res.status(200).send("{}");
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

		redisClient.keys(gameId + '*', function(err, reply) {
			var filenames = reply;
			console.log(filenames);
			var moveCount = filenames.filter(function(name) {
				return (name.indexOf("state_") != -1);
			}).length;
				
			var filename =  gameId + '/state_' + moveId + '.json';
			redisClient.get(filename, function(err, data) {
				if (!data) {
					res.status(404).send("No statefile found for gameId " + gameId + " moveId " + moveId);
				} else {
					res.send({'data': data, 'moveCount': moveCount});
				}
			});

		});

	}

};
