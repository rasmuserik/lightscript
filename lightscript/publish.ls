exports.nodemain = function() {
    var dst = "/usr/share/nginx/www/";
    var src = "/home/rasmuserik/solsort/sites/";
    console.log("copying sites to " + dst);
    var fs = require("fs");
    var util = require("./util");
    var dirs = {};
    var mkdir = function(path) {
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
    var rstat = function(root) {
        var acc = acc || [];
        var recurse = function(path) {
            var stat = fs.lstatSync(path);
            if(stat.isDirectory()) {
                fs.readdirSync(path).map(function(name) {
                    return path + "/" + name;
                }).forEach(recurse);
            } else  {
                var fobj = {name : path.replace(root, "")};
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
    var cp = function(src, dst, callback) {
        require("util").pump(fs.createReadStream(src), fs.createWriteStream(dst), callback);
    };
    var savehtml = function(filename, html) {
        fs.writeFile(filename, html.replace(RegExp("=\"http(s?):/(/[^\"]*\")", "g"), function(_, s, url) {
            return "=\"/redirect" + (s && "/s") + url;
        }));
    };
    var mustacheInclude = function(obj) {
        obj.include = function(arg) {
            console.log(arg);
        };
        return obj;
    };
    (function() {
        var files = rstat(process.env.HOME + "/solsort/sites");
        files.map(function(file) {
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
                        savehtml(dst + file.name, html);
                    });
                } else if(file.type === "md") {
                    fs.readFile(src + file.name, "utf8", function(err, markdown) {
                        if(file.name.split("/").slice(- 1)[0] === "README.md") {
                            return undefined;
                        };
                        var doc = {title : file.name.split("/").slice(- 1)[0].slice(0, - 3)};
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
                        var templatename = src + file.name.split("/").slice(0, - 1).join("/") + "/markdown.template.html";
                        fs.readFile(templatename, "utf8", function(err, html) {
                            if(err) {
                                console.log(file.name);
                                return console.log("could not access:", templatename);
                            };
                            html = require("mustache").to_html(html, mustacheInclude(doc));
                            savehtml(dst + file.name.slice(0, - 2) + "html", html);
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
            console.log("done");
            if(err) {
                console.log("Error:", err);
            };
        });
    })();
};
