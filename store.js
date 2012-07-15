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
                callback(null, JSON.stringify(xhr.responseText));
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
    }
    solsort.storePost = function(store, key, val, prevVal, callback) {
    }
})();
