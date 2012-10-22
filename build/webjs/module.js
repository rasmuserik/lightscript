define("module",function(exports, require){
// outer: window
// outer: Object
// outer: __dirname
// outer: require
// outer: exports
exports.list = function() {
    // outer: window
    // outer: Object
    // outer: __dirname
    // outer: require
    if(undefined) {};
    if(true) {
        return Object.keys(window.modules);
    };
};
});