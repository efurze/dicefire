var express = require('express');
var http = require('http');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var passport = require('passport');
var passportConf = require('./config/passport');
var path = require('path');


// Redis
var redis = require('redis');
var redisClient = redis.createClient(); //6379, 'localhost', '');

// Controllers
var userController = require('./controllers/user');
var gameController = require('./controllers/game');
var submissionController = require('./controllers/submission');

// Websockets
var ss = require('./sockethandler.js')(app, 5001);

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use('/jquery', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use('/jshashes', express.static(path.join(__dirname, '/node_modules/jshashes')));
app.use('/node-uuid', express.static(path.join(__dirname, '/node_modules/node-uuid')));
app.use('/socket.io-client', express.static(path.join(__dirname, '/node_modules/socket.io-client')));

app.use(bodyParser.json({limit: '50mb'}));       // to support JSON-encoded bodies
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

app.get('/', gameController.index);
app.get('/client', gameController.client);
app.get('/submit', gameController.submit);
app.get('/data/*', gameController.data);
app.get('/unit', gameController.unit);
app.get('/test', gameController.test);
app.get('/thunderdome', gameController.thunderdome);
app.get('/replay', gameController.replay);
app.post('/uploadMap', gameController.uploadMap);
app.post('/uploadGameInfo', gameController.uploadGameInfo);
app.get('/getGameInfo', gameController.getGameInfo);
app.post('/uploadState', gameController.uploadState);
app.get('/getMap', gameController.getMap);
app.get('/getState', gameController.getState); 

app.post('/submission', submissionController.submit);


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

