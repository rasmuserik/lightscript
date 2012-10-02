if(typeof exports !== "undefined") {
    modules = {};
    exports.use = function(name) {
        require("./" + name);
        return modules[name];
    };
    def = exports.def = function(name, fn) {
        modules[name] = {};
        fn(modules[name]);
    };
};
def("module", function(exports) {
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
});
