exports.nodemain = function() {
    var dst = "/usr/share/nginx/www/";
    var src = "/home/rasmuserik/solsort/sites/";
    console.log("copying sites to " + dst);
    var fs = require("fs");
    var util = require("./util");
    dirs = {};
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
        dir = "";
        var recurse = function(path) {
            var stat = fs.lstatSync(path);
            if(stat.isDirectory()) {
                dir = path.replace(root, "");
                fs.readdirSync(path).map(function(name) {
                    return path + "/" + name;
                }).forEach(recurse);
            } else  {
                fobj = {name: path.replace(root, "")};
                fobj.type = path.replace(RegExp("^[^.]*\\."), "");
                fobj.dir = dir;
                if(stat.isSymbolicLink()) {
                    fobj.symlink = true;
                }
                acc.push(fobj);
            };
        };
        recurse(root);
        return acc;
    };
    var cp = function(src, dst, callback) {
        require('util').pump(fs.createReadStream(src), fs.createWriteStream(dst), callback);
    };
    (function() {
        var files = rstat(process.env.HOME + "/solsort/sites");
        files.map(function(file) {
            mkdir(dst + file.dir);
            if(file.symlink) {
                require("child_process").spawn("cp", ['-a', src + file.name, dst + file.name])
                //fs.symlinkSync(src + file.name, dst + file.dir + '/' + fs.readlinkSync(src + file.name));
            } else {
                if(file.type === 'html') {
                    console.log('HTML:', file.name);
                    fs.readFile(src + file.name, 'utf8', function(err, html) {
                        fs.writeFile(dst + file.name, html.replace(RegExp('="http(s?):/(/[^"]*")', "g"), function(_, s, url) {
                            return '="/redirect' + (s && '/s') + url;
                        }));
                    });
                } else {
                    cp(src + file.name, dst + file.name, function(err) {
                        //console.log('Error:', err, file);
                    });
                }
            }
        });

        require("child_process").exec("cp -a ~/solsort/sites/* /usr/share/nginx/www/", function(err, stdout, stderr) {
            console.log("done");
            if(err) {
                console.log("Error:", err);
            };
        });
    })();
};
