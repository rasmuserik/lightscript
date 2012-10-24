require("./webapp");
var jsonml = require("./jsonml");
exports.webmain = function() {
    $("body").append("<div id=\"menu\" style=\"position:fixed; right: 0; width: 100pt;\"></div>");
    var buttons = [
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
        $("#menu").append(jsonml.toXml([
            "span",
            {id : name, style : "font: 16pt sans-serif; margin: 6pt 6pt 6pt 6pt; padding: 6pt 6pt 6pt 6pt; display: inline-block; border: 1px solid #ccc; border-radius: 6pt; box-shadow: 2pt 2pt 4pt 0pt #999; width: 80pt; text-align: center;"},
            name,
        ]));
        $("#menu").append("<br>");
        $("#" + name).live("click", function() {
            next();
            current.rating = name;
            socket.emit("rate", current);
        });
    });
    var socket = window.io.connect("http://" + location.host);
    socket.emit("my other event", {my : "data"});
    socket.on("hello", function(data) {
        imgs = data;
        next();
        next();
    });
    var i = - 1;
    var imgs = [];
    var nextImg = var current = undefined;
    window.next = function() {
        $("#current").remove();
        var $cur = $("#next");
        $cur.attr("id", "current");
        current = nextImg;
        var h = $cur.height();
        var wh = Math.min($(window).height(), 500);
        $cur.attr("width", $cur.width() * wh / h);
        $cur.attr("height", wh);
        $cur.css("display", "inline");
        nextImg = var img = imgs[++i];
        var extension = img.exts.JPG || img.exts.jpg || img.exts.png || img.exts["RAF.bz2.png"] || img.exts["RAF.bz2.png"] || img.exts["raf.bz2.png"];
        console.log(extension);
        if(img.rating || !extension || i > 10000) {
            return next();
        };
        $("body").append("<img style=\"display:none;position:fixed;top:0;left:0;\" src=\"" + img.name + "." + extension + "\" id=\"next\">");
        //$('body').append("<img src=" + imgs[++i].name +);
    };
};
exports.nodemain = function() {
    var fs = require("fs");
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
    var imgs = JSON.parse(fs.readFileSync("/home/rasmuserik/solsort/imagelist.json"));
    // server
    var express = require("express");
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
    app.use("/", express["static"]("/home/rasmuserik/private/image/DCIM"));
    var writeJSON = require("./util").throttledFn(function() {
        fs.writeFile("/home/rasmuserik/solsort/imagelist.json", JSON.stringify(imgs, null, "  "));
    }, 5000);
    io.sockets.on("connection", function(socket) {
        //socket.emit("news", {hello : "world"});
        var imlist = Object.keys(imgs).map(function(key) {
            return imgs[key];
        });
        imlist = imlist.sort(function() {
            return Math.random() - .5;
        });
        socket.emit("hello", imlist);
        socket.on("rate", function(data) {
            imgs[data.name] = data;
            console.log(data);
            writeJSON();
        });
        socket.on("my other event", function(data) {
            console.log(data);
        });
    });
};
