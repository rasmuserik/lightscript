define("main",function(exports, require){
// outer: undefined
// outer: arguments
// outer: this
// outer: window
// outer: process
// outer: Array
var use;
// outer: require
var util;
util = require("./util");
use = function(name) {
    // outer: require
    return require("./" + name);
};
util.nextTick(function() {
    // outer: undefined
    // outer: use
    // outer: arguments
    // outer: this
    // outer: require
    // outer: window
    var platform;
    // outer: process
    var commandName;
    // outer: Array
    var args;
    args = [];
    if(undefined) {};
    if(true) {
        commandName = window.location.hash.slice(1);
        platform = "web";
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
});