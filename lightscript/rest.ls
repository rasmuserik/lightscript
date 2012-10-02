def("rest", function(exports) {
    exports.api = {};
    var apis = {store : use("storage").restapi};
    var util = use("util");
    Object.keys(apis).forEach(function(name) {
        // create api functions
        if(util.platform === "web") {
            exports.api[name] = function(args, callback) {
                console.log("rest:", name, args);
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if(xhr.readyState === 4) {
                        if(xhr.status === 200) {
                            callback(util.trycatch(function() {
                                return JSON.parse(xhr.responseText);
                            }, function() {
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
        } else if(util.platform === "node") {
            exports.api[name] = function(args, callback) {
                throw "not implemented yet";
            };
        };
    });
    var RestObject = function(req, res, next) {
        var self = {};
        self.done = function(data) {
            res.header("Content-Type", "application/json");
            res.send(data);
        };
        return self;
    };
    exports.nodemain = function() {
        // setup server
        var express = require("express");
        var server = express();
        // serve api-script and index from memory
        var index = require("fs").readFileSync(__dirname + "/../webjs/index.html", "utf8");
        var solsortjs = require("fs").readFileSync(__dirname + "/../webjs/solsort.js", "utf8");
        server.get("/api/solsort.js", function(req, res, next) {
            res.end(solsortjs);
        });
        // setup apis
        Object.keys(apis).forEach(function(name) {
            var fn = apis[name];
            // setup request handle
            server.post("/api/" + name, function(req, res, next) {
                var data = [];
                req.setEncoding("utf8");
                req.addListener("data", function(chunk) {
                    data.push(chunk);
                    req.content += chunk;
                });
                req.addListener("end", function(chunk) {
                    data = data;
                    util.trycatch(function() {
                        data = JSON.parse(data.join(""));
                        fn(data, RestObject(req, res, next));
                    }, function(e) {
                        res.send(JSON.stringify({err : "Server error: " + String(e)}));
                    });
                });
            });
        });
        // start the server
        server.listen(8002);
    };
}, exports);
