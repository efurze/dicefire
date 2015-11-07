var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');

// Turn on handlebars.
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({defaultLayout: 'single', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.get('/', function(req, res) { 
    res.render("index");
});


app.get('/test', function(req, res) { 
    res.render("ai_tester", {layout: "ai_tester", title : "AI Test"});
});


app.get('/simulator', function(req, res) {
	res.render("simulator.hbs", {layout: "simulator", title : "Simulator"});
});


app.listen(app.get('port'), function() {
      console.log('Node app is running on port', app.get('port'));
});


module.exports = app;

