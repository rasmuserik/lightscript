if(typeof exports !== "undefined") {
    modules = {};
    compiler = {
        tokeniser : true,
        ast : true,
        syntax : true,
        rst2ast : true,
        code_analysis : true,
        ast2js : true,
        ast2rst : true,
    };
    exports.use = function(name) {
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
        modules[name] = {};
        fn(modules[name]);
    };
};
