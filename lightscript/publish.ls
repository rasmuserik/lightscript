def("publish", function(exports) {
    exports.nodemain = function() {
        console.log("copying sites to /usr/share/nginx/www/");
        require("child_process").exec("cp -a sites/* /usr/share/nginx/www/", function(err, stdout, stderr) {
            console.log("done");
            if(err) {
                console.log("Error:", err);
            };
        });
    };
});