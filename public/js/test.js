var fs = require('fs');
var dirName = "../upload/games/node";

var Engine = require('./game/engine.js');
//var Map = require('./game/map.js');
var Aggressive = require('./ai/aggressive.js');
var Plyer = require('./ai/plyer.js');
var DoNothing = require('./ai/donothing.js');
//var Country = require('./game/country.js');

var lastSaved = 0;

var update = function() {
	if (lastSaved < Engine.historyLength()) {
		fs.writeFileSync(dirName + "/state_" + Engine.historyLength() + ".json", Engine.getHistory(lastSaved - 1));
		lastSaved ++;
	}
}

Engine.init([Aggressive, Aggressive]);
Engine.setup();


var mapData = Engine.serializeMap();
fs.writeFileSync(dirName + "/map.json", mapData);

Engine.registerRenderingCallback(update);
Engine.startTurn(0);

//var Player = require('./game/player.js');
//Player.init(2);
//Map.generateMap(Player._array);

//console.log(JSON.stringify(Map._adjacencyList));
//var c = new Country();
//console.log(c);