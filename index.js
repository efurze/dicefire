var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var passportConf = require('./config/passport');
var path = require('path');
var secrets = require('./config/secrets');
var favicon = require('serve-favicon');
var flash = require('express-flash');
var logger = require('./lib/logger.js');

// Create the app.
var app = express();

// Redis
var redis = require('redis');
var redisClient = redis.createClient(); //6379, 'localhost', '');
var RedisStore = require('connect-redis')(session);	// For storing sessions.

// Controllers
var userController = require('./controllers/user');
var gameController = require('./controllers/game');
var submissionController = require('./controllers/submission');

// Game Server
var gameServer = require('./app/gameserver.js');
gameServer.listen(app, 5001);

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use('/jquery', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use('/jshashes', express.static(path.join(__dirname, '/node_modules/jshashes')));
app.use('/node-uuid', express.static(path.join(__dirname, '/node_modules/node-uuid')));
app.use('/socket.io-client', express.static(path.join(__dirname, '/node_modules/socket.io-client')));
app.use('/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));
app.use('/bootstrap-social', express.static(path.join(__dirname, '/node_modules/bootstrap-social')));
app.use('/font-awesome', express.static(path.join(__dirname, '/node_modules/font-awesome')));

app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.set('views', __dirname + '/views');

// Turn on handlebars.
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({defaultLayout: 'single', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.use(flash());
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: secrets.session.secret || 'keyboard cat',
    resave: true,
  	saveUninitialized: true
}));

// Turn on passport for auth.
app.use(passport.initialize());
app.use(passport.session());


// Store the user in locals for the template.
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});


// Routes

// User routes
app.get('/', gameController.index);					// Front Page
app.get('/solo', gameController.solo);			// Individual Game
app.get('/setup', gameController.setup);		// Ladder Game
app.get('/submit', gameController.submit);	// AI Submission
app.get('/ais', gameController.getAIList);	// AI List
app.get('/replay', gameController.replay);	
app.get('/ai/:hash', gameController.getAIDetail);

app.post('/submission', submissionController.submit); 						// submit the AI
app.post('/testsubmission', submissionController.submitForTest); 	// submit for test
app.get('/aitest', gameController.solo);													// user testing of AI

// admin tools
app.get('/errorReports', gameController.getErrorReportList);
app.get('/errorReport', gameController.getErrorReport);
app.get('/serverLog', gameController.getServerLog);
app.get('/thunderdome', gameController.thunderdome);
app.get('/resetai/:hash', gameController.resetAI);
app.get('/aicode/:hash', gameController.getAICode);


// client routes
app.post('/createGame', gameServer.createGame);
app.get('/play', gameController.client);
app.post('/uploadMap', gameController.uploadMap);
app.post('/uploadGameInfo', gameController.uploadGameInfo);
app.get('/getGameInfo', gameController.getGameInfo);
app.post('/uploadState', gameController.uploadState);
app.get('/getMap', gameController.getMap);
app.get('/getState', gameController.getState); 
app.get('/getStateCount', gameController.getStateCount);
app.post('/uploadErrorReport', gameController.uploadErrorReport);
app.get('/aisjson', gameController.getAIListJSON);
app.get('/aiworker/:hash', gameController.getAIWorker);


// other
app.get('/data/*', gameController.data);
app.get('/unit', gameController.unit);
app.get('/test', gameController.test);





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
	logger.log("Server starting", logger.LEVEL.INFO, logger.CHANNEL.SERVER);
});


module.exports = app;

