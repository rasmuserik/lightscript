
modules = {};
compiler = {
    "tokeniser" : true,
    "ast" : true,
    "syntax" : true,
    "rst2ast" : true,
    "code_analysis" : true,
    "ast2js" : true,
    "ast2rst" : true,
};
exports.use = function(name) {
    // outer: require
    // outer: compiler
    // outer: modules
    if(!modules[name]) {
        if(compiler[name]) {
            require("./compiler");
        } else  {
            require("./" + name);
        };
    };
    return modules[name];
};
exports.def = function(name, fn) {
    // outer: Object
    // outer: modules
    modules[name] = {};
    fn(modules[name]);
};
