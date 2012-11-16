// outer: window
// outer: Object
// outer: document
// outer: exports
exports.webapp = function(app) {
    // outer: window
    // outer: exports
    // outer: Object
    var webapp;
    // outer: document
    document.write("<canvas id=\"canvas\" style=\"position:fixed;top:0px;left:0px;width:100%;height:100%;\"></canvas>");
    webapp = {};
    webapp.run = function() {
        // outer: window
        // outer: app
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
    return webapp;
    return exports;
};
