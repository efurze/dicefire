var fs = require('fs');

var sourceDir = '../public/js';
var Globals = require(sourceDir + '/globals.js');
var Engine = require(sourceDir + '/game/engine.js');


var GameSerializer = function(engine, baseDir) {
	this._dir = (baseDir || './results/matches');
	this._engine = engine;
	this._data = [];
	
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
		
		console.log("Writing file: " + file);
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


var GameRunner = function(aiFiles, resultsDir) {
	this._ais = aiFiles.map(function(p){return p;});
	this._resultsDir = resultsDir || "./results";
	this._serializer = new GameSerializer(Engine);
	this._players = [];
	this._callback = null;
};


GameRunner.prototype.start = function(gameOver_cb) {
	this._loadAIs();
	
	Engine.init(this._players);
	Engine.setup();
	this._serializer.writeMap(Engine.serializeMap());
	Engine.registerStateCallback(this._serializer.engineUpdate.bind(this._serializer));
	Engine.startTurn(0);
};


GameRunner.prototype._loadAIs = function() {
	var self = this;
	this._ais.forEach(function(ai) {
		if (fs.existsSync(ai)) {
			var AI = require(ai);
			if (AI.hasOwnProperty("getName")) {
				self._players.push(AI);
				debug("Loaded AI " + AI.getName());
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