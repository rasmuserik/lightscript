if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
def("rest", function(exports) {
    // outer: console
    // outer: use
    // outer: __dirname
    // outer: require
    // outer: Object
    exports.api = {};
    exports.nodemain = function() {
        // outer: console
        // outer: exports
        var testFn;
        // outer: use
        // outer: Object
        var apis;
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
        server.get("/", function(req, res, next) {
            // outer: index
            res.end(index);
        });
        server.get("/solsort.js", function(req, res, next) {
            // outer: solsortjs
            res.end(solsortjs);
        });
        // setup apis
        apis = {"store" : use("storage").restapi};
        Object.keys(apis).forEach(function(name) {
            // outer: exports
            // outer: server
            // outer: use
            var platform;
            platform = use("util").platform;
            // setup request handle
            server.all("/" + name, function(req, res, next) {});
            // create api functions
            if(platform === "web") {
                exports.api[name] = function() {};
            } else if(platform === "node") {
                exports.api[name] = function() {};
            };
        });
        // sample api function
        testFn = function(req, res, next) {
            // outer: console
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
