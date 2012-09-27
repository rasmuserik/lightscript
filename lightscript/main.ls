
use = require("./module").use;
def = require("./module").def;
// Main {{{1
def("main", function(exports) {
    var util = use("util");
    util.nextTick(function() {
        var platform = util.platform;
        var args = [];
        if(platform === "node") {
            var commandName = process.argv[2];
            args = process.argv.slice(3);
        };
        if(platform === "web") {
            commandName = window.location.hash.slice(1);
        };
        if(use(commandName) && use(commandName)[platform + "main"]) {
            use(commandName)[platform + "main"].apply(undefined, args);
        } else if(use(commandName) && use(commandName).main) {
            use(commandName)["main"].apply(undefined, args);
        } else if(use(platform) && use(platform).main) {
            use(platform).main.apply(undefined, args);
        };
    });
});
use("main");
