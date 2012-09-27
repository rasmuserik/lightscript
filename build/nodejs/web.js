
use = require("./module").use;
def = require("./module").def;
// web {{{1
def("web", function(exports) {
    // outer: arguments
    // outer: Array
    // outer: JSON
    // outer: alert
    // outer: String
    // outer: window
    // outer: Date
    // outer: Math
    // outer: setTimeout
    // outer: true
    // outer: ;
    // outer: false
    // outer: document
    // outer: RegExp
    // outer: location
    // outer: localStorage
    // outer: Object
    // outer: console
    exports.main = function() {
        // outer: arguments
        // outer: Array
        // outer: JSON
        // outer: alert
        // outer: String
        // outer: window
        // outer: Date
        // outer: Math
        // outer: setTimeout
        // outer: true
        // outer: ;
        // outer: false
        // outer: document
        // outer: RegExp
        // outer: location
        var access_token;
        // outer: localStorage
        var loggingIn;
        var loginAs;
        var loginUI;
        // outer: Object
        var stores;
        // outer: exports
        var solsort;
        // outer: console
        console.log("here");
        // TODO: remove the following line
        solsort = exports;
        // # Utility functions {{{2
        // ## load an external .js file {{{3
        // TODO: callback parameter (+onreadychange etc.)
        exports.loadJS = function(url) {
            // outer: document
            var scriptElem;
            scriptElem = document.createElement("script");
            scriptElem.src = url;
            document.body.appendChild(scriptElem);
        };
        // ## identity function {{{3
        exports.id = function(a) {
            return a;
        };
        // ## Throttle a function {{{3
        exports.throttledFn = function(fn, delay) {
            // outer: Date
            // outer: Math
            // outer: setTimeout
            // outer: true
            // outer: ;
            // outer: false
            var scheduled;
            var lastRun;
            lastRun = 0;
            scheduled = false;
            return function(callback) {
                // outer: fn
                // outer: false
                // outer: lastRun
                // outer: Date
                // outer: delay
                // outer: Math
                // outer: setTimeout
                // outer: true
                var run;
                // outer: ;
                // outer: scheduled
                if(scheduled) {
                    return ;
                };
                run = function() {
                    // outer: fn
                    // outer: Date
                    // outer: lastRun
                    // outer: false
                    // outer: scheduled
                    scheduled = false;
                    lastRun = Date.now();
                    fn();
                };
                scheduled = true;
                setTimeout(run, Math.max(0, delay - (Date.now() - lastRun)));
            };
        };
        // ## extract url parameters {{{3
        exports.getVars = function() {
            // outer: window
            // outer: Object
            var result;
            // TODO: unencode urlencoding
            result = {};
            window.location.search.slice(1).split("&").forEach(function(s) {
                // outer: result
                var t;
                t = s.split("=");
                result[t[0]] = t[1];
            });
            return result;
        };
        // ## jsonp {{{3
        exports.jsonp = function(uri, args, callback, callbackName) {
            // outer: Object
            // outer: exports
            // outer: window
            // TODO: urlencode args
            // TODO: make reentrant
            // TODO: add timeout with error
            if(callback) {
                callbackName = callbackName || "callback";
                args[callbackName] = "solsortJSONP0";
                window.solsortJSONP0 = callback;
            };
            exports.loadJS(uri + "?" + Object.keys(args).map(function(key) {
                // outer: args
                return key + "=" + args[key];
            }).join("&"));
        };
        exports.error = function(err) {
            // outer: alert
            // outer: String
            // outer: Object
            // outer: exports
            exports.jsonp("http://solsort.com/clientError", {"error" : String(err)});
            alert("Error on solsort.com: \n" + err + "\nSorry, not quite bug free, if you are online, then the error has been reported...");
            throw err;
        };
        // # Storage  {{{2
        stores = {};
        exports.Storage = function(storageName, mergeFunction) {
            // outer: ;
            // outer: Object
            var get;
            var set;
            var throttledSync;
            // outer: exports
            var sync5s;
            var sync;
            // outer: Array
            var syncCallbacks;
            var storage;
            // outer: JSON
            // outer: localStorage
            var data;
            // outer: stores
            if(stores[storageName]) {
                return stores[storageName];
            };
            // ## Private data {{{3
            data = localStorage.getItem(storageName) || "{}";
            data = JSON.parse(storage.store);
            syncCallbacks = [];
            // ## Synchronise with localStorage and server {{{3
            sync = function() {
                // outer: syncCallbacks
                // outer: ;
                var user;
                // outer: data
                // outer: JSON
                // outer: storageName
                // outer: localStorage
                var execSyncCallbacks;
                execSyncCallbacks = function() {
                    // outer: syncCallbacks
                    while(syncCallbacks.length) {
                        syncCallbacks.pop()();
                    };
                };
                localStorage.setItem(storageName, JSON.stringify(data));
                user = localStorage.getItem("userId");
                if(!user) {
                    execSyncCallbacks();
                    return ;
                };
                // TODO: implement server-side sync
                execSyncCallbacks();
            };
            // ## Throttled version of synchronisation function {{{3
            sync5s = exports.throttledFn(sync, 5000);
            throttledSync = function(callback) {
                // outer: sync5s
                // outer: syncCallbacks
                if(callback) {
                    syncCallbacks.push(callback);
                };
                sync5s();
            };
            // ## setters/getters {{{3
            set = function(key, val) {
                // outer: throttledSync
                // outer: JSON
                // outer: data
                data[key] = JSON.stringify(val);
                throttledSync();
            };
            get = function(key) {
                // outer: data
                // outer: JSON
                return JSON.parse(data[key]);
            };
            // ## Create and return+cache store object {{{3
            storage = {
                "sync" : throttledSync,
                "set" : set,
                "get" : get,
            };
            stores[storageName] = storage;
            return storage;
        };
        // # Login system {{{2
        // ## Update user interface: add loginbuttons to `#solsortLogin` {{{3
        loginUI = function() {
            // outer: Object
            var userName;
            // outer: localStorage
            var userId;
            // outer: document
            var solsortLogin;
            solsortLogin = document.getElementById("solsortLogin");
            if(solsortLogin) {
                userId = localStorage.getItem("userId");
                userName = localStorage.getItem("userName");
                if(!userId) {
                    solsortLogin.innerHTML = "<ul class=\"nav\"><li class=\"dropdown\">" + "<a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">Login<b class=\"caret\"></b></a>" + "<ul class=\"dropdown-menu\">" + "<li><a href=\"javascript:use('web').loginGitHub()\"><span class=\"icon-github\"></span> github</a></li>" + "<li><a href=\"#\" onclick=\"use('web').loginFacebook()\"><span class=\"icon-facebook-sign\"></span> facebook</a></li>" + "<li><a href=\"#\" onclick=\"use('web').loginGoogle()\"><span class=\"icon-google-plus-sign\"></span> google</a></li>" + "</ul></li></ul>";
                } else  {
                    solsortLogin.innerHTML = "<ul class=\"nav\"><li><a onclick=\"use('web').logout();\">" + userName + "<span class=\"icon-" + {
                        "github" : "github",
                        "facebook" : "facebook-sign",
                        "google" : "google-plus-sign",
                    }[userId.split(":")[0]] + " icon-large\"></span>" + "logout" + "</a></li></ul>";
                };
            };
        };
        // ## Logout {{{3
        exports.logout = function() {
            // outer: loginUI
            // outer: localStorage
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
            loginUI();
        };
        // ## solsort.login {{{3
        exports.login = function() {
            // outer: localStorage
            var user;
            var callback;
            // outer: arguments
            var i;
            i = 0;
            while(i < arguments.length) {
                if(typeof arguments[i] === "function") {
                    callback = arguments[i];
                };
                ++i;
            };
            user = localStorage.getItem("userId");
            if(user) {
                return callback(user);
            };
            throw "not implemented yet";
        };
        // ## Internal utility functions {{{3
        // ### Log in to facebook {{{3
        exports.loginFacebook = function() {
            // outer: window
            // outer: localStorage
            localStorage.setItem("logging in", "facebook");
            window.location = "https://www.facebook.com/dialog/oauth?client_id=201142456681777&redirect_uri=http://solsort.com/&scope=&response_type=token";
        };
        // ### Log in to github {{{4
        exports.loginGitHub = function() {
            // outer: window
            // outer: localStorage
            localStorage.setItem("logging in", "github");
            window.location = "https://github.com/login/oauth/authorize?client_id=cc14f7f75ff01bdbb1e7";
        };
        // ### Log in to google {{{4
        exports.loginGoogle = function() {
            // outer: window
            // outer: localStorage
            localStorage.setItem("logging in", "google");
            window.location = "https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/userinfo.profile&state=&redirect_uri=http://solsort.com/&response_type=token&client_id=500223099774.apps.googleusercontent.com";
        };
        // ### Utility for setting userid/username when logged in {{{4
        loginAs = function(user, name) {
            // outer: window
            var loginFromUrl;
            // outer: Object
            // outer: exports
            // outer: localStorage
            localStorage.setItem("userId", user);
            localStorage.setItem("userName", name);
            exports.jsonp("http://solsort.com/", {"user" : user, "name" : name});
            loginFromUrl = localStorage.getItem("loginFromUrl");
            if(loginFromUrl) {
                localStorage.removeItem("loginFromUrl");
                window.location = loginFromUrl;
            };
        };
        // ### Handle second part of login, if magic cookie {{{4
        loggingIn = localStorage.getItem("logging in");
        if(loggingIn) {
            localStorage.removeItem("logging in");
            if(loggingIn === "github") {
                exports.jsonp("http://solsort.com/githubLogin", exports.getVars(), function(access_token) {
                    // outer: loginUI
                    // outer: loginAs
                    // outer: Object
                    // outer: exports
                    // outer: RegExp
                    access_token = access_token.replace(RegExp(".*access_token="), "").replace(RegExp("&.*"), "");
                    exports.jsonp("https://api.github.com/user", {"access_token" : access_token}, function(data) {
                        // outer: loginUI
                        // outer: loginAs
                        if(data.data.login) {
                            loginAs("github:" + data.data.login, data.data.name);
                            loginUI();
                        };
                    });
                });
            };
            if(loggingIn === "facebook") {
                access_token = location.hash.replace(RegExp(".*access_token="), "").replace(RegExp("&.*"), "");
                exports.jsonp("https://graph.facebook.com/me", {"access_token" : access_token}, function(data) {
                    // outer: loginUI
                    // outer: loginAs
                    if(data.id) {
                        loginAs("facebook:" + data.id, data.name);
                        loginUI();
                    };
                });
            };
            if(loggingIn === "google") {
                access_token = location.hash.replace(RegExp(".*access_token="), "").replace(RegExp("&.*"), "");
                exports.jsonp("https://www.googleapis.com/oauth2/v1/userinfo", {"access_token" : access_token}, function(data) {
                    // outer: loginUI
                    // outer: loginAs
                    if(data.id) {
                        loginAs("google:" + data.id, data.name);
                        loginUI();
                    };
                });
            };
        };
        // # Various initialisation on page
        loginUI();
        exports.loadJS("http://solsort.com/store.js");
    };
});
