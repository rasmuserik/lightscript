solsort = {};
(function() {
    solsort.set = function(key, val) {
        return localStorage.getItem(name);
    }
    solsort.get = function(key) {
        return localStorage.getItem(name);
    }
    solsort.getVars = function() {
        // TODO: unencode urlencoding
        var result = {};
        window.location.search.slice(1).split('&').forEach(function(s) {
            var t = s.split('=');
            result[t[0]] = t[1];
        });
        return result;
    }
    solsort.jsonp = function(uri, args, callback, callbackName) {
        // TODO: urlencode args
        // TODO: make reentrant
        // TODO: add timeout with error
        if(callback) {
            callbackName = callbackName || 'callback';
            args[callbackName] = 'solsortJSONP0';
            window.solsortJSONP0 = callback;
        }
        document.write('<script src="'+ uri + '?' +
            Object.keys(args).map(function(key) {
                return key + '=' + args[key];
            }).join('&') + 
            '"></script>');
    };
    solsort.error = function(err) {
        alert('Error: ' + err);
        solsort.jsonp('http://solsort.com/clientError', {error: err});
        throw err;
    };

    solsort.login = function(callback) {
        var user = localStorage.getItem('user');
        if(user) {
            return callback(user);
        }
        throw 'not implemented yet';
    }

    solsort.loginFacebook = function() {
        window.location = "https://www.facebook.com/dialog/oauth?client_id=201142456681777&redirect_uri=solsort.com&scope=user_about_me&response_type=token";
    }

    solsort.loginGitHub = function() {
        localStorage.setItem('logging in', 'github');
        window.location = 'https://github.com/login/oauth/authorize?client_id=cc14f7f75ff01bdbb1e7';
    }

    function loginAs(user) {
        localStorage.setItem('user', user);
        var loginFromUrl = localStorage.getItem('loginFromUrl');
        if(loginFromUrl) {
            localStorage.removeItem('loginFromUrl');
            window.location = loginFromUrl;
        }
    }

    !function(){
        var loggingIn = localStorage.getItem('logging in');
        if(loggingIn) {
            localStorage.removeItem('logging in');
            if(loggingIn === 'github') {
                console.log(solsort.getVars());
                solsort.jsonp('http://solsort.com/githubLogin', solsort.getVars(), function(access_token) {
                    access_token = access_token.replace(/.*access_token=/, '').replace(/&.*/, '');
                    solsort.jsonp('https://api.github.com/user', {access_token: access_token},
                        function(data) {
                            loginAs('github:' + data.data.login);
                        });
                });
            }
        }
    }();
})();
