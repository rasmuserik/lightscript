
def("rest", function(exports) {
    exports.nodemain = function() {
        var server = require("express")();
        var testFn = function(req, res, next) {
            console.log("request", req.params);
        };
        server.get("/store/:owner/:store/since/:timestamp", testFn);
        server.get("/store/:owner/:store/:key", testFn);
        server.put("/store/:owner/:store/:key", testFn);
        server.listen(8002);
    };
});
