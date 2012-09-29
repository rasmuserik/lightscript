def("storage", function(exports) {
    var util = use("util");
    if(util.platform === "node") {
        var sqlite3 = require("sqlite3");
        var db = new sqlite3.Database(process.env.HOME + "/data/storage.sqlite3");
        db.run("CREATE TABLE IF NOT EXISTS storage (owner, store, timestamp, key, val, PRIMARY KEY (owner, store, timestamp, key), UNIQUE (owner, store, key));");
        exports.restapi = function(args, rest) {
            console.log(args);
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
});
