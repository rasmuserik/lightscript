def("build", function(exports) {
    var fs = require("fs");
    exports.nodemain = function(arg) {
        var sourcepath = "/home/rasmuserik/solsort/lightscript/";
        /*__dirname + '/../lightscript/';*/
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
                    src = "use=require(\"./module\").use;def=require(\"./module\").def;" + src;
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
        require("async").forEach(sourcefiles, function(filename, done) {
            var destfile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
            optionalCompile(sourcepath + filename, destfile, compileToJS, done);
        }, function() {
            if(compiled["compiler.ls"] || compiled["build.ls"]) {
                sourcefiles.forEach(function(filename) {
                    var destfile = buildpath + "nodejs/" + filename.replace(".ls", ".js");
                    compileToJS(sourcepath + filename, destfile, function() {});
                });
            };
        });
    };
});
