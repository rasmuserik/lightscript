// web {{{1
def("web", function(exports) {
    exports.main = function() {
        console.log("here");
        // TODO: remove the following line
        var solsort = exports;
        // # Utility functions {{{1
        // ## load an external .js file {{{2
        // TODO: callback parameter (+onreadychange etc.)
        exports.loadJS = function(url) {
            var scriptElem = document.createElement("script");
            scriptElem.src = url;
            document.body.appendChild(scriptElem);
        };
        // ## identity function {{{2
        exports.id = function(a) {
            return a;
        };
        // ## Throttle a function {{{2
        exports.throttledFn = function(fn, delay) {
            var lastRun = 0;
            var scheduled = false;
            return function(callback) {
                if(scheduled) {
                    return ;
                };
                var run = function() {
                    scheduled = false;
                    lastRun = Date.now();
                    fn();
                };
                scheduled = true;
                setTimeout(run, Math.max(0, delay - (Date.now() - lastRun)));
            };
        };
        // ## extract url parameters {{{2
        exports.getVars = function() {
            // TODO: unencode urlencoding
            var result = {};
            window.location.search.slice(1).split("&").forEach(function(s) {
                var t = s.split("=");
                result[t[0]] = t[1];
            });
            return result;
        };
        // ## jsonp {{{2
        exports.jsonp = function(uri, args, callback, callbackName) {
            // TODO: urlencode args
            // TODO: make reentrant
            // TODO: add timeout with error
            if(callback) {
                callbackName = callbackName || "callback";
                args[callbackName] = "solsortJSONP0";
                window.solsortJSONP0 = callback;
            };
            exports.loadJS(uri + "?" + Object.keys(args).map(function(key) {
                return key + "=" + args[key];
            }).join("&"));
        };
        exports.error = function(err) {
            exports.jsonp("http://solsort.com/clientError", {error : String(err)});
            alert("Error on solsort.com: \n" + err + "\nSorry, not quite bug free, if you are online, then the error has been reported...");
            throw err;
        };
        // # Storage  {{{1
        var stores = {};
        exports.Storage = function(storageName, mergeFunction) {
            if(stores[storageName]) {
                return stores[storageName];
            };
            // ## Private data {{{2
            var data = localStorage.getItem(storageName) || "{}";
            data = JSON.parse(storage.store);
            var syncCallbacks = [];
            // ## Synchronise with localStorage and server {{{2
            var sync = function() {
                var execSyncCallbacks = function() {
                    while(syncCallbacks.length) {
                        syncCallbacks.pop()();
                    };
                };
                localStorage.setItem(storageName, JSON.stringify(data));
                var user = localStorage.getItem("userId");
                if(!user) {
                    execSyncCallbacks();
                    return ;
                };
                // TODO: implement server-side sync
                execSyncCallbacks();
            };
            // ## Throttled version of synchronisation function {{{2
            var sync5s = exports.throttledFn(sync, 5000);
            var throttledSync = function(callback) {
                if(callback) {
                    syncCallbacks.push(callback);
                };
                sync5s();
            };
            // ## setters/getters {{{2
            var set = function(key, val) {
                data[key] = JSON.stringify(val);
                throttledSync();
            };
            var get = function(key) {
                return JSON.parse(data[key]);
            };
            // ## Create and return+cache store object {{{2
            var storage = {
                sync : throttledSync,
                set : set,
                get : get,
            };
            stores[storageName] = storage;
            return storage;
        };
        // # Login system {{{1
        // ## Update user interface: add loginbuttons to `#solsortLogin` {{{2
        var loginUI = function() {
            var solsortLogin = document.getElementById("solsortLogin");
            if(solsortLogin) {
                var userId = localStorage.getItem("userId");
                var userName = localStorage.getItem("userName");
                if(!userId) {
                    solsortLogin.innerHTML = "<ul class=\"nav\"><li class=\"dropdown\">" + "<a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">Login<b class=\"caret\"></b></a>" + "<ul class=\"dropdown-menu\">" + "<li><a href=\"javascript:use('web').loginGitHub()\"><span class=\"icon-github\"></span> github</a></li>" + "<li><a href=\"#\" onclick=\"use('web').loginFacebook()\"><span class=\"icon-facebook-sign\"></span> facebook</a></li>" + "<li><a href=\"#\" onclick=\"use('web').loginGoogle()\"><span class=\"icon-google-plus-sign\"></span> google</a></li>" + "</ul></li></ul>";
                } else  {
                    solsortLogin.innerHTML = "<ul class=\"nav\"><li><a onclick=\"use('web').logout();\">" + userName + "<span class=\"icon-" + {
                        github : "github",
                        facebook : "facebook-sign",
                        google : "google-plus-sign",
                    }[userId.split(":")[0]] + " icon-large\"></span>" + "logout" + "</a></li></ul>";
                };
            };
        };
        // ## Logout {{{2
        exports.logout = function() {
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
            loginUI();
        };
        // ## solsort.login {{{2
        exports.login = function() {
            var i = 0;
            while(i < arguments.length) {
                if(typeof arguments[i] === "function") {
                    var callback = arguments[i];
                };
                ++i;
            };
            var user = localStorage.getItem("userId");
            if(user) {
                return callback(user);
            };
            throw "not implemented yet";
        };
        // ## Internal utility functions {{{2
        // ### Log in to facebook {{{2
        exports.loginFacebook = function() {
            localStorage.setItem("logging in", "facebook");
            window.location = "https://www.facebook.com/dialog/oauth?client_id=201142456681777&redirect_uri=http://solsort.com/&scope=&response_type=token";
        };
        // ### Log in to github {{{3
        exports.loginGitHub = function() {
            localStorage.setItem("logging in", "github");
            window.location = "https://github.com/login/oauth/authorize?client_id=cc14f7f75ff01bdbb1e7";
        };
        // ### Log in to google {{{3
        exports.loginGoogle = function() {
            localStorage.setItem("logging in", "google");
            window.location = "https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/userinfo.profile&state=&redirect_uri=http://solsort.com/&response_type=token&client_id=500223099774.apps.googleusercontent.com";
        };
        // ### Utility for setting userid/username when logged in {{{3
        var loginAs = function(user, name) {
            localStorage.setItem("userId", user);
            localStorage.setItem("userName", name);
            exports.jsonp("http://solsort.com/", {user : user, name : name});
            var loginFromUrl = localStorage.getItem("loginFromUrl");
            if(loginFromUrl) {
                localStorage.removeItem("loginFromUrl");
                window.location = loginFromUrl;
            };
        };
        // ### Handle second part of login, if magic cookie {{{3
        var loggingIn = localStorage.getItem("logging in");
        if(loggingIn) {
            localStorage.removeItem("logging in");
            if(loggingIn === "github") {
                exports.jsonp("http://solsort.com/githubLogin", exports.getVars(), function(access_token) {
                    access_token = access_token.replace(RegExp(".*access_token="), "").replace(RegExp("&.*"), "");
                    exports.jsonp("https://api.github.com/user", {access_token : access_token}, function(data) {
                        if(data.data.login) {
                            loginAs("github:" + data.data.login, data.data.name);
                            loginUI();
                        };
                    });
                });
            };
            if(loggingIn === "facebook") {
                var access_token = location.hash.replace(RegExp(".*access_token="), "").replace(RegExp("&.*"), "");
                exports.jsonp("https://graph.facebook.com/me", {access_token : access_token}, function(data) {
                    if(data.id) {
                        loginAs("facebook:" + data.id, data.name);
                        loginUI();
                    };
                });
            };
            if(loggingIn === "google") {
                access_token = location.hash.replace(RegExp(".*access_token="), "").replace(RegExp("&.*"), "");
                exports.jsonp("https://www.googleapis.com/oauth2/v1/userinfo", {access_token : access_token}, function(data) {
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
