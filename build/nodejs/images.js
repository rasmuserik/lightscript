// outer: null
// outer: JSON
// outer: console
// outer: Math
// outer: next
// outer: undefined
// outer: Object
// outer: location
// outer: window
// outer: Array
// outer: $
var jsonml;
// outer: require
// outer: exports
exports.webapp = require("./webapp").webapp(exports);
jsonml = require("./jsonml");
exports.webmain = function() {
    // outer: console
    // outer: Math
    // outer: next
    // outer: jsonml
    // outer: undefined
    var current;
    var nextImg;
    var imgs;
    var i;
    // outer: Object
    // outer: location
    // outer: window
    var socket;
    // outer: Array
    var buttons;
    // outer: $
    $("body").append("<div id=\"menu\" style=\"position:fixed; right: 0; width: 100pt;\"></div>");
    buttons = [
        "foto_pub",
        "foto_ok",
        "foto_bad",
        "ppl_pub",
        "ppl_ok",
        "ppl_bad",
        "delete",
        "private",
        "bug",
    ];
    buttons.forEach(function(name) {
        // outer: socket
        // outer: current
        // outer: next
        // outer: Object
        // outer: Array
        // outer: jsonml
        // outer: $
        $("#menu").append(jsonml.toXml([
            "span",
            {id : name, style : "font: 16pt sans-serif; margin: 6pt 6pt 6pt 6pt; padding: 6pt 6pt 6pt 6pt; display: inline-block; border: 1px solid #ccc; border-radius: 6pt; box-shadow: 2pt 2pt 4pt 0pt #999; width: 80pt; text-align: center;"},
            name,
        ]));
        $("#menu").append("<br>");
        $("#" + name).live("click", function() {
            // outer: socket
            // outer: name
            // outer: current
            // outer: next
            next();
            current.rating = name;
            socket.emit("rate", current);
        });
    });
    socket = window.io.connect("http://" + location.host);
    socket.emit("my other event", {my : "data"});
    socket.on("hello", function(data) {
        // outer: next
        // outer: imgs
        imgs = data;
        next();
        next();
    });
    i = - 1;
    imgs = [];
    nextImg = current = undefined;
    window.next = function() {
        // outer: next
        // outer: console
        var extension;
        // outer: i
        // outer: imgs
        var img;
        // outer: window
        // outer: Math
        var wh;
        var h;
        // outer: nextImg
        // outer: current
        var $cur;
        // outer: $
        $("#current").remove();
        $cur = $("#next");
        $cur.attr("id", "current");
        current = nextImg;
        h = $cur.height();
        wh = Math.min($(window).height(), 500);
        $cur.attr("width", $cur.width() * wh / h);
        $cur.attr("height", wh);
        $cur.css("display", "inline");
        nextImg = img = imgs[++i];
        extension = img.exts.JPG || img.exts.jpg || img.exts.png || img.exts["RAF.bz2.png"] || img.exts["RAF.bz2.png"] || img.exts["raf.bz2.png"];
        console.log(extension);
        if(img.rating || !extension || i > 10000) {
            return next();
        };
        $("body").append("<img style=\"display:none;position:fixed;top:0;left:0;\" src=\"" + img.name + "." + extension + "\" id=\"next\">");
        //$('body').append("<img src=" + imgs[++i].name +);
    };
};
exports.nodemain = function() {
    // outer: console
    // outer: Math
    // outer: Object
    // outer: null
    var writeJSON;
    var io;
    var server;
    var app;
    var express;
    // outer: JSON
    var imgs;
    // outer: require
    var fs;
    fs = require("fs");
    /*
    var files = require("fs").readdirSync("/home/rasmuserik/private/image/DCIM/");
    files = files.sort();
    var imgs = {};
    var exts = {};
    files.forEach(function(filename) {
        var name = filename.split(".")[0];
        var extension = filename.split(".").slice(1).join(".");
        var obj = imgs[name] || (imgs[name] = {name : name, exts : {}});
        obj.exts[extension] = extension;
    });
    Object.keys(imgs).forEach(function(key) {
        var extension = Object.keys(imgs[key].exts).join(",");
        exts[extension] = (exts[extension] || 0) + 1;
    });
    console.log(files.length, exts);
    //fs.writeFile('/home/rasmuserik/solsort/imagelist.json', JSON.stringify(imgs, null, "  "));
    */
    imgs = JSON.parse(fs.readFileSync("/home/rasmuserik/solsort/imagelist.json"));
    // server
    express = require("express");
    app = require("express")();
    server = require("http").createServer(app);
    io = require("socket.io").listen(server);
    server.listen(8080);
    app.get("/", function(req, res) {
        // outer: require
        require("fs").readFile("/usr/share/nginx/www/solsort/apps/images/index.html", "utf8", function(err, data) {
            // outer: res
            res.send(data);
        });
    });
    app.get("/webapp.js", function(req, res) {
        // outer: require
        require("fs").readFile("/usr/share/nginx/www/solsort/apps/images/webapp.js", "utf8", function(err, data) {
            // outer: res
            res.send(data);
        });
    });
    app.use("/", express["static"]("/home/rasmuserik/private/image/DCIM"));
    writeJSON = require("./util").throttledFn(function() {
        // outer: null
        // outer: imgs
        // outer: JSON
        // outer: fs
        fs.writeFile("/home/rasmuserik/solsort/imagelist.json", JSON.stringify(imgs, null, "  "));
    }, 5000);
    io.sockets.on("connection", function(socket) {
        // outer: writeJSON
        // outer: console
        // outer: Math
        // outer: imgs
        // outer: Object
        var imlist;
        //socket.emit("news", {hello : "world"});
        imlist = Object.keys(imgs).map(function(key) {
            // outer: imgs
            return imgs[key];
        });
        imlist = imlist.sort(function() {
            // outer: Math
            return Math.random() - .5;
        });
        socket.emit("hello", imlist);
        socket.on("rate", function(data) {
            // outer: writeJSON
            // outer: console
            // outer: imgs
            imgs[data.name] = data;
            console.log(data);
            writeJSON();
        });
        socket.on("my other event", function(data) {
            // outer: console
            console.log(data);
        });
    });
};
