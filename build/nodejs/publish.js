if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
exports.nodemain = function() {
    // outer: require
    // outer: console
    console.log("copying sites to /usr/share/nginx/www/");
    require("child_process").exec("cp -a ~/solsort/sites/* /usr/share/nginx/www/", function(err, stdout, stderr) {
        // outer: console
        console.log("done");
        if(err) {
            console.log("Error:", err);
        };
    });
};
