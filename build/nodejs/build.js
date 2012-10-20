exports.nodemain = function(arg) {
    // outer: true
    // outer: console
    // outer: ;
    var webjs;
    var createSolsortJS;
    var compileToJS;
    var optionalCompile;
    var sourcefiles;
    // outer: Object
    var compiled;
    var buildpath;
    // outer: __dirname
    var sourcepath;
    // outer: require
    var fs;
    fs = require("fs");
    sourcepath = __dirname + "/../../lightscript/";
    buildpath = sourcepath + "../build/";
    compiled = {};
    sourcefiles = fs.readdirSync(sourcepath).filter(function(name) {
        return name.slice(- 3) === ".ls";
    });
    optionalCompile = function(src, dst, fn, done) {
        // outer: ;
        // outer: fs
        fs.stat(src, function(err, srcStat) {
            // outer: done
            // outer: src
            // outer: fn
            // outer: dst
            // outer: fs
            // outer: ;
            if(err) {
                return ;
            };
            fs.stat(dst, function(err, dstStat) {
                // outer: done
                // outer: dst
                // outer: src
                // outer: fn
                // outer: srcStat
                if(err || dstStat.mtime.getTime() <= srcStat.mtime.getTime()) {
                    fn(src, dst, done);
                } else  {
                    done();
                };
            });
        });
    };
    compileToJS = function(fn) {
        // outer: fs
        // outer: true
        // outer: compiled
        // outer: console
        return function(ls, js, done) {
            // outer: fn
            // outer: fs
            // outer: true
            // outer: compiled
            // outer: console
            var shortname;
            shortname = ls.split("/").slice(- 1)[0];
            console.log("compiling:", shortname);
            compiled[shortname] = true;
            fs.readFile(ls, "utf8", function(err, src) {
                // outer: done
                // outer: js
                // outer: fs
                // outer: fn
                src = fn(src);
                fs.writeFile(js, src, function() {
                    // outer: done
                    done();
                });
            });
        };
    };
    if(arg === "pretty") {
        sourcefiles.forEach(function(filename) {
            // outer: require
            // outer: sourcepath
            // outer: fs
            var src;
            // outer: console
            console.log("prettyprinting:", filename);
            src = fs.readFileSync(sourcepath + filename, "utf8");
            src = require("./compiler").ls2ls(src);
            fs.writeFileSync(sourcepath + filename, src);
        });
    };
    createSolsortJS = function() {
        // outer: buildpath
        // outer: fs
        // outer: require
        var result;
        result = "solsort_modules={};";
        result += "solsort_require = function(name){";
        result += "  name = name.slice(2);";
        result += "  var t = solsort_modules[name];";
        result += "  if(typeof t === \"function\") {";
        result += "     t(solsort_modules[name]={},solsort_require);";
        result += "     return solsort_modules[name]}";
        result += "  return t;};";
        result += "solsort_define = function(name,fn){solsort_modules[name]=fn};";
        require("./module").list().forEach(function(name) {
            // outer: buildpath
            // outer: fs
            // outer: result
            result += fs.readFileSync(buildpath + "webjs/" + name + ".js");
        });
        result += "solsort_require(\"./main\")";
        fs.writeFile(buildpath + "webjs/solsort.js", result);
    };
    webjs = function(name) {
        // outer: require
        //return require("./compiler").ls2webjs;
        return function(ls) {
            // outer: require
            // outer: name
            var result;
            result = "solsort_define(\"" + name + "\",function(exports, require){";
            result += require("./compiler").ls2webjs(ls);
            result += "});";
            return result;
        };
    };
    require("async").forEach(sourcefiles, function(filename, done) {
        // outer: webjs
        // outer: require
        // outer: compileToJS
        // outer: sourcepath
        // outer: optionalCompile
        // outer: buildpath
        var nodefile;
        done;
        nodefile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
        optionalCompile(sourcepath + filename, nodefile, compileToJS(require("./compiler").ls2nodejs), function() {
            // outer: done
            // outer: webjs
            // outer: require
            // outer: compileToJS
            // outer: sourcepath
            // outer: optionalCompile
            // outer: filename
            // outer: buildpath
            var mozfile;
            mozfile = buildpath + "mozjs/lib/" + filename.replace(".ls", ".js");
            optionalCompile(sourcepath + filename, mozfile, compileToJS(require("./compiler").ls2mozjs), function() {
                // outer: done
                // outer: webjs
                // outer: compileToJS
                // outer: sourcepath
                // outer: optionalCompile
                // outer: filename
                // outer: buildpath
                var webfile;
                webfile = buildpath + "webjs/" + filename.replace(".ls", ".js");
                optionalCompile(sourcepath + filename, webfile, compileToJS(webjs(filename.replace(".ls", ""))), done);
            });
        });
    }, function() {
        // outer: webjs
        // outer: compileToJS
        // outer: sourcepath
        // outer: optionalCompile
        // outer: buildpath
        // outer: createSolsortJS
        // outer: sourcefiles
        // outer: require
        // outer: arg
        // outer: compiled
        if(compiled["compiler.ls"] || compiled["build.ls"] || arg === "web") {
            require("async").forEach(sourcefiles, function(filename, done) {
                // outer: webjs
                // outer: require
                // outer: compileToJS
                // outer: sourcepath
                // outer: optionalCompile
                // outer: buildpath
                var nodefile;
                done;
                nodefile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
                optionalCompile(sourcepath + filename, nodefile, compileToJS(require("./compiler").ls2nodejs), function() {
                    // outer: done
                    // outer: webjs
                    // outer: require
                    // outer: compileToJS
                    // outer: sourcepath
                    // outer: optionalCompile
                    // outer: filename
                    // outer: buildpath
                    var mozfile;
                    mozfile = buildpath + "mozjs/lib/" + filename.replace(".ls", ".js");
                    optionalCompile(sourcepath + filename, mozfile, compileToJS(require("./compiler").ls2mozjs), function() {
                        // outer: done
                        // outer: webjs
                        // outer: compileToJS
                        // outer: sourcepath
                        // outer: optionalCompile
                        // outer: filename
                        // outer: buildpath
                        var webfile;
                        webfile = buildpath + "webjs/" + filename.replace(".ls", ".js");
                        optionalCompile(sourcepath + filename, webfile, compileToJS(webjs(filename.replace(".ls", ""))), done);
                    });
                });
            }, createSolsortJS);
        } else  {
            createSolsortJS();
        };
    });
};
