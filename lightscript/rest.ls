def("rest", function(exports) {
    exports.nodemain = function() {
        // setup server
        var express = require("express");
        var server = express();
        // serve api-script and index from memory
        var index = require("fs").readFileSync(__dirname + "/../webjs/index.html", "utf8");
        var solsortjs = require("fs").readFileSync(__dirname + "/../webjs/solsort.js", "utf8");
        server.get("/", function(req, res, next) {
            res.end(index);
        });
        server.get("/solsort.js", function(req, res, next) {
            res.end(solsortjs);
        });
        // sample api function
        var testFn = function(req, res, next) {
            console.log("request", req.params);
            return next();
        };
        // apis
        server.get("/store/:owner/:store/since/:timestamp", testFn);
        server.get("/store/:owner/:store/:key", testFn);
        server.put("/store/:owner/:store/:key/:timestamp", testFn);
        // start the server
        server.listen(8002);
    };
});
