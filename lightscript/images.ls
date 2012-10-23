require("./webapp");
jsonml = require('./jsonml');
exports.webmain = function() {
    $("body").append(
            jsonml.toXml(["div", {style: 'background-color: red;'}, 'hello world'])
            );
    var socket = window.io.connect("http://localhost:8080");
    socket.emit("my other event", {my : "data"});
    socket.on("news", function(data) {
        $("body").append(JSON.stringify(data));
        console.log(data);
        socket.emit("my other event", {my : "data"});
    });
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
        require("fs").readFile(__dirname + "/../apps/images/index.html", "utf8", function(err, data) {
            res.send(data);
        });
    });
    app.get("/webapp.js", function(req, res) {
        require("fs").readFile(__dirname + "/../apps/images/webapp.js", "utf8", function(err, data) {
            res.send(data);
        });
    });
    app.use("/", express.static('/home/rasmuserik/private/image/DCIM'));

    io.sockets.on("connection", function(socket) {
        socket.emit("news", {hello : "world"});
        socket.emit("news", imgs);
        socket.on("my other event", function(data) {
            console.log(data);
        });
    });
};
