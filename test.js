util = require('util');
ls = require('./lightscript');
var ast = ls.parse(ls.tokenise(require('fs').readFileSync('test.js', 'utf8')))

toList = function(ast) {
    console.log(ast, ast.children.map(toList));
    return [(ast.infix?'#':'')+ast.val].concat(ast.children.map(toList));
}
console.log(util.inspect(ast.map(toList), false, 100));

if(true) {
    -1
} else {
    2
}
