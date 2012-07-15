if(!solsort) {
    alert('page error, store should only be loaded from solsort.js');
}
// # Storage, automatically synchronised with solsort.com/store
//

(function() {
    solsort.storeKeys = function(store, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://solsort.com/store?store=' + store);
        xhr.addEventListener("load", done);
        xhr.addEventListener("error", error);
        xhr.addEventListener("abort", error);
        xhr.onload(function
        function retrieve(a) {
            window.a = a;
            console.log(a);
        }
        function error(e) {
            console.log('error', e);
            callback(e || 'xhr-error');
        }
        

    }
    solsort.storeGet = function(store, key, callback) {
    }
    solsort.storePost = function(store, key, val, prevVal, callback) {
    }
})();
