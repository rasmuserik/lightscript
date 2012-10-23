// outer: __dirname
// outer: Array
// outer: console
// outer: JSON
// outer: Object
// outer: window
// outer: $
// outer: exports
// outer: require
require("./webapp");
exports.webmain = function() {
    // outer: console
    // outer: JSON
    // outer: Object
    // outer: window
    var socket;
    // outer: $
    $("body").append("hello");
    socket = window.io.connect("http://localhost:8080");
    socket.emit("my other event", {my : "data"});
    socket.on("news", function(data) {
        // outer: Object
        // outer: socket
        // outer: console
        // outer: JSON
        // outer: $
        $("body").append(JSON.stringify(data));
        console.log(data);
        socket.emit("my other event", {my : "data"});
    });
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
        // outer: require
        require("fs").readFile(__dirname + "/../apps/images/index.html", "utf8", function(err, data) {
            // outer: res
            res.send(data);
        });
    });
    app.get("/webapp.js", function(req, res) {
        // outer: __dirname
        // outer: require
        require("fs").readFile(__dirname + "/../apps/images/webapp.js", "utf8", function(err, data) {
            // outer: res
            res.send(data);
        });
    });
    io.sockets.on("connection", function(socket) {
        // outer: console
        // outer: imgs
        // outer: Object
        socket.emit("news", {hello : "world"});
        socket.emit("news", imgs);
        socket.on("my other event", function(data) {
            // outer: console
            console.log(data);
        });
    });
};
