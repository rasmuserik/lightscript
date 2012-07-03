var express = require('express');
var mustache = require('mustache');
var fs = require('fs');
var app = express.createServer();
var logger = require('express-logger');

app.use(logger({path: process.env.HOME + "/httpd.log"}));

htmlTemplate = fs.readFileSync('html.mustache', 'utf8');

function name2url(name) {
    return name.replace(/[^a-zA-Z0-9._~:/?#\[\]@!$&'()*+,;=-]/g, '_');
}
function file2entries(filename) {
    var result = {};
    fs.readFileSync(filename, 'utf8')
        .split('\n# ').slice(1)
        .forEach(function(elem){
            var title = elem.split('\n')[0].trim();
            if(result[title]) {
                throw 'duplicate title in "' + filename + '": ' + title
            }
            result[title] = {
                title: title,
                url: name2url(title),
                html: require( "markdown" ).markdown.toHTML( '# ' + elem)
            };
         });
    return result;
}
var info = file2entries('info.md');
var notes = file2entries('notes.md');

Object.keys(info).forEach(function(key) {
    app.get('/'+info[key].url, function(req, res) {
        res.send(fixLinks(mustache.to_html(htmlTemplate, {
            title: key,
            body: info[key].html
        })));
    });
});

Object.keys(notes).forEach(function(key) {
    app.get('/'+notes[key].url, function(req, res) {
        res.send(fixLinks(mustache.to_html(htmlTemplate, {
            title: key,
            body: notes[key].html
        })));
    });
});


function fixLinks(html) {
    return html.replace(/href="http(s?):\/\/([^"]*)/g, function(_,s,url) { return 'href="/http' + s + '?' + url });
}

app.get('/', function(req, res){
    fs.readFile('frontpage.html.mustache', 'utf8', function(err, frontpage) {
        res.send(fixLinks(
            mustache.to_html(frontpage, {
                notes: Object.keys(notes).map(function(noteName) {
                    var title = notes[noteName].title;
                    return '<a href="/' + notes[noteName].url + '">' + title.replace(/:/g, ':<br/>') + '</a>';
                }).join(''),
                info: Object.keys(info).map(function(page) {
                    var title = info[page].title;
                    return '<a href="/' + info[page].url + '">' + title.replace(/:/g, ':<br/>') + '</a>';
                }).join('')
            })
        ));
    });
});

/* app.get('/', function(req, res){
    fs.readFile('log.md', 'utf8', function(err, data) {
        res.send(fixLinks(
            mustache.to_html(htmlTemplate, {
                title: 'solsort', 
                body: require( "markdown" ).markdown.toHTML( data ) })));
    });
}); */

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
