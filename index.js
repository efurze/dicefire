var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');

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
	// assign a game id
	var filenames = fs.readdirSync(uploadDir);
	var id = filenames.length + 1;
	fs.mkdirSync(uploadDir + id);
    res.render("index", {'gameId': id});
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

app.get('/simulator', function(req, res) {
	res.render("simulator.hbs", {layout: "simulator", title : "Simulator"});
});

app.post('/uploadMap', function(req, res) { 
	var gameId = req.param('gameId');
	var mapData = JSON.stringify(req.body);
	
	var dirName = uploadDir + gameId;
	if (!fs.existsSync(dirName)) {
		fs.mkdirSync(dirName);
	}
	
	fs.writeFileSync(dirName + "/map.json", mapData);
	
	res.send("");
});

app.post('/uploadState', function(req, res) { 
	var moveId = req.param('moveId');
	var gameId = req.param('gameId');
	var stateData = JSON.stringify(req.body);
	
	var dirName = uploadDir + gameId;
	if (!fs.existsSync(dirName)) {
		console.log("ERROR: uploaded state data for unknown gameId " + gameId);
		res.status(404).send("Unrecognized gameId " + gameId);
	} else {		
		fs.writeFileSync(dirName + "/state_" + moveId + ".json", stateData);
		res.send("");
	}
});


app.listen(app.get('port'), function() {
      console.log('Node app is running on port', app.get('port'));
});


module.exports = app;

