solsort_define("storage",function(exports, require){util = require("./util");
// sync api
storeProto = {
    sync : util.throttledFn(function(done) {
        // outer: console
        // outer: true
        // outer: false
        // outer: ;
        // outer: setTimeout
        // outer: require
        var syncLocal;
        var serverSync;
        var connectTimeout;
        // outer: Object
        var newServer;
        var self;
        // outer: util
        // outer: this
        if(!this.lastSync) {
            // TODO: this should be gotten/stored in localstorage
            this.lastSync = 0;
        };
        util = util;
        self = this;
        newServer = {};
        connectTimeout = 10000;
        serverSync = function(callback) {
            // outer: serverSync
            // outer: newServer
            // outer: ;
            // outer: setTimeout
            // outer: self
            // outer: Object
            // outer: require
            // outer: util
            util = util;
            require("./rest").api.store({
                owner : self.owner,
                store : self.storename,
                timestamp : self.lastSync,
            }, function(result) {
                // outer: serverSync
                // outer: newServer
                // outer: self
                // outer: callback
                // outer: util
                // outer: ;
                // outer: setTimeout
                var connectTimeout;
                if(result.err) {
                    // retry exponentially later on connection failure
                    connectTimeout *= 1.5;
                    setTimeout(function() {
                        // outer: callback
                        // outer: self
                        self.sync(callback);
                    }, connectTimeout);
                    return ;
                };
                connectTimeout = 10000;
                result.forEach(function(obj) {
                    // outer: newServer
                    newServer[obj.key] = obj;
                });
                if(result.length === 100) {
                    util.nextTick(function() {
                        // outer: callback
                        // outer: serverSync
                        serverSync(callback);
                    });
                } else  {
                    callback();
                };
            });
        };
        syncLocal = function() {
            // outer: syncLocal
            // outer: serverSync
            // outer: console
            // outer: require
            // outer: true
            // outer: false
            var needSync;
            // outer: newServer
            // outer: self
            // outer: util
            // outer: Object
            var changedKeys;
            changedKeys = Object.keys(util.extend(util.extend({}, self.local), newServer));
            needSync = false;
            util.aForEach(changedKeys, function(key, done) {
                // outer: console
                // outer: Object
                // outer: require
                var timestamp;
                // outer: true
                // outer: needSync
                // outer: util
                // outer: newServer
                var serverVal;
                var localVal;
                // outer: self
                var prevVal;
                prevVal = self.server[key] && self.server[key].val;
                localVal = self.local[key];
                serverVal = newServer[key] && newServer[key].val;
                if(localVal === serverVal) {
                    self.server[key] = newServer[key];
                    util.delprop(self.local, key);
                    util.delprop(serverVal, key);
                    done();
                } else  {
                    needSync = true;
                    self.local[key] = self.mergeFn(prevVal, localVal, serverVal, key);
                    if(!self.local[key]) {
                        throw "empty mergeFn result";
                    };
                    timestamp = timestamp || (newServer[key] && newServer[key].timestamp);
                    timestamp = timestamp || (self.server[key] && self.server[key].timestamp);
                    timestamp = timestamp || 0;
                    require("./rest").api.store({
                        owner : self.owner,
                        store : self.storename,
                        timestamp : timestamp,
                        key : key,
                        val : self.local[key],
                    }, function(result) {
                        // outer: done
                        // outer: console
                        if(result.err) {
                            console.log(result);
                        };
                        done();
                    });
                };
            }, function() {
                // outer: syncLocal
                // outer: serverSync
                // outer: util
                // outer: needSync
                if(needSync) {
                    util.nextTick(function() {
                        // outer: syncLocal
                        // outer: serverSync
                        serverSync(syncLocal);
                    });
                };
            });
        };
        serverSync(syncLocal);
    }),
    set : function(key, val) {
        // outer: this
        this.local[key] = val;
        this.sync();
    },
    get : function(key) {
        // outer: this
        return this.local[key] || this.server[key] && this.server[key].val;
    },
    keys : function() {
        // outer: true
        // outer: this
        // outer: Object
        var result;
        result = {};
        Object.keys(this.local).concat(Object.keys(this.server)).forEach(function(key) {
            // outer: true
            // outer: result
            result[key] = true;
        });
        return Object.keys(result);
    },
};
exports.create = function(owner, storename, mergeFn) {
    // outer: storeProto
    // outer: Object
    var store;
    store = Object.create(storeProto);
    store.owner = owner;
    store.storename = storename;
    store.mergeFn = mergeFn;
    store.local = {};
    store.server = {};
    store.sync();
    return store;
};
// storage server-database/rest-api;
if(undefined) {};
});