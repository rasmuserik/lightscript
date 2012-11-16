exports.webapp = function(app) {
    return { 
        run: function() {
    var canvas = document.getElementById("canvas");
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
}; })
};
