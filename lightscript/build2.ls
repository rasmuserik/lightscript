exports.main = function() {
    // # requirements
    var fs = require("fs");
    var async = require("async");
    var compiler = require("./compiler");
    // # constants
    var sourcepath = __dirname + "/../../lightscript/";
    var buildpath = sourcepath + "../build2/";
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
                console.log("parsed: " + name);
                callback();
            });
        }, callback);
    };
    // # main
    console.log("here");
    async.series([
        makeModulesObject,
        function(callback) {
            var platforms = [
                "lightscript",
                "nodejs",
                "webjs",
            ];
            //modules = {"experiments": modules["experiments"]};
            async.forEach(Object.keys(modules), function(name, callback) {
                async.forEach(platforms, function(platform, callback) {
                    var ast = compiler.applyMacros({
                        ast : modules[name].ast,
                        name : name,
                        platform : platform,
                    });
                    if(platform.slice(- 2) === "js") {
                        var type = "js";
                        var result = compiler.ppjs(ast);
                    } else if(platform === "lightscript") {
                        type = "ls";
                        ast = compiler.applyMacros({
                            ast : ast,
                            name : name,
                            platform : platform,
                            reverse : true,
                        });
                        result = compiler.ppls(ast);
                    } else  {
                        throw "unsupported platform:" + type;
                    };
                    console.log("generatede " + platform + "-code for " + name);
                    fs.writeFile(buildpath + platform + "/" + name + "." + type, result, callback);
                }, callback);
            }, callback);
        },
        function() {
            console.log("done");
        },
        function() {},
    ]);
};
