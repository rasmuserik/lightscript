require("./jqueryapp");
exports.webmain = function() {
    $("body").append("hello");
};
exports.nodemain = function() {
    var files = require("fs").readdirSync("/home/rasmuserik/private/image/DCIM/");
    files = files.sort();
    var imgs = {};
    var exts = {};
    files.forEach(function(filename) {
        var name = filename.split(".")[0];
        var extension = filename.split(".").slice(1).join(".");
        var obj = imgs[name] || (imgs[name] = {name : name, exts : []});
        obj.exts.push(extension);
    });
    Object.keys(imgs).forEach(function(name) {
        var extension = imgs[name].exts.join(",");
        exts[extension] = (exts[extension] || 0) + 1;
    });
    console.log(files.length, exts);
    // server
    var app = require("express")();
    var server = require("http").createServer(app);
    var io = require("socket.io").listen(server);
    server.listen(8080);
    app.get("/", function(req, res) {
        res.sendfile(__dirname + "../apps/images/index.html");
    });
    app.get("/jqueryapp.js", function(req, res) {
        res.sendfile(__dirname + "../apps/images/jqueryapp.js");
    });
    io.sockets.on("connection", function(socket) {
        socket.emit("news", {hello : "world"});
        socket.on("my other event", function(data) {
            console.log(data);
        });
    });
};
