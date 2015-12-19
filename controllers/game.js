var fs = require('fs');
var redis = require('redis');
var redisClient = redis.createClient(); //6379, 'localhost', '');


module.exports = {

	index: function(req, res) { 
		res.render("index", {'gameId': uuid.v1()});	    
	},

	client: function(req, res) { 
		res.render("client", {gameId: uuid.v1(), layout: "client"});
	},

	submit: function(req, res) {
		res.render("submit", {title: "AI Submission", layout: "submit"});
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
	    res.sendFile(__dirname + "/views/unittest.html");
	},

	test: function(req, res) { 
	    res.render("ai_tester", {layout: "ai_tester", title : "AI Test"});
	},

	thunderdome: function(req, res) { 
	    res.render("thunderdome", {layout: "thunderdome", title : "Welcome to Thunderdome"});
	},

	replay: function(req, res) { 
		var gameId = req.query['gameId'];
	    res.render("replay", {'gameId' : gameId, layout: "replay"});
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
