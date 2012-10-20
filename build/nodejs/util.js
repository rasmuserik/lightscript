util = exports;
// Basic platform/language {{{1
// try-catch
exports.trycatch = Function("return function trycatch(fn,handle){try{return fn();}catch(e){return handle(e);}}")();
// delprop
exports.delprop = Function("return function delprop(obj,key){delete obj[key]}")();
// extend
exports.extend = function(a, b) {
    // outer: Object
    Object.keys(b).forEach(function(key) {
        // outer: b
        // outer: a
        a[key] = b[key];
    });
    return a;
};
// nextTick
if(true) {
    exports.nextTick = process.nextTick;
} else  {
    exports.nextTick = function(f) {
        // outer: setTimeout
        setTimeout(f, 0);
    };
};
// throttle function {{{1
// ## Throttle a function {{{2
exports.throttledFn = function(fn, delay) {
    // outer: Date
    // outer: Math
    // outer: setTimeout
    // outer: true
    // outer: this
    // outer: ;
    // outer: Array
    var callbacks;
    // outer: false
    var scheduled;
    var lastRun;
    delay = delay || 5000;
    lastRun = 0;
    scheduled = false;
    callbacks = [];
    return function(callback) {
        // outer: fn
        // outer: Array
        // outer: false
        // outer: lastRun
        // outer: Date
        // outer: delay
        // outer: Math
        // outer: setTimeout
        // outer: true
        var run;
        // outer: this
        var self;
        // outer: ;
        // outer: scheduled
        // outer: callbacks
        if(callback) {
            callbacks.push(callback);
        };
        if(scheduled) {
            return ;
        };
        self = this;
        run = function() {
            // outer: self
            // outer: fn
            // outer: Date
            // outer: lastRun
            // outer: Array
            // outer: callbacks
            // outer: false
            // outer: scheduled
            scheduled = false;
            callbacks = [];
            lastRun = Date.now();
            fn.call(self, function() {
                // outer: callbacks
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
// list to object
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
// async {{{3
exports.aForEach = function(arr, fn, done) {
    var cb;
    var count;
    count = arr.length;
    cb = function() {
        // outer: done
        // outer: count
        if(count === 0) {
            done();
        };
        --count;
    };
    cb();
    arr.forEach(function(key) {
        // outer: cb
        // outer: fn
        fn(key, cb);
    });
};
// uri/string-escape {{{1
// transform to urlsafe string
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
// local storage {{{1
if(true) {
    !(function() {
        // outer: null
        // outer: process
        // outer: require
        // outer: JSON
        // outer: Object
        // outer: exports
        var lastSync;
        var syncLocalStorage;
        // outer: util
        var db;
        db = util.trycatch(function() {
            // outer: process
            // outer: require
            // outer: JSON
            return JSON.parse(require("fs").readFileSync(process.env.HOME + "/data/local.sqlite3"));
        }, function() {
            // outer: Object
            return {};
        });
        syncLocalStorage = util.throttledFn(function() {
            // outer: null
            // outer: db
            // outer: JSON
            // outer: process
            // outer: require
            require("fs").writeFile(process.env.HOME + "/data/local.sqlite3", JSON.stringify(db, null, "  "));
        });
        lastSync = 0;
        exports.local = {set : function(key, val) {
            // outer: syncLocalStorage
            // outer: db
            db[key] = val;
            syncLocalStorage();
        }, get : function(key) {
            // outer: db
            return db[key];
        }};
    })();
} else if(typeof localStorage !== "undefined") {
    exports.local = {set : function(key, val) {
        // outer: localStorage
        localStorage.setItem(key, val);
    }, get : function(key) {
        // outer: localStorage
        localStorage.getItem(key);
    }};
};
// runonce {{{1
util.runonce = function(fn) {
    // outer: false
    // outer: arguments
    // outer: Array
    // outer: this
    // outer: true
    var execute;
    execute = true;
    return function() {
        // outer: false
        // outer: arguments
        // outer: Array
        // outer: this
        // outer: fn
        // outer: execute
        if(execute) {
            fn.apply(this, Array.prototype.slice.call(arguments, 0));
            execute = false;
        };
    };
};
// flatteArray {{{1
util.flattenArray = function(arr) {
    var flatten;
    // outer: Array
    var acc;
    acc = [];
    flatten = function(arr) {
        // outer: acc
        // outer: flatten
        // outer: Array
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
    // outer: Object
    var result;
    result = {};
    Object.keys(obj).forEach(function(key) {
        // outer: obj
        // outer: fn
        // outer: result
        result[key] = fn(obj[key]);
    });
    return result;
};
