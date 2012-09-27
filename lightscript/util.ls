
use = require("./module").use;
def = require("./module").def;
// Util {{{1
def("util", function(exports) {
    exports.trycatch = Function("return function trycatch(fn,handle){try{return fn();}catch(e){return handle(e);}}")();
    exports.extend = function(a, b) {
        Object.keys(b).forEach(function(key) {
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
            setTimeout(f, 0);
        };
    };
    exports.listpp = function(list, indent) {
        indent = indent || "  ";
        if(typeof list === "string") {
            return list;
        };
        var result = list.map(function(elem) {
            return exports.listpp(elem, indent + "  ");
        });
        var len = 0;
        result.forEach(function(elem) {
            len += elem.length + 1;
        });
        if(len < 72) {
            return "[" + result.join(" ") + "]";
        } else  {
            return "[" + result.join("\n" + indent) + "]";
        };
    };
    exports.list2obj = function(arr) {
        var result = {};
        arr.forEach(function(elem) {
            result[elem] = true;
        });
        return result;
    };
    exports.name2url = function(name) {
        return name.replace(RegExp("[^a-zA-Z0-9_-]", "g"), function(c) {
            var subs = {
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
