var fs = require('fs');
var Runner = require('./gameRunner.js');



var files = ["aggressive.js", "aggressive.js"];//fs.readdirSync('../public/js/bullpen');
files = files.map(function(file) {
	return '../public/js/bullpen/' + file;
});


var runner = new Runner(files);
runner.start();