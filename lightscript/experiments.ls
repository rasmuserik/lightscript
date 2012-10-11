(function() {
    exports.main = function() {
        `(t = "a compiletime value" + 2 * 2);
        `console.log("compiletime", t);
        console.log("runtime", `t);
        return 1;
    };
})();
