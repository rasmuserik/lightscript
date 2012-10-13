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
        //`console.log(require('util').inspect(compiler, false, 10));
        var x = 17;
        console.log("runtime", `t);
        return 1;
    };
})();
