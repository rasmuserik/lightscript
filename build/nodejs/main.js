if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
util = require("./util");
util.nextTick(function() {
    // outer: undefined
    // outer: use
    // outer: window
    // outer: process
    var commandName;
    // outer: Array
    var args;
    // outer: util
    var platform;
    platform = util.platform;
    args = [];
    if(platform === "node") {
        commandName = process.argv[2];
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
