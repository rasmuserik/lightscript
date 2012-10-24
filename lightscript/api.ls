    var cookieRegExp = RegExp(".*(^|[ ;,])c=([a-zA-Z0-9+/]*).*");
    var cookieId = function(cookie) {
        return cookie.replace(cookieRegExp, function(_, _, id) {
            return id;
        });
    };
    var cookieIdStr = function(id) {
        var expires = new Date(Date.now() + 360 * 24 * 60 * 60 * 1000);
        var cookiestr = "c=" + id + "; Expires=" + expires.toUTCString() + ";";
    };
if(`compiler.nodejs) {
    var newId = function() {
        return require("crypto").randomBytes(18)["toString"]("base64");
    };
    exports.nodemain = function() {
        handler = function(req, res) {
            var id = cookieId(req.headers.cookie || "");
            if(id.length !== 24) {
                id = exports.newId();
            };
            res.setHeader("Set-Cookie", cookieIdStr(id));
            res.writeHead(200, {"Content-Type" : "application/javascript"});
            res.end("solsortapi_clientid='" + id + "';\n");
        };
        var app = require('http').createServer(handler);
        exports.io = io = require('socket.io').listen(app);
        app.listen(8888);
        io.configure(function (){
            io.set('authorization', function (handshake, callback) {
                handshake.cid = cookieId(handshake.headers.cookie || "") || newId();
                console.log('auth...', handshake.cid);
                callback(null, true); // error first callback style 
            });
        });
    };
};
// # client
if(`compiler.nodejs) {
    exports.socket = require("socket.io-client").connect("http://localhost:8888");
} else if(`compiler.webjs) {
    exports.clientid = window.solsortapi_clientid;
    if(!exports.clientid) {
        exports.clientid = cookieId(document.cookie);
    } else {
        document.cookie = cookieIdStr(exports.clientid);
    }
    if(location.hostname.slice(-9) === 'localhost') {
        exports.socket = window.io.connect("http://localhost:8888");
    } else {
        exports.socket = window.io.connect("http://api.solsort.com");
    }
    exports.socket.on("solsortapi_clientid", function(id) {
        exports.clientid = id;
        document.cookie = cookieIdStr(id);
    });
};
