exports.main = function() {
    // # requirements
    var fs = require("fs");
    var util = require("./util");
    var async = require("async");
    var compiler = require("./compiler");
    // # constants
    var sourcepath = __dirname + "/../../lightscript/";
    var buildpath = sourcepath + "../build2/";
    // # functions
    var parseFile = function(filename, done) {};
    var modules = {};
    var mTime = function(filename) {
                        return util.trycatch(function() {
                            return fs.statSync(filename).mtime.getTime();
                        }, function() {
                            return 0;
                        });
    };
    var makeModuleObjects = function(callback) {
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
                modules[name].filename = lsname;
                modules[name].name = name;
                modules[name].ast = compiler.parsels(source);
                modules[name].timestamp = mTime(lsname);
                console.log("parsed: " + name);
                callback();
            });
        }, callback);
    };
    var platforms = [ "lightscript", "nodejs", "webjs", ];
    var compileFns = {
        webjs: function(module, ast, callback) {
            result = "solsort_define(\"";
            result += module.name;
            result += "\",function(exports, require){\n" ;
            result += compiler.ppjs(ast);
            result +=    "});";
            callback(result);
        },
        nodejs: function(module, ast, callback) {
            callback(compiler.ppjs(ast));
        },
        lightscript: function(module, ast, callback) {
                        ast = compiler.applyMacros({
                            ast : ast,
                            name : module.name,
                            platform : 'lightscript',
                            reverse : true,
                        });
                        callback(compiler.ppls(ast));
        },
    }
    var compileModuleObjects = function(callback) {
            async.forEach(Object.keys(modules), function(name, callback) {
                async.forEach(platforms, function(platform, callback) {
                    var ast = compiler.applyMacros({
                        ast : modules[name].ast,
                        name : name,
                        platform : platform,
                    });
                    if(platform.slice(- 2) === "js") {
                        var type = "js";
                    } else if(platform === "lightscript") {
                        type = "ls";
                    }
                    dest = modules[name][platform];
                    if(!dest) {
                        modules[name][platform] = dest = { };
                        dest.type = (platform.slice(- 2) === "js" ? "js" : "ls");
                        dest.filename = buildpath + platform + "/" + name + "." + type;
                        dest.lastModified = mTime(dest.filename);
                    }
                    compileFns[platform](modules[name], ast, function(result) {
                    dest.data = result;
                    console.log("generated " + platform + "-code for " + name);
                    fs.writeFile(dest.filename, dest.data, callback);
                    });
                }, callback);
            }, callback);
    };
    // # main
    async.series([
        makeModuleObjects,
        compileModuleObjects,
        function() {
            console.log("done");
        },
        function() {},
    ]);
};
