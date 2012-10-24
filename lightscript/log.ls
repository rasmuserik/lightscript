logname = process.env.HOME + '/data/log/' + require('os').hostname();
util = require("./util");
api = require("./api");
logfile = undefined;
log = function(data) {
    console.log(data);
    if(!logfile) {
        util.mkdir(logname.split('/').slice(0, -1).join('/'));
    }
}
exports.apimain = function() {
    api.io.sockets.on('connection', function(socket) {
        socket.on('log', function() {
            args = Array.prototype.slice.call(arguments, 0);
            log({timestamp: Date.now(), cid: socket.handshake.cid, msg: args});
        });
        socket.emit('blah');
        api.socket.emit('log', "connection", socket.handshake.cid);
    });
};
setTimeout(function() {
    //console.log('here', api.socket);
    api.socket.emit('log', 'hello');
}, 1000)
