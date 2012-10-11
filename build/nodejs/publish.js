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
