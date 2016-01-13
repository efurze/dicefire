'use strict'


if( 'function' === typeof importScripts) {

importScripts('/js/globals.js');
importScripts('/js/game/gamestate.js');
importScripts('/js/ai/util.js');
importScripts('/aicode/_replaceThisWithAIHash_');



var createAIByName = function(name, playerId) {
	return eval('ai'+name).create(playerId);
}

var adjacencyList = null;
var state = null;
var ai = null;
var attackCallback = null;


onmessage = function(e) {
	var data = e.data;

	switch (data.command) {
		case 'init':
			adjacencyList = data.adjacencyList;
			var playerId = data.playerId;
			ai = createAIByName(data.ai, playerId);
			break;
		case 'startTurn':
			state = Gamestate.deserialize(data.state);
			ai.startTurn(AIInterface());
			break;
		case 'attackResult':
			state = Gamestate.deserialize(data.state);
			attackCallback(data.result);
			break;
	}
	
}


var AIInterface = function() {
	return {
		adjacentCountries: function(countryId) { return adjacencyList[countryId];},
		getState: function() { return state; },
		attack: function(fromCountryId, toCountryId, callback) { 
			attackCallback = callback;	
			postMessage({command: 'attack', from: fromCountryId, to: toCountryId});
		},
		endTurn: function() { 
			postMessage({command: 'endTurn'});
		}
	};
};

};