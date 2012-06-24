var express = require('express');
var fs = require('fs');
var app = express.createServer();
var logger = require('express-logger');

app.use(logger({path: process.env.HOME + "/httpd.log"}));

app.get('/', function(req, res){
    fs.readFile('log.md', 'utf8', function(err, data) {
        res.send(
            "<html><body>"
            + require( "markdown" ).markdown.toHTML( data )
            + "</body></html>");
    });
});

app.get('/http', function(req, res) {
    res.redirect('http://' + req.originalUrl.slice(6));
});

app.get('/https', function(req, res) {
    res.redirect('https://' + req.originalUrl.slice(7));
});

app.configure(function(){
    app.use("/", express.static(__dirname + ''));
});

app.get('*', function(req, res){
    res.send('<html><body><h1>404 not found</h1></body></html>', 404);
});

app.listen(process.env.PORT || 80);
