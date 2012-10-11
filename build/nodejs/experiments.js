(function() {
    // outer: console
    // outer: exports
    exports.main = function() {
        // outer: console
        "a compiletime value4";
        undefined;
        console.log("runtime", "a compiletime value4");
        return 1;
    };
})();
