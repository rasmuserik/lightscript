exports.nodemain = function() {
    // outer: Object
    // outer: require
    // outer: process
    // outer: console
    console.log(process.cwd() + "/build/mozjs");
    require("child_process").exec("cfx run", {cwd : process.cwd() + "/build/mozjs"});
};
