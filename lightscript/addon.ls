if(`compiler.mozjs) {
    //widget = require('addon-kit/widget');
    exports.main = function(options, callbacks) {
        var pagemod = require("page-mod");
        pagemod.PageMod({
            include : "*",
            contentScriptWhen : "end",
            contentScript : "document.body.innerHTML += \"hello from solsort\"",
        });
        //    contentScript: 'document.body.innerHTML += "<h1>Here I am</h1>";'
        /*
        widget.Widget({
            id: 'solsort-widget',
            label: 'solsort',
            content: 'solsort <b>hello</b> <i>world</i>',
            width: 200
        });
        */
        console.log("hello from addon");
    };
};
// # nodejs runner
if(`compiler.nodejs) {
    exports.main = function(arg0) {
        console.log(process.cwd() + "/build/mozjs");
        var args = Array.prototype.slice.call(arguments, 0);
        var spawnopt = {cwd : process.cwd() + "/build/mozjs", stdio : "inherit"};
        require("child_process").spawn("cfx", args, spawnopt).on("exit", function() {
            if(arg0 === "xpi") {
                require("child_process").spawn("sh", ["-c", "zip -d solsort.xpi install.rdf; perl -pi -e \"s/<em:version>[^<]*</<em:version>0.`date +%s`</\" install.rdf; zip solsort.xpi install.rdf; cp -v solsort.xpi /usr/share/nginx/www/solsort/"], spawnopt);
            };
        });
    };
};
