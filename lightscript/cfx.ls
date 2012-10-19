exports.nodemain = function() {
    console.log(process.cwd() + "/build/mozjs");
    require("child_process").exec("cfx run", {cwd : process.cwd() + "/build/mozjs"});
};
