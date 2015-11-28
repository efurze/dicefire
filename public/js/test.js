
var Engine = require('./game/engine.js');
//var Map = require('./game/map.js');
var Aggressive = require('./ai/aggressive.js');
var Plyer = require('./ai/plyer.js');
var DoNothing = require('./ai/donothing.js');
//var Country = require('./game/country.js');

Engine.init([Aggressive, Aggressive]);
Engine.setup();
Engine.startTurn(0);

//var Player = require('./game/player.js');
//Player.init(2);
//Map.generateMap(Player._array);

//console.log(JSON.stringify(Map._adjacencyList));
//var c = new Country();
//console.log(c);