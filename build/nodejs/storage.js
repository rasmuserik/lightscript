if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
def("storage", function(exports) {
    // outer: String
    // outer: Date
    // outer: process
    // outer: require
    // outer: true
    // outer: sync
    // outer: this
    // outer: console
    // outer: undefined
    var db;
    // outer: Object
    var storeProto;
    // outer: use
    var util;
    util = use("util");
    // sync api
    storeProto = {
        "sync" : util.throttledFn(function(done) {
            // outer: console
            // TODO: implement
            console.log("sync request");
        }),
        "set" : function(key, val) {
            // outer: sync
            // outer: this
            this.local[key] = val;
            sync();
        },
        "get" : function(key) {
            // outer: this
            return this.local[key] || this.server[key].val;
        },
        "keys" : function() {
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
    exports.create = function(owner, storename, mergefn) {
        // outer: storeProto
        // outer: Object
        var store;
        store = Object.create(storeProto);
        store.owner = owner;
        store.storename = storename;
        store.mergefn = mergefn;
        store.local = {};
        store.server = {};
    };
    // storage server-database/rest-api;
    if(util.platform === "node") {
        db = undefined;
        exports.restapi = function(args, rest) {
            // outer: true
            // outer: String
            // outer: Date
            var timestamp;
            // outer: Object
            // outer: undefined
            // outer: process
            // outer: db
            // outer: require
            var sqlite3;
            sqlite3 = require("sqlite3");
            if(!db) {
                db = new sqlite3.Database(process.env.HOME + "/data/storage.sqlite3");
                db.run("CREATE TABLE IF NOT EXISTS storage (owner, store, timestamp, key, val, PRIMARY KEY (owner, store, timestamp, key), UNIQUE (owner, store, key));");
            };
            if(args.owner === undefined || args.store === undefined || args.timestamp === undefined) {
                return rest.done({"err" : "missing owner, store, or timestamp parameter"});
            };
            if(!args.key && !args.val) {
                // sync / get changes since timestamp
                db.all("SELECT timestamp, key, val FROM storage WHERE owner=$owner AND store=$store AND timestamp>=$timestamp ORDER BY timestamp ASC LIMIT 100;", {
                    "$owner" : args.owner,
                    "$store" : args.store,
                    "$timestamp" : args.timestamp,
                }, function(err, rows) {
                    // outer: String
                    // outer: Object
                    // outer: rest
                    if(err) {
                        return rest.done({"err" : "DB-error: " + String(err)});
                    };
                    rest.done(rows);
                });
            } else  {
                timestamp = Date.now();
                if(args.timestamp === 0) {
                    db.run("INSERT INTO storage VALUES ($owner, $store, $timestamp, $key, $val);", {
                        "$owner" : args.owner,
                        "$store" : args.store,
                        "$timestamp" : timestamp,
                        "$key" : args.key,
                        "$val" : args.val,
                    }, function(err) {
                        // outer: true
                        // outer: String
                        // outer: Object
                        // outer: rest
                        if(err) {
                            return rest.done({"err" : "out-of-sync", "DBerror" : String(err)});
                        };
                        rest.done({"ok" : true});
                    });
                } else  {
                    db.run("UPDATE storage SET timestamp=$timestamp, val=$val WHERE owner=$owner AND store=$store AND timestamp=$prevtime AND key=$key;", {
                        "$timestamp" : timestamp,
                        "$val" : args.val,
                        "$owner" : args.owner,
                        "$store" : args.store,
                        "$prevtime" : args.timestamp,
                        "$key" : args.key,
                    }, function(err) {
                        // outer: true
                        // outer: timestamp
                        // outer: args
                        // outer: db
                        // outer: String
                        // outer: Object
                        // outer: rest
                        if(err) {
                            return rest.done({"err" : "DB-error: " + String(err)});
                        };
                        db.get("SELECT * FROM storage WHERE owner=$owner AND store=$store AND timestamp=$timestamp AND key=$key;", {
                            "$owner" : args.owner,
                            "$store" : args.store,
                            "$timestamp" : timestamp,
                            "$key" : args.key,
                        }, function(err, row) {
                            // outer: true
                            // outer: String
                            // outer: Object
                            // outer: rest
                            if(err) {
                                return rest.done({"err" : "DB-error: " + String(err)});
                            };
                            if(!row) {
                                return rest.done({"err" : "out-of-sync"});
                            };
                            row.ok = true;
                            rest.done(row);
                        });
                    });
                };
            };
        };
    };
});
