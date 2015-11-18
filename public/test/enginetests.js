var expect = chai.expect;
var should = chai.should();
var assert = chai.assert;


var playerDice = function(gamestate, playerId) {
	var total = 0;
	gamestate.countryIds().forEach(function(countryId) {
		if (playerId == gamestate.countryOwner(countryId)) {
			total += gamestate.countryDice(countryId);
		}
	});
	total += gamestate.storedDice(playerId);
	return total;
};

var testInit = function(players) {
	Engine.init(players);
	Engine.setup();
	
	assert(Engine.playerCount() == players.length, "Engine has " + players.length + "players");
	var total = 0;
	var avg = Math.floor(Engine.totalCountryCount() / Engine.playerCount());
	var remainder = Engine.totalCountryCount() % Engine.playerCount();
	assert(remainder < Engine.playerCount(), "sanity check on country division");
	for(var i=0; i < players.length; i++) {
		assert(Engine.playerCountryCount(i) == avg || (remainder && Engine.playerCountryCount(i) == avg+1), "Countries divided up evenly, playerCount=" + players.length);
		total += Engine.playerCountryCount(i);
	}
	
	assert(total == Engine.totalCountryCount(), "All countries assigned");
};

describe('Engine', function() {
	
	it('should initialize new 2-8 player games', function() {
		//assert.isNotNull(MapData, "test map data has been loaded");
		var players = ["human"];
		
		for (var i=1; i < 8; i++){
			players.push("human");
			testInit(players);
		}
	});


	it('can return gamestate', function() {
		Engine.init(["human", "human"]);
		Engine.setup();

		var state = Engine.getState();
		assert(state instanceof Gamestate);
	});
	 
	it('should add dice at the end of a turn', function() {
		Engine.init(["human", "human"]);
		Engine.setup();
		
		var playerId = Engine._currentPlayerId;
		var diceCount = playerDice(Engine.getState(), playerId);
		Engine.endTurn();
		var newCount = playerDice(Engine.getState(), playerId);
		
		assert(newCount = diceCount + Engine.getState().numContiguous(playerId), "correct number of dice added at end of turn");
	});
});