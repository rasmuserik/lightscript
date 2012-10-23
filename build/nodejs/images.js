// outer: __dirname
// outer: Array
// outer: console
// outer: Object
// outer: $
// outer: exports
// outer: require
require("./jqueryapp");
exports.webmain = function() {
    // outer: $
    $("body").append("hello");
};
exports.nodemain = function() {
    // outer: __dirname
    // outer: Array
    var io;
    var server;
    var app;
    // outer: console
    var exts;
    // outer: Object
    var imgs;
    // outer: require
    var files;
    files = require("fs").readdirSync("/home/rasmuserik/private/image/DCIM/");
    files = files.sort();
    imgs = {};
    exts = {};
    files.forEach(function(filename) {
        // outer: Array
        // outer: Object
        // outer: imgs
        var obj;
        var extension;
        var name;
        name = filename.split(".")[0];
        extension = filename.split(".").slice(1).join(".");
        obj = imgs[name] || (imgs[name] = {name : name, exts : []});
        obj.exts.push(extension);
    });
    Object.keys(imgs).forEach(function(name) {
        // outer: exts
        // outer: imgs
        var extension;
        extension = imgs[name].exts.join(",");
        exts[extension] = (exts[extension] || 0) + 1;
    });
    console.log(files.length, exts);
    // server
    app = require("express")();
    server = require("http").createServer(app);
    io = require("socket.io").listen(server);
    server.listen(8080);
    app.get("/", function(req, res) {
        // outer: __dirname
        res.sendfile(__dirname + "../apps/images/index.html");
    });
    app.get("/jqueryapp.js", function(req, res) {
        // outer: __dirname
        res.sendfile(__dirname + "../apps/images/jqueryapp.js");
    });
    io.sockets.on("connection", function(socket) {
        // outer: console
        // outer: Object
        socket.emit("news", {hello : "world"});
        socket.on("my other event", function(data) {
            // outer: console
            console.log(data);
        });
    });
};
