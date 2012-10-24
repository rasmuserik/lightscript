api = require("./api");
if(`compiler.nodejs) {
logname = process.env.HOME + '/data/log/' + require('os').hostname() + '-';
util = require("./util");
fs = require('fs');
logfile = undefined;
logdata = [];

logdate = undefined;
logstream = undefined;

syncLog = util.throttledFn(function() {
    date = new Date();
    today = date.getUTCFullYear() 
    today += (100+date.getUTCDate() + "").slice(1);
    today += (101+date.getUTCMonth() + "").slice(1);
    if(today !== logdate) {
        if(logstream) {
            logstream.end();
            logstream = undefined;
        }
    }
    if(!logstream) {
        logdate = today;
        fname = logname + logdate + '.log';
        logstream = fs.createWriteStream(fname, {flags:"a"});
        logstream.on('close', function() {
                require('child_process').exec('bzip2 ' + fname);
        });
    };
    logdata.forEach(function(data) {
        logstream.write(data);
        logstream.write("\n");
    });
});

log = function(data) {
    logdata.push(data);
    syncLog();
    console.log(data);
    if(!logfile) {
        util.mkdir(logname.split('/').slice(0, -1).join('/'));
    }
}
exports.apimain = function() {
    api.io.sockets.on('connection', function(socket) {
        socket.on('log', function() {
            args = Array.prototype.slice.call(arguments, 0);
            console.log.apply(console, [socket.handshake.cid + ':'].concat(args));
            logdata.push(JSON.stringify({timestamp: Date.now(), cid: socket.handshake.cid, msg: args}));
            syncLog();
        });
        api.socket.emit('log', "connection", socket.handshake.cid);
    });
};
};
logfn = function(level) { return function() {
            args = Array.prototype.slice.call(arguments, 0);
            args.unshift(level);
            api.socket.emit.apply(api.socket, args);
}
}
exports.info = logfn("info");
exports.warn = logfn("warn");
exports.error = logfn("error");
