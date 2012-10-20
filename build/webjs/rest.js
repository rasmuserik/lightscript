exports.api = {};
apis = {store : require("./storage").restapi};
util = require("./util");
Object.keys(apis).forEach(function(name) {
    // outer: Object
    // outer: util
    // outer: JSON
    // outer: true
    // outer: XMLHttpRequest
    // outer: console
    // outer: exports
    // create api functions
    if(true) {
        exports.api[name] = function(args, callback) {
            // outer: Object
            // outer: util
            // outer: JSON
            // outer: true
            // outer: XMLHttpRequest
            var xhr;
            // outer: name
            // outer: console
            console.log("rest:", name, args);
            xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                // outer: JSON
                // outer: Object
                // outer: util
                // outer: callback
                // outer: xhr
                if(xhr.readyState === 4) {
                    if(xhr.status === 200) {
                        callback(util.trycatch(function() {
                            // outer: xhr
                            // outer: JSON
                            return JSON.parse(xhr.responseText);
                        }, function() {
                            // outer: xhr
                            // outer: Object
                            return {err : "cannot parse: " + xhr.responseText};
                        }));
                    } else  {
                        callback({
                            err : "HTTP-status !== 200",
                            status : xhr.status,
                            statusText : xhr.statusText,
                            content : xhr.responseText,
                        });
                    };
                };
            };
            xhr.open("POST", "/api/" + name, true);
            xhr.send(JSON.stringify(args));
        };
    } else if(undefined) {};
});
RestObject = function(req, res, next) {
    // outer: Object
    var self;
    self = {};
    self.done = function(data) {
        // outer: res
        res.header("Content-Type", "application/json");
        res.send(data);
    };
    return self;
};
exports.nodemain = function() {
    // outer: String
    // outer: RestObject
    // outer: JSON
    // outer: util
    // outer: Array
    // outer: apis
    // outer: Object
    var solsortjs;
    // outer: __dirname
    var index;
    var server;
    // outer: require
    var express;
    // setup server
    express = require("express");
    server = express();
    // serve api-script and index from memory
    index = require("fs").readFileSync(__dirname + "/../webjs/index.html", "utf8");
    solsortjs = require("fs").readFileSync(__dirname + "/../webjs/solsort.js", "utf8");
    server.get("/api/solsort.js", function(req, res, next) {
        // outer: solsortjs
        res.end(solsortjs);
    });
    // setup apis
    Object.keys(apis).forEach(function(name) {
        // outer: String
        // outer: Object
        // outer: RestObject
        // outer: JSON
        // outer: util
        // outer: Array
        // outer: server
        // outer: apis
        var fn;
        fn = apis[name];
        // setup request handle
        server.post("/api/" + name, function(req, res, next) {
            // outer: String
            // outer: Object
            // outer: RestObject
            // outer: fn
            // outer: JSON
            // outer: util
            // outer: Array
            var data;
            data = [];
            req.setEncoding("utf8");
            req.addListener("data", function(chunk) {
                // outer: req
                // outer: data
                data.push(chunk);
                req.content += chunk;
            });
            req.addListener("end", function(chunk) {
                // outer: String
                // outer: Object
                // outer: next
                // outer: res
                // outer: req
                // outer: RestObject
                // outer: fn
                // outer: JSON
                // outer: util
                // outer: data
                data = data;
                util.trycatch(function() {
                    // outer: next
                    // outer: res
                    // outer: req
                    // outer: RestObject
                    // outer: fn
                    // outer: JSON
                    // outer: data
                    data = JSON.parse(data.join(""));
                    fn(data, RestObject(req, res, next));
                }, function(e) {
                    // outer: String
                    // outer: Object
                    // outer: JSON
                    // outer: res
                    res.send(JSON.stringify({err : "Server error: " + String(e)}));
                });
            });
        });
    });
    // start the server
    server.listen(8002);
};
