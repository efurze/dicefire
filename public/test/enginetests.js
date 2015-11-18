var expect = chai.expect;
var should = chai.should();


describe('Engine', function() {
	

	it('should initialize', function() {
	  var players = ["human", AI.Aggressive];
	  Engine.init(players);
	  Engine.setup();
	  expect(1).to.equal(1);
	});
});