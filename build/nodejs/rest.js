if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
def("rest", function(exports) {
    // outer: console
    // outer: __dirname
    // outer: require
    exports.nodemain = function() {
        // outer: console
        var solsortjs;
        // outer: __dirname
        var index;
        var testFn;
        var server;
        // outer: require
        var express;
        express = require("express");
        server = express();
        testFn = function(req, res, next) {
            // outer: console
            console.log("request", req.params);
            return next();
        };
        index = require("fs").readFileSync(__dirname + "/../webjs/index.html", "utf8");
        solsortjs = require("fs").readFileSync(__dirname + "/../webjs/solsort.js", "utf8");
        server.get("/store/:owner/:store/since/:timestamp", testFn);
        server.get("/store/:owner/:store/:key", testFn);
        server.put("/store/:owner/:store/:key", testFn);
        server.put("/store/:owner/:store/:key", testFn);
        server.get("/", function(req, res, next) {
            // outer: index
            res.end(index);
        });
        server.get("/solsort.js", function(req, res, next) {
            // outer: solsortjs
            res.end(solsortjs);
        });
        console.log(express["static"]("/"));
        server.listen(8002);
    };
});
