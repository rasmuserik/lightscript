if(typeof exports !== "undefined") {
    modules = {};
    exports.use = function(name) {
        return require("./" + name);
    };
    def = exports.def = function(name, fn, exports) {
        modules[name] = exports;
        fn(modules[name]);
    };
};
exports.list = function() {
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
