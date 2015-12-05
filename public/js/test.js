var fs = require('fs');
var dirName = "../upload/games/23";

var Engine = require('./game/engine.js');
var Globals = require('./globals.js');
var Aggressive = require('./ai/aggressive.js');
var Plyer = require('./ai/plyer.js');
var DoNothing = require('./ai/donothing.js');
var Map = require('./game/map.js');

var players = [Aggressive, Aggressive];

var lastSaved = 0;
var update = function() {
	if (lastSaved < Engine.historyLength()) {
		lastSaved ++;
		fs.writeFileSync(dirName + "/state_" + Engine.historyLength() + ".json", Engine.getHistory(lastSaved - 1));
	}
}





Engine.init(players);
Engine.setup();
var mapData = Engine.serializeMap();
fs.writeFileSync(dirName + "/map.json", mapData);
lastSaved = 0;
Engine.registerStateCallback(update);
Engine.startTurn(0);


//var Player = require('./game/player.js');
//Player.init(2);
//Map.generateMap(Player._array);

//console.log(JSON.stringify(Map._adjacencyList));
//var c = new Country();
//console.log(c);