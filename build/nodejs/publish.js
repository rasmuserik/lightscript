exports.nodemain = function() {
    // outer: undefined
    // outer: process
    // outer: RegExp
    // outer: Array
    // outer: true
    // outer: dir
    var mustacheInclude;
    var savehtml;
    var sitemaps;
    var cp;
    var rstat;
    var mkdir;
    // outer: Object
    var dirs;
    var util;
    // outer: require
    var fs;
    // outer: console
    var src;
    var dst;
    dst = "/usr/share/nginx/www/";
    src = "/home/rasmuserik/solsort/sites/";
    console.log("copying sites to " + dst);
    fs = require("fs");
    util = require("./util");
    dirs = {};
    mkdir = function(path) {
        // outer: true
        // outer: dir
        // outer: mkdir
        // outer: fs
        // outer: dirs
        if(!dirs[path] && !fs.existsSync(path)) {
            path = path.split("/");
            while(!path[path.length - 1]) {
                path.pop();
            };
            mkdir(path.slice(0, - 1).join("/"));
            fs.mkdirSync(path.join("/"));
            dir[path] = true;
        };
    };
    rstat = function(root) {
        // outer: true
        // outer: RegExp
        // outer: Object
        // outer: fs
        var recurse;
        // outer: Array
        var acc;
        acc = acc || [];
        recurse = function(path) {
            // outer: acc
            // outer: true
            // outer: RegExp
            // outer: root
            // outer: Object
            var fobj;
            // outer: recurse
            // outer: fs
            var stat;
            stat = fs.lstatSync(path);
            if(stat.isDirectory()) {
                fs.readdirSync(path).map(function(name) {
                    // outer: path
                    return path + "/" + name;
                }).forEach(recurse);
            } else  {
                fobj = {name : path.replace(root, "")};
                fobj.type = path.replace(RegExp("^[^.]*\\."), "");
                if(stat.isSymbolicLink()) {
                    fobj.symlink = true;
                };
                acc.push(fobj);
            };
        };
        recurse(root);
        return acc;
    };
    cp = function(src, dst, callback) {
        // outer: fs
        // outer: require
        require("util").pump(fs.createReadStream(src), fs.createWriteStream(dst), callback);
    };
    sitemaps = {};
    savehtml = function(filename, html) {
        // outer: fs
        // outer: dst
        // outer: RegExp
        // outer: console
        // outer: Object
        // outer: sitemaps
        var sitemap;
        var path;
        var site;
        site = filename.split("/")[1];
        path = filename.split("/").slice(2).join("/");
        sitemap = sitemaps[site] = sitemaps[site] || {};
        sitemap[path] = {};
        console.log(sitemaps);
        html.replace(RegExp("<title>([\\s\\S]*)</title>"), function(_, title) {
            // outer: path
            // outer: sitemap
            // outer: console
            console.log("here");
            sitemap[path].title = title;
        });
        filename = dst + filename;
        fs.writeFile(filename, html.replace(RegExp("=\"http(s?):/(/[^\"]*\")", "g"), function(_, s, url) {
            return "=\"/redirect" + (s && "/s") + url;
        }));
    };
    mustacheInclude = function(obj) {
        // outer: console
        obj.include = function(arg) {
            // outer: console
            console.log(arg);
        };
        return obj;
    };
    (function() {
        // outer: mustacheInclude
        // outer: console
        // outer: Object
        // outer: undefined
        // outer: savehtml
        // outer: cp
        // outer: fs
        // outer: src
        // outer: Array
        // outer: dst
        // outer: mkdir
        // outer: require
        // outer: process
        // outer: rstat
        var files;
        files = rstat(process.env.HOME + "/solsort/sites");
        files.map(function(file) {
            // outer: mustacheInclude
            // outer: console
            // outer: Object
            // outer: undefined
            // outer: savehtml
            // outer: cp
            // outer: fs
            // outer: src
            // outer: Array
            // outer: require
            // outer: dst
            // outer: mkdir
            mkdir(dst + file.name.split("/").slice(0, - 1).join("/"));
            if(file.symlink) {
                require("child_process").spawn("cp", [
                    "-a",
                    src + file.name,
                    dst + file.name,
                ]);
            } else  {
                if(file.type === "html") {
                    fs.readFile(src + file.name, "utf8", function(err, html) {
                        // outer: file
                        // outer: savehtml
                        savehtml(file.name, html);
                    });
                } else if(file.type === "md") {
                    fs.readFile(src + file.name, "utf8", function(err, markdown) {
                        // outer: savehtml
                        // outer: mustacheInclude
                        // outer: console
                        // outer: fs
                        // outer: src
                        var templatename;
                        // outer: require
                        // outer: Object
                        var doc;
                        // outer: undefined
                        // outer: file
                        if(file.name.split("/").slice(- 1)[0] === "README.md") {
                            return undefined;
                        };
                        doc = {title : file.name.split("/").slice(- 1)[0].slice(0, - 3)};
                        markdown = markdown.split("\n");
                        if(markdown[0][0] === "%") {
                            doc.title = markdown[0].slice(1).trim();
                            markdown.shift();
                            if(markdown[0][0] === "%") {
                                doc.author = markdown[0].slice(1).trim();
                                markdown.shift();
                                if(markdown[0][0] === "%") {
                                    doc.date = markdown[0].slice(1).trim();
                                    markdown.shift();
                                };
                            };
                        };
                        doc.content = require("markdown").markdown.toHTML(markdown.join("\n"));
                        templatename = src + file.name.split("/").slice(0, - 1).join("/") + "/markdown.template.html";
                        fs.readFile(templatename, "utf8", function(err, html) {
                            // outer: savehtml
                            // outer: doc
                            // outer: mustacheInclude
                            // outer: require
                            // outer: templatename
                            // outer: file
                            // outer: console
                            if(err) {
                                console.log(file.name);
                                return console.log("could not access:", templatename);
                            };
                            html = require("mustache").to_html(html, mustacheInclude(doc));
                            savehtml(file.name.slice(0, - 2) + "html", html);
                        });
                        //console.log(src + file.name, doc, file.dir);
                    });
                } else  {
                    cp(src + file.name, dst + file.name, function(err) {
                        //console.log('Error:', err, file);
                    });
                };
            };
        });
        require("child_process").exec("cp -a ~/solsort/sites/* /usr/share/nginx/www/", function(err, stdout, stderr) {
            // outer: console
            console.log("done");
            if(err) {
                console.log("Error:", err);
            };
        });
    })();
};
