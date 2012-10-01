def("build", function(exports) {
    var fs = require("fs");
    exports.nodemain = function(arg) {
        var sourcepath = __dirname + '/../../lightscript/';
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
        var compileToJS = function(ls, js, done) {
            var shortname = ls.split("/").slice(- 1)[0];
            console.log("compiling:", shortname);
            compiled[shortname] = true;
            fs.readFile(ls, "utf8", function(err, src) {
                src = use("compiler").ls2js(src);
                if(shortname !== "module.ls") {
                    src = "if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}" + src;
                };
                fs.writeFile(js, src, function() {
                    done();
                });
            });
        };
        if(arg === "pretty") {
            sourcefiles.forEach(function(filename) {
                console.log("prettyprinting:", filename);
                var src = fs.readFileSync(sourcepath + filename, "utf8");
                src = use("compiler").ls2ls(src);
                fs.writeFileSync(sourcepath + filename, src);
            });
        };
        var createSolsortJS = function() {
            require("child_process").exec("cat " + buildpath + "nodejs/* > " + buildpath + "webjs/solsort.js");
        };
        require("async").forEach(sourcefiles, function(filename, done) {
            var destfile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
            optionalCompile(sourcepath + filename, destfile, compileToJS, done);
        }, function() {
            if(compiled["compiler.ls"] || compiled["build.ls"] || arg === "web") {
                require("async").forEach(sourcefiles, function(filename, done) {
                    var destfile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
                    compileToJS(sourcepath + filename, destfile, done);
                }, createSolsortJS);
            } else  {
                createSolsortJS();
            };
        });
    };
});
