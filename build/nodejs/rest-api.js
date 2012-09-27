
use = require("./module").use;
def = require("./module").def;
// rest-api {{{1
def("restapi", function(exports) {
    // outer: Object
    // outer: console
    // outer: use
    var platform;
    platform = use("util").platform;
    exports.nodemain = function() {
        // outer: console
        console.log("hello world");
        // setup server
    };
    if(platform === "node") {
        exports.call = function(module, name, param, callback) {
            // outer: Object
            // outer: use
            // call function directly a la
            if(use(module) && use(module).restable && use(module).restable[name] && typeof use(module)[name] === "function") {
                use(module)[name](param, callback);
            } else  {
                callback({"error" : "no such call"});
            };
        };
    } else if(platform === "web") {
        exports.call = function(module, param, callback) {
            // send jsonp-request to api.solsort.com
        };
    };
});
