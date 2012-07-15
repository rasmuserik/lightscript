if(!solsort) {
    alert('page error, store should only be loaded from solsort.js');
}
// # Storage, automatically synchronised with solsort.com/store
//

(function() {
    solsort.storeKeys = function(store, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://solsort.com/store?store=' + store);

        function done(a) {
            try {
                callback(null, JSON.parse(xhr.responseText));
            } catch(e) {
                callback(e || 'xhr-parsing-error', a);
            }
        }
        function error(e) {
            callback(e || 'xhr-error');
        }

        xhr.addEventListener("load", done);
        xhr.addEventListener("error", error);
        xhr.addEventListener("abort", error);
        xhr.send();
    }
    solsort.storeGet = function(store, key, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://solsort.com/store?store=' + store + '&key=' + key);

        function done(a) {
            try {
                callback(null, JSON.parse(xhr.responseText));
            } catch(e) {
                callback(e || 'xhr-parsing-error', a);
            }
        }
        function error(e) {
            callback(e || 'xhr-error');
        }

        xhr.addEventListener("load", done);
        xhr.addEventListener("error", error);
        xhr.addEventListener("abort", error);
        xhr.send();
    }
    solsort.storeSet = function(store, key, val, prevVal, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST','http://solsort.com/store');

        function done(a) {
            console.log(xhr, a);
            try {
                callback(null, xhr.responseText);
            } catch(e) {
                callback(e || 'xhr-parsing-error', a);
            }
        }
        function error(e) {
            callback(e || 'xhr-error');
        }

        xhr.addEventListener("load", done);
        xhr.addEventListener("error", error);
        xhr.addEventListener("abort", error);
        xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xhr.send('store=' + store + '&key=' + key + '&val=' + JSON.stringify(val) + '&prev=' + JSON.stringify(prevVal));
    }
})();
