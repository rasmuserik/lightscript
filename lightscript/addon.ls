if(`compiler.mozjs) {
    //widget = require('addon-kit/widget');
    exports.main = function(options, callbacks) {
        var pagemod = require("page-mod");
        var data = require("self").data;
        pagemod.PageMod({
            include : "*",
            contentScriptWhen : "end",
            contentScriptFile : data.url("solsort.js"),
        });
        console.log("hello from addon");
    };
};
if(`compiler.webjs) {
    exports.main = function() {
        alert(document.body.innerHTML);
        document.body.innerHTML += "<div style=\"position:fixed;top:0px;left:0px;width:44px;height:44px;z-index:100000;\">XXX</div>";
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
