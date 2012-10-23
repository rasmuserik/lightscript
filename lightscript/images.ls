require('./jqueryapp');
exports.webmain = function() {
    $('body').append('hello');
}
exports.nodemain = function() {
    files = require('fs').readdirSync('/home/rasmuserik/private/image/DCIM/');
    files = files.sort();
    imgs = {};
    exts = {};
    files.forEach(function(filename) {
        name = filename.split('.')[0];
        extension = filename.split('.').slice(1).join('.');
        obj = imgs[name] || (imgs[name] = {name: name, exts: []});
        obj.exts.push(extension);
    });
    Object.keys(imgs).forEach(function(name) {
        extension = imgs[name].exts.join(',');
        exts[extension] = (exts[extension]||0) +1;
    });
    

    console.log(files.length, exts);


// server
var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8080);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '../apps/images/index.html');
});
app.get('/jqueryapp.js', function (req, res) {
  res.sendfile(__dirname + '../apps/images/jqueryapp.js');
});

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
}
