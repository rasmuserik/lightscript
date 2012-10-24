// outer: setTimeout
// outer: false
// outer: true
// outer: console
// outer: process
// outer: undefined
// outer: Array
// outer: Object
// outer: __dirname
// outer: require
// outer: exports
exports.nodemain = function() {
    // outer: setTimeout
    // outer: false
    // outer: true
    var dest;
    // outer: console
    var watch;
    // outer: process
    var restartServer;
    var startServer;
    var killServer;
    // outer: undefined
    var server;
    var compileModuleObjects;
    var buildFiles;
    var findRequires;
    var findExports;
    var updateDest;
    var compileFns;
    var webapp;
    // outer: Array
    var platforms;
    var makeModuleObjects;
    var readModule;
    var mTime;
    // outer: Object
    var modules;
    var parseFile;
    var templatepath;
    var buildpath;
    // outer: __dirname
    var sourcepath;
    var child_process;
    var compiler;
    var async;
    var util;
    // outer: require
    var fs;
    // # requirements
    fs = require("fs");
    util = require("./util");
    async = require("async");
    compiler = require("./compiler");
    child_process = require("child_process");
    // # constants
    sourcepath = __dirname + "/../../lightscript/";
    buildpath = sourcepath + "../build/";
    templatepath = sourcepath + "../template/";
    // # functions
    parseFile = function(filename, done) {};
    modules = {};
    mTime = function(filename) {
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
    readModule = function(lsname, callback) {
        // outer: mTime
        // outer: compiler
        // outer: Object
        // outer: modules
        // outer: undefined
        // outer: console
        // outer: sourcepath
        // outer: fs
        fs.readFile(sourcepath + lsname, "utf8", function(err, source) {
            // outer: callback
            // outer: mTime
            // outer: compiler
            // outer: Object
            // outer: modules
            var module;
            var name;
            // outer: undefined
            // outer: lsname
            // outer: sourcepath
            // outer: console
            if(err) {
                console.log(err, "could not read \"" + sourcepath + lsname + "\"");
                return undefined;
            };
            name = lsname.slice(0, - 3);
            module = modules[name] || (modules[name] = {});
            module.filename = lsname;
            module.name = name;
            module.ast = compiler.parsels(source);
            module.timestamp = mTime(lsname);
            module.depends = module.depends || {};
            console.log("< " + name);
            callback();
        });
    };
    makeModuleObjects = function(callback) {
        // outer: readModule
        // outer: sourcepath
        // outer: fs
        // outer: async
        async.forEach(fs.readdirSync(sourcepath).filter(function(name) {
            return name.slice(- 3) === ".ls";
        }), readModule, callback);
    };
    platforms = [
        "lightscript",
        "nodejs",
        "webjs",
    ];
    webapp = function(opts, kind) {
        // outer: modules
        // outer: fs
        // outer: Object
        // outer: Array
        // outer: async
        // outer: templatepath
        // outer: util
        var apppath;
        // outer: console
        console.log("> " + "apps/" + opts.module.name);
        apppath = "/usr/share/nginx/www/solsort/apps/" + opts.module.name;
        util.mkdir(apppath);
        util.cp(templatepath + kind + ".html", apppath + "/index.html", function() {
            // outer: apppath
            // outer: kind
            // outer: modules
            // outer: fs
            // outer: Object
            // outer: opts
            // outer: Array
            // outer: async
            var canvasapp;
            canvasapp = "(function(){var modules={};";
            canvasapp += "var require=function(name){name=name.slice(2);";
            canvasapp += "var t=modules[name];if(typeof t===\"function\"){";
            canvasapp += "t(modules[name]={},require);return modules[name];}return t;};";
            canvasapp += "var define=function(name,fn){modules[name]=fn};";
            async.forEach([opts.module.name].concat(Object.keys(opts.dest.requires)), function(name, callback) {
                // outer: canvasapp
                // outer: modules
                // outer: fs
                fs.readFile(modules[name].webjs.filename, "utf8", function(err, data) {
                    // outer: callback
                    // outer: canvasapp
                    if(err) {
                        throw err;
                    };
                    canvasapp += data;
                    callback();
                });
            }, function() {
                // outer: apppath
                // outer: fs
                // outer: opts
                // outer: kind
                // outer: canvasapp
                canvasapp += "require(\"./" + kind + "\").run(\"" + opts.module.name + "\");";
                canvasapp += "})();";
                fs.writeFile(apppath + "/" + kind + ".js", canvasapp, opts.callback);
            });
        });
    };
    compileFns = {
        webjs : function(opts) {
            // outer: webapp
            // outer: dest
            // outer: fs
            // outer: compiler
            var result;
            result = "define(\"";
            result += opts.module.name;
            result += "\",function(exports, require){\n";
            result += compiler.ppjs(opts.ast);
            result += "});";
            fs.writeFile(dest.filename, result, function() {
                // outer: webapp
                // outer: opts
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
            // outer: restartServer
            // outer: compiler
            // outer: dest
            // outer: fs
            fs.writeFile(dest.filename, compiler.ppjs(opts.ast), function() {
                // outer: restartServer
                // outer: dest
                // outer: opts
                if(opts.module.name === "api" || dest.exports.apimain) {
                    restartServer(opts.callback);
                } else  {
                    opts.callback();
                };
            });
        },
        lightscript : function(opts) {
            // outer: dest
            // outer: fs
            // outer: true
            // outer: Object
            // outer: compiler
            var ast;
            ast = compiler.applyMacros({
                ast : opts.ast,
                name : opts.module.name,
                platform : "lightscript",
                reverse : true,
            });
            fs.writeFile(dest.filename, compiler.ppls(ast), opts.callback);
        },
    };
    updateDest = function(name, platform) {
        // outer: mTime
        // outer: util
        // outer: buildpath
        // outer: Object
        // outer: modules
        // outer: dest
        dest = modules[name][platform];
        if(!dest) {
            modules[name][platform] = dest = {};
            dest.type = platform.slice(- 2) === "js" ? "js" : "ls";
            dest.filename = buildpath + platform + "/" + name + "." + dest.type;
            util.mkdir(buildpath + platform);
            dest.lastModified = mTime(dest.filename);
        };
        return dest;
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
    buildFiles = function(name, callback) {
        // outer: buildFiles
        // outer: true
        // outer: compileFns
        // outer: console
        // outer: findRequires
        // outer: findExports
        // outer: updateDest
        // outer: modules
        // outer: Object
        // outer: compiler
        // outer: platforms
        // outer: async
        async.forEach(platforms, function(platform, callback) {
            // outer: true
            // outer: compileFns
            // outer: console
            // outer: findRequires
            // outer: findExports
            // outer: updateDest
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
            dest = updateDest(name, platform);
            dest.exports = findExports(ast);
            dest.requires = findRequires(ast);
            Object.keys(dest.requires).forEach(function(reqname) {
                // outer: true
                // outer: name
                // outer: modules
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
            // outer: buildFiles
            // outer: Object
            // outer: async
            // outer: callback
            // outer: true
            // outer: name
            // outer: modules
            if(!modules[name].haveRun) {
                modules[name].haveRun = true;
                callback();
            } else  {
                async.forEach(Object.keys(modules[name].depends), buildFiles, callback);
            };
        });
    };
    compileModuleObjects = function(callback) {
        // outer: buildFiles
        // outer: modules
        // outer: Object
        // outer: async
        async.forEach(Object.keys(modules), buildFiles, callback);
    };
    server = undefined;
    killServer = function(callback) {
        // outer: true
        // outer: setTimeout
        // outer: false
        var killed;
        // outer: undefined
        // outer: server
        if(!server) {
            callback();
            return undefined;
        };
        killed = false;
        server.on("exit", function() {
            // outer: callback
            // outer: undefined
            // outer: server
            // outer: true
            // outer: killed
            killed = true;
            server = undefined;
            callback();
        });
        server.kill();
        setTimeout(function() {
            // outer: server
            // outer: killed
            if(!killed) {
                server.kill(9);
            };
        }, 3000);
    };
    startServer = function(callback) {
        // outer: buildpath
        // outer: child_process
        // outer: server
        var js;
        // outer: modules
        // outer: Object
        // outer: Array
        var apimodules;
        apimodules = [];
        Object.keys(modules).forEach(function(name) {
            // outer: apimodules
            // outer: modules
            if(modules[name].nodejs.exports.apimain) {
                apimodules.push(name);
            };
        });
        js = "require('./api').nodemain();";
        js += apimodules.map(function(name) {
            return "require('./" + name + "').apimain();";
        }).join("");
        server = child_process.spawn("node", ["-e", js], {cwd : buildpath + "nodejs", stdio : "inherit"});
        callback();
    };
    restartServer = function(callback) {
        // outer: startServer
        // outer: killServer
        killServer(function() {
            // outer: callback
            // outer: startServer
            startServer(callback);
        });
    };
    process.on("exit", killServer);
    watch = function(callback) {
        // outer: buildFiles
        // outer: readModule
        // outer: setTimeout
        // outer: fs
        // outer: sourcepath
        // outer: modules
        // outer: Object
        Object.keys(modules).forEach(function(name) {
            // outer: buildFiles
            // outer: readModule
            // outer: setTimeout
            // outer: fs
            // outer: modules
            // outer: sourcepath
            var filename;
            var watchFn;
            watchFn = function() {
                // outer: buildFiles
                // outer: watchFn
                // outer: filename
                // outer: fs
                // outer: readModule
                // outer: setTimeout
                // outer: name
                // outer: modules
                modules[name].watcher.close();
                setTimeout(function() {
                    // outer: buildFiles
                    // outer: watchFn
                    // outer: filename
                    // outer: fs
                    // outer: name
                    // outer: modules
                    // outer: readModule
                    readModule(modules[name].filename, function() {
                        // outer: buildFiles
                        // outer: watchFn
                        // outer: filename
                        // outer: fs
                        // outer: name
                        // outer: modules
                        modules[name].watcher = fs.watch(filename, watchFn);
                        buildFiles(name, function() {});
                    });
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
            // outer: console
            console.log("initial build done");
            callback();
        },
        restartServer,
        watch,
        function() {},
    ]);
};
