use = require('./module').use;
def = require('./module').def;
// Build {{{1
def("build", function(exports) {
    var fs = require('fs');
    exports.nodemain = function() {
        var sourcepath = '/home/rasmuserik/solsort/lightscript/';
    /*__dirname + '/../lightscript/';*/
        var buildpath = sourcepath + '../build/';
        var sourcefiles = fs.readdirSync(sourcepath).filter(function(name) { 
            return name.slice(-3) === '.ls'; 
        });
        var optionalCompile = function(src, dst, fn) {
            fs.stat(src, function(err, srcStat) {
                if(err) {
                    return;
                }
                fs.stat(dst, function(err, dstStat) {
                    if(err || dstStat.mtime.getTime() <= srcStat.mtime.getTime()) {
                        fn(src, dst);
                    }
                });
            });
        }
        var compileToJS = function(ls, js) {
            console.log('compiling:', ls.split('/').slice(-1)[0]);
            fs.readFile(ls, 'utf8', function(err, src) {
                var t = use('compiler').ls2js(src);
                fs.writeFile(js, t);
            });
        }
        sourcefiles.forEach(function(filename) {
            var destfile = buildpath + 'nodejs/' + filename.replace('.ls', '.js');
            optionalCompile(sourcepath + filename, destfile, compileToJS);
        });
    };
});
