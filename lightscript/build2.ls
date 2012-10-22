exports.main = function() {
    // # requirements
    var fs = require("fs");
    var async = require("async");
    var compiler = require("./compiler");
    // # constants
    var sourcepath = __dirname + "/../../lightscript/";
    var buildpath = sourcepath + "../build/";
    // # functions
    var parseFile = function(filename, done) {};
    var modules = {};
    var makeModulesObject = function(callback) {
        async.forEach(fs.readdirSync(sourcepath).filter(function(name) {
            return name.slice(- 3) === ".ls";
        }), function(lsname, callback) {
            fs.readFile(sourcepath + lsname, "utf8", function(err, source) {
                if(err) {
                    console.log("could not read \"" + lsname + "\"");
                    return undefined;
                };
                var name = lsname.slice(0, - 3);
                modules[name] = {};
                modules[name].ast = compiler.parsels(source);
                callback();
            });
        }, callback);
    };
    // # main
    console.log("here");
    async.series([
        makeModulesObject,
        function(callback) {
            modules = {experiments: modules['experiments']};
            async.forEach(Object.keys(modules), function(name, callback) {
                var js = compiler.ppjs(compiler.applyMacros({
                    ast : modules[name].ast,
                    name : name,
                    platform : "nodejs",
                    reverse : false,
                }));
                fs.writeFile(buildpath + name + ".js", js, callback);
            }, callback);
        },
        function() {
            console.log("done");
        },
        function() {},
    ]);
};
