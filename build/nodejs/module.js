
if(typeof exports !== "undefined") {
    modules = {};
    exports.use = function(name) {
        // outer: require
        return require("./" + name);
    };
    def = exports.def = function(name, fn, exports) {
        // outer: modules
        modules[name] = exports;
        fn(modules[name]);
    };
};
def("module", function(exports) {
    // outer: modules
    // outer: Object
    // outer: __dirname
    // outer: require
    // outer: use
    exports.list = function() {
        // outer: modules
        // outer: Object
        // outer: __dirname
        // outer: require
        // outer: use
        if(use("util").platform === "node") {
            return require("fs").readdirSync(__dirname).filter(function(name) {
                return name.slice(- 3) === ".js";
            }).map(function(name) {
                return name.slice(0, - 3);
            });
        } else  {
            return Object.keys(modules);
        };
    };
}, exports);
