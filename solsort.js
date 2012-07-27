// # Module setup {{{1
solsort = {};
/*global setTimeout:true, solsort:true, localStorage:true, window:true, document:true, alert:true, location:true */
(function() {
    "use strict";
    // # Utility functions {{{1
    // ## load an external .js file {{{2
    // TODO: callback parameter (+onreadychange etc.)
    solsort.loadJS = function(url) {
        var scriptElem = document.createElement('script');
        scriptElem.src = url;
        document.body.appendChild(scriptElem);
    };
    // ## identity function {{{2
    solsort.id = function(a) { return a; };
    // ## Throttle a function {{{2
    solsort.throttledFn = function(fn, delay) {
        var lastRun = 0;
        var scheduled = false;
        var callbacks = [];
        return function(callback) {
            callbacks.push(callback || solsort.id);
            if(scheduled) { return; }

            function run() {
                var result = fn();
                scheduled = false;
                callbacks.forEach(function(callback) { callback(result); });
                callbacks = [];
            }

            var now = Date.now();
            if(now-lastRun < delay) {
                scheduled = true;
                setTimeout(run, delay - (now-lastRun));
            } else {
                run();
            }
        };
    };
    // ## extract url parameters {{{2
    solsort.getVars = function() {
        // TODO: unencode urlencoding
        var result = {};
        window.location.search.slice(1).split('&').forEach(function(s) {
            var t = s.split('=');
            result[t[0]] = t[1];
        });
        return result;
    };
    // ## jsonp {{{2
    solsort.jsonp = function(uri, args, callback, callbackName) {
        // TODO: urlencode args
        // TODO: make reentrant
        // TODO: add timeout with error
        if(callback) {
            callbackName = callbackName || 'callback';
            args[callbackName] = 'solsortJSONP0';
            window.solsortJSONP0 = callback;
        }
        solsort.loadJS(uri + '?' +
            Object.keys(args).map(function(key) {
                return key + '=' + args[key];
            }).join('&'));
        /*
        document.write('<script src="'+ uri + '?' +
            Object.keys(args).map(function(key) {
                return key + '=' + args[key];
            }).join('&') + 
            '"></script>');
            */
    };
    solsort.error = function(err) {
        solsort.jsonp('http://solsort.com/clientError', {error: String(err)});
        alert('Error on solsort.com: \n' + err + '\nSorry, not quite bug free, if you are online, then the error has been reported...');
        throw err;
    };
    // # Storage  {{{1
    solsort.Storage = function(storageName, mergeFunction) {
        function sync(callback) {
            callback = callback || solsort.id;
        }
        function set(key, val) {
        }
        function get(key) {
        }
        function getSynced(key) {
        }
        
        return {
            sync: sync,
            set: set,
            get: get
        };
    };
    solsort.set = function(key, val) {
        return localStorage.getItem(key);
    };
    solsort.get = function(key) {
        return localStorage.getItem(key);
    };

    // # Login system {{{1
    // ## Update user interface: add loginbuttons to `#solsortLogin` {{{2
    function loginUI() {
        var solsortLogin= document.getElementById('solsortLogin');
        if(solsortLogin) {
            var userId = localStorage.getItem('userId');
            var userName = localStorage.getItem('userName');
            if(!userId) {
                solsortLogin.innerHTML = 
                    '<img src="/img/fontawesome/github.png" title="GitHub" alt="GitHub" onclick="solsort.loginGitHub()"/> ' +
                    '<img src="/img/fontawesome/facebook.png" title="Facebook" alt="Facebook" onclick="solsort.loginFacebook()"/> ' +
                    '<img src="/img/fontawesome/google.png" title="Google" alt="Google" onclick="solsort.loginGoogle()"/> ' +
                    '<span>&#8592; click <br/>to login</span>';
            } else {
                solsortLogin.innerHTML = '<a onclick="solsort.logout();">' +
                    '<span>' + userName + ' <br/>click to logout </span> ' +
                    '<img src="/img/fontawesome/' + userId.split(':')[0] + '.png">' +
                    '</a>';
            }
        }
    }
    // ## Logout {{{2
    solsort.logout = function() {
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        loginUI();
    };

    // ## solsort.login {{{2
    solsort.login = function() {
        var callback;
        for(var i = 0; i < arguments.length; ++i) {
            if(typeof arguments[i] === 'function') {
                callback = arguments[i];
            }
        }
        var user = localStorage.getItem('userId');
        if(user) {
            return callback(user);
        }
        throw 'not implemented yet';
    };

    // ## Internal utility functions {{{2
    // ### Log in to facebook {{{3
    solsort.loginFacebook = function() {
        localStorage.setItem('logging in', 'facebook');
        window.location = "https://www.facebook.com/dialog/oauth?client_id=201142456681777&redirect_uri=http://solsort.com/&scope=&response_type=token";
    };

    // ### Log in to github {{{3
    solsort.loginGitHub = function() {
        localStorage.setItem('logging in', 'github');
        window.location = 'https://github.com/login/oauth/authorize?client_id=cc14f7f75ff01bdbb1e7';
    };

    // ### Log in to google {{{3
    solsort.loginGoogle = function() {
        localStorage.setItem('logging in', 'google');
        window.location = 'https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/userinfo.profile&state=&redirect_uri=http://solsort.com/&response_type=token&client_id=500223099774.apps.googleusercontent.com';
    };

    // ### Utility for setting userid/username when logged in {{{3
    function loginAs(user, name) {
        localStorage.setItem('userId', user);
        localStorage.setItem('userName', name);
        solsort.jsonp('http://solsort.com/', {user: user, name: name});
        var loginFromUrl = localStorage.getItem('loginFromUrl');
        if(loginFromUrl) {
            localStorage.removeItem('loginFromUrl');
            window.location = loginFromUrl;
        }
    }

    // ### Handle second part of login, if magic cookie {{{3
    (function(){
        var loggingIn = localStorage.getItem('logging in');
        var access_token;
        if(loggingIn) {
            localStorage.removeItem('logging in');

            if(loggingIn === 'github') {
                solsort.jsonp('http://solsort.com/githubLogin', solsort.getVars(), function(access_token) {
                    access_token = access_token.replace(/.*access_token=/, '').replace(/&.*/, '');
                    solsort.jsonp('https://api.github.com/user', {access_token: access_token},
                        function(data) {
                            if(data.data.login) {
                                loginAs('github:' + data.data.login, data.data.name);
                                loginUI();
                            }
                        });
                });
            }

            if(loggingIn === 'facebook') {
                access_token = location.hash.replace(/.*access_token=/, '').replace(/&.*/, '');
                solsort.jsonp('https://graph.facebook.com/me', {access_token: access_token}, function(data) {
                    if(data.id) { 
                        loginAs('facebook:' + data.id, data.name);
                        loginUI();
                    }
                });
            }

            if(loggingIn === 'google') {
                access_token = location.hash.replace(/.*access_token=/, '').replace(/&.*/, '');
                solsort.jsonp('https://www.googleapis.com/oauth2/v1/userinfo', {access_token: access_token}, function(data) {
                    if(data.id) { 
                        loginAs('google:' + data.id, data.name);
                        loginUI();
                    }
                });
            }
        }
    })();
    // # Various initialisation on page
    loginUI();
    solsort.loadJS('http://solsort.com/store.js');
    /* document.write('<script src="http://solsort.com/store.js"></script>'); */
})();
