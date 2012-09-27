def("storage", function(exports) {
    exports.restSet = function(rest) {
        rest.send({err : "set not implemented yet"});
    };
    exports.restSince = function(rest) {
        rest.send({err : "since not implemented yet"});
    };
    exports.restGet = function(rest) {
        rest.send({err : "get not implemented yet"});
    };
});
