if(undefined) {};
if(undefined) {};
// # nodejs runner
if(true) {
    exports.main = function(arg0) {
        // outer: require
        // outer: Object
        var spawnopt;
        // outer: arguments
        // outer: Array
        var args;
        // outer: process
        // outer: console
        console.log(process.cwd() + "/build/mozjs");
        args = Array.prototype.slice.call(arguments, 0);
        spawnopt = {cwd : process.cwd() + "/build/mozjs", stdio : "inherit"};
        require("child_process").spawn("cfx", args, spawnopt).on("exit", function() {
            // outer: spawnopt
            // outer: Array
            // outer: require
            // outer: arg0
            if(arg0 === "xpi") {
                require("child_process").spawn("sh", ["-c", "zip -d solsort.xpi install.rdf; perl -pi -e \"s/<em:version>[^<]*</<em:version>0.`date +%s`</\" install.rdf; zip solsort.xpi install.rdf; cp -v solsort.xpi /usr/share/nginx/www/solsort/"], spawnopt);
            };
        });
    };
};
