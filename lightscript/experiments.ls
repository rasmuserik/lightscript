(function() {
    exports.main = function() {
        `(t = "a compiletime value" + 2 * 2);
        `console.log("compiletime", t);
        `compiler.macro("id:x", function(ast) {
            return ast.create("id:y");
        });
        `console.log(compiler);
        var x = 17;
        console.log("runtime", `t);
        return 1;
    };
})();
