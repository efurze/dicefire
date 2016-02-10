var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var Promise = require('bluebird');
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
var rwClient = require('./lib/redisWrapper');

// Controllers
var userController = require('./controllers/user');
var gameController = require('./controllers/game');
var userAIController = require('./controllers/userAI');
var adminController = require('./controllers/admin');

// Game Server
var gameServer = require('./app/gameserver.js');
gameServer.listen(app, 5001);

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use('/public/images', express.static(__dirname + '/public/images'));
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use('/jquery', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use('/jshashes', express.static(path.join(__dirname, '/node_modules/jshashes')));
app.use('/node-uuid', express.static(path.join(__dirname, '/node_modules/node-uuid')));
app.use('/socket.io-client', express.static(path.join(__dirname, '/node_modules/socket.io-client')));
app.use('/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));
app.use('/bootstrap-social', express.static(path.join(__dirname, '/node_modules/bootstrap-social')));
app.use('/font-awesome', express.static(path.join(__dirname, '/node_modules/font-awesome')));
app.use('/bluebird', express.static(path.join(__dirname, '/node_modules/bluebird/js/browser')));
app.use('/three', express.static(path.join(__dirname, '/node_modules/three')));

app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));      // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({                 // to support URL-encoded bodies
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
app.get('/', gameController.index);                             // Front Page
app.get('/setupsolo', gameController.setupSolo);                // Ladder Game
app.post('/solo', gameController.solo);                         // Individual Game
app.get('/setup', gameController.setup);                        // Ladder Game
app.get('/replay', gameController.replay);	

app.get('/submit', userAIController.submissionForm);            // AI Submission form
app.get('/submission/:hash', userAIController.submit);         // promote the test AI to saved
app.post('/testsubmission', userAIController.submitForTest);    // submit for test
app.get('/aitest', userAIController.testAI);					// instructions for testing a submitted AI
app.get('/playai', userAIController.playAI);
app.get('/ais', userAIController.getAIList);                    // AI List
app.get('/ai/:hash', userAIController.getAIDetail);

// admin tools
app.get('/errorReports', adminController.getErrorReportList);
app.get('/errorReport', adminController.getErrorReport);
app.get('/serverLog', adminController.getServerLog);
app.get('/thunderdome', adminController.thunderdome);
app.get('/resetai/:hash', adminController.resetAI);
app.get('/aicode/:hash', adminController.getAICode);
app.get('/aitest/:hash', adminController.getAIForTest);


// client routes
app.post('/createGame', gameServer.createGame);
app.get('/createGame', gameServer.createGame);
app.get('/play', gameController.client);
app.post('/uploadMap', gameController.uploadMap);
app.post('/uploadGameInfo', gameController.uploadGameInfo);
app.get('/getGameInfo', gameController.getGameInfo);
app.post('/uploadState', gameController.uploadState);
app.get('/getMap', gameController.getMap);
app.get('/getState', gameController.getState); 
app.get('/getStateCount', gameController.getStateCount);
app.post('/uploadErrorReport', adminController.uploadErrorReport);
app.get('/aisjson', userAIController.getAIListJSON);
app.get('/aiworker/:hash', userAIController.getAIWorker);
app.get('/testworker/:hash', userAIController.getTestWorker);


// other
app.get('/unit', gameController.unit);


app.get('/current', function(req, res) {
  
    var gameIds = gameServer.activeGames();
    var data = {games: []};

    Promise.each(gameIds.map(function(gameId) {
        return rwClient.getGameInfo(gameId);
    }), function(gameInfo, idx) { // Gameinfo serialized to JSON
            var game = {};
            game['watch'] = "<a href='/replay?gameId=" + gameIds[idx] + "'>Watch</a>";
            game['players'] = [];
            var hasOpen = false;

            gameInfo.players.forEach(function(player, id) {
                if (gameServer.isPositionOpen(gameIds[idx], id)) {
                    hasOpen = true;
                    game['players'].push("[Open]");
                } else {
                    game['players'].push(player.id);
                }
            });

            if (hasOpen) {
                game['join'] = "<a href='/play?gameId=" + gameIds[idx] + "'>Join</a>";
            }

            data.games.push(game);
    })
    .then(function() {
        res.render('currentGames', data);
    })
    .catch(function(err) {
        res.status(500).send("Server Error: " + err.toString());
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
	logger.log("Server starting", logger.LEVEL.INFO, logger.CHANNEL.DEFAULT);
});


module.exports = app;

