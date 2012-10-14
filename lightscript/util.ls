util = exports;
// Basic platform/language {{{1
// try-catch
exports.trycatch = Function("return function trycatch(fn,handle){try{return fn();}catch(e){return handle(e);}}")();
// delprop
exports.delprop = Function("return function delprop(obj,key){delete obj[key]}")();
// extend
exports.extend = function(a, b) {
    Object.keys(b).forEach(function(key) {
        a[key] = b[key];
    });
    return a;
};
// platform
exports.platform = undefined;
if(typeof navigator !== "undefined" && navigator.userAgent) {
    exports.platform = "web";
};
if(typeof process !== "undefined" && process.versions && process.versions.node) {
    exports.platform = "node";
};
// nextTick
if(util.platform === "node") {
    exports.nextTick = process.nextTick;
} else  {
    exports.nextTick = function(f) {
        setTimeout(f, 0);
    };
};
// throttle function {{{1
// ## Throttle a function {{{2
exports.throttledFn = function(fn, delay) {
    delay = delay || 5000;
    var lastRun = 0;
    var scheduled = false;
    var callbacks = [];
    return function(callback) {
        if(callback) {
            callbacks.push(callback);
        };
        if(scheduled) {
            return ;
        };
        var self = this;
        var run = function() {
            scheduled = false;
            callbacks = [];
            lastRun = Date.now();
            fn.call(self, function() {
                callbacks.forEach(function(f) {
                    f();
                });
            });
        };
        scheduled = true;
        setTimeout(run, Math.max(0, delay - (Date.now() - lastRun)));
    };
};
// List utils {{{1
// list-prettyprint
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
// list to object
exports.list2obj = function(arr) {
    var result = {};
    arr.forEach(function(elem) {
        result[elem] = true;
    });
    return result;
};
// async {{{3
exports.aForEach = function(arr, fn, done) {
    var count = arr.length;
    var cb = function() {
        if(count === 0) {
            done();
        };
        --count;
    };
    cb();
    arr.forEach(function(key) {
        fn(key, cb);
    });
};
// uri/string-escape {{{1
// transform to urlsafe string
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
// local storage {{{1
if(util.platform === "node") {
    !(function() {
        var db = util.trycatch(function() {
            return JSON.parse(require("fs").readFileSync(process.env.HOME + "/data/local.sqlite3"));
        }, function() {
            return {};
        });
        var syncLocalStorage = util.throttledFn(function() {
            require("fs").writeFile(process.env.HOME + "/data/local.sqlite3", JSON.stringify(db, null, "  "));
        });
        var lastSync = 0;
        exports.local = {set : function(key, val) {
            db[key] = val;
            syncLocalStorage();
        }, get : function(key) {
            return db[key];
        }};
    })();
} else if(typeof localStorage !== "undefined") {
    exports.local = {set : function(key, val) {
        localStorage.setItem(key, val);
    }, get : function(key) {
        localStorage.getItem(key);
    }};
};
// runonce {{{1
util.runonce = function(fn) {
    var execute = true;
    return function() {
        if(execute) {
            fn.apply(this, Array.prototype.slice.call(arguments, 0));
            execute = false;
        };
    };
};
// flatteArray {{{1
util.flattenArray = function(arr) {
    var acc = [];
    var flatten = function(arr) {
        if(Array.isArray(arr)) {
            arr.forEach(flatten);
        } else  {
            acc.push(arr);
        };
    };
    flatten(arr);
    return acc;
};
// valmap {{{1
util.valmap = function(obj, fn) {
    var result = {};
    Object.keys(obj).forEach(function(key) {
        result[key] = fn(obj[key]);
    });
    return result;
};
