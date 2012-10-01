if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
def("build", function(exports) {
    // outer: use
    // outer: true
    // outer: console
    // outer: ;
    // outer: Object
    // outer: __dirname
    // outer: require
    var fs;
    fs = require("fs");
    exports.nodemain = function(arg) {
        // outer: use
        // outer: true
        // outer: console
        // outer: ;
        // outer: require
        var createSolsortJS;
        var compileToJS;
        var optionalCompile;
        // outer: fs
        var sourcefiles;
        // outer: Object
        var compiled;
        var buildpath;
        // outer: __dirname
        var sourcepath;
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
                // outer: shortname
                // outer: use
                src = use("compiler").ls2js(src);
                if(shortname !== "module.ls") {
                    src = "if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}" + src;
                };
                fs.writeFile(js, src, function() {
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
        createSolsortJS = function() {
            // outer: buildpath
            // outer: require
            require("child_process").exec("cat " + buildpath + "nodejs/* > " + buildpath + "webjs/solsort.js");
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
            // outer: createSolsortJS
            // outer: sourcefiles
            // outer: require
            // outer: arg
            // outer: compiled
            if(compiled["compiler.ls"] || compiled["build.ls"] || arg === "web") {
                require("async").forEach(sourcefiles, function(filename, done) {
                    // outer: sourcepath
                    // outer: compileToJS
                    // outer: buildpath
                    var destfile;
                    destfile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
                    compileToJS(sourcepath + filename, destfile, done);
                }, createSolsortJS);
            } else  {
                createSolsortJS();
            };
        });
    };
});
