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
