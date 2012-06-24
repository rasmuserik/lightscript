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

app.configure(function(){
    app.use("/", express.static(__dirname + ''));
});
app.listen(process.env.PORT || 80);
