api = require("./api");
if(`compiler.nodejs) {
    var logname = process.env.HOME + "/data/log/" + require("os").hostname() + "-";
    var util = require("./util");
    var fs = require("fs");
    var logfile = undefined;
    var logdata = [];
    var logdate = undefined;
    var logstream = undefined;
    var syncLog = util.throttledFn(function() {
        var date = new Date();
        var today = date.getUTCFullYear();
        today += (100 + date.getUTCDate() + "").slice(1);
        today += (101 + date.getUTCMonth() + "").slice(1);
        if(today !== logdate) {
            if(logstream) {
                logstream.end();
                logstream = undefined;
            };
        };
        if(!logstream) {
            logdate = today;
            var fname = logname + logdate + ".log";
            logstream = fs.createWriteStream(fname, {flags : "a"});
            logstream.on("close", function() {
                require("child_process").exec("bzip2 " + fname);
            });
        };
        logdata.forEach(function(data) {
            logstream.write(data);
            logstream.write("\n");
        });
    });
    var log = function(data) {
        logdata.push(data);
        syncLog();
        console.log(data);
        if(!logfile) {
            util.mkdir(logname.split("/").slice(0, - 1).join("/"));
        };
    };
    exports.apimain = function() {
        api.io.sockets.on("connection", function(socket) {
            socket.on("log", function() {
                var args = Array.prototype.slice.call(arguments, 0);
                console.log.apply(console, [socket.handshake.cid + ":"].concat(args));
                logdata.push(JSON.stringify({
                    timestamp : Date.now(),
                    cid : socket.handshake.cid,
                    msg : args,
                }));
                syncLog();
            });
            api.socket.emit("log", "connection", socket.handshake.cid);
        });
    };
};
var logfn = function(level) {
    api;
    return function() {
        var args = Array.prototype.slice.call(arguments, 0);
        console.log("log", level, args);
        api.socket.emit("log", level, args);
    };
};
exports.info = logfn("info");
exports.warn = logfn("warn");
exports.error = logfn("error");
