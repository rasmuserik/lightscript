define("addon",function(exports, require){
// outer: arguments
// outer: Array
// outer: process
// outer: document
// outer: alert
// outer: console
// outer: Object
// outer: require
// outer: exports
if(undefined) {};
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