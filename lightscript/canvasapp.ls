exports.webapp = function(app) {
    var webapp = {};
    webapp.run = function() {
        var canvas = document.getElementById("canvas");
        if(!canvas) {
            document.write("<canvas id=\"canvas\" style=\"position:fixed;top:0px;left:0px;width:100%;height:100%;\"></canvas>");
        };
        canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        var h = ctx.height = canvas.height = canvas.offsetHeight;
        var w = ctx.width = canvas.width = canvas.offsetWidth;
        var obj = {
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
                app.update(obj);
            };
            app.update(obj);
        };
    };
    return webapp;
    return exports;
};
