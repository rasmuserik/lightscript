var util = require("./util");
if(`compiler.webjs) {
exports.webapp = require("./canvasapp").webapp(exports);
var log = require("./log");
var V2d = require("./v2d").V2d;
// # Spring-based graph layout {{{1
// This is experimental code, not really intended for reading yet.
exports.init = function(app) {
    var canvas = app.canvas;
    canvas.width = app.w;
    canvas.height = app.h;
    var running = true;
    var basegraph = {};
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
            force : new V2d(0, 0),
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
    var spring = .1;
    var repuls = 1;
    var dampening = 0.90;
    var maxspeed = 0.01;
    var run = function() {
        // ### Calculate force
        graph.forEach(function(elem) {
            elem.force = new V2d(0, 0);
        });
        // #### Edges/springs
        graph.forEach(function(a) {
            a.children.forEach(function(b) {
                var v = b.pos.sub(a.pos);
                var force = v.scale(spring * Math.min(v.length(), 100));
                a.force = a.force.add(force);
                b.force = b.force.add(force.neg());
            });
        });
        // #### Collisions
        graph.forEach(function(a) {
            graph.forEach(function(b) {
                if(a.id !== b.id) {
                    var v = a.pos.sub(b.pos).norm();
                    var d = b.pos.dist(a.pos);
                    if(d < Math.PI / 2) {
                        //a.force = a.force.add( v.scale(repuls * Math.cos(d)));
                        a.force = a.force.add(v.scale(repuls * (Math.PI / 2 - d)));
                    };
                };
            });
        });
        // ### Calculate velocity
        graph.forEach(function(elem) {
            elem.velocity = elem.velocity.add(elem.force);
            elem.velocity = elem.velocity.scale(dampening);
            if(elem.velocity.length() > maxspeed) {
                elem.velocity.scale(maxspeed - elem.velocity.length());
            };
        });
        // ### Calculate position
        graph.forEach(function(elem) {
            var rescale = elem.velocity.length();
            elem.pos = elem.pos.add(elem.velocity.scale(1 / Math.sqrt(1 + rescale)));
        });
        // ### Blit and repeat
        drawGraph();
        if(running) {
            setTimeout(run, 0);
        };
    };
    var runno = 0;
    var drawGraph = function() {
        /*
        if((++runno) & 15) {
            return undefined;
        }
        */
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
        //ctx.fillText(passt, 0, 20);
        //ctx.fillText(JSON.stringify(graph.map(function(b){return graph[0].pos.dist(b.pos);})), 0,40);
    };
    run();
};
}
// graph algorithms {{{1
exports.updateParents = function(graph) {
    util.objForEach(graph, function(_, node) {
        node.parents = {};
    });
    util.objForEach(graph, function(nodeId, node) {
        util.objForEach(node.children, function(key, _) {
            graph[key].parents[nodeId] = true;
        });
    });
}
// Traverse a directed acyclic graph {{{2
// - simple stupid $O(|E|^2)$ algorhthm.
exports.traverseDAG = function(graph) {
    result = []
    exports.updateParents(graph);
    visited = {};
    prevLength = -1;
    while(result.length !== prevLength) {
        prevLength = result.length;
        util.objForEach(graph, function(nodeId, node) {
            if(!visited[nodeId]) {
                ok = true;
                Object.keys(node.parents).forEach(function(parentId) {
                    if(!visited[parentId]) {
                        ok = false;
                    }
                });
                if(ok) {
                    result.push(nodeId);
                    visited[nodeId] = true;
                }
            }
        });
    }
    return result;
};
// Ensure that a named node exists in a graph (or create it). {{{2
exports.ensureNode = function(graph, name) {
    if(!graph[name]) {
        graph[name] = {
            id: name,
            children: {}
        };
    }
};
// Add an edge to a graph, and add nodes if they doesn't exists {{{2
exports.addEdge = function(graph, from, to) {
    exports.ensureNode(graph, from);
    exports.ensureNode(graph, to);
    graph[from].children[to] = graph[from].children[to] || {};
};
// Export a graph into dot format {{{2
exports.toDot = function(graph) {
    // TODO
    throw 'transformation to graphviz not implemented yet';
};

// unit test {{{1
exports.test = function(test) {
    g = {};
    exports.addEdge(g, 'a', 'b');
    exports.addEdge(g, 'b', 'c');
    exports.addEdge(g, 'a', 'c');
    test.assertEqual(JSON.stringify(exports.traverseDAG(g)), '["a","b","c"]');
    exports.updateParents(g);
    test.assert(util.emptyObject(g.a.parents), 'a has no parents');
    test.assert(g.c.parents.a, 'c has parent a');
    test.done();
};
