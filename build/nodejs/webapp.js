// outer: require
// outer: exports
exports.run = function(name) {
    // outer: require
    require("./" + name).webmain();
};
exports.webapp = function() {};
