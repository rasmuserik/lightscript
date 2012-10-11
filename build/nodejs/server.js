
if(require("./util").platform === "node") {
    rootdir = __dirname + "/../../../solsort/";
    exports.nodemain = function() {
        // outer: Date
        // outer: String
        // outer: ;
        // outer: Array
        // outer: RegExp
        // outer: Object
        // outer: undefined
        // outer: console
        var app;
        // outer: exports
        var configureApp;
        var notes;
        var file2entries;
        var name2url;
        // outer: rootdir
        var htmlTemplate;
        // outer: process
        var db;
        var https;
        var sqlite3;
        var logger;
        var fs;
        var mustache;
        // outer: require
        var express;
        // # includes and initialisation {{{1
        express = require("express");
        mustache = require("mustache");
        fs = require("fs");
        logger = require("express-logger");
        sqlite3 = require("sqlite3");
        https = require("https");
        db = new sqlite3.Database(process.env.HOME + "/data/db.sqlite3");
        db.run("CREATE TABLE IF NOT EXISTS userdata (store, key, val, timestamp, PRIMARY KEY (store, key))");
        // # Pages from markdown {{{1
        htmlTemplate = fs.readFileSync(rootdir + "/sites/solsort/template/html.mustache", "utf8");
        name2url = require("./util").name2url;
        file2entries = function(filename) {
            // outer: require
            // outer: name2url
            // outer: fs
            // outer: Object
            var result;
            result = {};
            fs.readFileSync(filename, "utf8").split("\n# ").slice(1).forEach(function(elem) {
                // outer: require
                // outer: name2url
                // outer: Object
                // outer: filename
                // outer: result
                var title;
                title = elem.split("\n")[0].trim();
                if(result[title]) {
                    throw "duplicate title in \"" + filename + "\": " + title;
                };
                result[title] = {
                    title : title,
                    url : name2url(title),
                    html : require("markdown").markdown.toHTML("# " + elem),
                };
            });
            return result;
        };
        notes = file2entries(rootdir + "/sites/solsort/notes.md");
        // # Web content/server configuration {{{1
        configureApp = function(app) {
            // outer: fs
            // outer: Date
            // outer: undefined
            // outer: String
            // outer: ;
            // outer: db
            // outer: Array
            // outer: console
            // outer: https
            // outer: RegExp
            // outer: mustache
            var storeHandle;
            var fixLinks;
            // outer: notes
            // outer: express
            // outer: process
            // outer: logger
            // outer: Object
            // outer: htmlTemplate
            // outer: rootdir
            // outer: require
            require(rootdir + "/sites/solsort/theodorelias/genindex.js").gen(htmlTemplate);
            app.use(function(req, res, next) {
                res.removeHeader("X-Powered-By");
                next();
            });
            app.stack.unshift({route : "", handle : logger({path : process.env.HOME + "/data/httpd.log"})});
            app.use(express.bodyParser());
            Object.keys(notes).forEach(function(key) {
                // outer: Object
                // outer: htmlTemplate
                // outer: mustache
                // outer: fixLinks
                // outer: notes
                // outer: app
                app.get("/" + notes[key].url, function(req, res) {
                    // outer: notes
                    // outer: key
                    // outer: Object
                    // outer: htmlTemplate
                    // outer: mustache
                    // outer: fixLinks
                    res.send(fixLinks(mustache.to_html(htmlTemplate, {title : key, body : notes[key].html})));
                });
            });
            fixLinks = function(html) {
                // outer: RegExp
                return html.replace(RegExp("href=\"http(s?):\\/\\/([^\"]*)", "g"), function(_, s, url) {
                    return "href=\"/http" + s + "?" + url;
                });
            };
            app.get("/githubLogin", function(req, res) {
                // outer: Object
                // outer: https
                https.get({host : "github.com", path : "/login/oauth/access_token?client_id=cc14f7f75ff01bdbb1e7&client_secret=d978cb4e2e1cdb35d4ae9e194b9c36fa0c2f607e&code=" + req.query.code + "&state=" + req.query.state}, function(con) {
                    // outer: Object
                    // outer: req
                    // outer: res
                    con.on("data", function(data) {
                        // outer: Object
                        // outer: req
                        // outer: res
                        res.send(req.query.callback + "(\"" + data + "\");", {"Content-Type" : "application/javascript"});
                    });
                });
            });
            app.get("/store", storeHandle);
            app.post("/store", storeHandle);
            storeHandle = function(req, res) {
                // outer: Date
                // outer: undefined
                // outer: String
                // outer: ;
                // outer: db
                // outer: Array
                var result;
                var prevVal;
                var newVal;
                var key;
                var store;
                var body;
                // outer: Object
                var query;
                // outer: console
                console.log(req.query, req.body);
                query = req.query || {};
                body = req.body || {};
                store = query.store || body.store;
                key = query.key || body.key;
                newVal = query.val || body.val;
                prevVal = query.prev || body.prev;
                if(!store) {
                    return res.send("Parameters: store, key[, val, prev]\nReturns current store/key-value, or sets it if val+prev is set (prev must be the current value in the database and val the new one).", {"Content-Type" : "text/plain"}, 400);
                };
                if(!key) {
                    result = [];
                    db.all("SELECT key, timestamp FROM userdata WHERE store=$store;", {$store : store}, function(err, val) {
                        // outer: Object
                        // outer: String
                        // outer: res
                        if(err) {
                            return res.send(String(err), {"Content-Type" : "text/plain"}, 500);
                        };
                        res.send(val, {"Content-Type" : "text/plain"});
                    });
                    return ;
                };
                db.get("SELECT * FROM userdata WHERE store=$store AND key=$key;", {$store : store, $key : key}, function(err, row) {
                    // outer: Date
                    // outer: key
                    // outer: store
                    // outer: db
                    // outer: prevVal
                    // outer: console
                    // outer: undefined
                    // outer: newVal
                    var val;
                    // outer: Object
                    // outer: String
                    // outer: res
                    if(err) {
                        return res.send(String(err), {"Content-Type" : "text/plain"}, 500);
                    };
                    val = row && row.val;
                    if(newVal !== undefined) {
                        console.log({val : val, prevVal : prevVal});
                        if(prevVal["!="](val)) {
                            return res.send(val, {"Content-Type" : "text/plain"}, 409);
                        };
                        return db.run("INSERT OR REPLACE INTO userdata VALUES ($store, $key, $val, $timestamp);", {
                            $store : store,
                            $key : key,
                            $val : newVal,
                            $timestamp : Date.now(),
                        }, function(err) {
                            // outer: Object
                            // outer: String
                            // outer: res
                            if(err) {
                                return res.send(String(err), {"Content-Type" : "text/plain"}, 500);
                            };
                            res.send("ok", {"Content-Type" : "text/plain"});
                        });
                    };
                    if(!row) {
                        return res.send("", {"Content-Type" : "text/plain"}, 404);
                    };
                    res.send(val, {"Content-Type" : "text/plain"});
                });
            };
            app.get("/", function(req, res) {
                // outer: RegExp
                // outer: notes
                // outer: Object
                // outer: mustache
                // outer: fixLinks
                // outer: rootdir
                // outer: fs
                fs.readFile(rootdir + "/sites/solsort/template/index.html.mustache", "utf8", function(err, frontpage) {
                    // outer: RegExp
                    // outer: notes
                    // outer: Object
                    // outer: mustache
                    // outer: fixLinks
                    // outer: res
                    res.send(fixLinks(mustache.to_html(frontpage, {notes : Object.keys(notes).map(function(noteName) {
                        // outer: RegExp
                        // outer: notes
                        var title;
                        title = notes[noteName].title;
                        return "<a class=\"solsortBtn\" href=\"/" + notes[noteName].url + "\">" + title.replace(RegExp(":", "g"), ":<br/>") + "</a>";
                    }).join("")})));
                });
            });
            app.get("/te_fodsel", function(req, res) {
                res.redirect("/theodorelias/?fodsel");
            });
            app.get("/skolevangen", function(req, res) {
                res.redirect("https://www.facebook.com/groups/520346057991618");
            });
            app.get("/http", function(req, res) {
                res.redirect("http://" + req.originalUrl.slice(6));
            });
            app.get("/https", function(req, res) {
                res.redirect("https://" + req.originalUrl.slice(7));
            });
            app.get("*", express["static"](rootdir + "/sites/solsort"));
            /*
app.get('*', function(req, res){
res.send(
mustache.to_html(htmlTemplate, {
title: 'Page not found :(', 
body: '<h1>The end of the Internet</h1>' +
'<p>Sorry, no page found (404) on this url</p>' +
'<p>You have reached the end of the internet</p>' +
'<p>Hope you enjoyed the web</p>' +
'<p>You may now turn off your device and go out in the world</p>' +
'<p>(or see if you can find the page your were looking for <a href="/">here</a>)</p>'}),
404);
});
*/
        };
        // # Setup the servers {{{1
        //
        exports.expressCreateServer = function(hook_name, args, callback) {
            // outer: configureApp
            configureApp(args.app);
            callback();
        };
        app = express.createServer();
        console.log(app);
        exports.expressCreateServer(undefined, {app : app}, function() {
            // outer: console
            // outer: app
            app.listen(8080);
            console.log("listening on port 8080");
        });
    };
};
