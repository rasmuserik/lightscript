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
        var user = localStorage.getItem('userId');
        if(user) {
            return callback(user);
        }
        throw 'not implemented yet';
    }

    solsort.loginFacebook = function() {
        localStorage.setItem('logging in', 'facebook');
        window.location = "https://www.facebook.com/dialog/oauth?client_id=201142456681777&redirect_uri=http://solsort.com/&scope=&response_type=token";
    }

    solsort.loginGitHub = function() {
        localStorage.setItem('logging in', 'github');
        window.location = 'https://github.com/login/oauth/authorize?client_id=cc14f7f75ff01bdbb1e7';
    }
    solsort.loginTwitter = function() {
        localStorage.setItem('logging in', 'twitter');
        window.location='https://oauth.twitter.com/2/authorize?oauth_callback_url=http://solsort.com/&oauth_mode=flow_web_client&oauth_client_identifier=WzcFlvqd3GskSoFsOt25A&redirect_uri=http://solsort.com/&response_type=token&client_id=WzcFlvqd3GskSoFsOt25A'
    }

    function loginAs(user, name) {
        localStorage.setItem('userId', user);
        localStorage.setItem('userName', name);
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
                solsort.jsonp('http://solsort.com/githubLogin', solsort.getVars(), function(access_token) {
                    access_token = access_token.replace(/.*access_token=/, '').replace(/&.*/, '');
                    solsort.jsonp('https://api.github.com/user', {access_token: access_token},
                        function(data) {
                            if(data.data.login) {
                                loginAs('github:' + data.data.login, data.data.name);
                            };
                        });
                });
            }

            if(loggingIn === 'facebook') {
                var access_token = location.hash.replace(/.*access_token=/, '').replace(/&.*/, '');
                solsort.jsonp('https://graph.facebook.com/me', {access_token: access_token}, function(data) {
                    if(data.id) { 
                        loginAs('facebook:' + data.id, data.name);
                    }
                });
            }
            if(loggingIn === 'twitter') {
                var access_token = location.hash.replace(/.*oauth_access_token=/, '').replace(/&.*/, '');
                solsort.jsonp('https://api.twitter.com/2/account/verify_credentials.json', {access_token: access_token}, function(data) {
                    console.log(data);
                    if(data.id) { 
                        loginAs('facebook:' + data.id, data.name);
                    }
                });
            }
        }
    }();
})();
