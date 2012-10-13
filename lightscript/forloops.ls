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
            console.log('here');
            result = ast.create("block", "", forpart.children[1], branch);
            console.log(result.toList());
            return ast.create("block", "", forpart.children[1], branch);
        };
    };
});
//`console.log(compiler.asts);
(function() {
for(i=0;i<100;++i) {
    console.log(i);
    console.log(i);
}
})();
