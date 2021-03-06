"use strict"

var GAME_LINGER_TIMEOUT = 20000; // milliseconds

var rwClient = require('../lib/redisWrapper.js');
var logger = require('../lib/logger.js');
var Globals = require('../public/js/app/globals.js');
var Message = require('../public/js/app/network/message.js');
var Gamestate = require('../public/js/app/game/gamestate.js');
var Gameinfo = require('../public/js/app/game/gameinfo.js');
var SocketWrapper = require('../public/js/app/network/socket.js');
var AISocketWrapper = require('./aiSocketWrapper');
var PlayerWrapper = require('./playerSocketWrapper');

// redirect the Engine logs to the server-side logger
Globals.setLogRedirect(logger.log.bind(logger));

/*
	GameManager - Constructs a new GameServer every time the createGame/ route is hit. Also listens for incoming 
	websocket connections
*/
var GameManager = function() {

	var sio = require('socket.io');
	var io = null;
	var games = {};
	
	// called both on game creation and game restoration. Constructs new GameServer.
	var setupGame = function(gameId, restoreState, map) {
		logger.log("Listening for game", logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
		var socketNamespace = io.of("/" + gameId);
		var watchNamespace = io.of("/watch/" + gameId);
		games[gameId] = new GameServer(gameId, socketNamespace, watchNamespace, restoreState, map);
	};
	

	// runs on server restart. Restores any in-progess games that were interrupted by restart
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
							gamestate = Gamestate.deserialize(JSON.parse(state));
							logger.log("Got state", gamestate.stateId(), logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
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
	
	// restore current games
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
			var aiAry = req.body;
			var aiNames = [];
			Object.keys(aiAry).forEach(function(key) {
				if (aiAry[key] == 'none') {
					return;
				}
				aiNames.push(aiAry[key]);
			});

			if (aiNames.length < 2) {
				res.status(200).send("You need at least 2 players");
				return;	
			}
			
			// randomize the player order
			aiNames = Globals.shuffleArray(aiNames);
			
			var resultsData = new Gameinfo(aiNames.map(function(name) { return {id: name}; }));
			
			logger.log("Create game", resultsData, logger.LEVEL.INFO, logger.CHANNEL.SERVER, gameId);
			// add a timestamp
			resultsData.setTimestamp(Date.now());
			rwClient.saveGameInfo(gameId, resultsData)
				.then(function(reply) {
					setupGame(gameId);
					rwClient.addActiveGame(gameId, games[gameId].createTime())
						.catch(function(err) {
							logger.log("Error adding game to redis", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
						});
					res.redirect("/play?gameId="+gameId);
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
		},

		isPositionOpen: function(gameId, playerId) {
			if (games.hasOwnProperty(gameId)) {
				return games[gameId].positionOpen(playerId);
			}
			return false;
		}
	};
}();



/*========================================================================================================================================*/
// GameServer - one of these for each active game. Requires that the GameInfo for the given gameId is already stored in Redis.
// This class constructs an Engine for each game and manages the client socket connections to it. Also manages all 'watcher' connections.
/*========================================================================================================================================*/

var Engine = require('../public/js/app/game/engine.js');
var Plyer = require('../public/js/app/ai/plyer.js');
var Greedy = require('../public/js/app/ai/greedy.js');
var Aggressive = require('../public/js/app/ai/aggressive.js');


var GameServer = function(gameId, namespace, watchNamespace, restoreState  /*optional*/, map /*optional*/) {
	var self = this;
	self._gameId = gameId;
	self._ns = namespace;
	self._watchersNs = watchNamespace;
	self._playerSockets = {};	// socketId to socketWrapper
	self._watcherSockets = {};	// socketId to socketWrapper
	self._socketMap = {}; 		// socketId to array of playerIds
	self._ipMap = {}; 			// IP address to array of playerIds
	self._gameInfo = null;
	self._players = []; 		// array of PlayerInterface
	self._connectionCount = 0;
	self._expectedHumans = 0;
	self._currentHumans = 0;
	self._started = false;
	self._createTime = Date.now();
	self._lingerTimer = null;
	
	// get the game info
	self.restore()
		.then(function() {
			return rwClient.getGameInfo(gameId);
		})
		.then(function(gameInfo) {
			try {
				if (!gameInfo) {
					logger.log("No game file found", logger.LEVEL.WARN, logger.CHANNEL.SERVER, gameId);
				} else {
					logger.log("Got game info: " + gameInfo, logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, gameId);
					self._gameInfo = gameInfo;
				
					self._engine = new Engine();
					self._engine.setKeepHistory(false);
							
				
					//initialize the AIs
					var players = [];
					self._gameInfo.getPlayers().forEach(function(playerName, id) {
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
					self._engine.init(players, map);
					self._engine.registerGameCallback(self.gameOver.bind(self));
					self._engine.registerStateCallback(self.engineUpdate.bind(self));	
					self._engine.setup(restoreState);

					// push the map data to redis
					rwClient.saveMap(self._gameId, self._engine.serializeMap())
						.then(function(reply) {
							// listen for player connections
							namespace.on('connection', self.connectPlayer.bind(self));
							// listen for watcher connections
							watchNamespace.on('connection', self.connectWatcher.bind(self));
						}).catch(function(err) {
							logger.log("ERROR saving map data to Redis:", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
						});

					self.startLingerTimer();
				}
			} catch (err) {
				logger.log("Exception initializing game engine", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
			}
		}).catch(function(err) {
			logger.log("Error getting gameInfo", err, err.stack, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, gameId);
		});
};

GameServer.prototype.persist = function() {
	var self = this;
	var serverState = {ipMap: self._ipMap};
	rwClient.saveServerState(self._gameId, JSON.stringify(serverState))
		.catch(function(err) {
			logger.log("Error persisting server state", err.toString(), logger.LEVEL.ERROR, logger.CHANNEL.SERVER, self._gameId);
		});
};

GameServer.prototype.restore = function() {
	var self = this;
	return rwClient.getServerState(self._gameId)
		.then(function(data) {
			if (data) {
				var state = JSON.parse(data);
				logger.log("Restoring server state", state, logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, self._gameId);
				self._ipMap = state.ipMap;
			}
		})
		.catch(function(err) {
			logger.log("Error restoring server state", err.toString(), logger.LEVEL.ERROR, logger.CHANNEL.SERVER, self._gameId);
		});
};


GameServer.prototype.positionOpen = function(playerId) {
	var self = this;
	if (self._players[playerId] && self._players[playerId].isHuman() && !self._players[playerId].hasSocket()) {
		return true;
	}
	return false;
};

GameServer.prototype.createTime = function() {
	return this._createTime;
};

// Called when a client connects as a 'watcher' (ie, not a player)
GameServer.prototype.connectWatcher = function(socket) {
	logger.log("Connected watcher socket id " + socket.id + " at " + socket.handshake.address + " to game " + this._gameId, 
									logger.LEVEL.INFO, logger.CHANNEL.SERVER, this._gameId);
	var self = this;
	var sock = new SocketWrapper(socket, self._gameId);
	self._watcherSockets[sock.id()] = sock;

	// push the latest gamestate to them
	sock.sendState(self._engine.currentStateId(), self._gameId);

	// tell them who isn't connected
	self._players.forEach(function(player) {
		if(player.isHuman() && !player.isInitialized()) {
			sock.sendPlayerStatus(player.id(), false);
		}
	});
};


// Called when a client connects as an active Player
GameServer.prototype.connectPlayer = function(socket) {
	logger.log("Connected player socket id " + socket.id + " at " + socket.handshake.address + " to game " + this._gameId, 
									logger.LEVEL.INFO, logger.CHANNEL.SERVER, this._gameId);
	var self = this;
	var sock = new SocketWrapper(socket, self._gameId);
	self._playerSockets[sock.id()] = sock;
	self._connectionCount ++;
	sock.on('error', this.socketError.bind(this));
	sock.on('disconnect', this.disconnect.bind(this));
	sock.on(Message.TYPE.PLAYER_INITIALIZED, this.player_init.bind(this));
	
	self.stopLingerTimer();
	
	// find a slot for this player

	// See if we've already seen this IP, if so reconnect this socket to the same player
	var id = self.reconnect(sock);
	
	if (id < 0) {
		// couldn't reconnect. Find a human slot to assign 
		for (var i=0; i < self._gameInfo.getPlayers().length; i++) {
			if (self._players[i].isHuman() && !self._players[i].hasSocket()) {
				logger.log('Assigning socket ' + sock.id() + ' to player ' + i, logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
				self._players[i].setSocket(sock);
				
				if (!self._socketMap[sock.id()]) { self._socketMap[sock.id()] = []; }
				self._socketMap[sock.id()].push(i);
				
				if (!self._ipMap[sock.ip()]) { self._ipMap[sock.ip()] = []; }
				self._ipMap[sock.ip()].push(i);
				self.persist();
				id = i;
				break;
			}
		}
	}
	
};

// from socket
GameServer.prototype.player_init = function(sock, msg) {
	var self = this;
	if (!self._socketMap[sock.id()] || !self._socketMap[sock.id()].length) {
		logger.log('player_init: no player associated with socket', sock.id(), logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, self._gameId);
	} else {
		var playerId = self._socketMap[sock.id()][0];
		var newGuy = self._players[playerId];
		if (newGuy && !newGuy.isInitialized()) {
			logger.log('Player', newGuy.id(), 'initialized', logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
			self._currentHumans++;
		
			// push the latest gamestate to them
			newGuy.setInitialized(true);
			newGuy.socket().sendState(self._engine.currentStateId(), self._gameId);
			if (self._started && self._engine.currentPlayerId() == playerId) {
				newGuy.startTurn(self._engine.getState());
			}
			
			self._players.forEach(function(player) {
				if(player.isHuman() && player != newGuy) {
					if (!player.isInitialized()) {
						// tell the new guy about everyone who hasn't connected yet
						newGuy.socket().sendPlayerStatus(player.id(), false);
					} else {
						// tell everyone else the new guy connected
						player.socket().sendPlayerStatus(newGuy.id(), true, newGuy.getName());
					}
				}
			});

			// update the watchers
			self._watchersNs.emit(Message.TYPE.PLAYER_STATUS, Message.playerStatus(newGuy.id(), true, newGuy.getName()));	
		}
	}

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
		logger.log('Socket ' + socketWrapper.id() + ' disconnected. Current connectionCount', self._connectionCount, logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, self._gameId);
		

		// put the player sockets into an array so we can round-robin any orphaned bots
		var socketAry = Object.keys(self._playerSockets)
			.map(function(id) {
				return self._playerSockets[id];
			}).filter(function(sw) {
				return sw.id() != socketWrapper.id();
			});

		var playerIds = self._socketMap[socketWrapper.id()];
		playerIds.forEach(function(playerId, idx) {

			if (self._players[playerId].isHuman()) {
				logger.log('Socket disconnect player', playerId, logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);

				// send a status update to other players
				self._players.forEach(function(player, idx) {
					if (idx != playerId && player.isInitialized()) {
						player.socket().sendPlayerStatus(playerId, false);
					}
				});

				// update the watchers
				self._watchersNs.emit(Message.TYPE.PLAYER_STATUS, Message.playerStatus(playerId, false));

				self._players[playerId].setSocket(null);
				self._players[playerId].setInitialized(false);
			} else if (socketAry.length) {
				// if it's a bot, try to reassign it
				logger.log('Reassigning bot', playerId, logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
				self.assignBot(self._players[playerId], socketAry[idx % socketAry.length]);
			} else {
				self._players[playerId].setSocket(null);
			}
		});

		delete self._socketMap[socketWrapper.id()];

		if (self._playerSockets[socketWrapper.id()]) {
			self._playerSockets[socketWrapper.id()].removeAll();
			self._playerSockets[socketWrapper.id()].disconnect();
			delete self._playerSockets[socketWrapper.id()]
		}
		
		if (self._connectionCount == 0) {
			logger.log('No active connections, starting linger timer', logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
			self.startLingerTimer();
		}
	} else {
		// a watcher left
		logger.log('Watcher socket ' + socketWrapper.id() + ' disconnected.', logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, self._gameId);
		if (self._watcherSockets[socketWrapper.id()]) {
			self._watcherSockets[socketWrapper.id()].removeAll();
			self._watcherSockets[socketWrapper.id()].disconnect();
			delete self._watcherSockets[socketWrapper.id()]
		}
	}
};


GameServer.prototype.startGame = function() {
	var self = this;
	
	logger.log('startGame', logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
	
	
	var humans = self._players.filter(function(player) {
		return player.isHuman();
	});

	var bots = self._players.filter(function(player) {
		return !player.isHuman();
	});

	// send a 'create_human' msg to each player to assign playerIds
	humans.forEach(function(human) {
		human.start();
	});


	// put the player sockets into an array so we can round-robin them
	var socketAry = Object.keys(self._playerSockets).map(function(id) {
		return self._playerSockets[id];
	});

	// assign each bot to a client to run
	bots.forEach(function(bot, idx) {
		if (!bot.hasSocket()) {
			self.assignBot(bot, socketAry[idx % socketAry.length]);
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
	var results = new Gameinfo(self._players.map(function(p) { return {id: p.getName()}; }), id);
	rwClient.recordGame(self._gameId, results, "LADDER")
		.then(function() {
			GameManager.removeGame(self._gameId);
		})
		.catch(function(err) {
			logger.log('Error saving gameInfo', err, logger.LEVEL.ERROR, logger.CHANNEL.SERVER, self._gameId);
			GameManager.removeGame(self._gameId);
		});
};

// @bot: AISocketWrapper
// @socket: SocketWrapper
GameServer.prototype.assignBot = function(bot, socket) {
	var self = this;
	Globals.ASSERT(socket instanceof SocketWrapper);
	logger.log('Assigning Bot ' + bot.getName() + ' at position ' + bot.id() + ' to socket ' + socket.id(), logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
	bot.setSocket(socket);
	
	if (!self._socketMap[socket.id()]) { self._socketMap[socket.id()] = []; }
	self._socketMap[socket.id()].push(bot.id());
	
	if (!self._ipMap[socket.ip()]) { self._ipMap[socket.ip()] = []; }
	self._ipMap[socket.ip()].push(bot.id());
	
	socket.sendCreateBot(bot.getName(), bot.id());
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
	
	Object.keys(self._playerSockets).forEach(function(id) {
		self._playerSockets[id].removeAll();
		self._playerSockets[id].disconnect();
		delete self._playerSockets[id];
		self._playerSockets[id] = null;
	});
	
	self._playerSockets.length = 0;

	Object.keys(self._watcherSockets).forEach(function(id) {
		self._watcherSockets[id].removeAll();
		self._watcherSockets[id].disconnect();
		delete self._watcherSockets[id];
		self._watcherSockets[id] = null;
	});
	
	self._watcherSockets.length = 0;

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


GameServer.prototype.startLingerTimer = function() {
	var self = this;
	logger.log('Starting linger timer', logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, self._gameId);
	self._lingerTimer = setTimeout(function() {
			logger.log('Timeout expired, cleaning up game', logger.LEVEL.INFO, logger.CHANNEL.SERVER, self._gameId);
			GameManager.removeGame(self._gameId);
			self._lingerTimer = null;
		}, GAME_LINGER_TIMEOUT);
};

GameServer.prototype.stopLingerTimer = function() {
	var self = this;
	if (self._lingerTimer) {
		logger.log('Stopping linger timer', logger.LEVEL.DEBUG, logger.CHANNEL.SERVER, self._gameId);
		clearTimeout(self._lingerTimer);
	}
	self._lingerTimer = null;
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

module.exports = GameManager;