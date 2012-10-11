exports.nodemain = function(arg) {
    // outer: true
    // outer: console
    // outer: ;
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
    compileToJS = function(ls, js, done) {
        // outer: require
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
            // outer: require
            src = require("./compiler").ls2js(src);
            fs.writeFile(js, src, function() {
                // outer: done
                done();
            });
        });
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
        result = "modules={};";
        result += "require = function(name){";
        result += "  name = name.slice(2);";
        result += "  var t = modules[name];";
        result += "  if(typeof t === \"function\") { t(modules[name]={}); return modules[name]}";
        result += "  return t;};";
        result += "define = function(name,fn){modules[name]=fn};";
        require("./module").list().forEach(function(name) {
            // outer: buildpath
            // outer: fs
            // outer: result
            result += "define(\"" + name + "\",function(exports){";
            result += fs.readFileSync(buildpath + "nodejs/" + name + ".js");
            result += "});";
        });
        result += "require(\"./main\")";
        fs.writeFile(buildpath + "webjs/solsort.js", result);
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
