use = require("./module").use;
def = require("./module").def;
// Main {{{1
def("main", function(exports) {
    var util = use("util");
    util.nextTick(function() {
        var platform = util.platform;
        if(platform === "node") {
            var commandName = process.argv[2];
        };
        if(platform === "web") {
            commandName = window.location.hash.slice(1);
        };
        if(use(commandName) && use(commandName)[platform + "main"]) {
            use(commandName)[platform + "main"]();
        } else if(use(commandName) && use(commandName).main) {
            use(commandName)[platform + "main"]();
        } else if(use(platform) && use(platform).main) {
            use(platform).main();
        };
    });
});
use("main");
