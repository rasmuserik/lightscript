// simple ls-compile based of mtime of .ls and .js
//
// cached dependency graph for app-generation
//
// watch ls-dir which recompiles regularly
// Initialisation {{{1
//
util = require('./util');
compiler = require('./compiler');
fs = require('fs');
meta = undefined;
path = {};
extension = {};
compiled = {};
platforms = ['nodejs', 'webjs', 'lightscript'];
init = function() {
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
        util.mkdir(path[name]);
    });
    meta = util.loadJSONSync(path.build + "build.metadata", {});
    var sourcefiles = fs.readdirSync(path.source).filter(function(name) {
        return name.slice(- 3) === ".ls";
    }).forEach(function(name) {
        name = name.slice(0, -3);
        meta[name] = meta[name] || {exports: {}, webdep: {}};
    });
};
// Util {{{1
// filename {{{2
var filename = function(platform, name) {
    return path[platform] + name + extension[platform];
};
// parseSource {{{2
var parseSource = function(id) {
    var source = fs.readFileSync(filename('source', id), "utf8");
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
// Compile {{{1
// compileFns {{{2
var compileFns = {
    webjs : function(name, ast) {
        var src = "define(\"";
        src += name;
        src += "\",function(exports, require){\n";
        src += compiler.ppjs(ast);
        src += "});";
        meta[name].webdep = findRequires(ast);
        return src;
    },
    nodejs : function(name, ast) {
        return compiler.ppjs(ast);
    },
    lightscript: function(name, ast) {
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
    console.log('Compiling', name);
    plainast = parseSource(name);
    meta[name].exports = findExports(plainast);
    platforms.forEach(function(platform) {
        var ast = compiler.applyMacros({
            ast : plainast,
            name : name,
            platform : platform,
        });
        fs.writeFileSync(filename(platform, name), compileFns[platform](name, ast));
    });
    compiled[name] = true;
}
// optionalCompile {{{2
optionalCompile = function(name) {
    if(util.mtime(filename('source', name)) > util.mtime(filename('nodejs', name))) {
        compile(name);
    }
}
// build apps {{{2
buildWebApp = function(name, modules) {
    console.log("build webapp", name, modules);
    var apppath = "/usr/share/nginx/www/solsort/apps/" + name;
    util.mkdir(apppath);
    util.cp(path.template + "webapp.html", apppath + "/index.html");
    var source = "(function(){var modules={};";
    source += "var require=function(name){name=name.slice(2);";
    source += "var t=modules[name];if(typeof t===\"function\"){";
    source += "t(modules[name]={},require);return modules[name];}return t;};";
    source += "var define=function(name,fn){modules[name]=fn};";
    modules.forEach(function(name) {
        source += fs.readFileSync(filename('webjs', name));
    });
    source += "require(\"./webapp\").run(\"" + name + "\");";
    source += "})();";
    fs.writeFile(apppath + "/webapp.js", source);
};
buildWebApps = function() {
    apps = [];
    util.objForEach(meta, function(name, info) {
        if(info.exports.webapp) {
            apps.push(name);
        }
    });
    apps.forEach(function(app) {
        recompile = false;
        visited = {};
        deps = [app];
        while(deps.length) {
            dep = deps.pop();
            if(!visited[dep]) {
                deps = deps.concat(Object.keys(meta[dep].webdep));
                if(compiled[dep]) {
                    recompile = true;
                }
                visited[dep] = true;
            }
        }
        if(recompile) {
            buildWebApp(app, Object.keys(visited));
        }
    });
}
compileAll = function() {
    compiled = {};
    Object.keys(meta).forEach(optionalCompile);
    buildWebApps();
    util.saveJSON(path.build + "build.metadata", meta);
}
// Main {{{1
exports.nodemain = function(arg) {
    init();
    compileAll();
    if(arg === 'watch') {
        watchFn = function() {
            watcher.close();
            setTimeout(function() {
                compileAll();
                watcher = fs.watch(path.source, watchFn);
            }, 200);
        };
        watcher = fs.watch(path.source, watchFn);
    }
}
/*
