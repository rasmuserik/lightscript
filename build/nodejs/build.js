// outer: console
// outer: exports
exports.nodemain = function() {
    // outer: console
    console.log("here");
};
/*
// Initialisation {{{1
//
var graph = undefined;
// Modules {{{2
//
var fs = require("fs");
var async = require("async");
var util = require("./util");
var compiler = require("./compiler");
var set = require("./set");
//
// Paths {{{2
//
var path = {};
var extension = {};
// Initialisation function {{{2
var init = function() {
    path.source = __dirname + "/../../lightscript/";
    path.build = path.source + "../build/";
    path.nodejs = path.build + "node/";
    path.node = path.build + "node/";
    path.pretty = path.build + "lightscript/";
    path.js = path.build + "js/";
    // Extensions {{{3
    extension.source = ".ls";
    extension.nodejs = ".js";
    extension.node= ".js";
    extension.js = ".js";
    extension.pretty = ".ls";
    // Make sure paths exists
    Object.keys(path).forEach(function(name) {
        util.mkdir(path[name]);
    });
    // Dependency graph {{{3
    // Load from cache {{{4
    graph = util.loadJSONSync(path.build + "build.graph", {});
    // find list of sourcefiles {{{4
    var sourcefiles = fs.readdirSync(path.source).filter(function(name) {
        return name.slice(- 3) === ".ls";
    }).map(function(name) {
        return "source:" + name.slice(0, - 3);
    });
    // add missing objects from sourcefiles {{{4
    sourcefiles.forEach(function(id) {
        if(!graph[id]) {
            console.log("generate build-graph object for", id);
            var ast = parseSource(id);
            var exports = findExports(ast);
            graph[id] = var node = {children: {}, exports : exports};
        };
    });
    // remove deleted sourcefiles
    sourcefiles = set.fromArray(sourcefiles);
    Object.keys(graph).filter(function(name) {
        return util.strStartsWith(name, "source:");
    }).forEach(function(name) {
        if(!sourcefiles[name]) {
            util.delprop(graph, name);
        };
    });
};
// Utility functions {{{1
// update timestamps {{{2
var timestamps = function() {
    var ts = {};
    Object.keys(graph).forEach(function(name) {
        var fname = getfilename(name);
        ts[fname] = ts[fname] || util.mtime(fname);
        graph[name].timestamp = ts[fname];
    });
};
// write graph to cache {{{2
var cacheGraph = function() {
    util.saveJSON(path.build + "build.graph", graph);
};
// getkind {{{2
var getkind = function(id) {
    return id.split(":")[0];
};
// getname {{{2
var getname = function(id) {
    return id.split(":")[1];
};
// getfilename {{{2
var getfilename = function(id) {
    var kind = getkind(id);
    var name = getname(id);
    return path[kind] + name + extension[kind];
};
// parsesource {{{2
var parseSource = function(id) {
    // TODO: cache this for previous value (NB: add util.cacheFn(fn, cachesize))
    var source = fs.readFileSync(getfilename(id), "utf8");
    return compiler.parsels(source);
};
// find exports in ast {{{2
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
// find requires in ast {{{2
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
// Update dependencies {{{1
ensureChild = function(node, child) {
    if(node.children[child]) {
        return undefined;
    }
    if(!graph[child]) {
        graph[child] = {
            children: {},
            timestamp: 0
        }
    }
    node.children[child] = true;
};
update = function() {
    util.objForEach(graph, function(id, node) {
        kind = getkind(id);
        name = getname(id);
        if(kind === 'source') {
            if(node.exports.nodemain) {
                ensureChild(node, 'nodejs:' + name);
            }
        }
    });
};
optionalCompile = function(id) {
    needsUpdate = false;
    timestamp = graph[id].timestamp;
    util.objForEach(graph[id].children, function(child) {
        if(timestamp > graph[child].timestamp) {
    (compilerTable[getkind(id)] || function(id) {
        throw "cannot compile " + id;
    })(id);
        }
    });
};
compilerTable = {};
compilerTable.source = function(id) {
    console.log("TODO: compile", id, platforms);
    node = graph[id];
    name = getname(id);
    platforms = Object.keys(node.children).map(getkind);
    plainast = parseSource(id);
    platforms.forEach(function(platform) {
            var ast = compiler.applyMacros({
                ast : plainast,
                name : name,
                platform : platform,
            });
            if(platform === "nodejs") {
                fs.writeFileSync(path.nodejs + name + ".js", compiler.ppjs(ast));
            } 
        });
}

// Main {{{1
exports.nodemain = function() {
    init();
    timestamps();
    update();
    require('./graph').traverseDAG(graph).forEach(optionalCompile);
    cacheGraph();
//    console.log("graph:", graph);
};
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX{{{1
/*
// Thoughts on build system
//  - dependency graph
//  - id: "kind:name" -> id list
//  - update function based on kind 
//  - rebuild-function based on kind
//  
var fs = require("fs");
var async = require("async");
var util = require("./util");
var compiler = require("./compiler");
//
// Definitions, paths etc {{{1
//
// Modules {{{2
//
fs = require("fs");
async = require("async");
util = require("./util");
compiler = require("./compiler");
//
// paths and extensions{{{2
// Extensions {{{3
var extension = {
    source : ".ls",
    nodejs : ".js",
    js : ".js",
    pretty : ".ls",
};
// Paths {{{3
//
var path = {};
path.source = __dirname + "/../../lightscript/";
path.build = path.source + "../build/";
path.nodejs = path.build + "node/";
path.pretty = path.build + "lightscript/";
path.js = path.build + "js/";
// Make sure paths exists
Object.keys(path).forEach(function(name) {
    util.mkdir(path[name]);
});
// Get info from id {{{1
//
// getkind {{{2
var getkind = function(id) {
    return id.split(":")[0];
};
// getname {{{2
var getname = function(id) {
    return id.split(":")[1];
};
// getfilename {{{2
var getfilename = function(id) {
    var kind = getkind(id);
    var name = getname(id);
    return path[kind] + name + extension[kind];
};
// mtime {{{2
var mtime = function(id) {
    return util.mtime(getfilename(id));
};
// Dependency graph {{{1
// 
var deps = util.trycatch(function() {
    return JSON.parse(fs.readFileSync(path.build + "deps.cache", "utf8"));
}, function() {
    // create default graph;
    var result = {};
    fs.readdirSync(path.source).filter(function(name) {
        return name.slice(- 3) === ".ls";
    }).forEach(function(name) {
        name = name.slice(0, - 3);
        result["source:" + name] = {};
        result["js:" + name] = {};
        result["js:" + name]["source:" + name] = true;
    });
    return result;
});
var cacheDeps = function() {
    fs.writeFile(path.build + "deps.cache", JSON.stringify(deps));
};
cacheDeps();
// Traverse deps and find out what needs to be rebuilt {{{1
var traverseDeps = function() {
    var needsRebuild = {};
    var rebuildLength = - 1;
    while(Object.keys(needsRebuild).length !== rebuildLength) {
        rebuildLength = Object.keys(needsRebuild).length;
        Object.keys(deps).forEach(function(dest) {
            var destTime = mtime(dest);
            Object.keys(deps[dest]).forEach(function(src) {
                if(needsRebuild[dest] || destTime <= mtime(src)) {
                    needsRebuild[dest] = true;
                };
            });
        });
    };
    return needsRebuild;
};
// find exports and requires in ast {{{1
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
// Keep track of webapp requires {{{1
var webreq = util.trycatch(function() {
    return JSON.parse(fs.readFileSync(path.build + "webreq.cache", "utf8"));
}, function() {
    return {};
});
var setwebreq = function(name, reqs) {
    reqs = Object.keys(reqs);
    reqs.forEach(function(req) {
        webreq[name] = webreq[name] || {};
        webreq[name][req] = true;
    });
    fs.writeFile(path.build + "webreq.cache", JSON.stringify(webreq));
};
var webappdep = function(name) {
    var id = "webapp:" + name;
    deps[id] = {};
    deps[id][name] = true;
    var len = - 1;
    while(Object.keys(deps[id]).length !== len) {
        len = Object.keys(deps[id]).length;
        Object.keys(deps[id]).forEach(function(dep) {
            Object.keys(webreq[dep] || {}).forEach(function(child) {});
        });
    };
    console.log("webapp", name);
};
// build function {{{1
var build = function(id) {
    if(id.slice(0, 3) === "js:") {
        console.log("build", id);
        var name = id.slice(3);
        var source = fs.readFileSync(getfilename("source:" + name), "utf8");
        var plainast = compiler.parsels(source);
        [
            "lightscript",
            "nodejs",
            "webjs",
        ].forEach(function(platform) {
            var ast = compiler.applyMacros({
                ast : plainast,
                name : name,
                platform : platform,
            });
            var exports = findExports(ast);
            if(platform === "webjs") {
                console.log(exports);
                var src = "define(\"" + name + "\",function(exports, require){\n";
                src += compiler.ppjs(ast) + "});";
                fs.writeFileSync(path.js + name + extension.js, src);
                setwebreq(name, findRequires(ast));
                if(exports.webapp === true) {
                    webappdep(name);
                };
            } else if(platform === "nodejs") {
                fs.writeFileSync(path.nodejs + name + ".js", compiler.ppjs(ast));
            } else if(platform === "lightscript") {
                ast = compiler.applyMacros({
                    ast : ast,
                    name : name,
                    platform : platform,
                    reverse : true,
                });
                src = compiler.ppls(ast);
                fs.writeFileSync(path.pretty + name + ".ls", src);
            };
        });
    };
};
// Rebuild function {{{1
// Main {{{1
exports.nodemain = function() {
    Object.keys(traverseDeps()).forEach(build);
};
/*
// # intermediate version {{{1
path.cache = path.build + "cache/";

//

// ## global variables {{{2
//
var sourcefiles = {};
var platforms = ["nodejs", "webjs"];
var deps = {};
//
// # Utility functions
//
var mtime = function(filename) {
    return util.trycatch(function() {
        return fs.statSync(filename).mtime.getTime();
    }, function() {
        return 0;
    });
};
//





// type:name,
//
//  - ls-source
//      - metadata (require-dependencies, nodemain, etc)
//      - generated souce code
//
//  ------------------
//
// 
// # ...{{{1
//
var updatefiles = function(callback) {
    async.forEach(fs.readdirSync(path.source).filter(function(name) {
        return name.slice(- 3) === ".ls";
    }), updatefile, callback);
};
// updatefile {{{2
var updatefile = function(filename, callback) {
    var name = filename.slice(0, - 3);
    sourcefiles[name] = var obj = sourcefiles[name] || {};
    // 
    // Initialise simple values
    //
    obj.name = name;
    obj.filename = path.source + filename;
    var timestamp = mtime(obj.filename);
    //
    // read compilercache if possible
    //
    var cachefile = path.cache + name;
    if(timestamp <= mtime(cachefile)) {
        console.log("cached " + name);
        deps = obj.deps;
        obj = JSON.parse(fs.readFileSync(cachefile, "utf8"));
        obj.deps = deps;
        sourcefiles[name] = obj;
    } ;
        //
        // actually generate compiled file/data if needed
        //
    if(!obj.timestamp || obj.timestamp < timestamp) {
        console.log("compiling " + name);
        var source = fs.readFileSync(obj.filename, "utf8");
        obj.ast = compiler.parsels(source);
        obj.timestamp = timestamp;
        platforms.forEach(function(platform) {
            buildfile(obj, platform);
        });
        obj.ast = undefined;
        fs.writeFile(cachefile, JSON.stringify(obj));
    };
    //
    // update dependencies
    // 
    platforms.forEach(function(platform) {
        Object.keys(obj[platform].requires).forEach(function(dest) {
            if(!sourcefiles[dest]) {
                sourcefiles[dest] = {};
            }
            deps = sourcefiles[dest].deps;
            if(!deps) {
                deps = {};
                sourcefiles[dest].deps = deps;
                platforms.forEach(function(platform) {
                    deps[platform] = {};
                });
            }
            deps[platform][obj.name] = true;
        });
    });
    callback();
};

// buildfile {{{2
var buildfile = function(obj, platform) {
    var ast = compiler.applyMacros({
        ast : obj.ast,
        name : obj.name,
        platform : platform,
    });
    obj[platform] = var dest = {};
    dest.ast = ast;
    dest.exports = findExports(ast);
    dest.requires = findRequires(ast);
    compileFns[platform](obj, dest);
    dest.ast = undefined;
};
//
// compileFns {{{2
// 
var compileFns = {
    webjs : function(obj, dest) {
        var src = "define(\"";
        src += obj.name;
        src += "\",function(exports, require){\n";
        src += compiler.ppjs(dest.ast);
        src += "});";
        fs.writeFileSync(path.webjs + obj.name + ".js", src);
        if(dest.exports.webapp) {
            obj.webapp = true;
        }
    },
    nodejs : function(obj, dest) {
        var src = compiler.ppjs(dest.ast);
        fs.writeFileSync(path.nodejs + obj.name + ".js", src);
    },
    pretty: function(obj, dest) {
        var ast = compiler.applyMacros({
            ast : dest.ast,
            name : obj.name,
            platform : "lightscript",
            reverse : true,
        });
        var src = compiler.ppls(dest.ast);
        fs.writeFileSync(path.pretty + obj.name + ".ls", src);
    },
};
// {{{1
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
// # Main {{{1
exports.nodemainold = function(arg) {
    updatefiles(function() {
        //console.log(sourcefiles["compiler"]);
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
    // defs {{{2
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
    var readModule = function(lsname, callback) { //{{{2
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
    var makeModuleObjects = function(callback) { //{{{2
        async.forEach(fs.readdirSync(sourcepath).filter(function(name) {
            return name.slice(- 3) === ".ls";
        }), readModule, callback);
    };
    var platforms = [
        "lightscript",
        "nodejs",
        "webjs",
    ];
    var webapp = function(opts, kind) { //{{{2
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
    var compileFns = { // {{{2
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
    var updateDest = function(name, platform) { //{{{2
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
    var findExports = function(ast) { //{{{2
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
    var findRequires = function(ast) { //{{{2
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
    recurseRequires = function(reqs, platform) { //{{{2
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
    var buildFiles = function(name, callback) { //{{{2
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
    var compileModuleObjects = function(callback) { //{{{2
        async.forEach(Object.keys(modules), buildFiles, callback);
    };
    var server = undefined;
    var killServer = function(callback) { //{{{2
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
    var startServer = function(callback) { //{{{2
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
    var restartServer = function(callback) { //{{{2
        killServer(function() {
            startServer(callback);
        });
    };
    process.on("exit", killServer);
    var watch = function(callback) { //{{{2
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
    // # main //{{{2
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
