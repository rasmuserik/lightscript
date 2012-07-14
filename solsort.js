console.log('here');
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

    solsort.loginGH = function() {
        localStorage.setItem('logging in', 'github');
        window.location = 'https://github.com/login/oauth/authorize?client_id=cc14f7f75ff01bdbb1e7';
    }

    !function(){
        var loggingIn = localStorage.getItem('logging in');
        if(loggingIn) {
            localStorage.removeItem('logging in');
            if(loggingIn === 'github') {
                console.log(solsort.getVars());
                solsort.jsonp('http://solsort.com/githubLogin', solsort.getVars(), function(access_token) {
                    access_token = access_token
                        .replace(/.*access_token=/, '')
                        .replace(/&.*/, '');
                    console.log(access_token);
                    solsort.jsonp('https://api.github.com/user', {access_token: access_token},
                        function(data) {
                            localStorage.setItem('user', 'github:' + data.data.login);
                        });
                });
            }
        }
    }();
})();
