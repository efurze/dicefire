var rwClient = require('../lib/redisWrapper.js');
var logger = require('../lib/logger.js');

module.exports = {
	

	thunderdome: function(req, res) { 
	    res.render("thunderdome", {
	    	title: "Welcome to Thunderdome",
	    	scripts: [
				{ path: "/node-uuid/uuid.js" },
				{ path: "/js/app/thunderdome.js" }
	    	]
	    });
	},

	
	uploadErrorReport: function(req, res) {
		var gameId = req.query.gameId;
		var logData = JSON.stringify(req.body);
		rwClient.clientErrorReport(logData, gameId);
		logger.log("Got client error report", logger.LEVEL.DEBUG, logger.CHANNEL.ADMIN, gameId);
		res.status(200).send("{}");
	},
	
	getServerLog: function(req, res) {
		rwClient.getServerLog()
			.then(function(list) { // list: array of strings: {channel:, level:, gameId:, msg:, timestamp:}
				list = list.map(function(m){
					var msg = JSON.parse(m);
					var d = new Date(parseInt(msg.timestamp));
					msg.timestamp = (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear();
					msg.timestamp += " " + d.toTimeString().split(' ')[0];
					return msg;
				});

				res.status(200).render('server_log', {log: list});
			});
	},
	
	getErrorReportList: function(req, res) {
		rwClient.getClientErrorReportList()
			.then(function(list) { // array of {timestamp: , gameId: }
				list = list.map(function(item) {
					var date = new Date(parseInt(item.timestamp));
					item.formattedDate = date.toString();
					return item;
				});
				res.status(200).render("clientErrorLogs", {errorLogs: list});
			}).catch(function(err) {
				res.status(500).send("Error retrieving error log list" + err);
			});
	},
	
	getErrorReport: function(req, res) {
		var gameId = req.query.gameId;
		var timestamp = req.query.timestamp;
		rwClient.getClientErrorReport (timestamp, gameId)
			.then(function(log) { // log is a string
				console.log("Client Log:", log);
				log = JSON.parse(log);
				var strList = log.map(function(l) {
					return '['+logger.channelNames[l.channel]+'] ' + '['+logger.levelNames[l.level]+'] ' + l.msg;
				});
				res.status(200).send(strList.join('<br>'));
			}).catch(function(err) {
				res.status(500).send("Error retrieving error log" + err);
			});
	},

	getAIForTest: function(req, res) {	
		logger.log("getAIForTest", logger.LEVEL.DEBUG, logger.CHANNEL.ADMIN);
		req.params.test = true;
		return module.exports.getAICode(req, res);
	},

	getAICode: function(req, res) {
		var sha = req.params.hash;
		var test = req.params.test;
		logger.log("getAICode", sha, test, logger.LEVEL.DEBUG, logger.CHANNEL.ADMIN);
		rwClient.getAI(sha, test)
			.then(function(result) {
				result = JSON.parse(result);
				res.send(result.code);
			}).catch(function(err) {
				logger.log("Error retrieving AI", sha, JSON.stringify(err), logger.LEVEL.ERROR, logger.CHANNEL.ADMIN);
				res.status(500).send("Error retrieving AI: " + err.toString());
			});
	},
	
	resetAI: function(req, res) {
		var hash = req.params.hash;

		return rwClient.delAIGames(hash)
			.then(function(){
				return rwClient.getAI(hash);
			}).then(function(reply) {
				var info = JSON.parse(reply);
				info.wins = 0;
				info.losses = 0;
				return rwClient.saveAI(hash, JSON.stringify(info));
			}).then(function(reply) {
				res.send("Reset successful");
			}).catch(function(err) {
				logger.log("Error resetting AI", err, logger.LEVEL.ERROR, logger.CHANNEL.ADMIN);
				res.status(500).send("Error resetting AI" + err);
			});			
	}

};
