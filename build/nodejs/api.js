// outer: true
// outer: null
// outer: Object
// outer: Date
// outer: location
// outer: document
// outer: window
// outer: require
// outer: exports
var newId;
var cookieIdStr;
var cookieId;
// outer: RegExp
var cookieRegExp;
cookieRegExp = RegExp(".*(^|[ ;,])c=([a-zA-Z0-9+/]*).*");
cookieId = function(cookie) {
    // outer: cookieRegExp
    return cookie.replace(cookieRegExp, function(_, _, id) {
        return id;
    });
};
cookieIdStr = function(id) {
    var cookiestr;
    // outer: Date
    var expires;
    expires = new Date(Date.now() + 360 * 24 * 60 * 60 * 1000);
    cookiestr = "c=" + id + "; Expires=" + expires.toUTCString() + ";";
};
if(true) {
    newId = function() {
        // outer: require
        return require("crypto").randomBytes(18)["toString"]("base64");
    };
    exports.nodemain = function() {
        // outer: true
        // outer: null
        // outer: newId
        // outer: Object
        // outer: cookieIdStr
        // outer: cookieId
        var io;
        // outer: exports
        // outer: require
        var app;
        var handler;
        handler = function(req, res) {
            // outer: Object
            // outer: cookieIdStr
            // outer: exports
            // outer: cookieId
            var id;
            id = cookieId(req.headers.cookie || "");
            if(id.length !== 24) {
                id = exports.newId();
            };
            res.setHeader("Set-Cookie", cookieIdStr(id));
            res.writeHead(200, {"Content-Type" : "application/javascript"});
            res.end("solsortapi_clientid='" + id + "';\n");
        };
        app = require("http").createServer(handler);
        exports.io = io = require("socket.io").listen(app);
        app.listen(8888);
        io.configure(function() {
            // outer: true
            // outer: null
            // outer: newId
            // outer: cookieId
            // outer: io
            io.set("authorization", function(handshake, callback) {
                // outer: true
                // outer: null
                // outer: newId
                // outer: cookieId
                handshake.cid = cookieId(handshake.headers.cookie || "") || newId();
                callback(null, true);
                // error first callback style 
            });
        });
    };
};
// # client
if(true) {
    exports.socket = require("socket.io-client").connect("http://localhost:8888");
} else if(undefined) {};
