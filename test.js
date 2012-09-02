util = require('util');
ls = require('./lightscript');
rst2ast = require('./rst2ast');
//var rst = ls.parse(ls.tokenise(require('fs').readFileSync('test.js', 'utf8')))
var rst = ls.parse(ls.tokenise(require('fs').readFileSync('rst2ast.js', 'utf8')))

toList = function(ast) {
    return [ast.kind + ':' + (ast.infix?'#':'')+ast.val].concat(ast.children.map(toList));
}
console.log('RST:', require('./listpp')(rst.map(toList)));
console.log('AST:', require('./listpp')(rst.map(rst2ast).map(toList)));
//console.log(util.inspect(rst, false, 100));
