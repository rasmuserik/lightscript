// outer: setTimeout
// outer: false
// outer: console
// outer: true
// outer: __dirname
// outer: exports
var compileAll;
var buildWebApps;
var buildWebApp;
var optionalCompile;
var compile;
var compileFns;
var findRequires;
var findExports;
var parseSource;
var filename;
var init;
// outer: Array
var platforms;
var compiled;
var extension;
// outer: Object
var path;
// outer: undefined
var meta;
var fs;
var compiler;
// outer: require
var util;
// simple ls-compile based of mtime of .ls and .js
//
// cached dependency graph for app-generation
//
// watch ls-dir which recompiles regularly
// Initialisation {{{1
//
util = require("./util");
compiler = require("./compiler");
fs = require("fs");
meta = undefined;
path = {};
extension = {};
compiled = {};
platforms = [
    "nodejs",
    "webjs",
    "lightscript",
];
init = function() {
    // outer: fs
    var sourcefiles;
    // outer: util
    // outer: meta
    // outer: Object
    // outer: extension
    // outer: __dirname
    // outer: path
    path.source = __dirname + "/../../lightscript/";
    path.template = __dirname + "/../../template/";
    path.build = path.source + "../build/";
    path.nodejs = path.build + "nodejs/";
    path.webjs = path.build + "webjs/";
    path.lightscript = path.build + "lightscript/";
    extension.source = ".ls";
    extension.nodejs = ".js";
    extension.webjs = ".js";
    extension.lightscript = ".ls";
    Object.keys(path).forEach(function(name) {
        // outer: path
        // outer: util
        util.mkdir(path[name]);
    });
    meta = util.loadJSONSync(path.build + "build.metadata", {});
    sourcefiles = fs.readdirSync(path.source).filter(function(name) {
        return name.slice(- 3) === ".ls";
    }).forEach(function(name) {
        // outer: Object
        // outer: meta
        name = name.slice(0, - 3);
        meta[name] = meta[name] || {exports : {}, webdep : {}};
    });
};
// Util {{{1
// filename {{{2
filename = function(platform, name) {
    // outer: extension
    // outer: path
    return path[platform] + name + extension[platform];
};
// parseSource {{{2
parseSource = function(id) {
    // outer: compiler
    // outer: filename
    // outer: fs
    var source;
    source = fs.readFileSync(filename("source", id), "utf8");
    return compiler.parsels(source);
};
// find exports in ast {{{2
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
// find requires in ast {{{2
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
// Compile {{{1
// compileFns {{{2
compileFns = {
    webjs : function(name, ast) {
        // outer: findRequires
        // outer: meta
        // outer: compiler
        var src;
        src = "define(\"";
        src += name;
        src += "\",function(exports, require){\n";
        src += compiler.ppjs(ast);
        src += "});";
        meta[name].webdep = findRequires(ast);
        return src;
    },
    nodejs : function(name, ast) {
        // outer: compiler
        return compiler.ppjs(ast);
    },
    lightscript : function(name, ast) {
        // outer: true
        // outer: Object
        // outer: compiler
        ast = compiler.applyMacros({
            ast : ast,
            name : name,
            platform : "lightscript",
            reverse : true,
        });
        return compiler.ppls(ast);
    },
};
// compile {{{2
compile = function(name) {
    // outer: compileFns
    // outer: filename
    // outer: fs
    // outer: Object
    // outer: compiler
    // outer: true
    // outer: compiled
    // outer: platforms
    // outer: findExports
    // outer: meta
    // outer: parseSource
    var plainast;
    // outer: console
    console.log("Compiling", name);
    plainast = parseSource(name);
    meta[name].exports = findExports(plainast);
    platforms.forEach(function(platform) {
        // outer: compileFns
        // outer: filename
        // outer: fs
        // outer: name
        // outer: plainast
        // outer: Object
        // outer: compiler
        var ast;
        ast = compiler.applyMacros({
            ast : plainast,
            name : name,
            platform : platform,
        });
        fs.writeFileSync(filename(platform, name), compileFns[platform](name, ast));
    });
    compiled[name] = true;
};
// optionalCompile {{{2
optionalCompile = function(name) {
    // outer: compile
    // outer: filename
    // outer: util
    if(util.mtime(filename("source", name)) > util.mtime(filename("nodejs", name))) {
        compile(name);
    };
};
// build apps {{{2
buildWebApp = function(name, modules) {
    // outer: filename
    // outer: fs
    var source;
    // outer: path
    // outer: util
    var apppath;
    // outer: console
    console.log("build webapp", name, modules);
    apppath = "/usr/share/nginx/www/solsort/apps/" + name;
    util.mkdir(apppath);
    util.cp(path.template + "webapp.html", apppath + "/index.html");
    source = "(function(){var modules={};";
    source += "var require=function(name){name=name.slice(2);";
    source += "var t=modules[name];if(typeof t===\"function\"){";
    source += "t(modules[name]={},require);return modules[name];}return t;};";
    source += "var define=function(name,fn){modules[name]=fn};";
    modules.forEach(function(name) {
        // outer: filename
        // outer: fs
        // outer: source
        source += fs.readFileSync(filename("webjs", name));
    });
    source += "require(\"./webapp\").run(\"" + name + "\");";
    source += "})();";
    fs.writeFile(apppath + "/webapp.js", source);
};
buildWebApps = function() {
    // outer: buildWebApp
    // outer: true
    // outer: compiled
    // outer: Object
    // outer: false
    // outer: meta
    // outer: util
    // outer: Array
    var apps;
    apps = [];
    util.objForEach(meta, function(name, info) {
        // outer: apps
        if(info.exports.webapp) {
            apps.push(name);
        };
    });
    apps.forEach(function(app) {
        // outer: buildWebApp
        // outer: true
        // outer: compiled
        // outer: meta
        var dep;
        // outer: Array
        var deps;
        // outer: Object
        var visited;
        // outer: false
        var recompile;
        recompile = false;
        visited = {};
        deps = [app, "webapp"];
        while(deps.length) {
            dep = deps.pop();
            if(!visited[dep]) {
                deps = deps.concat(Object.keys(meta[dep].webdep));
                if(compiled[dep]) {
                    recompile = true;
                };
                visited[dep] = true;
            };
        };
        if(recompile) {
            buildWebApp(app, Object.keys(visited));
        };
    });
};
compileAll = function() {
    // outer: path
    // outer: util
    // outer: buildWebApps
    // outer: optionalCompile
    // outer: meta
    // outer: Object
    // outer: compiled
    compiled = {};
    Object.keys(meta).forEach(optionalCompile);
    buildWebApps();
    util.saveJSON(path.build + "build.metadata", meta);
};
// Main {{{1
exports.nodemain = function(arg) {
    // outer: console
    // outer: util
    // outer: setTimeout
    // outer: path
    // outer: fs
    var watcher;
    var watchFn;
    // outer: compileAll
    // outer: init
    init();
    compileAll();
    if(arg === "watch") {
        watchFn = function() {
            // outer: console
            // outer: watchFn
            // outer: path
            // outer: fs
            // outer: compileAll
            // outer: util
            // outer: setTimeout
            // outer: watcher
            watcher.close();
            setTimeout(function() {
                // outer: console
                // outer: watchFn
                // outer: path
                // outer: fs
                // outer: watcher
                // outer: compileAll
                // outer: util
                util.trycatch(compileAll, function(err) {
                    // outer: console
                    console.log(err);
                });
                watcher = fs.watch(path.source, watchFn);
            }, 200);
        };
        watcher = fs.watch(path.source, watchFn);
    };
};
