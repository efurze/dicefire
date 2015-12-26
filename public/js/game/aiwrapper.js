if (typeof module !== 'undefined' && module.exports) {
	var Globals = require('../globals.js');
	var Gamestate = require('./gamestate.js');
}

var AIInterface = function(aiwrapper) {
	var engine = aiwrapper._engine;
	return {
		adjacentCountries: function(countryId) { return engine.map().adjacentCountries(countryId);},
		getState: function() { return engine.getState(); },
		attack: function(fromCountryId, toCountryId, callback) { 	
			aiwrapper.attack(fromCountryId, toCountryId, callback);
		},
		endTurn: function() { 
			aiwrapper.endTurn(); 
		}
	};
};

//--------------------------------------------------------------------------------------
//	AIWrapper
//--------------------------------------------------------------------------------------
var AIWrapper = function(ai, engine, playerId, trusted) {
	this._trusted = (typeof trusted == undefined) ? false : trusted;
	this._isMyTurn = false;
	this._engine = engine;
	
	if (this._trusted) {
		this._ai = ai.create(playerId);
	} else {
		this._worker = new Worker("/js/game/aiworker.js");
		this._worker.onmessage = this.callback.bind(this);
		this._worker.postMessage({command: 'init', adjacencyList: engine.map().adjacencyList(), ai: ai.getName(), playerId: playerId});
	}
};


AIWrapper.prototype.getAI = function() {
	return this._ai;
};

// from engine
AIWrapper.prototype.stop = function() {
	if (!this._trusted && this._worker) {
		this._worker.close();
		this._worker = null;
	}
};

// from engine
AIWrapper.prototype.startTurn = function(state) {
	Globals.ASSERT(!this._isMyTurn);
	this._isMyTurn = true;
	if (this._trusted) {
		this._ai.startTurn(AIInterface(this));
	} else {
		this._worker.postMessage({command: 'startTurn', state: state.serialize()});
	}
};

// from engine
AIWrapper.prototype.attackDone = function(success) {
	if (this._trusted) {
		this._aiCallback(success);
	} else {
		this._worker.postMessage({command: 'attackResult', result: success, state: this._engine.getState().serialize()})
	}
};

// from engine
AIWrapper.prototype.loses = function() {
	if (this._trusted) {
		this._ai = null;
	} else {
		this._worker.close();
		this._worker = null;
	}
};

// from AI
AIWrapper.prototype.endTurn = function() {
	Globals.ASSERT(this._isMyTurn);
	this._isMyTurn = false;
	this._engine.endTurn();
};

// from AI
AIWrapper.prototype.attack = function(from, to, callback) {
	this._aiCallback = callback;
	this._engine.attack(this._engine.map().getCountry(from), this._engine.map().getCountry(to), this.attackDone.bind(this));
}

// from AIWorker
AIWrapper.prototype.callback = function(e) {
	Globals.ASSERT(this._isMyTurn);
	console.log("Got message from worker", e);
	var data = e.data;
	switch (data.command) {
		case 'attack':
			var from = parseInt(data.from);
			var to = parseInt(data.to);
			this._engine.attack(this._engine.map().getCountry(from), this._engine.map().getCountry(to), this.attackDone.bind(this));
			break;
		case 'endTurn':
			this._isMyTurn = false;
			this._engine.endTurn();
			break;
	}
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = AIWrapper;
}