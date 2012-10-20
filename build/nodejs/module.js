exports.list = function() {
    // outer: window
    // outer: Object
    // outer: __dirname
    // outer: require
    if(true) {
        return require("fs").readdirSync(__dirname).filter(function(name) {
            return name.slice(- 3) === ".js";
        }).map(function(name) {
            return name.slice(0, - 3);
        });
    };
    if(undefined) {};
};
