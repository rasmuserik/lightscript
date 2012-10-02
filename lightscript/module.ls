exports.use = function(name) {
    return require("./" + name);
};
exports.list = function() {
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
