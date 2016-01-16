"use strict"

var GAME_LINGER_TIMEOUT = 60000; // milliseconds

var rwClient = require('../lib/redisWrapper.js');
var gameController = require('../controllers/game.js');
var logger = require('../lib/logger.js');
var Globals = require('../public/js/globals.js');
var Message = require('../public/js/network/message.js');
var Map = require('../public/js/game/map.js');
var Gamestate = require('../public/js/game/gamestate.js');
var Gameinfo = require('../public/js/game/gameinfo.js');
var SocketWrapper = require('../public/js/network/socket.js');
var AISocketWrapper = require('./aiSocketWrapper');
var PlayerWrapper = require('./playerSocketWrapper');

// redirect the Engine logs to the server-side logger
Globals.setLogRedirect(logger.log.bind(logger));

var SocketHandler = function() {

	var sio = require('socket.io');
	var io = null;
	var games = {};
	
	var setupGame = function(gameId, restoreState, map) {
		logger.log("Listening for game", logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
		var socketNamespace = io.of("/" + gameId);
		var watchNamespace = io.of("/watch/" + gameId);
		games[gameId] = new GameServer(gameId, socketNamespace, watchNamespace, restoreState, map);
	};
	
	var init = function() {
		rwClient.getActiveGames()
			.then(function(gameIds) { // String array of gameIds
				if (!gameIds || !gameIds.length) {
					return;
				}
				
				gameIds.forEach(function(gameId) {
					logger.log("Restore game", logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
					var gamestate = null;
					rwClient.getStateCount(gameId)
						.then(function(count) {
							logger.log("State count", count, logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
							return rwClient.getState(gameId, count-1);
						}).then(function(state) {
							logger.log("Got state", logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
							gamestate = state;
							return rwClient.getMap(gameId);
						}).then(function(mapData) {
							logger.log("Got map", logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
							logger.log("Restoring game", logger.LEVEL.INFO, logger.CHANNEL.SERVER, gameId);
							setupGame(gameId, gamestate, mapData);
						}).catch(function(err) {
							logger.log("Error Restoring game", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
						})
					
				});
				
			}).catch(function(err) {
				logger.log("Error retrieving active game list", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER);
			});
	};
	
	init();
	
	return {
		
		activeGames: function() {
			return Object.keys(games);
		},
		
		listen: function(app, port) {
			var server = app.listen(port);
			io = require('socket.io').listen(server);
		},
		
		createGame: function(req, res) {
			var gameId = req.query['gameId'];
			var resultsData = req.body; // stringified GameInfo
			// randomize the player order
			resultsData.players = Globals.shuffleArray(resultsData.players);
			logger.log("Create game", resultsData, logger.LEVEL.INFO, logger.CHANNEL.SERVER, gameId);
			// add a timestamp
			resultsData.timestamp = Date.now();
			rwClient.saveGameInfo(gameId, JSON.stringify(resultsData))
				.then(function(reply) {
					setupGame(gameId);
					rwClient.addActiveGame(gameId, games[gameId].createTime())
						.catch(function(err) {
							logger.log("Error adding game to redis", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
						});
					res.status(200).send("{}");
				}).catch(function(err) {
					logger.log("ERROR saving gameInfo to Redis:", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
					res.status(500).send(JSON.stringify({err: err}));
				});
		},
		
		removeGame: function(gameId) {
			if(games.hasOwnProperty(gameId)) {
				logger.log("Cleaning up game", gameId, logger.LEVEL.INFO, logger.CHANNEL.SERVER, gameId);
				games[gameId].close();
				delete games[gameId];
			}
			
			rwClient.removeActiveGame(gameId);
		}
	};
}();



/*========================================================================================================================================*/
// GameServer - one of these for each active game
/*========================================================================================================================================*/

var Engine = require('../public/js/game/engine.js');
var Plyer = require('../public/js/ai/plyer.js');
var Greedy = require('../public/js/ai/greedy.js');
var Aggressive = require('../public/js/ai/aggressive.js');


var GameServer = function(gameId, namespace, watchNamespace, restoreState  /*optional*/, map /*optional*/) {
	var self = this;
	self._gameId = gameId;
	self._ns = namespace;
	self._watchersNs = watchNamespace;
	self._sockets = {};
	self._socketMap = {}; // socketId to array of playerIds
	self._ipMap = {}; // IP address to array of playerIds
	self._gameInfo = null;
	self._players = []; // array of PlayerInterface
	self._connectionCount = 0;
	self._expectedHumans = 0;
	self._currentHumans = 0;
	self._started = false;
	self._createTime = Date.now();
	self._watchdogTimerId = -1;
	
	// get the game info
	rwClient.getGameInfo(gameId)
		.then(function(data) {
			try {
				if (!data) {
					logger.log("No game file found", logger.LEVEL.WARN, logger.CHANNEL.SERVER, gameId);
				} else {
					logger.log("Got game info: " + data, logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
					self._gameInfo = JSON.parse(data);
				
					self._engine = new Engine();
					self._engine.setKeepHistory(false);
				
					//initialize the AIs
					var players = [];
					self._gameInfo['players'].forEach(function(playerName, id) {
						if (playerName === "human") {
							self._expectedHumans ++;
							var pw = new PlayerWrapper(id, self._engine);
							logger.log("Inserted human at position " + pw.id(), logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
							players.push(pw);
							self._players.push(pw);
						} else {
							var ai = new AISocketWrapper(playerName, id, self._engine);
							players.push(ai);
							self._players.push(ai);
						}
					});
				
					logger.log("Players for game", logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
					self._players.forEach(function(player) {
						logger.log(JSON.stringify(player), logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
					})
				
				
					// initialize the game engine
					self._engine.init(players, self.gameOver.bind(self));
					self._engine.setup(map, restoreState);

					// push the map data to redis
					rwClient.saveMap(self._gameId, self._engine.serializeMap())
						.then(function(reply) {
							self._engine.registerStateCallback(self.engineUpdate.bind(self));			
							// listen for player connections
							namespace.on('connection', self.connectPlayer.bind(self));
							// listen for watcher connections
							watchNamespace.on('connection', self.connectWatcher.bind(self));
						}).catch(function(err) {
							logger.log("ERROR saving map data to Redis:", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
						});
				}
			} catch (err) {
				logger.log("Exception initializing game engine", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
			}
		}).catch(function(err) {
			logger.log("Error getting gameInfo", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
		});
};

GameServer.prototype.createTime = function() {
	return this._createTime;
};

GameServer.prototype.connectWatcher = function(socket) {
	logger.log("Connected watcher socket id " + socket.id + " at " + socket.handshake.address + " to game " + this._gameId, 
									logger.LEVEL.INFO, logger.CHANNEL.SERVER, this._gameId);
	var self = this;
	var sock = new SocketWrapper(socket, self._gameId);
	self._sockets[sock.id()] = sock;
};

GameServer.prototype.connectPlayer = function(socket) {
	logger.log("Connected player socket id " + socket.id + " at " + socket.handshake.address + " to game " + this._gameId, 
									logger.LEVEL.INFO, logger.CHANNEL.SERVER, this._gameId);
	var self = this;
	var sock = new SocketWrapper(socket, self._gameId);
	self._sockets[sock.id()] = sock;
	self._connectionCount ++;
	sock.on('error', this.socketError.bind(this));
	sock.on('disconnect', this.disconnect.bind(this));
	
	if (self._watchdogTimerId >= 0) {
		clearTimeout(self._watchdogTimerId);
	}
	self._watchdogTimerId = -1;
	
	// find a slot for this player
	var id = self.reconnect(sock);
	
	if (id < 0) {
		for (var i=0; i < self._gameInfo.players.length; i++) {
			if (self._players[i].isHuman() && !self._players[i].hasSocket()) {
				logger.log('Assigning socket ' + sock.id() + ' to player ' + i, logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
				self._currentHumans ++; 
				self._players[i].setSocket(sock);
				
				if (!self._socketMap[sock.id()]) { self._socketMap[sock.id()] = []; }
				self._socketMap[sock.id()].push(i);
				
				if (!self._ipMap[sock.ip()]) { self._ipMap[sock.ip()] = []; }
				self._ipMap[sock.ip()].push(i);
				id = i;
				break;
			}
		}
	}

	if (id >= 0 && self._started) {
		// push the latest gamestate to them
		sock.emit(Message.TYPE.STATE, Message.state(self._engine.currentStateId(), self._gameId));
	}
	
	sock.emit(Message.TYPE.MAP, Message.map(self._gameId));
	if (self._currentHumans == self._expectedHumans && !self._started) {
		self.startGame();
	}
};

// checks to see if we've seen this IP address before, and if so
// attempts to reconnect socket to same player
GameServer.prototype.reconnect = function(socketWrapper) {
	var self = this;
	var humanAssignedTo = -1;
	if (self._ipMap.hasOwnProperty(socketWrapper.ip())) {
		var playerIds = self._ipMap[socketWrapper.ip()];
		playerIds.forEach(function(playerId) {
			// try to reconnect all the players that were previously assigned to this IP
			if (self._players[playerId] && !self._players[playerId].hasSocket()) {
				logger.log('Reconnecting socket ' + socketWrapper.id() + ' to player ' + playerId, logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
				
				if (self._players[playerId].isHuman()) {
					self._players[playerId].setSocket(socketWrapper);

					if (!self._socketMap[socketWrapper.id()]) { self._socketMap[socketWrapper.id()] = []; }
					self._socketMap[socketWrapper.id()].push(playerId);

					self._players[playerId].start();
					
					self._currentHumans ++; 
					humanAssignedTo = playerId;
				} else { 
					self.assignBot(self._players[playerId], socketWrapper);
				}

				if (self._started && self._engine.currentPlayerId() == playerId) {
					self._players[playerId].startTurn(self._engine.getState());
				}
			}
		});
		
	} else {
		logger.log("haven't seen this IP before", logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, self._gameId);
	}
	
	return humanAssignedTo;
};

GameServer.prototype.disconnect = function(socketWrapper) {
	var self = this;
		
	if (self._socketMap.hasOwnProperty(socketWrapper.id())) {
		self._connectionCount --;
		self._currentHumans --;
		logger.log('Socket ' + socketWrapper.id() + ' disconnected. Current connectionCount', self._connectionCount, logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
		
		var playerIds = self._socketMap[socketWrapper.id()];
		playerIds.forEach(function(playerId) {
			if (self._players[playerId]) {
				logger.log('Socket disconnect orphaning player', playerId, logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
				self._players[playerId].setSocket(null);
			}
		});
		delete self._socketMap[socketWrapper.id()];
		
		if (self._connectionCount == 0) {
			logger.log('No active connections, starting linger timer', logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
			self._watchdogTimerId = setTimeout(function() {
				logger.log('Timeout expired, cleaning up game', logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
				SocketHandler.removeGame(self._gameId);
				self._watchdogTimerId = -1;
			}, GAME_LINGER_TIMEOUT);
		}
	} else {
		// a watcher left
		logger.log('Watcher socket ' + socketWrapper.id() + ' disconnected.', logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, self._gameId);
	}
};

GameServer.prototype.startGame = function() {
	var self = this;
	
	logger.log('startGame', logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
	
	self._players.forEach(function(player, id) {
		if (player.isHuman()) {
			player.start(); // sends 'create_human' message
		} else {
			// farm out the AIs to various players
			Globals.ASSERT(player instanceof AISocketWrapper);
			if (!player.hasSocket()) {
				self.assignBot(player)
			}	
		}
	});
		
	var current = self._engine.currentPlayerId();
	logger.log('Game started, currentPlayer=', current, logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
	self._started = true;
	self._engine.startTurn(current);
};


GameServer.prototype.gameOver = function(winner, id) {
	var self = this;
	logger.log('gameOver', winner, id, logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
	var results = new Gameinfo(self._players.map(function(p){return p.getName();}), id);
	gameController.saveGameInfo(self._gameId, results.serialize(), "LADDER")
		.then(function() {
			SocketHandler.removeGame(self._gameId);
		})
		.catch(function(err) {
			logger.log('Error saving gameInfo', err, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, self._gameId);
			SocketHandler.removeGame(self._gameId);
		});
};

// @bot: AISocketWrapper
GameServer.prototype.assignBot = function(bot, socket) {
	var self = this;
	var socketIds = [];
	Object.keys(self._sockets).forEach(function(socketId) {
		socketIds.push(socketId);
	});

	if (!socket) {
		// TODO: FIXME: make this round robin
		// randomly pick a socket to assign it to
		var index = Math.round(Math.random() * (socketIds.length - 1));
		socket = self._sockets[socketIds[index]];
	}
	Globals.ASSERT(socket instanceof SocketWrapper);
	logger.log('Assigning Bot ' + bot.getName() + ' at position ' + bot.id() + ' to socket ' + socket.id(), logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
	bot.setSocket(socket);
	
	if (!self._socketMap[socket.id()]) { self._socketMap[socket.id()] = []; }
	self._socketMap[socket.id()].push(bot.id());
	
	if (!self._ipMap[socket.ip()]) { self._ipMap[socket.ip()] = []; }
	self._ipMap[socket.ip()].push(bot.id());
	
	socket.emit(Message.TYPE.CREATE_BOT, Message.createBot(bot.getName(), bot.id()));
};

GameServer.prototype.close = function() {
	var self = this;
	logger.log('GameServer::close', logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
	self._engine.registerStateCallback(null);

	self._players.forEach(function(player) {
		if (player) {
			player.stop();
		}
	});
	
	Object.keys(self._sockets).forEach(function(id) {
		self._sockets[id].removeAll();
		self._sockets[id].disconnect();
		delete self._sockets[id];
		self._sockets[id] = null;
	});
	
	self._sockets.length = 0;

	if (self._ns) {
		self._ns._events = null;
		self._ns._eventsCount = 0;
		delete self._ns;
		self._ns = null;
	}
	
	if (self._watchersNs) {
		self._watchersNs._events = null;
		self._watchersNs._eventsCount = 0;
		delete self._watchersNs;
		self._watchersNs = null;
	}
};


// from socket
GameServer.prototype.socketError = function(socketWrapper, err) {
	logger.log("Socket error: " + err, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, this._gameId);
};

// from engine. State update that we broadcast to everyone connected to this game
GameServer.prototype.engineUpdate = function(gamestate, stateId) {
	var self = this;
	logger.log("engineUpdate, stateId", stateId, 'currentPlayer', gamestate.currentPlayerId(), logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, self._gameId);
	if (gamestate) {
		var stateData = JSON.stringify(gamestate.serialize());
		rwClient.saveState(self._gameId, stateId, stateData)
			.then(function(reply) {
				logger.log("<= state", stateId, logger.LEVEL.INFO, logger.CHANNEL.SERVER_SOCKET, self._gameId);
				// brodcast to all
				self._ns.emit(Message.TYPE.STATE, Message.state(stateId, self._gameId));
				self._watchersNs.emit(Message.TYPE.STATE, Message.state(stateId, self._gameId));
			}).catch(function(err) {
				logger.log("ERROR saving engine state to Redis:", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, self._gameId);
			});
		
	}
};


/*========================================================================================================================================*/

module.exports = SocketHandler;