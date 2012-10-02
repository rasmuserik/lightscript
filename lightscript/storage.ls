util = use("util");
// sync api
storeProto = {
    sync : util.throttledFn(function(done) {
        if(!this.lastSync) {
            // TODO: this should be gotten/stored in localstorage
            this.lastSync = 0;
        };
        util = util;
        var self = this;
        var newServer = {};
        var connectTimeout = 10000;
        var serverSync = function(callback) {
            util = util;
            use("rest").api.store({
                owner : self.owner,
                store : self.storename,
                timestamp : self.lastSync,
            }, function(result) {
                if(result.err) {
                    // retry exponentially later on connection failure
                    connectTimeout *= 1.5;
                    setTimeout(function() {
                        self.sync(callback);
                    }, connectTimeout);
                    return ;
                };
                var connectTimeout = 10000;
                result.forEach(function(obj) {
                    newServer[obj.key] = obj;
                });
                if(result.length === 100) {
                    util.nextTick(function() {
                        serverSync(callback);
                    });
                } else  {
                    callback();
                };
            });
        };
        var syncLocal = function() {
            var changedKeys = Object.keys(util.extend(util.extend({}, self.local), newServer));
            var needSync = false;
            util.aForEach(changedKeys, function(key, done) {
                var prevVal = self.server[key] && self.server[key].val;
                var localVal = self.local[key];
                var serverVal = newServer[key] && newServer[key].val;
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
                    var timestamp = timestamp || (newServer[key] && newServer[key].timestamp);
                    timestamp = timestamp || (self.server[key] && self.server[key].timestamp);
                    timestamp = timestamp || 0;
                    use("rest").api.store({
                        owner : self.owner,
                        store : self.storename,
                        timestamp : timestamp,
                        key : key,
                        val : self.local[key],
                    }, function(result) {
                        if(result.err) {
                            console.log(result);
                        };
                        done();
                    });
                };
            }, function() {
                if(needSync) {
                    util.nextTick(function() {
                        serverSync(syncLocal);
                    });
                };
            });
        };
        serverSync(syncLocal);
    }),
    set : function(key, val) {
        this.local[key] = val;
        this.sync();
    },
    get : function(key) {
        return this.local[key] || this.server[key] && this.server[key].val;
    },
    keys : function() {
        var result = {};
        Object.keys(this.local).concat(Object.keys(this.server)).forEach(function(key) {
            result[key] = true;
        });
        return Object.keys(result);
    },
};
exports.create = function(owner, storename, mergeFn) {
    var store = Object.create(storeProto);
    store.owner = owner;
    store.storename = storename;
    store.mergeFn = mergeFn;
    store.local = {};
    store.server = {};
    store.sync();
    return store;
};
// storage server-database/rest-api;
if(util.platform === "node") {
    db = undefined;
    exports.restapi = function(args, rest) {
        var sqlite3 = require("sqlite3");
        if(!db) {
            db = new sqlite3.Database(process.env.HOME + "/data/storage.sqlite3");
            db.run("CREATE TABLE IF NOT EXISTS storage (owner, store, timestamp, key, val, PRIMARY KEY (owner, store, timestamp, key), UNIQUE (owner, store, key));");
        };
        if(args.owner === undefined || args.store === undefined || args.timestamp === undefined) {
            return rest.done({err : "missing owner, store, or timestamp parameter"});
        };
        if(!args.key && !args.val) {
            // sync / get changes since timestamp
            db.all("SELECT timestamp, key, val FROM storage WHERE owner=$owner AND store=$store AND timestamp>=$timestamp ORDER BY timestamp ASC LIMIT 100;", {
                $owner : args.owner,
                $store : args.store,
                $timestamp : args.timestamp,
            }, function(err, rows) {
                if(err) {
                    return rest.done({err : "DB-error: " + String(err)});
                };
                rest.done(rows);
            });
        } else  {
            var timestamp = Date.now();
            if(args.timestamp === 0) {
                db.run("INSERT INTO storage VALUES ($owner, $store, $timestamp, $key, $val);", {
                    $owner : args.owner,
                    $store : args.store,
                    $timestamp : timestamp,
                    $key : args.key,
                    $val : args.val,
                }, function(err) {
                    if(err) {
                        return rest.done({err : "out-of-sync", DBerror : String(err)});
                    };
                    rest.done({ok : true});
                });
            } else  {
                db.run("UPDATE storage SET timestamp=$timestamp, val=$val WHERE owner=$owner AND store=$store AND timestamp=$prevtime AND key=$key;", {
                    $timestamp : timestamp,
                    $val : args.val,
                    $owner : args.owner,
                    $store : args.store,
                    $prevtime : args.timestamp,
                    $key : args.key,
                }, function(err) {
                    if(err) {
                        return rest.done({err : "DB-error: " + String(err)});
                    };
                    db.get("SELECT * FROM storage WHERE owner=$owner AND store=$store AND timestamp=$timestamp AND key=$key;", {
                        $owner : args.owner,
                        $store : args.store,
                        $timestamp : timestamp,
                        $key : args.key,
                    }, function(err, row) {
                        if(err) {
                            return rest.done({err : "DB-error: " + String(err)});
                        };
                        console.log(args, row);
                        if(!row) {
                            return rest.done({err : "out-of-sync"});
                        };
                        row.ok = true;
                        rest.done(row);
                    });
                });
            };
        };
    };
};
