// outer: console
// outer: window
// outer: require
// outer: Object
// outer: document
// outer: exports
exports.run = function(name) {
    // outer: window
    // outer: require
    var app;
    // outer: Object
    var obj;
    var w;
    var h;
    var ctx;
    // outer: document
    var canvas;
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    h = ctx.height = canvas.height = canvas.offsetHeight;
    w = ctx.width = canvas.width = canvas.offsetWidth;
    obj = {
        canvas : canvas,
        ctx : ctx,
        h : h,
        w : w,
    };
    app = require("./" + name);
    if(app.init) {
        app.init(obj);
    };
    if(app.update) {
        window.onresize = function() {
            // outer: obj
            // outer: app
            app.update(obj);
        };
        app.update(obj);
    };
};
exports.webapp = function(arg) {
    // outer: exports
    // outer: console
    console.log(arg);
    return exports;
};
