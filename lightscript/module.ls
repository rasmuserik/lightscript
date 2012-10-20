exports.list = function() {
    if(`compiler.nodejs) {
        return require("fs").readdirSync(__dirname).filter(function(name) {
            return name.slice(- 3) === ".js";
        }).map(function(name) {
            return name.slice(0, - 3);
        });
    };
    if(`compiler.webjs) {
        return Object.keys(window.modules);
    };
};
