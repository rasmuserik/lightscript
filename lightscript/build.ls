use = require('./module').use;
def = require('./module').def;
// Build {{{1
def("build", function(exports) {
    var fs = require('fs');
    exports.nodemain = function() {
        var sourcepath = __dirname + '/../lightscript/';
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
            console.log('compile:', ls, '->', js);
        }
        sourcefiles.forEach(function(filename) {
            var destfile = buildpath + 'nodejs/' + filename.replace('.ls', '.js');
            optionalCompile(sourcepath + filename, destfile, compileToJS);
        });

        console.log(sourcefiles);
    };
});
