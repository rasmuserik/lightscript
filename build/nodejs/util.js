use=require("./module").use;def=require("./module").def;
def("util", function(exports) {
    // outer: RegExp
    // outer: true
    // outer: setTimeout
    // outer: Object
    // outer: process
    // outer: navigator
    // outer: undefined
    // outer: Function
    exports.trycatch = Function("return function trycatch(fn,handle){try{return fn();}catch(e){return handle(e);}}")();
    exports.extend = function(a, b) {
        // outer: Object
        Object.keys(b).forEach(function(key) {
            // outer: b
            // outer: a
            a[key] = b[key];
        });
        return a;
    };
    exports.platform = undefined;
    if(typeof navigator !== "undefined" && navigator.userAgent) {
        exports.platform = "web";
    };
    if(typeof process !== "undefined" && process.versions && process.versions.node) {
        exports.platform = "node";
    };
    if(exports.platform === "node") {
        exports.nextTick = process.nextTick;
    } else  {
        exports.nextTick = function(f) {
            // outer: setTimeout
            setTimeout(f, 0);
        };
    };
    exports.listpp = function(list, indent) {
        // outer: exports
        var len;
        var result;
        indent = indent || "  ";
        if(typeof list === "string") {
            return list;
        };
        result = list.map(function(elem) {
            // outer: indent
            // outer: exports
            return exports.listpp(elem, indent + "  ");
        });
        len = 0;
        result.forEach(function(elem) {
            // outer: len
            len += elem.length + 1;
        });
        if(len < 72) {
            return "[" + result.join(" ") + "]";
        } else  {
            return "[" + result.join("\n" + indent) + "]";
        };
    };
    exports.list2obj = function(arr) {
        // outer: true
        // outer: Object
        var result;
        result = {};
        arr.forEach(function(elem) {
            // outer: true
            // outer: result
            result[elem] = true;
        });
        return result;
    };
    exports.name2url = function(name) {
        // outer: Object
        // outer: RegExp
        return name.replace(RegExp("[^a-zA-Z0-9_-]", "g"), function(c) {
            // outer: Object
            var subs;
            subs = {
                "Æ" : "AE",
                "Ø" : "O",
                "Å" : "AA",
                "æ" : "ae",
                "ø" : "o",
                "å" : "aa",
                "é" : "e",
                "?" : "",
                ":" : "",
                " " : "_",
            };
            if(typeof subs[c] === "string") {
                return "_";
            } else  {
                return subs[c];
            };
        });
    };
});
