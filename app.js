var express = require('express');
var app = express();

// Turn on handlebars.
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({defaultLayout: 'single', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.get('/', function(req, res) { 
    res.render("index");
});

app.listen(3000, function() {


});



module.exports = app;

