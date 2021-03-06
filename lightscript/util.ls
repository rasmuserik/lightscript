var util = exports;
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
// nextTick
if(`compiler.nodejs) {
    exports.nextTick = process.nextTick;
} else if(`compiler.webjs) {
    exports.nextTick = function(f) {
        setTimeout(f, 0);
    };
} else if(`compiler.mozjs) {
    exports.nextTick = function(f) {
        require("timers").setTimeout(f, 0);
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
if(`compiler.nodejs) {
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
// emptyObject {{{1
exports.emptyObject = function(obj) {
    return Object.keys(obj).length === 0;
};
// strStartsWith {{{1
exports.strStartsWith = function(str1, str2) {
    return str1.slice(0, str2.length) === str2;
};
// objForEach {{{1
exports.objForEach = function(obj, fn) {
    Object.keys(obj).forEach(function(key) {
        fn(key, obj[key]);
    });
};
// mkdir,cp,mtime {{{1
if(`compiler.nodejs) {
    var fs = require("fs");
    var dirs = {};
    exports.mkdir = function(path) {
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
        require("util").pump(fs.createReadStream(src), fs.createWriteStream(dst), callback);
    };
    exports.mtime = function(filename) {
        return util.trycatch(function() {
            return fs.statSync(filename).mtime.getTime();
        }, function() {
            return 0;
        });
    };
};
// shuffle array {{{1
exports.shuffleArray = function(arr) {
    var i = arr.length;
    while(i) {
        --i;
        var r = Math.random() * arr.length | 0;
        var t = arr[i];
        arr[i] = arr[r];
        arr[r] = t;
    };
    return arr;
};
// pick a random array element {{{1
exports.arrayPick = function(arr) {
    return arr[Math.random() * arr.length | 0];
};
// save/load json {{{1
if(`compiler.nodejs) {
    exports.saveJSON = function(filename, content, callback) {
        require("fs").writeFile(filename, JSON.stringify(content), callback);
    };
    exports.loadJSONSync = function(filename, defaultVal) {
        if(!defaultVal) {
            defaultVal = function(e) {
                return {err : e};
            };
        };
        var fn = typeof defaultVal === "function" ? defaultVal : function(err) {
            return defaultVal;
        };
        return util.trycatch(function() {
            return JSON.parse(require("fs").readFileSync(filename, "utf8"));
        }, fn);
    };
};
// Testrunner {{{1
exports.test = function(test) {
    if(`compiler.nodejs) {
        var jsontest = test.create("load/save-JSON");
        var result = exports.loadJSONSync("/does/not/exists", 1);
        jsontest.assertEqual(result, 1);
        exports.saveJSON("/tmp/exports-save-json-testb", 2);
        exports.saveJSON("/tmp/exports-save-json-test", 2, function() {
            result = exports.loadJSONSync("/tmp/exports-save-json-test", 1);
            jsontest.assertEqual(result, 2);
            jsontest.done();
        });
    };
    var count = 0;
    var obj = {a : 1, b : 2};
    exports.objForEach(obj, function(key, val) {
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
