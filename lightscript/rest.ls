def("rest", function(exports) {
    exports.nodemain = function() {
        var express = require("express");
        var server = express();
        var testFn = function(req, res, next) {
            console.log("request", req.params);
            return next();
        };
        var index = require("fs").readFileSync(__dirname + "/../webjs/index.html", "utf8");
        var solsortjs = require("fs").readFileSync(__dirname + "/../webjs/solsort.js", "utf8");
        server.get("/store/:owner/:store/since/:timestamp", testFn);
        server.get("/store/:owner/:store/:key", testFn);
        server.put("/store/:owner/:store/:key", testFn);
        server.put("/store/:owner/:store/:key", testFn);
        server.get("/", function(req, res, next) {
            res.end(index);
        });
        server.get("/solsort.js", function(req, res, next) {
            res.end(solsortjs);
        });
        console.log(express["static"]("/"));
        server.listen(8002);
    };
});
