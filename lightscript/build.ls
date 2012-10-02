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
    var compileToJS = function(ls, js, done) {
        var shortname = ls.split("/").slice(- 1)[0];
        console.log("compiling:", shortname);
        compiled[shortname] = true;
        fs.readFile(ls, "utf8", function(err, src) {
            src = require("./compiler").ls2js(src);
            fs.writeFile(js, src, function() {
                done();
            });
        });
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
        var result = "modules={};";
        result += "require = function(name){";
        result += "  name = name.slice(2);";
        result += "  var t = modules[name];";
        result += "  if(typeof t === \"function\") { t(modules[name]={}); return modules[name]}";
        result += "  return t;};";
        result += "define = function(name,fn){modules[name]=fn};";
        require("./module").list().forEach(function(name) {
            result += "define(\"" + name + "\",function(exports){";
            result += fs.readFileSync(buildpath + "nodejs/" + name + ".js");
            result += "});";
        });
        result += "require(\"./main\")";
        fs.writeFile(buildpath + "webjs/solsort.js", result);
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
