
use = require("./module").use;
def = require("./module").def;
// Build {{{1
def("build", function(exports) {
    // outer: use
    // outer: true
    // outer: console
    // outer: ;
    // outer: Object
    // outer: require
    var fs;
    fs = require("fs");
    exports.nodemain = function(arg) {
        // outer: use
        // outer: true
        // outer: console
        // outer: ;
        // outer: require
        var compileToJS;
        var optionalCompile;
        // outer: fs
        var sourcefiles;
        // outer: Object
        var compiled;
        var buildpath;
        var sourcepath;
        sourcepath = "/home/rasmuserik/solsort/lightscript/";
        /*__dirname + '/../lightscript/';*/
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
        compileToJS = function(ls, js, done) {
            // outer: use
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
                // outer: use
                var t;
                t = use("compiler").ls2js(src);
                fs.writeFile(js, t, function() {
                    // outer: done
                    done();
                });
            });
        };
        if(arg === "pretty") {
            sourcefiles.forEach(function(filename) {
                // outer: use
                // outer: sourcepath
                // outer: fs
                var src;
                // outer: console
                console.log("prettyprinting:", filename);
                src = fs.readFileSync(sourcepath + filename, "utf8");
                src = use("compiler").ls2ls(src);
                fs.writeFileSync(sourcepath + filename, src);
            });
        };
        require("async").forEach(sourcefiles, function(filename, done) {
            // outer: compileToJS
            // outer: sourcepath
            // outer: optionalCompile
            // outer: buildpath
            var destfile;
            destfile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
            optionalCompile(sourcepath + filename, destfile, compileToJS, done);
        }, function() {
            // outer: sourcepath
            // outer: compileToJS
            // outer: buildpath
            // outer: sourcefiles
            // outer: compiled
            if(compiled["compiler.ls"] || compiled["build.ls"]) {
                sourcefiles.forEach(function(filename) {
                    // outer: sourcepath
                    // outer: compileToJS
                    // outer: buildpath
                    var destfile;
                    destfile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
                    compileToJS(sourcepath + filename, destfile, function() {});
                });
            };
        });
    };
});
