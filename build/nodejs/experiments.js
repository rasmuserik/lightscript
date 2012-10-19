(function() {
    // outer: console
    // outer: exports
    exports.main = function() {
        // outer: console
        var y;
        "a compiletime value4";
        //`console.log("compiletime", t);
        undefined;
        undefined;
        undefined;
        //`console.log(require('util').inspect(compiler, false, 10));
        if(true) {
            1;
            //    console.log("here");
        };
        if(true) {
            2;
            //console.log('nodejs');
        };
        if(undefined) {};
        y = 17;
        console.log("runtime", "a compiletime value4");
        return 1;
    };
})();
