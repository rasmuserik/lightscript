if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
def("storage", function(exports) {
    // outer: true
    // outer: iftimestamp
    // outer: Date
    // outer: String
    // outer: $args
    // outer: Object
    // outer: undefined
    // outer: console
    // outer: process
    var db;
    // outer: require
    var sqlite3;
    // outer: use
    var util;
    util = use("util");
    if(util.platform === "node") {
        sqlite3 = require("sqlite3");
        db = new sqlite3.Database(process.env.HOME + "/data/storage.sqlite3");
        db.run("CREATE TABLE IF NOT EXISTS storage (owner, store, timestamp, key, val, PRIMARY KEY (owner, store, timestamp, key), UNIQUE (owner, store, key));");
        exports.restapi = function(args, rest) {
            // outer: true
            // outer: iftimestamp
            // outer: Date
            // outer: String
            // outer: $args
            // outer: db
            var getTimestamp;
            // outer: Object
            // outer: undefined
            // outer: console
            console.log(args);
            if(args.owner === undefined || args.store === undefined || args.timestamp === undefined) {
                return rest.done({"err" : "missing owner, store, or timestamp parameter"});
            };
            getTimestamp = function(callback) {
                // outer: console
                // outer: String
                // outer: rest
                // outer: $args
                // outer: args
                // outer: Object
                // outer: db
                db.get("SELECT timestamp FROM storage WHERE owner=$owner AND store=$store AND key=$key;", {
                    "$owner" : args.owner,
                    "$store" : args.store,
                    "$key" : $args.key,
                }, function(err, rows) {
                    // outer: callback
                    // outer: console
                    // outer: String
                    // outer: Object
                    // outer: rest
                    if(err) {
                        return rest.done({"err" : "DB-error: " + String(err)});
                    };
                    console.log("timestamp:", rows[0]);
                    callback(rows.length && rows[0]);
                });
            };
            if(!args.key && !args.val) {
                // sync / get changes since timestamp
                db.get("SELECT timestamp, key, val FROM storage WHERE owner=$owner AND store=$store AND timestamp>=$timestamp ORDER BY timestamp ASC LIMIT 100;", {
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
                getTimestamp(function(timestamp) {
                    // outer: true
                    // outer: String
                    // outer: rest
                    // outer: iftimestamp
                    // outer: Date
                    // outer: args
                    // outer: Object
                    // outer: db
                    if(!timestamp) {
                        db.get("INSERT INTO storage VALUES ($owner, $store, $timestamp, $key, $val);", {
                            "$owner" : args.owner,
                            "$store" : args.store,
                            "$timestamp" : Date.now(),
                            "$key" : args.key,
                            "$val" : args.val,
                        }, function(err, rows) {
                            // outer: true
                            // outer: String
                            // outer: Object
                            // outer: rest
                            if(err) {
                                return rest.done({"err" : "DB-error: " + String(err)});
                            };
                            rest.done({"ok" : true});
                        });
                    } else if(iftimestamp === args.timestamp) {
                        db.get("UPDATE storage SET timestamp=$timestamp, val=$val WHERE owner=$owner AND store=$store AND timestamp=$timestamp AND key=$key;", {
                            "$owner" : args.owner,
                            "$store" : args.store,
                            "$prevtime" : timestamp,
                            "$timestamp" : Date.now(),
                            "$key" : args.key,
                            "$val" : args.val,
                        }, function(err, rows) {
                            // outer: true
                            // outer: String
                            // outer: Object
                            // outer: rest
                            if(err) {
                                return rest.done({"err" : "DB-error: " + String(err)});
                            };
                            rest.done({"ok" : true});
                        });
                    } else  {
                        rest.done({"err" : "out of sync"});
                    };
                });
            };
        };
    };
});
