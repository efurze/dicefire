var express = require('express');
var http = require('http');
var app = express();
var fs = require('fs');
var uuid = require('node-uuid');
var bodyParser = require('body-parser');
var passport = require('passport');
var passportConf = require('./config/passport');
var path = require('path');
var submissionHandler = require('./app/submit.js');


// Redis
var redis = require('redis');
var redisClient = redis.createClient(); //6379, 'localhost', '');


// Controllers
var userController = require('./controllers/user');

// Websockets
var ss = require('./sockethandler.js')(app, 5001);

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use('/jquery', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use('/node-uuid', express.static(path.join(__dirname, '/node_modules/node-uuid')));

app.use( bodyParser.json({limit: '50mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.set('views', __dirname + '/views');

// Turn on handlebars.
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({defaultLayout: 'single', extname: '.hbs'}));
app.set('view engine', '.hbs');

// Turn on passport for auth.
app.use(passport.initialize());
app.use(passport.session());

// Routes

app.get('/', function(req, res) { 
	res.render("index", {'gameId': uuid.v1()});
    
});

app.get('/client', function(req, res) { 
	res.render("client", {gameId: uuid.v1(), layout: "client"});
});

app.get('/submit', function(req, res) {
	res.render("submit", {title: "AI Submission", layout: "submit"});
});

app.post('/submission', submissionHandler.submit);

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

app.get('/thunderdome', function(req, res) { 
    res.render("thunderdome", {layout: "thunderdome", title : "Welcome to Thunderdome"});
});


app.get('/replay', function(req, res) { 
	var gameId = req.query['gameId'];
    res.render("replay", {'gameId' : gameId, layout: "replay"});
});

app.post('/uploadMap', function(req, res) { 
	var gameId = req.query['gameId'];
	var mapData = JSON.stringify(req.body);
	console.log("UploadMap for gameId " + gameId);
	var filename = gameId + "/map.json";

	redisClient.set(filename, mapData, function(err, reply) {
		res.status(200).send("{}");
	});
});

app.post('/uploadGameInfo', function(req, res) { 
	var gameId = req.query['gameId'];
	var resultsData = JSON.stringify(req.body);
	console.log("UploadResults for gameId " + gameId);
	var filename = gameId + "/game.json";

	redisClient.set(filename, resultsData, function(err, reply) {
		res.status(200).send("{}");
	});
});

app.get('/getGameInfo', function(req, res) {
	var gameId = req.query['gameId'];
	var filename = gameId + '/game.json';

	redisClient.get(filename, function(err, data) {
		if (!data) {
			res.status(404).send("No game file found for gameId " + gameId);
		} else {
			res.send(data);
		}
	});
});

app.post('/uploadState', function(req, res) { 
	var moveId = req.query['moveId'];
	var gameId = req.query['gameId'];
	var stateData = JSON.stringify(req.body);
	
	var filename = gameId + "/state_" + moveId + ".json";
	console.log("Saving state file " + filename);
	redisClient.set(filename, stateData, function(err, reply) {
		res.status(200).send("{}");
	});

});

app.get('/getMap', function(req, res) {
	var gameId = req.query['gameId'];
	var filename = gameId + '/map.json';

	redisClient.get(filename, function(err, data) {
		if (!data) {
			res.status(404).send("No map file found for gameId " + gameId);
		} else {
			res.send(data);
		}
	});
});

app.get('/getState', function(req, res) {
	var gameId = req.query['gameId'];
	var moveId = req.query['moveId'];

	redisClient.keys(gameId + '*', function(err, reply) {
		var filenames = reply;
		console.log(filenames);
		var moveCount = filenames.filter(function(name) {
			return (name.indexOf("state_") != -1);
		}).length;
			
		var filename =  gameId + '/state_' + moveId + '.json';
		redisClient.get(filename, function(err, data) {
			if (!data) {
				res.status(404).send("No statefile found for gameId " + gameId + " moveId " + moveId);
			} else {
				res.send({'data': data, 'moveCount': moveCount});
			}
		});

	});

});

// User account routes
/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});

app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);



app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});


module.exports = app;

