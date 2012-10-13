(function() {
    // outer: console
    // outer: exports
    exports.main = function() {
        // outer: console
        var x;
        "a compiletime value4";
        undefined;
        undefined;
        undefined;
        x = 17;
        console.log("runtime", "a compiletime value4");
        return 1;
    };
})();
