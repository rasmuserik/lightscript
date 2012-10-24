if(`compiler.nodejs) {
    var newId = function() {
        return require("crypto").randomBytes(18)["toString"]("base64");
    };
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
    var cookieServer = function() {
        var http = require("http");
        http.createServer(function(req, res) {
            var id = cookieId(req.headers.cookie || "");
            if(id.length !== 24) {
                id = exports.newId();
            };
            res.setHeader("Set-Cookie", cookieIdStr(id));
            res.writeHead(200, {"Content-Type" : "application/javascript"});
            res.end("solsortapi_clientid='" + id + "';\n");
        });
    };
    exports.nodemain = function() {};
};
// # client
if(`compiler.nodejs) {
    exports.socket = require("socket.io-client").connect("http://localhost:8888");
} else if(`compiler.webjs) {
    // TODO: either localhost or api.solsort.com
    exports.socket = window.io.connect("http://" + location.host);
};
