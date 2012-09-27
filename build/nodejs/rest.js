use=require("./module").use;def=require("./module").def;
def("rest", function(exports) {
    // outer: console
    // outer: require
    exports.nodemain = function() {
        // outer: console
        var testFn;
        // outer: require
        var server;
        server = require("express")();
        testFn = function(req, res, next) {
            // outer: console
            console.log("request", req.params);
        };
        server.get("/store/:owner/:store/since/:timestamp", testFn);
        server.get("/store/:owner/:store/:key", testFn);
        server.put("/store/:owner/:store/:key", testFn);
        server.listen(8002);
    };
});
