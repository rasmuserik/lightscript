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
    var readModule = function(lsname, callback) {
            fs.readFile(sourcepath + lsname, "utf8", function(err, source) {
                if(err) {
                    console.log(err, "could not read \"" + sourcepath + lsname + "\"");
                    return undefined;
                };
                var name = lsname.slice(0, - 3);
                var module = modules[name] || ( modules[name] = {});
                module.filename = lsname;
                module.name = name;
                module.ast = compiler.parsels(source);
                module.timestamp = mTime(lsname);
                module.depends = module.depends || {};
                console.log("< " + name);
                callback();
            });
    };
    var makeModuleObjects = function(callback) {
        async.forEach(fs.readdirSync(sourcepath).filter(function(name) {
            return name.slice(- 3) === ".ls";
        }), readModule, callback);
    };
    var platforms = [
        "lightscript",
        "nodejs",
        "webjs",
    ];
    var compileFns = {
        webjs : function(module, ast, callback) {
            var result = "solsort_define(\"";
            result += module.name;
            result += "\",function(exports, require){\n";
            result += compiler.ppjs(ast);
            result += "});";
            callback(result);
        },
        nodejs : function(module, ast, callback) {
            callback(compiler.ppjs(ast));
        },
        lightscript : function(module, ast, callback) {
            ast = compiler.applyMacros({
                ast : ast,
                name : module.name,
                platform : "lightscript",
                reverse : true,
            });
            callback(compiler.ppls(ast));
        },
    };
    var updateDest = function(name, platform) {
        var dest = modules[name][platform];
        if(!dest) {
            modules[name][platform] = dest = {};
            dest.type = platform.slice(- 2) === "js" ? "js" : "ls";
            dest.filename = buildpath + platform + "/" + name + "." + dest.type;
            dest.lastModified = mTime(dest.filename);
        };
        return dest;
    };
    var findExports = function(ast) {
        acc = {};
        doIt = function(ast) {
        if(ast.isa('call:.=') && ast.children[0].isa('id:exports')) {
            acc[ast.children[1].val] = true;
        }
        ast.children.forEach(doIt);
        }
        doIt(ast);
        return Object.keys(acc);
    }
    var findRequires = function(ast) {
        acc = {};
        doIt = function(ast) {
        if(ast.isa('call:*()') && ast.children[0].isa('id:require') ) {
            if (ast.children[1].kind === "str" && ast.children[1].val.slice(0,2) === './') {
            acc[ast.children[1].val.slice(2)] = true;
            }
        }
        ast.children.forEach(doIt);
        }
        doIt(ast);
        return Object.keys(acc);
    }
    var buildFiles = function(name, callback) {
        async.forEach(platforms, function(platform, callback) {
            var ast = compiler.applyMacros({
                ast : modules[name].ast,
                name : name,
                platform : platform,
            });
            var dest = updateDest(name, platform);
            dest.exports = findExports(ast);
            dest.requires = findRequires(ast);
            dest.requires.forEach(function(reqname) {
                modules[reqname].depends[name] = true;
            });
                console.log("> " + platform + "/" + name);
            compileFns[platform](modules[name], ast, function(result) {
                dest.data = result;
                fs.writeFile(dest.filename, dest.data, callback);
            });
        }, function() {
            if(!modules[name].haveRun) {
                modules[name].haveRun = true;
                callback();
            } else {
                async.forEach(Object.keys(modules[name].depends), buildFiles, callback);
            }
        });
    };
    var compileModuleObjects = function(callback) {
        async.forEach(Object.keys(modules), buildFiles, callback);
    };
    var watch = function(callback) {
        Object.keys(modules).forEach(function(name) {
            var watchFn = function() {
                modules[name].watcher.close();
                setTimeout(function() {
                readModule(modules[name].filename, function() {
                modules[name].watcher = fs.watch(filename, watchFn);

                buildFiles(name, function() { });
                }) 
                }, 100);
             };
            filename = sourcepath + modules[name].filename;
            modules[name].watcher = fs.watch(filename, watchFn);
        });
    };
    // # main
    async.series([
        makeModuleObjects,
        compileModuleObjects,
        function(callback) {
            console.log("initial build done");
            callback();
        },
        watch,
        function() {},
    ]);
};
