exports.run = function(name) {
    console.log('webapp', name);
    require("./" + name).webapp.run();
};
