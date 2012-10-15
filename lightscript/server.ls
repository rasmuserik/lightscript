if(require("./util").platform === "node") {
    rootdir = __dirname + "/../../../solsort/";
    exports.nodemain = function() {
        // # includes and initialisation {{{1
        var express = require("express");
        var mustache = require("mustache");
        var fs = require("fs");
        var logger = require("express-logger");
        var sqlite3 = require("sqlite3");
        var https = require("https");
        var db = new sqlite3.Database(process.env.HOME + "/data/db.sqlite3");
        db.run("CREATE TABLE IF NOT EXISTS userdata (store, key, val, timestamp, PRIMARY KEY (store, key))");
        // # Pages from markdown {{{1
        var htmlTemplate = fs.readFileSync(rootdir + "/sites/solsort/template/html.mustache", "utf8");
        var name2url = require("./util").name2url;
        var file2entries = function(filename) {
            var result = {};
            fs.readFileSync(filename, "utf8").split("\n# ").slice(1).forEach(function(elem) {
                var title = elem.split("\n")[0].trim();
                if(result[title]) {
                    throw "duplicate title in \"" + filename + "\": " + title;
                };
                //console.log(name2url(title) + '.md');
                //               fs.writeFile('/home/rasmuserik/' + name2url(title).replace("__", "_") + '.md', '%title\n%\n%\n\n' + '# ' + elem);
                result[title] = {
                    title : title,
                    url : name2url(title),
                    html : require("markdown").markdown.toHTML("# " + elem),
                };
            });
            return result;
        };
        var notes = file2entries(rootdir + "/sites/solsort/notes.md");
        // # Web content/server configuration {{{1
        var configureApp = function(app) {
            require(rootdir + "/sites/solsort/theodorelias/genindex.js").gen(htmlTemplate);
            app.use(function(req, res, next) {
                res.removeHeader("X-Powered-By");
                next();
            });
            app.stack.unshift({route : "", handle : logger({path : process.env.HOME + "/data/httpd.log"})});
            app.use(express.bodyParser());
            Object.keys(notes).forEach(function(key) {
                app.get("/" + notes[key].url, function(req, res) {
                    res.send(fixLinks(mustache.to_html(htmlTemplate, {title : key, body : notes[key].html})));
                });
            });
            var fixLinks = function(html) {
                return html.replace(RegExp("href=\"http(s?):\\/\\/([^\"]*)", "g"), function(_, s, url) {
                    return "href=\"/http" + s + "?" + url;
                });
            };
            app.get("/githubLogin", function(req, res) {
                https.get({host : "github.com", path : "/login/oauth/access_token?client_id=cc14f7f75ff01bdbb1e7&client_secret=d978cb4e2e1cdb35d4ae9e194b9c36fa0c2f607e&code=" + req.query.code + "&state=" + req.query.state}, function(con) {
                    con.on("data", function(data) {
                        res.send(req.query.callback + "(\"" + data + "\");", {"Content-Type" : "application/javascript"});
                    });
                });
            });
            app.get("/store", storeHandle);
            app.post("/store", storeHandle);
            var storeHandle = function(req, res) {
                console.log(req.query, req.body);
                var query = req.query || {};
                var body = req.body || {};
                var store = query.store || body.store;
                var key = query.key || body.key;
                var newVal = query.val || body.val;
                var prevVal = query.prev || body.prev;
                if(!store) {
                    return res.send("Parameters: store, key[, val, prev]\nReturns current store/key-value, or sets it if val+prev is set (prev must be the current value in the database and val the new one).", {"Content-Type" : "text/plain"}, 400);
                };
                if(!key) {
                    var result = [];
                    db.all("SELECT key, timestamp FROM userdata WHERE store=$store;", {$store : store}, function(err, val) {
                        if(err) {
                            return res.send(String(err), {"Content-Type" : "text/plain"}, 500);
                        };
                        res.send(val, {"Content-Type" : "text/plain"});
                    });
                    return ;
                };
                db.get("SELECT * FROM userdata WHERE store=$store AND key=$key;", {$store : store, $key : key}, function(err, row) {
                    if(err) {
                        return res.send(String(err), {"Content-Type" : "text/plain"}, 500);
                    };
                    var val = row && row.val;
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
                fs.readFile(rootdir + "/sites/solsort/template/index.html.mustache", "utf8", function(err, frontpage) {
                    res.send(fixLinks(mustache.to_html(frontpage, {notes : Object.keys(notes).map(function(noteName) {
                        var title = notes[noteName].title;
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
            configureApp(args.app);
            callback();
        };
        var app = express.createServer();
        console.log(app);
        exports.expressCreateServer(undefined, {app : app}, function() {
            app.listen(8080);
            console.log("listening on port 8080");
        });
    };
};
