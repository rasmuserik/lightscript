exports.nodemain = function() {
    // outer: process
    // outer: RegExp
    // outer: Array
    // outer: true
    var dir;
    var savehtml;
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
        // outer: dir
        // outer: Array
        var acc;
        acc = acc || [];
        dir = "";
        recurse = function(path) {
            // outer: acc
            // outer: true
            // outer: RegExp
            // outer: Object
            var fobj;
            // outer: recurse
            // outer: root
            // outer: dir
            // outer: fs
            var stat;
            stat = fs.lstatSync(path);
            if(stat.isDirectory()) {
                dir = path.replace(root, "");
                fs.readdirSync(path).map(function(name) {
                    // outer: path
                    return path + "/" + name;
                }).forEach(recurse);
            } else  {
                fobj = {name : path.replace(root, "")};
                fobj.type = path.replace(RegExp("^[^.]*\\."), "");
                fobj.dir = dir;
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
    savehtml = function(filename, html) {
        // outer: RegExp
        // outer: fs
        fs.writeFile(filename, html.replace(RegExp("=\"http(s?):/(/[^\"]*\")", "g"), function(_, s, url) {
            return "=\"/redirect" + (s && "/s") + url;
        }));
    };
    (function() {
        // outer: console
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
            // outer: savehtml
            // outer: cp
            // outer: fs
            // outer: src
            // outer: Array
            // outer: require
            // outer: dst
            // outer: mkdir
            mkdir(dst + file.dir);
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
                        // outer: dst
                        // outer: savehtml
                        savehtml(dst + file.name, html);
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
