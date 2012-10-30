exports.run = function(name) {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext('2d');
    h = ctx.height = canvas.height = canvas.offsetHeight;
    w = ctx.width = canvas.width = canvas.offsetWidth;
    obj = {canvas : canvas, ctx: ctx, h: h, w: w};
    app = require('./' + name);
    if(app.init) {
        app.init(obj);
    }
    if(app.update) {
        window.onresize = function() {
            app.update(obj);
        }
        app.update(obj);
    }
};
