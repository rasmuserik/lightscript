solsort_define("addon",function(exports, require){if(undefined) {};
if(true) {
    exports.main = function() {
        // outer: document
        // outer: alert
        alert(document.body.innerHTML);
        document.body.innerHTML += "<div style=\"position:fixed;top:0px;left:0px;width:44px;height:44px;z-index:100000;\">XXX</div>";
    };
};
// # nodejs runner
if(undefined) {};
});