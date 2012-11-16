exports.run = function(name) {
    console.log('webapp', name);
    require("./" + name).webmain();
};
exports.webapp = function() {};
