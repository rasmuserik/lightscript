exports.run = function(name) {
    // outer: Object
    // outer: require
    // outer: document
    var canvas;
    canvas = document.getElementById("canvas");
    require("./" + name).init({canvas : canvas});
};
