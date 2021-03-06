// outer: arguments
// outer: null
// outer: JSON
// outer: RegExp
// outer: Date
// outer: Math
// outer: true
// outer: this
// outer: ;
// outer: Array
// outer: false
// outer: setTimeout
var dirs;
// outer: require
var fs;
// outer: Object
// outer: localStorage
// outer: process
// outer: Function
// outer: exports
var util;
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
} else if(undefined) {} else if(undefined) {};
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
// emptyObject {{{1
exports.emptyObject = function(obj) {
    // outer: Object
    return Object.keys(obj).length === 0;
};
// strStartsWith {{{1
exports.strStartsWith = function(str1, str2) {
    return str1.slice(0, str2.length) === str2;
};
// objForEach {{{1
exports.objForEach = function(obj, fn) {
    // outer: Object
    Object.keys(obj).forEach(function(key) {
        // outer: obj
        // outer: fn
        fn(key, obj[key]);
    });
};
// mkdir,cp,mtime {{{1
if(true) {
    fs = require("fs");
    dirs = {};
    exports.mkdir = function(path) {
        // outer: true
        // outer: exports
        // outer: fs
        // outer: dirs
        if(!dirs[path] && !fs.existsSync(path)) {
            path = path.split("/");
            while(!path[path.length - 1]) {
                path.pop();
            };
            exports.mkdir(path.slice(0, - 1).join("/"));
            fs.mkdirSync(path.join("/"));
            dirs[path] = true;
        };
    };
    exports.cp = function(src, dst, callback) {
        // outer: fs
        // outer: require
        require("util").pump(fs.createReadStream(src), fs.createWriteStream(dst), callback);
    };
    exports.mtime = function(filename) {
        // outer: fs
        // outer: util
        return util.trycatch(function() {
            // outer: filename
            // outer: fs
            return fs.statSync(filename).mtime.getTime();
        }, function() {
            return 0;
        });
    };
};
// shuffle array {{{1
exports.shuffleArray = function(arr) {
    var t;
    // outer: Math
    var r;
    var i;
    i = arr.length;
    while(i) {
        --i;
        r = Math.random() * arr.length | 0;
        t = arr[i];
        arr[i] = arr[r];
        arr[r] = t;
    };
    return arr;
};
// pick a random array element {{{1
exports.arrayPick = function(arr) {
    // outer: Math
    return arr[Math.random() * arr.length | 0];
};
// save/load json {{{1
if(true) {
    exports.saveJSON = function(filename, content, callback) {
        // outer: JSON
        // outer: require
        require("fs").writeFile(filename, JSON.stringify(content), callback);
    };
    exports.loadJSONSync = function(filename, defaultVal) {
        // outer: require
        // outer: JSON
        // outer: Object
        // outer: util
        var fn;
        if(!defaultVal) {
            defaultVal = function(e) {
                // outer: Object
                return {err : e};
            };
        };
        fn = typeof defaultVal === "function" ? defaultVal : function(err) {
            // outer: defaultVal
            return defaultVal;
        };
        return util.trycatch(function() {
            // outer: filename
            // outer: require
            // outer: JSON
            return JSON.parse(require("fs").readFileSync(filename, "utf8"));
        }, fn);
    };
};
// Testrunner {{{1
exports.test = function(test) {
    // outer: Object
    var obj;
    var count;
    // outer: exports
    var result;
    var jsontest;
    if(true) {
        jsontest = test.create("load/save-JSON");
        result = exports.loadJSONSync("/does/not/exists", 1);
        jsontest.assertEqual(result, 1);
        exports.saveJSON("/tmp/exports-save-json-testb", 2);
        exports.saveJSON("/tmp/exports-save-json-test", 2, function() {
            // outer: jsontest
            // outer: exports
            // outer: result
            result = exports.loadJSONSync("/tmp/exports-save-json-test", 1);
            jsontest.assertEqual(result, 2);
            jsontest.done();
        });
    };
    count = 0;
    obj = {a : 1, b : 2};
    exports.objForEach(obj, function(key, val) {
        // outer: count
        // outer: obj
        // outer: test
        test.assert(key && obj[key] === val, "objforeach");
        ++count;
    });
    test.assertEqual(count, 2, "objforeach count");
    test.assert(exports.strStartsWith("foobarbaz", "foobar"), "strstartswith1");
    test.assert(!exports.strStartsWith("qoobarbaz", "foobar"), "strstartswith2");
    test.assert(exports.strStartsWith("foobarbaz", ""), "strstartswith3");
    test.assert(!exports.strStartsWith("foo", "foobar"), "strstartswith4");
    test.done();
};
