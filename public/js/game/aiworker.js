'use strict'


if( 'function' === typeof importScripts) {

importScripts('/js/globals.js');
importScripts('/js/game/gamestate.js');
importScripts('/js/ai/util.js');
importScripts('/js/ai/plyer.js');
importScripts('/js/ai/greedy.js');
importScripts('/js/ai/aggressive.js');


var adjacencyList = null;
var state = null;
var ai = null;
var attackCallback = null;

onmessage = function(e) {
	console.log("worker got data:", e);
	var data = e.data;

	switch (data.command) {
		case 'init':
			adjacencyList = data.adjacencyList;
			ai = data.ai;
			break;
		case 'startTurn':
			state = data.state;
			ai.startTurn(AIInterface());
			break;
		case 'attackResult':
			state = data.state;
			attackCallback(data.result);
			break;
	}
	
}


var AIInterface = function() {
	return {
		adjacentCountries: function(countryId) { return adjacencyList(countryId);},
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