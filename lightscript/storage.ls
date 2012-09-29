def("storage", function(exports) {
    var util = use('util');
    exports.restapi = function(args, rest) {
        rest.done({restapi: args});
    }
});
