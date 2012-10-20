util = require("./util");
use = function(name) {
    // outer: require
    return require("./" + name);
};
util.nextTick(function() {
    // outer: undefined
    // outer: use
    // outer: window
    var platform;
    // outer: process
    var commandName;
    // outer: Array
    var args;
    args = [];
    if(true) {
        commandName = process.argv[2];
        args = process.argv.slice(3);
        platform = "node";
    };
    if(undefined) {};
    if(use(commandName) && use(commandName)[platform + "main"]) {
        use(commandName)[platform + "main"].apply(undefined, args);
    } else if(use(commandName) && use(commandName).main) {
        use(commandName)["main"].apply(undefined, args);
    } else if(use(platform) && use(platform).main) {
        use(platform).main.apply(undefined, args);
    };
});
