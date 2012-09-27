
use = require("./module").use;
def = require("./module").def;
// Main {{{1
def("main", function(exports) {
    // outer: window
    // outer: process
    // outer: use
    var util;
    util = use("util");
    util.nextTick(function() {
        // outer: use
        // outer: window
        // outer: process
        var commandName;
        // outer: util
        var platform;
        platform = util.platform;
        if(platform === "node") {
            commandName = process.argv[2];
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
