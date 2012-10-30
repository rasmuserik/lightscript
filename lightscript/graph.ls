require("./canvasapp");
var log = require("./log");
var V2d = require("./v2d").V2d;
var util = require("./util");
// # Spring-based graph layout
// This is experimental code, not really intended for reading yet.
running;
exports.init = function(app) {
    var running = true;
    var canvas = app.canvas;
    canvas.width = app.w;
    canvas.height = app.h;
    running = true;
    var basegraph = {};
    /*
        i = 0;
        while(i< 100) {
            basegraph[i] = [];
            //while(i>4 && Math.random() < 0.2) {basegraph[i-2-Math.random() * Math.random()*(i-2)|0].push(i);}
            basegraph[Math.random() *i|0].push(i);
            ++i;
        }
        while(i) {
            --i;
            basegraph[i].push[i-1];
        }
        i = 0;
        while(i<99) {

            if(Math.random() < 0.2) {
                basegraph[i].push(i+1);
            }
            ; ++i;
        }
        */
    var i = 0;
    while(i < 100) {
        basegraph[i] = [];
        basegraph[Math.random() * i | 0].push(i);
        ++i;
    };
    //basegraph[0].push('0,0');
    Object.keys(basegraph).forEach(function(id) {
        basegraph[id] = {
            id : id,
            force : new V2d(0,0),
            velocity : new V2d(Math.random() - 0.5, Math.random() - 0.5),
            pos : new V2d(Math.random(), Math.random()),
            children : basegraph[id],
        };
    });
    var graph = [];
    Object.keys(basegraph).forEach(function(id) {
        basegraph[id].children = basegraph[id].children.map(function(child) {
            return basegraph[child];
        });
        graph.push(basegraph[id]);
    });
    var spring = 10000;
    var repuls = 1000;
    var passt = 0;
    var timestep = 0.005;
    var dampening = 0.99;
    var run = function() {
        if(passt > 0) {
            passt -= 0.01;
        };
        // ### Calculate force
        graph.forEach(function(elem) {
            elem.force = new V2d(0, 0);
        });
        graph.forEach(function(a) {
            a.children.forEach(function(b) {
                var doit = Math.random() * Math.random() * 4 > passt;
                if(doit) {
                    var v = b.pos.sub(a.pos);
                    var force = v.scale(spring * 0.1 * Math.min(v.length(), 100));
                    a.force = a.force.add(force);
                    b.force = b.force.add(force.neg());
                };
            });
        });
        var doit = Math.random() * Math.random() * 2 > passt;
        graph.forEach(function(a) {
            graph.forEach(function(b) {
                if(a.id !== b.id && doit) {
                    var v = a.pos.sub(b.pos).norm();
                    var d = b.pos.dist(a.pos);
                    if(d < Math.PI / 2) {
                        a.force = a.force.add( v.scale(repuls * Math.cos(d)));
                    };
                };
            });
        });
        // ### Calculate velocity
        graph.forEach(function(elem) {
            elem.velocity = elem.velocity.add( elem.force.scale(timestep).scale(dampening));
        });
        // ### Calculate position
        graph.forEach(function(elem) {
            var rescale = elem.velocity.length();
            elem.pos = elem.pos.add( elem.velocity.scale(timestep / Math.sqrt(1 + rescale)));
        });
        // ### Blit and repeat
        drawGraph();
        if(running) {
            setTimeout(run, 0);
        };
    };
    var drawGraph = function() {
        var minx = Math.min.apply(undefined, graph.map(function(e) {
            return e.pos.x;
        }));
        var miny = Math.min.apply(undefined, graph.map(function(e) {
            return e.pos.y;
        }));
        var maxx = Math.max.apply(undefined, graph.map(function(e) {
            return e.pos.x;
        }));
        var maxy = Math.max.apply(undefined, graph.map(function(e) {
            return e.pos.y;
        }));
        var ctx = canvas.getContext("2d");
        var transform = function(a) {
            return new V2d((a.x - minx) / (maxx - minx) * canvas.width, (a.y - miny) / (maxy - miny) * canvas.height);
        };
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        var line = function(a, b) {
            ctx.lineWidth = 3;
            var p1 = transform(a);
            ctx.moveTo(p1.x, p1.y);
            var p2 = transform(b);
            ctx.lineTo(p2.x, p2.y);
        };
        var drawdot = function(a) {
            var p = transform(a.pos);
            var sz = 24;
            ctx.lineWidth = 1;
            ctx.strokeRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
            ctx.fillStyle = "rgba(255,255,255,.7)";
            ctx.fillRect(p.x - sz + 1, p.y - sz + 1, sz * 2 - 2, sz * 2 - 2);
            ctx.fillStyle = "#000";
            ctx.fillText(a.id, p.x - 17, p.y);
        };
        graph.forEach(function(a) {
            a.children.forEach(function(b) {
                line(a.pos, b.pos);
            });
        });
        ctx.stroke();
        graph.forEach(function(a) {
            drawdot(a);
        });
        ctx.fillText(passt, 0, 20);
        //ctx.fillText(JSON.stringify(graph.map(function(b){return graph[0].pos.dist(b.pos);})), 0,40);
    };
    run();
};
