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
        if(compiled["compiler.ls"] || compiled["build.ls"] || arg === "web") {
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
