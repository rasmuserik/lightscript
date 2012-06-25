var express = require('express');
var mustache = require('mustache');
var fs = require('fs');
var app = express.createServer();
var logger = require('express-logger');

app.use(logger({path: process.env.HOME + "/httpd.log"}));

htmlTemplate = fs.readFileSync('html.mustache', 'utf8');

function fixLinks(html) {
    return html.replace(/href="http(s?):\/\/([^"]*)/, function(_,s,url) { return 'href="/http' + s + '?' + url });
}

app.get('/', function(req, res){
    fs.readFile('log.md', 'utf8', function(err, data) {
        res.send(fixLinks(
            mustache.to_html(htmlTemplate, {
                title: 'solsort', 
                body: require( "markdown" ).markdown.toHTML( data ) })));
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
    res.send(
        mustache.to_html(htmlTemplate, {
            title: 'Page not found :(', 
            body: '<h1>The end of the Internet</h1>' +
                '<p>Sorry, no page found (404) on this url</p>' +
                '<p>You have reached the end of the internet</p>' +
                '<p>Hope you enjoyed the web</p>' +
                '<p>You may now turn off your device and go out in the world</p>' +
                '<p>(or see if you can find the page your were looking for <a href="/">here</a>)</p>'}),
        404);
});

app.listen(process.env.PORT || 80);
