"use strict"

//--------------------------------------------------------------------------------------
//	GameRunner
//--------------------------------------------------------------------------------------


var GameRunner = function(AIs) {
	this._engine = new Engine();
	this._players = AIs.map(function(p){return p;});
	this._callback = null;
	
	if (this._players.length < 2) {
		debug("Not enough players: " + self.players);
	}
};

// @gameOver_cb = function(){}
GameRunner.prototype.start = function(gameOver_cb) {
	if (this._players.length > 1) {
		this._callback = gameOver_cb;
		
		this._engine.init(this._players, this.gameDone.bind(this));
		this._engine.setup();
		this._engine.registerStateCallback(this.engineUpdate.bind(this));
		
		this._gameId = uuid.v1();
		this._uploader = new Uploader(this._gameId);
		this._uploader.push(this._engine.serializeMap());
	
		debug("Beginning game " + this._gameId + ": " + this._players.map(function(p) {return p.getName();}));
		this._engine.startTurn(0);
	} else {
		debug("Not enough players to play: " + JSON.stringify(this._players));
		this._callback = null;
		this._gameId = "";
		this._engine = null;
		this._players = null;
		this._uploader = null;
		if (gameOver_cb) {
			gameOver_cb();
		}
	}
};

GameRunner.prototype.engineUpdate = function(gamestate, stateId) {
	var self = this;
	self._uploader.push(gamestate.clone());
	if (gamestate.attack()) {
		window.setTimeout(function() {
			self._engine.finishAttack(gamestate.attack());
		}, 0);
	}
};

GameRunner.prototype.gameDone = function(winner, id) {
	var self = this;
	var results = new Gameinfo(self._players.map(function(p){return p.getName();}), id);
	
	self._uploader.push(results);
	
	var cb = this._callback;
	
	this._engine = null;
	this._gameId = "";
	this._players = null;
	this._uploader = null;
	this._callback = null;
	
	if (cb) {
		cb();
	}
};

var debug = function(msg) {
	console.log(msg);
}


//--------------------------------------------------------------------------------------
//	RandomRunner
//--------------------------------------------------------------------------------------


var RandomRunner = function(AIs, max) {
	this._count = 0;
	this._stop = false;
	this._max = max || -1;
	this._players = AIs;
	
};

RandomRunner.prototype.start = function() {
	// construct a random list of players
	var players = [];
	var numPlayers = 1 + Math.ceil(Math.random() * 7);
	while (players.length < numPlayers) {
		var pool = this._players.map(function(p) {return p;});
		while (pool.length && players.length < numPlayers) {
			var idx = Math.floor(Math.random() * pool.length);
			players.push(pool[idx]);
			pool.splice(idx, 1);
		}
	}
	
	this._count++;
	this._runner = new GameRunner(players);
	console.log("game " + this._count + " starting");
	this._runner.start(this.done.bind(this));
};

RandomRunner.prototype.stop = function() {
	this._stop = true;
};

RandomRunner.prototype.done = function() {
	console.log("game over");
	this._runner = null;
	if (this._stop) {
		console.log("Exiting Thunderdome");
	} else if (this._max > 0 && this._count >= this._max) {
		console.log("Exiting Thunderdome");
	} else {
		setTimeout(this.start.bind(this), 0);
	}
};


//--------------------------------------------------------------------------------------
//	Thunderdome
//--------------------------------------------------------------------------------------


$(function() {

	
	window.Thunderdome = {
		
		_AIs: [AI.Plyer, AI.Greedy, AI.Aggressive],
		_runner: null,
		
		init: function () {
			Thunderdome._runner = new RandomRunner(Thunderdome._AIs, 1);
			
			$('#stop_btn').prop('disabled', true);
			$('#start_btn').prop('disabled', false);
			
			$('#start_btn').click(Thunderdome.start);
			$('#stop_btn').click(Thunderdome.stop);
		},
		
		start: function() {
			$('#stop_btn').prop('disabled', false);
			$('#start_btn').prop('disabled', true);
			Thunderdome._runner.start();			
		},
		
		stop: function() {
			$('#stop_btn').prop('disabled', true);
			Thunderdome._runner.stop();
		},


	};
});

