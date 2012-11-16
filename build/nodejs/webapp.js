// outer: require
// outer: console
// outer: exports
exports.run = function(name) {
    // outer: require
    // outer: console
    console.log("webapp", name);
    require("./" + name).webapp.run();
};
