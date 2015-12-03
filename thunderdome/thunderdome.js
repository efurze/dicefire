var fs = require('fs');
var Runner = require('./gameRunner.js');

var RandomRunner = function(playerFiles, max) {
	this._count = 0;
	this._max = max || -1;
	this._players = playerFiles;
	
};

RandomRunner.prototype.start = function() {
	// construct a random list of players
	var players = [];
	var numPlayers = 1 + Math.round(Math.random() * 7);
	while (players.length < numPlayers) {
		var pool = this._players.map(function(p) {return p;});
		while (pool.length && players.length < numPlayers) {
			var idx = Math.floor(Math.random() * pool.length);
			players.push(pool[idx]);
			pool.splice(idx, 1);
		}
	}
	
	this._count++;
	this._runner = new Runner(players);
	console.log("game " + this._count + " starting");
	this._runner.start(this.done.bind(this));
};


RandomRunner.prototype.done = function() {
	console.log("game over");
	this._runner = null;
	if (fs.existsSync("stop.td")) {
		fs.unlinkSync("stop.td");
		console.log("Exiting Thunderdome");
	} else if (this._max > 0 && this._count > this._max) {
		console.log("Exiting Thunderdome");
	} else {
		setTimeout(this.start.bind(this), 0);
	}
};


//var files = fs.readdirSync('../public/js/bullpen'); 
var files = ["aggressive.js", "plyer.js", "greedy.js"];
//var files = ["aggressive.js", "aggressive.js"];
files = files.map(function(file) {
	return '../public/js/bullpen/' + file;
});


var rr = new RandomRunner(files);
rr.start();