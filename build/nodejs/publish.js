// outer: undefined
// outer: process
// outer: true
// outer: RegExp
// outer: Array
// outer: Object
// outer: require
// outer: console
// outer: exports
exports.nodemain = function() {
    // outer: undefined
    // outer: process
    // outer: true
    // outer: RegExp
    // outer: Array
    var savehtml;
    var replacer;
    var includeFiles;
    // outer: Object
    var sitemaps;
    var rstat;
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
    sitemaps = {};
    includeFiles = {};
    replacer = function(str, obj) {
        // outer: RegExp
        return str.replace(RegExp("\\{\\{([^{}]*)\\}\\}", "g"), function(_, s) {
            // outer: obj
            s = s.split(" ");
            if(obj[s[0]]) {
                return obj[s[0]];
            };
        });
    };
    savehtml = function(filename, html, replace) {
        // outer: fs
        // outer: dst
        // outer: sitemaps
        var sitemap;
        var path;
        var site;
        // outer: replacer
        // outer: RegExp
        // outer: Object
        replace = replace || {};
        html.replace(RegExp("<title>([\\s\\S]*)</title>"), function(_, title) {
            // outer: replace
            replace.title = replace.title || title;
        });
        html = replacer(html, replace);
        site = filename.split("/")[1];
        path = filename.split("/").slice(2).join("/");
        sitemap = sitemaps[site] = sitemaps[site] || {};
        sitemap[path] = {};
        sitemap[path].title = replace.title;
        //console.log(sitemaps);
        filename = dst + filename;
        fs.writeFile(filename, html.replace(RegExp("=\"http(s?):/(/[^\"]*\")", "g"), function(_, s, url) {
            return "=\"/redirect" + (s && "/s") + url;
        }));
    };
    (function() {
        // outer: RegExp
        // outer: Object
        // outer: undefined
        // outer: savehtml
        // outer: fs
        // outer: src
        // outer: Array
        // outer: console
        // outer: require
        // outer: dst
        // outer: util
        // outer: process
        // outer: rstat
        var files;
        files = rstat(process.env.HOME + "/solsort/sites");
        util.mkdir(dst + "/common/js/");
        util.cp("./build/webjs/solsort.js", dst + "/common/js/solsort.js", function(err) {
            // outer: console
            if(err) {
                console.log("Error:", err, "solsort.js");
            };
        });
        files.map(function(file) {
            // outer: console
            // outer: RegExp
            // outer: Object
            // outer: undefined
            // outer: savehtml
            // outer: fs
            // outer: src
            // outer: Array
            // outer: require
            // outer: dst
            // outer: util
            util.mkdir(dst + file.name.split("/").slice(0, - 1).join("/"));
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
                        // outer: console
                        // outer: fs
                        // outer: src
                        var templatename;
                        // outer: require
                        // outer: RegExp
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
                        markdown = markdown.join("\n").replace(RegExp("<!--.*?-->", "g"), "");
                        doc.content = require("markdown").markdown.toHTML(markdown);
                        templatename = src + file.name.split("/").slice(0, - 1).join("/") + "/markdown.template.html";
                        fs.readFile(templatename, "utf8", function(err, html) {
                            // outer: doc
                            // outer: savehtml
                            // outer: templatename
                            // outer: file
                            // outer: console
                            if(err) {
                                console.log(file.name);
                                return console.log("could not access:", templatename);
                            };
                            savehtml(file.name.slice(0, - 2) + "html", html, doc);
                        });
                    });
                } else if(file.type === "less") {
                    fs.readFile(src + file.name, "utf8", function(err, less) {
                        // outer: dst
                        // outer: fs
                        // outer: file
                        // outer: console
                        // outer: require
                        require("less").render(less, function(err, css) {
                            // outer: dst
                            // outer: fs
                            // outer: file
                            // outer: console
                            if(err) {
                                console.log(file.name, err, file);
                            };
                            fs.writeFile(dst + file.name.replace(".less", ".css"), css);
                        });
                    });
                } else  {
                    util.cp(src + file.name, dst + file.name, function(err) {
                        //console.log('Error:', err, file);
                    });
                };
            };
        });
        require("child_process").exec("cp -a ~/lightscript/build/apps/* /usr/share/nginx/www/solsort/apps/");
        require("child_process").exec("cp -a ~/solsort/sites/* /usr/share/nginx/www/", function(err, stdout, stderr) {
            // outer: console
            console.log("done");
            if(err) {
                console.log("Error:", err);
            };
        });
    })();
};
