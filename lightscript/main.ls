util = require("./util");
use = function(name) {
    return require("./" + name);
};
util.nextTick(function() {
    var args = [];
    if(`compiler.nodejs) {
        var commandName = process.argv[2];
        args = process.argv.slice(3);
        var platform = "node";
    };
    if(`compiler.webjs) {
        commandName = window.location.hash.slice(1);
        platform = "web";
    };
    if(`compiler.mozjs) {
        commandName = "addon";
        return require("./addon").main.apply(this, Array.prototype.slice.call(arguments, 0));
    };
    if(use(commandName) && use(commandName)[platform + "main"]) {
        use(commandName)[platform + "main"].apply(undefined, args);
    } else if(use(commandName) && use(commandName).main) {
        use(commandName)["main"].apply(undefined, args);
    } else if(use(platform) && use(platform).main) {
        use(platform).main.apply(undefined, args);
    };
});
