if(`compiler.nodejs) {
newId = function() {
    return require('crypto').randomBytes(18)["toString"]('base64');
}
cookieRegExp = RegExp('.*(^|[ ;,])c=([a-zA-Z0-9+/]*).*');
cookieId = function(cookie) {
    return cookie.replace(cookieRegExp, function(_, _, id) { return id; });
}                           
cookieIdStr = function(id) {
    expires = new Date(Date.now() + 360*24*60*60*1000);
    cookiestr = 'c=' + id +'; Expires=' + expires.toUTCString() + ';'
}
cookieServer = function() {
    var http = require('http');
    http.createServer(function (req, res) {
        id = cookieId(req.headers.cookie || "");
        if(id.length !== 24) {
            id = exports.newId();
        }
        res.setHeader('Set-Cookie', cookieIdStr(id));
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.end("solsortapi_clientid=\'" + id + "';\n");
    });
}
exports.nodemain = function() {
}
}
// # client
if(`compiler.nodejs) {
    exports.socket = require('socket.io-client').connect('http://localhost:8888');
} else if(`compiler.webjs) {
    // TODO: either localhost or api.solsort.com
    exports.socket = window.io.connect("http://" + location.host);
};
