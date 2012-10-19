(function() {
    exports.main = function() {
        `(t = "a compiletime value" + 2 * 2);
        //`console.log("compiletime", t);
        `compiler.macro("assign:x", function(ast) {
            ast.val = "y";
        });
        `compiler.macro("id:x", function(ast) {
            ast.val = "y";
        });
        `console.log("target:", compiler.target);
        //`console.log(require('util').inspect(compiler, false, 10));
        if(`(compiler.target === "nodejs")) {
            1;
            //    console.log("here");
        };
        if(`compiler.nodejs) {
            2;
            //console.log('nodejs');
        };
        if(`compiler.webjs) {
            3;
            //console.log('webjs');
        };
        var y = 17;
        console.log("runtime", `t);
        return 1;
    };
})();
