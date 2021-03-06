var Message = {

	TYPE: {
		'PLAYER_STATUS': 'player_status',
		'PLAYER_INITIALIZED': 'player_initialized',
		'STATE': 'state_update',
		'CREATE_BOT': 'create_bot',
		'CREATE_HUMAN': 'create_human',
		'START_TURN': 'start_turn',
		'ATTACK_RESULT': 'attack_result',
		'TURN_ENDED': 'turn_ended',

		'ATTACK': 'attack',
		'END_TURN': 'end_turn',
	},

	playerStatus: function(playerId, connected, playerName) {
		return {
			playerId: playerId,
			connected: connected,
			playerName: playerName
		};
	},

	playerInitialized: function() {
		return {};
	},

	createBot: function(name, playerId) {
		return {
			name: name,
			playerId: playerId
		};
	},

	createHuman: function(name, playerId) {
		return {
			name: name,
			playerId: playerId
		};
	},

	state: function(stateId, gameId) {
		return {
			stateId: stateId,
			gameId: gameId,
		};
	},

	startTurn: function(playerId, stateId) {
		return {
			playerId: playerId,
			stateId: stateId
		};
	},

	attackResult: function(playerId, success, stateId) {
		return {
			playerId: playerId,
			success: success,
			stateId: stateId
		};
	},



	attack: function(fromId, toId, playerId) {
		return {
			playerId: playerId,
			from: fromId,
			to: toId
		};
	},

	endTurn: function(playerId) {
		return {
			playerId: playerId
		};
	},

	turnEnded: function(playerId, stateId) {
		return {
			playerId: playerId,
			stateId: stateId
		};
	}
};


if (typeof module !== 'undefined' && module.exports){
	module.exports = Message;
}