var express = require('express');
var app = express();
var fs = require('fs');
var uuid = require('node-uuid');
var bodyParser = require('body-parser');

var uploadBaseDir = __dirname + "/public/upload/";
var uploadDir = __dirname + "/public/upload/games/";


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.use( bodyParser.json({limit: '50mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.set('views', __dirname + '/views');

// Turn on handlebars.
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({defaultLayout: 'single', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.get('/', function(req, res) { 
	res.render("index", {'gameId': uuid.v1()});
    
});


app.get('/data/*', function(req, res) { 
	var filename = req.url.trim().split("/").slice(2).join("/");
	fs.readFile(__dirname + "/public/" + filename + ".json", 'utf8', function (err, data) {
		if (err) {
			res.send({});
		} else {
	  		res.send("var MapData=" + data + ";");
		}
	});
});

app.get('/unit', function(req, res) { 
    res.sendFile(__dirname + "/views/unittest.html");
});

app.get('/test', function(req, res) { 
    res.render("ai_tester", {layout: "ai_tester", title : "AI Test"});
});

app.get('/loader', function(req, res) { 
    res.render("loader", {title : "Replay Game"});
});

app.get('/replay', function(req, res) { 
	var gameId = req.query['gameId'];
    res.render("replay", {'gameId' : gameId, layout: "replay"});
});

app.get('/simulator', function(req, res) {
	res.render("simulator.hbs", {layout: "simulator", title : "Simulator"});
});

app.post('/uploadMap', function(req, res) { 
	var gameId = req.query['gameId'];
	var mapData = JSON.stringify(req.body);
	console.log("UploadMap for gameId " + gameId);
	var dirName = uploadDir + gameId;
	var filename = dirName + "/map.json";
	
	ensureDir(dirName);
	fs.writeFile(filename, mapData, function(err) {
		if (err) {
			console.log("Error saving mapfile ", filename, err);
		}
	});
	
	res.status(200).send("success");
});

app.post('/uploadState', function(req, res) { 
	var moveId = req.query['moveId'];
	var gameId = req.query['gameId'];
	var stateData = JSON.stringify(req.body);
	
	var dirName = uploadDir + gameId;
	ensureDir(dirName);
	if (!fs.existsSync(dirName)) {
		console.log("ERROR: uploaded state data for unknown gameId " + gameId);
		res.status(404).send("Unrecognized gameId " + gameId);
	} else {
		var filename = dirName + "/state_" + moveId + ".json";
		console.log("Saving state file " + filename);
		fs.writeFile(filename, stateData, function(err) {
			if (err) {
				console.log("Error saving statefile ", filename, err);
			}
		});
		res.status(200).send("success");
	}

});

app.get('/getMap', function(req, res) {
	var gameId = req.query['gameId'];
	var gameDir = uploadDir + gameId;
	
	ensureDir(gameDir);
	var filename = gameDir + '/map.json';
	
	if (!fs.existsSync(filename)) {
		console.log("Cannot find file " + filename);
		res.status(404).send("No mapfile found for gameId " + gameId);
	} else {
		fs.readFile(filename, 'utf8', function (err, data) {
			if (err) {
				res.status(500).send("Error reading mapfile: " + JSON.stringify(err));
			} else {
				res.send(data);
			}
		});
	}
});

app.get('/getState', function(req, res) {
	var gameId = req.query['gameId'];
	var moveId = req.query['moveId'];
	var gameDir = uploadDir + gameId;
	
	ensureDir(gameDir);
	var filenames = fs.readdirSync(gameDir);
	var moveCount = filenames.filter(function(name) {
		return (name.substring(0, 6) == "state_");
	}).length;
	
	
	var filename =  gameDir + '/state_' + moveId + '.json';
	if (!fs.existsSync(filename)) {
		res.status(404).send("No statefile found for gameId " + gameId + " moveId " + moveId);
	} else {
		fs.readFile(filename, 'utf8', function (err, data) {
			if (err) {
				res.status(500).send("Error reading statefile: " + JSON.stringify(err));
			} else {
				res.send({'data': data, 'moveCount': moveCount});
			}
		});
	}
});


app.listen(app.get('port'), function() {
	if (!fs.existsSync(uploadDir)) {
		if (!fs.existsSync(uploadBaseDir)) {
			fs.mkdirSync(uploadBaseDir);
		}
		fs.mkdirSync(uploadDir);
	}
	console.log('Node app is running on port', app.get('port'));
});


var ensureDir = function(dir) {
	if (fs.existsSync(dir)) {
		return;
	}
	
	var dirAry = dir.split('/');
	var assembledPath = dir[0] == '/' ? '/' : '';
	dirAry.forEach(function(d) {
		d = d.trim();
		if (!d || !d.length) {
			return;
		}
	
		assembledPath += d + '/';
		if (!fs.existsSync(assembledPath)) {
			fs.mkdirSync(assembledPath);
		}
	});
	
	if (!fs.existsSync(dir)) {
		console.log("Unable to create directory " + dir);
	}
};

module.exports = app;

