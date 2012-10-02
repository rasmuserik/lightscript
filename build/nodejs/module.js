
exports.use = function(name) {
    // outer: require
    return require("./" + name);
};
exports.list = function() {
    // outer: window
    // outer: Object
    // outer: __dirname
    // outer: require
    if(require("./util").platform === "node") {
        return require("fs").readdirSync(__dirname).filter(function(name) {
            return name.slice(- 3) === ".js";
        }).map(function(name) {
            return name.slice(0, - 3);
        });
    };
    if(require("./util").platform === "web") {
        return Object.keys(window.modules);
    };
};
