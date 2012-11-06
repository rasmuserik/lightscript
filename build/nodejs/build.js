// outer: true
// outer: recurseRequires
// outer: name
// outer: modules
// outer: platforms
// outer: console
// outer: JSON
// outer: exports
var findRequires;
var findExports;
var buildfile;
var updatefile;
var updatefiles;
var mtime;
// outer: Object
var sourcefiles;
// outer: Array
var nodepath;
var cachepath;
var buildpath;
// outer: __dirname
var sourcepath;
var compiler;
var util;
var async;
// outer: require
var fs;
// Thoughts on build system
//  - dependency graph
// 
//  - ls-source
//      - metadata (require-dependencies, nodemain, etc)
//      - generated souce code
//
//  ------------------
//
// 
// # Definitions, paths etc {{{1
//
// ## modules
//
fs = require("fs");
async = require("async");
util = require("./util");
compiler = require("./compiler");
//
// ## paths
//
sourcepath = __dirname + "/../../lightscript/";
buildpath = sourcepath + "../build/";
cachepath = buildpath + "cache/";
nodepath = buildpath + "node/";
// ### Make sure paths exists
[
    buildpath,
    cachepath,
    nodepath,
].forEach(util.mkdir);
//
// ## global variables
//
sourcefiles = {};
//
// # Utility functions
//
mtime = function(filename) {
    // outer: fs
    // outer: util
    return util.trycatch(function() {
        // outer: filename
        // outer: fs
        return fs.statSync(filename).mtime.getTime();
    }, function() {
        return 0;
    });
};
//
// # Find/update list of filenames {{{1
//
updatefiles = function(callback) {
    // outer: updatefile
    // outer: sourcepath
    // outer: fs
    // outer: async
    async.forEach(fs.readdirSync(sourcepath).filter(function(name) {
        return name.slice(- 3) === ".ls";
    }), updatefile, callback);
};
updatefile = function(filename, callback) {
    // outer: buildfile
    // outer: platforms
    // outer: compiler
    var source;
    // outer: console
    // outer: fs
    // outer: JSON
    // outer: cachepath
    var cachefile;
    // outer: mtime
    var timestamp;
    // outer: sourcepath
    // outer: Object
    var obj;
    // outer: sourcefiles
    var name;
    name = filename.slice(0, - 3);
    sourcefiles = obj = sourcefiles[name] || {};
    obj.name = name;
    obj.filename = sourcepath + filename;
    timestamp = mtime(obj.filename);
    // read compilercache if possible
    cachefile = cachepath + name;
    if(timestamp <= mtime(cachefile)) {
        sourcefiles[name] = JSON.parse(fs.readFileSync(cachefile, "utf8"));
        console.log("cached " + name);
        return callback();
    };
    // actually generate compiled file/data
    if(!obj.timestamp || obj.timestamp < timestamp) {
        source = fs.readFileSync(obj.filename, "utf8");
        obj.ast = compiler.parsels(source);
        obj.timestamp = timestamp;
        platforms.forEach(function(platform) {
            // outer: obj
            // outer: buildfile
            buildfile(obj, platform);
        });
        fs.writeFile(cachefile, JSON.stringify(obj));
        console.log("compiling " + name);
    };
    callback();
};
buildfile = function(obj, platform) {
    // outer: findRequires
    // outer: recurseRequires
    // outer: findExports
    var dest;
    // outer: name
    // outer: modules
    // outer: Object
    // outer: compiler
    var ast;
    ast = compiler.applyMacros({
        ast : modules[name].ast,
        name : name,
        platform : platform,
    });
    obj[platform] = dest = {};
    dest.exports = findExports(ast);
    dest.requires = recurseRequires(findRequires(ast), platform);
};
findExports = function(ast) {
    // outer: true
    var doIt;
    // outer: Object
    var acc;
    acc = {};
    doIt = function(ast) {
        // outer: doIt
        // outer: true
        // outer: acc
        if(ast.isa("call:.=") && ast.children[0].isa("id:exports")) {
            acc[ast.children[1].val] = true;
        };
        ast.children.forEach(doIt);
    };
    doIt(ast);
    return acc;
};
findRequires = function(ast) {
    // outer: true
    var doIt;
    // outer: Object
    var acc;
    acc = {};
    doIt = function(ast) {
        // outer: doIt
        // outer: true
        // outer: acc
        if(ast.isa("call:*()") && ast.children[0].isa("id:require")) {
            if(ast.children[1].kind === "str" && ast.children[1].val.slice(0, 2) === "./") {
                acc[ast.children[1].val.slice(2)] = true;
            };
        };
        ast.children.forEach(doIt);
    };
    doIt(ast);
    return acc;
};
//
// # Main {{{1
exports.nodemain = function(arg) {
    // outer: sourcefiles
    // outer: console
    // outer: updatefiles
    updatefiles(function() {
        // outer: sourcefiles
        // outer: console
        console.log(sourcefiles["build"]);
    });
};
//
// # Old code {{{1
/*
// build {{{2 
exports.nodemain = function(arg) {
    var fs = require("fs");
    var sourcepath = __dirname + "/../../lightscript/";
    var buildpath = sourcepath + "../build/";
    var compiled = {};
    var sourcefiles = fs.readdirSync(sourcepath).filter(function(name) {
        return name.slice(- 3) === ".ls";
    });
    var optionalCompile = function(src, dst, fn, done) {
        fs.stat(src, function(err, srcStat) {
            if(err) {
                return ;
            };
            fs.stat(dst, function(err, dstStat) {
                if(err || dstStat.mtime.getTime() <= srcStat.mtime.getTime()) {
                    fn(src, dst, done);
                } else  {
                    done();
                };
            });
        });
    };
    var compileToJS = function(fn) {
        return function(ls, js, done) {
            var shortname = ls.split("/").slice(- 1)[0];
            console.log("compiling:", shortname);
            compiled[shortname] = true;
            fs.readFile(ls, "utf8", function(err, src) {
                src = fn(src);
                fs.writeFile(js, src, function() {
                    done();
                });
            });
        };
    };
    if(arg === "pretty") {
        sourcefiles.forEach(function(filename) {
            console.log("prettyprinting:", filename);
            var src = fs.readFileSync(sourcepath + filename, "utf8");
            src = require("./compiler").ls2ls(src);
            fs.writeFileSync(sourcepath + filename, src);
        });
    };
    var createSolsortJS = function() {
        var result = "solsort_modules={};";
        result += "solsort_require = function(name){";
        result += "  name = name.slice(2);";
        result += "  var t = solsort_modules[name];";
        result += "  if(typeof t === \"function\") {";
        result += "     t(solsort_modules[name]={},solsort_require);";
        result += "     return solsort_modules[name]}";
        result += "  return t;};";
        result += "solsort_define = function(name,fn){solsort_modules[name]=fn};";
        require("./module").list().forEach(function(name) {
            result += fs.readFileSync(buildpath + "webjs/" + name + ".js");
        });
        result += "solsort_require(\"./main\");";
        fs.writeFile(buildpath + "webjs/solsort.js", result);
        fs.writeFile(buildpath + "mozjs/data/solsort.js", result + "solsort_require(\"./addon\").main();");
    };
    var webjs = function(name) {
        //return require("./compiler").ls2webjs;
        return function(ls) {
            var result = "solsort_define(\"" + name + "\",function(exports, require){";
            result += require("./compiler").ls2webjs(ls);
            result += "});";
            return result;
        };
    };
    require("async").forEach(sourcefiles, function(filename, done) {
        done;
        var nodefile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
        optionalCompile(sourcepath + filename, nodefile, compileToJS(require("./compiler").ls2nodejs), function() {
            var mozfile = buildpath + "mozjs/lib/" + filename.replace(".ls", ".js");
            optionalCompile(sourcepath + filename, mozfile, compileToJS(require("./compiler").ls2mozjs), function() {
                var webfile = buildpath + "webjs/" + filename.replace(".ls", ".js");
                optionalCompile(sourcepath + filename, webfile, compileToJS(webjs(filename.replace(".ls", ""))), done);
            });
        });
    }, function() {
        if(false && compiled["compiler.ls"] || compiled["build.ls"] || arg === "web") {
            require("async").forEach(sourcefiles, function(filename, done) {
                done;
                var nodefile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
                optionalCompile(sourcepath + filename, nodefile, compileToJS(require("./compiler").ls2nodejs), function() {
                    var mozfile = buildpath + "mozjs/lib/" + filename.replace(".ls", ".js");
                    optionalCompile(sourcepath + filename, mozfile, compileToJS(require("./compiler").ls2mozjs), function() {
                        var webfile = buildpath + "webjs/" + filename.replace(".ls", ".js");
                        optionalCompile(sourcepath + filename, webfile, compileToJS(webjs(filename.replace(".ls", ""))), done);
                    });
                });
            }, createSolsortJS);
        } else  {
            createSolsortJS();
        };
    });
};
// build2 {{{2
exports.nodemain = function() {
    // # requirements
    var fs = require("fs");
    var util = require("./util");
    var async = require("async");
    var compiler = require("./compiler");
    var child_process = require("child_process");
    // # constants
    var sourcepath = __dirname + "/../../lightscript/";
    var buildpath = sourcepath + "../build/";
    var templatepath = sourcepath + "../template/";
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
            var module = modules[name] || (modules[name] = {});
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
    var webapp = function(opts, kind) {
        console.log("> " + "apps/" + opts.module.name);
        var apppath = "/usr/share/nginx/www/solsort/apps/" + opts.module.name;
        util.mkdir(apppath);
        opts.dest.requires = recurseRequires(opts.dest.requires, 'webjs');
        util.cp(templatepath + kind + ".html", apppath + "/index.html", function() {
            var canvasapp = "(function(){var modules={};";
            canvasapp += "var require=function(name){name=name.slice(2);";
            canvasapp += "var t=modules[name];if(typeof t===\"function\"){";
            canvasapp += "t(modules[name]={},require);return modules[name];}return t;};";
            canvasapp += "var define=function(name,fn){modules[name]=fn};";
            async.forEach([opts.module.name].concat(Object.keys(opts.dest.requires)), function(name, callback) {
                fs.readFile(modules[name].webjs.filename, "utf8", function(err, data) {
                    if(err) {
                        throw err;
                    };
                    canvasapp += data;
                    callback();
                });
            }, function() {
                canvasapp += "require(\"./" + kind + "\").run(\"" + opts.module.name + "\");";
                canvasapp += "})();";
                fs.writeFile(apppath + "/" + kind + ".js", canvasapp, opts.callback);
            });
        });
    };
    var compileFns = {
        webjs : function(opts) {
            var result = "define(\"";
            result += opts.module.name;
            result += "\",function(exports, require){\n";
            result += compiler.ppjs(opts.ast);
            result += "});";
            fs.writeFile(dest.filename, result, function() {
                if(opts.dest.requires.canvasapp) {
                    webapp(opts, "canvasapp");
                } else if(opts.dest.requires.webapp) {
                    webapp(opts, "webapp");
                } else  {
                    opts.callback();
                };
            });
        },
        nodejs : function(opts) {
            fs.writeFile(dest.filename, compiler.ppjs(opts.ast), function() {
                if(opts.module.name === "api" || dest.exports.apimain) {
                    restartServer(opts.callback);
                } else  {
                    opts.callback();
                };
            });
        },
        lightscript : function(opts) {
            var ast = compiler.applyMacros({
                ast : opts.ast,
                name : opts.module.name,
                platform : "lightscript",
                reverse : true,
            });
            fs.writeFile(dest.filename, compiler.ppls(ast), opts.callback);
        },
    };
    var updateDest = function(name, platform) {
        var dest = modules[name][platform];
        if(!dest) {
            modules[name][platform] = dest = {};
            dest.type = platform.slice(- 2) === "js" ? "js" : "ls";
            dest.filename = buildpath + platform + "/" + name + "." + dest.type;
            util.mkdir(buildpath + platform);
            dest.lastModified = mTime(dest.filename);
        };
        return dest;
    };
    var findExports = function(ast) {
        var acc = {};
        var doIt = function(ast) {
            if(ast.isa("call:.=") && ast.children[0].isa("id:exports")) {
                acc[ast.children[1].val] = true;
            };
            ast.children.forEach(doIt);
        };
        doIt(ast);
        return acc;
    };
    var findRequires = function(ast) {
        var acc = {};
        var doIt = function(ast) {
            if(ast.isa("call:*()") && ast.children[0].isa("id:require")) {
                if(ast.children[1].kind === "str" && ast.children[1].val.slice(0, 2) === "./") {
                    acc[ast.children[1].val.slice(2)] = true;
                };
            };
            ast.children.forEach(doIt);
        };
        doIt(ast);
        return acc;
    };
    recurseRequires = function(reqs, platform) {
        count = 0;
        while(count !== Object.keys(reqs).length) {
            count = Object.keys(reqs).length;
            Object.keys(reqs).forEach(function(name) {
                if(modules[name] && modules[name][platform] && modules[name][platform].requires) {
                    Object.keys(modules[name][platform].requires).forEach(function(dep) {
                        reqs[dep] = true;
                    });
                }
            });
        };
        return reqs;
    };
    var buildFiles = function(name, callback) {
        async.forEach(platforms, function(platform, callback) {
            var ast = compiler.applyMacros({
                ast : modules[name].ast,
                name : name,
                platform : platform,
            });
            var dest = updateDest(name, platform);
            dest.exports = findExports(ast);
            dest.requires = recurseRequires(findRequires(ast), platform);
            Object.keys(dest.requires).forEach(function(reqname) {
                modules[reqname].depends[name] = true;
            });
            console.log("> " + platform + "/" + name);
            compileFns[platform]({
                module : modules[name],
                ast : ast,
                dest : dest,
                callback : callback,
            });
        }, function() {
            if(!modules[name].haveRun) {
                modules[name].haveRun = true;
                callback();
            } else  {
                async.forEach(Object.keys(modules[name].depends), buildFiles, callback);
            };
        });
    };
    var compileModuleObjects = function(callback) {
        async.forEach(Object.keys(modules), buildFiles, callback);
    };
    var server = undefined;
    var killServer = function(callback) {
        if(!server) {
            callback();
            return undefined;
        };
        var killed = false;
        server.on("exit", function() {
            killed = true;
            server = undefined;
            callback();
        });
        server.kill();
        setTimeout(function() {
            if(!killed) {
                server.kill(9);
            };
        }, 3000);
    };
    var startServer = function(callback) {
        var apimodules = [];
        Object.keys(modules).forEach(function(name) {
            if(modules[name].nodejs.exports.apimain) {
                apimodules.push(name);
            };
        });
        var js = "require('./api').nodemain();";
        js += apimodules.map(function(name) {
            return "require('./" + name + "').apimain();";
        }).join("");
        server = child_process.spawn("node", ["-e", js], {cwd : buildpath + "nodejs", stdio : "inherit"});
        callback();
    };
    var restartServer = function(callback) {
        killServer(function() {
            startServer(callback);
        });
    };
    process.on("exit", killServer);
    var watch = function(callback) {
        Object.keys(modules).forEach(function(name) {
            var watchFn = function() {
                modules[name].watcher.close();
                setTimeout(function() {
                    readModule(modules[name].filename, function() {
                        modules[name].watcher = fs.watch(filename, watchFn);
                        buildFiles(name, function() {});
                    });
                }, 100);
            };
            var filename = sourcepath + modules[name].filename;
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
        restartServer,
        watch,
        function() {},
    ]);
};
*/
