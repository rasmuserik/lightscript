require("./canvasapp");
var log = require("./log");
var V2d = require("./v2d").V2d;
util = require("./util");

// # Spring-based graph layout
// This is experimental code, not really intended for reading yet.
var running;
exports.init =  function(app) {
        running = true;
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
        i = 0;
        while (i <100) {
            basegraph[i] = [];
            basegraph[Math.random() *i|0].push(i);
            ++i;
        }
        //basegraph[0].push('0,0');


        Object.keys(basegraph).forEach(function(id) {
            basegraph[id] = {
                id: id,
                force: {x:0,y:0},
                velocity: {x:Math.random() - 0.5, y:Math.random() - 0.5},
                pos: {
                    x: Math.random(),
                    y: Math.random()},
                children: basegraph[id]
            };
        });

        var graph = [];
        Object.keys(basegraph).forEach(function(id) {
            basegraph[id].children = basegraph[id].children.map(function(child) { return basegraph[child]; });
            graph.push(basegraph[id]);
        });

        vsub = function(a,b) {
            return { x: a.x-b.x, y: a.y-b.y};
        }
        vadd = function(a,b) {
            return { x: a.x+b.x, y: a.y+b.y};
        }
        vscale = function (k,a) {
            return {x: a.x*k, y: a.y*k};
        }
        dot = function (a,b) {
            return a.x*b.x + a.y*b.y;
        }
        vlen = function (v) {
            return Math.sqrt(v.x*v.x+v.y*v.y);
        }
        norm = function (v) {
            var l = vlen(v);
            return { x: v.x/l, y:v.y/l};
        }
        dist=function (a,b) {
            var t = vsub(a,b);
            return Math.sqrt(dot(t,t));
        }
        vneg = function (v) {
            return {x:-v.x, y:-v.y};
        }
        var spring = 10000;
        var repuls = 1000;
        var passt = 0;
        var timestep = 0.005;
        var dampening = 0.99;
        run= function () {
            if(passt > 0) {
                passt -= 0.01;
            }

            // ### Calculate force
            graph.forEach(function(elem) {
                elem.force = {x:0,y:0};
            });

            graph.forEach(function(a) {
                a.children.forEach(function(b) {
                    var doit = Math.random()*Math.random()*4 > passt;
                    if(doit) {
                    var v = vsub(b.pos, a.pos);
                    var force = vscale(spring*0.1*Math.min(vlen(v), 100), v);
                    a.force = vadd(a.force, force);
                    b.force = vadd(b.force, vneg(force));
                    }
                });
            });
          
            var doit = Math.random() * Math.random()*2 > passt;
            graph.forEach(function(a) {
                graph.forEach(function(b) {
                    if(a.id !== b.id && doit) {
                        var v = norm(vsub(a.pos, b.pos));
                        var d = dist(b.pos, a.pos);
                        if(d < Math.PI/2){
                            a.force = vadd(a.force, vscale(repuls*Math.cos(d), v));
                        }
                    }
                });
            });

            // ### Calculate velocity
            graph.forEach(function(elem) {
                elem.velocity = vscale(dampening, vadd(elem.velocity, vscale(timestep, elem.force)));
            });
            // ### Calculate position
            graph.forEach(function(elem) {
                var rescale = vlen(elem.velocity);
                elem.pos = vadd(elem.pos, vscale(timestep/Math.sqrt(1+rescale), elem.velocity));
            });
            // ### Blit and repeat
            drawGraph();
            if(running) {
                setTimeout(run, 0);
            }
        }

        drawGraph = function () {
            var minx = Math.min.apply(undefined, graph.map(function(e) { return e.pos.x; }));
            var miny = Math.min.apply(undefined, graph.map(function(e) { return e.pos.y; }));
            var maxx = Math.max.apply(undefined, graph.map(function(e) { return e.pos.x; }));
            var maxy = Math.max.apply(undefined, graph.map(function(e) { return e.pos.y; }));

            var ctx = canvas.getContext('2d');

            transform = function (a) {
                return {
                    x: (a.x-minx)/(maxx-minx) * canvas.width,
                    y: (a.y-miny)/(maxy-miny) * canvas.height
                };
            }

            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.beginPath();
            line= function (a,b) {
                ctx.lineWidth = 3;
                var p1 = transform(a);
                ctx.moveTo(p1.x, p1.y);
                var p2 = transform(b);
                ctx.lineTo(p2.x, p2.y);
            }
            drawdot=function (a) {
                var p = transform(a.pos);
                var sz = 24;
                ctx.lineWidth = 1;
                ctx.strokeRect(p.x-sz, p.y-sz, sz*2, sz*2);
                ctx.fillStyle = 'rgba(255,255,255,.7)';
                ctx.fillRect(p.x-sz+1, p.y-sz+1, sz*2-2, sz*2-2);
                ctx.fillStyle = '#000';
                ctx.fillText(a.id, p.x-17,p.y);
            }
            graph.forEach(function(a) {
                a.children.forEach(function(b) {
                        line(a.pos,b.pos);
                });

            });
            ctx.stroke();
            graph.forEach(function(a) {
                drawdot(a);
            });
            ctx.fillText(passt, 0,20);
            //ctx.fillText(JSON.stringify(graph.map(function(b){return dist(graph[0].pos, b.pos);})), 0,40);
        }
        run();
    }
