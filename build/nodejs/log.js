// outer: JSON
// outer: arguments
// outer: console
// outer: Object
// outer: Date
var logfn;
// outer: exports
var log;
var syncLog;
var logstream;
var logdate;
// outer: Array
var logdata;
// outer: undefined
var logfile;
var fs;
var util;
// outer: process
var logname;
// outer: require
var api;
api = require("./api");
if(true) {
    logname = process.env.HOME + "/data/log/" + require("os").hostname() + "-";
    util = require("./util");
    fs = require("fs");
    logfile = undefined;
    logdata = [];
    logdate = undefined;
    logstream = undefined;
    syncLog = util.throttledFn(function() {
        // outer: require
        // outer: logdata
        // outer: Object
        // outer: fs
        // outer: logname
        var fname;
        // outer: undefined
        // outer: logstream
        // outer: logdate
        var today;
        // outer: Date
        var date;
        date = new Date();
        today = date.getUTCFullYear();
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
            fname = logname + logdate + ".log";
            logstream = fs.createWriteStream(fname, {flags : "a"});
            logstream.on("close", function() {
                // outer: fname
                // outer: require
                require("child_process").exec("bzip2 " + fname);
            });
        };
        logdata.forEach(function(data) {
            // outer: logstream
            logstream.write(data);
            logstream.write("\n");
        });
    });
    log = function(data) {
        // outer: logname
        // outer: util
        // outer: logfile
        // outer: console
        // outer: syncLog
        // outer: logdata
        logdata.push(data);
        syncLog();
        console.log(data);
        if(!logfile) {
            util.mkdir(logname.split("/").slice(0, - 1).join("/"));
        };
    };
    exports.apimain = function() {
        // outer: syncLog
        // outer: Date
        // outer: Object
        // outer: JSON
        // outer: logdata
        // outer: console
        // outer: arguments
        // outer: Array
        // outer: api
        api.io.sockets.on("connection", function(socket) {
            // outer: syncLog
            // outer: Date
            // outer: Object
            // outer: JSON
            // outer: logdata
            // outer: console
            // outer: arguments
            // outer: Array
            // outer: api
            socket.on("log", function() {
                // outer: syncLog
                // outer: Date
                // outer: Object
                // outer: JSON
                // outer: logdata
                // outer: socket
                // outer: console
                // outer: arguments
                // outer: Array
                var args;
                args = Array.prototype.slice.call(arguments, 0);
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
logfn = function(level) {
    // outer: console
    // outer: arguments
    // outer: Array
    // outer: api
    api;
    return function() {
        // outer: api
        // outer: level
        // outer: console
        // outer: arguments
        // outer: Array
        var args;
        args = Array.prototype.slice.call(arguments, 0);
        console.log("log", level, args);
        api.socket.emit("log", level, args);
    };
};
exports.info = logfn("info");
exports.warn = logfn("warn");
exports.error = logfn("error");
