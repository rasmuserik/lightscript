
if(typeof exports !== "undefined") {
    modules = {};
    exports.use = function(name) {
        // outer: modules
        // outer: require
        require("./" + name);
        return modules[name];
    };
    def = exports.def = function(name, fn) {
        // outer: Object
        // outer: modules
        modules[name] = {};
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
});
