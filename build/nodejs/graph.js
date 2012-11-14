// outer: JSON
// outer: false
// outer: undefined
// outer: setTimeout
// outer: Math
// outer: Array
// outer: Object
// outer: true
var V2d;
var log;
// outer: exports
// outer: require
var util;
util = require("./util");
if(undefined) {};
// graph algorithms {{{1
exports.updateParents = function(graph) {
    // outer: true
    // outer: Object
    // outer: util
    util.objForEach(graph, function(_, node) {
        // outer: Object
        node.parents = {};
    });
    util.objForEach(graph, function(nodeId, node) {
        // outer: true
        // outer: graph
        // outer: util
        util.objForEach(node.children, function(key, _) {
            // outer: true
            // outer: nodeId
            // outer: graph
            graph[key].parents[nodeId] = true;
        });
    });
};
// Traverse a directed acyclic graph {{{2
// - simple stupid $O(|E|^2)$ algorhthm.
exports.traverseDAG = function(graph) {
    // outer: false
    // outer: true
    // outer: util
    var prevLength;
    // outer: Object
    var visited;
    // outer: exports
    // outer: Array
    var result;
    result = [];
    exports.updateParents(graph);
    visited = {};
    prevLength = - 1;
    while(result.length !== prevLength) {
        prevLength = result.length;
        util.objForEach(graph, function(nodeId, node) {
            // outer: false
            // outer: result
            // outer: Object
            // outer: true
            var ok;
            // outer: visited
            if(!visited[nodeId]) {
                ok = true;
                Object.keys(node.parents).forEach(function(parentId) {
                    // outer: false
                    // outer: ok
                    // outer: visited
                    if(!visited[parentId]) {
                        ok = false;
                    };
                });
                if(ok) {
                    result.push(nodeId);
                    visited[nodeId] = true;
                };
            };
        });
    };
    return result;
};
// Ensure that a named node exists in a graph (or create it). {{{2
exports.ensureNode = function(graph, name) {
    // outer: Object
    if(!graph[name]) {
        graph[name] = {id : name, children : {}};
    };
};
// Add an edge to a graph, and add nodes if they doesn't exists {{{2
exports.addEdge = function(graph, from, to) {
    // outer: Object
    // outer: exports
    exports.ensureNode(graph, from);
    exports.ensureNode(graph, to);
    graph[from].children[to] = graph[from].children[to] || {};
};
// Export a graph into dot format {{{2
exports.toDot = function(graph) {
    // TODO
    throw "transformation to graphviz not implemented yet";
};
// unit test {{{1
exports.test = function(test) {
    // outer: util
    // outer: JSON
    // outer: exports
    // outer: Object
    var g;
    g = {};
    exports.addEdge(g, "a", "b");
    exports.addEdge(g, "b", "c");
    exports.addEdge(g, "a", "c");
    test.assertEqual(JSON.stringify(exports.traverseDAG(g)), "[\"a\",\"b\",\"c\"]");
    exports.updateParents(g);
    test.assert(util.emptyObject(g.a.parents), "a has no parents");
    test.assert(g.c.parents.a, "c has parent a");
    test.done();
};
