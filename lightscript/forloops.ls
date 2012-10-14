//`compiler.macro("", function(ast) { console.log(ast); });
`compiler.macro("call:*{}", function(ast) {
    if(ast.children[0].isa("call:*()")) {
        var forpart = ast.children[0];
        if(forpart.children[0].isa("id:for")) {
            forpart.assertEqual(forpart.children.length, 6);
            var branch = ast.create("branch:while", forpart.children[3]);
            block = ast.create('block', '');
            block.children = ast.children.slice(1);
            block.children.push(forpart.children[5]);
            branch.children.push(block);
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
    /*compiler.unmacro("branch:while", function(ast) {
        console.log(1);
        if(ast.prev && ast.prev.kind === "assign") {
            var id = ast.prev.val;
            block = ast.children[1];
            console.log(2, block.children.length);
            if(block.children.length > 1 && readsVar(ast.children[0], id)) {
                console.log(3);
                var last = block.children[block.children.length - 1];
                if(last.isa("assign:" + id) ||
                    (last.kind === "call" && incrs.indexOf(last.val) !== - 1)) {
                        init = ast.prev;
                        initIndex = ast.parent.indexOf(init);
                        if(initIndex === -1) {
                            return undefined;
                        }
                        return undefined;
                };
            };
        };
    });
    */
})();
//`console.log(compiler.asts);
while(1) {
    console.log('arvh');
};
(function() {
    for(i=0;i<100;++i) {
        console.log(i);
    }
})();
