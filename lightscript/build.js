use = require('./module').use;
def = require('./module').def;
// Build {{{1
def("build", function(exports) {
    exports.nodemain = function() {
        var sourcepath = __dirname + '/../lightscript';
    };
});
