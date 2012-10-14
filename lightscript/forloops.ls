//`compiler.macro("", function(ast) { console.log(ast); });
`compiler.macro("call:*{}", function(ast) {
    if(ast.children[0].isa("call:*()")) {
        var forpart = ast.children[0];
        if(forpart.children[0].isa("id:for")) {
            console.log("for", forpart);
            forpart.assertEqual(forpart.children.length, 6);
            var branch = ast.create("branch:while", forpart.children[3]);
            branch.children = branch.children.concat(ast.children.slice(1));
            branch.children.push(forpart.children[5]);
            console.log("here");
            var result = ast.create("block", "", forpart.children[1], branch);
            console.log(result.toList());
            return ast.create("block", "", forpart.children[1], branch);
        };
    };
});
`(function() {
    var readsVar = function(ast, varname) {
        if(ast.kind === "id" && ast.name === varname) {
            return true;
        };
        var i = 0;
        while(i < ast.children.length) {
            if(readsVar(ast.children[i])) {
                return true;
            };
            ++i;
        };
    };
    var incrs = "++ -- += -= /= *=".split(" ");
    compiler.unmacro("branch:while", function(ast) {
        if(ast.prev && ast.prev.kind === "assign") {
            var id = ast.prev.val;
            if(ast.children.length > 2 && readsVar(ast.children[0], id)) {
                var last = ast.children[ast.children.length - 1];
                if(last.isa("assign:" + id)) {
                    if(last.kind === "call" && incrs.indexOf(last.val) !== - 1) {
                        console.log("HERE!!!");
                    };
                };
            };
        };
    });
})();
//`console.log(compiler.asts);
(function() {
    var i = 0;
    while(i < 100) {
        console.log(i);
        console.log(i);
        ++i;
    };
})();
