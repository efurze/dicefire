var fs = require('fs');

var sourceDir = '../public/js';
var Globals = require(sourceDir + '/globals.js');

var GameSerializer = function(engine, playerCount, baseDir) {
	this._dir = (baseDir || './results/matches');
	this._engine = engine;
	this._data = [];
	
	if (!fs.existsSync(this._dir)) {
		fs.mkdirSync(this._dir);
	}
	
	this._dir = this._dir + '/' + playerCount + "players";
	if (!fs.existsSync(this._dir)) {
		fs.mkdirSync(this._dir);
	}
	
	// find a game id
	var dirs = fs.readdirSync(this._dir);
	var gameId = dirs.length + 1;
	this._dir = this._dir + "/" + gameId;
	
	Globals.ASSERT(!fs.existsSync(this._dir));
	fs.mkdirSync(this._dir);
	Globals.ASSERT(fs.existsSync(this._dir));
};

GameSerializer.prototype.engineUpdate = function(gamestate, index) {
	var self = this;
	self._data.push({'id': index+1, 'state': gamestate});
	self._writeNext();
};

GameSerializer.prototype.writeMap = function(map) {
	var self = this;
	self._data.push({'map': map});
	self._writeNext();
};

GameSerializer.prototype.writeResults = function(results) {
	var file = this._dir + "/results.json";
	fs.writeFileSync(file, results);
};

GameSerializer.prototype._writeNext = function() {
	var self = this;
	if (self._data.length) {
		var info = self._data.shift();
		var file = "";
		var data = {};
		if (info.hasOwnProperty('map')) {
			file = self._dir + "/map.json";
			data = info.map;
		} else if (info.hasOwnProperty('state')){
			file = self._dir + "/state_" + (info.id) + ".json";
			data = info.state;
		} else {
			Globals.ASSERT(false);
			return;
		}
		
		Globals.ASSERT(!fs.existsSync(file));
		fs.writeFile(file, data, self._writeCB.bind(self));
	}
};

GameSerializer.prototype._writeCB = function(err) {
	if (err) {
		debug("Error writing statefile: " + JSON.stringify(err));
	}
	this._writeNext();
}



//--------------------------------------------------------------------------------------


var GameRunner = function(aiFiles, resultsDir) {
	this._engine = require(sourceDir + '/game/engine.js');
	this._ais = aiFiles.map(function(p){return p;});
	this._players = [];
	this._loadAIs();
	this._resultsDir = resultsDir || "./results";
	this._serializer = new GameSerializer(this._engine, this._players.length);
	this._callback = null;
};

// @gameOver_cb = function(){}
GameRunner.prototype.start = function(gameOver_cb) {
	this._callback = gameOver_cb;
	this._engine.init(this._players, this.gameDone.bind(this));
	this._engine.setup();
	this._serializer.writeMap(this._engine.serializeMap());
	this._engine.registerStateCallback(this._serializer.engineUpdate.bind(this._serializer));
	
	debug("Beginning game: " + this._players.map(function(p) {return p.getName();}));
	this._engine.startTurn(0);
};

GameRunner.prototype.gameDone = function(winner, id) {
	var self = this;
	var results = {};
	results.winner = id + 1;
	self._players.forEach(function(player, index) {
		results['player' + (index+1)] = player.getName();
	});
	
	self._serializer.writeResults(JSON.stringify(results));
	
	var cb = this._callback;
	
	this._engine = null;
	this._ais = null;
	this._players = null;
	this._resultsDir = null;
	this._serializer = null;
	this._callback = null;
	
	if (cb) {
		cb();
	}
};

GameRunner.prototype._loadAIs = function() {
	var self = this;
	self._players = [];
	this._ais.forEach(function(ai) {
		if (fs.existsSync(ai)) {
			var AI = require(ai);
			if (AI.hasOwnProperty("getName")) {
				self._players.push(AI);

			}
		} else {
			debug("Couldn't find AI " + ai);
		}
	});
	
	Globals.ASSERT(self._players.length > 1);
};

var debug = function(msg) {
	console.log(msg);
}

module.exports = GameRunner;