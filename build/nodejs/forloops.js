//`compiler.macro("", function(ast) { console.log(ast); });
undefined;
undefined;
//`console.log(compiler.asts);
(function() {
    // outer: console
    var i;
    i = 0;
    while(i < 100) {
        console.log(i);
        ++i;
    };
})();
