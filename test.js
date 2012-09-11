util = require('util');
ls = require('./lightscript');
rst2ast = require('./rst2ast');
var filename = process.argv[2] || 'test.js';
//var rst = ls.parse(ls.tokenise(require('fs').readFileSync('test.js', 'utf8')))
var rst = ls.parse(ls.tokenise(require('fs').readFileSync(filename, 'utf8')));

toList = function(ast) {
    return [ast.kind + ':' + (ast.infix?'#':'')+ast.val].concat(ast.children.map(toList));
}
//console.log('RST:', require('./listpp')(rst.map(toList)));
//console.log('AST:', require('./listpp')(rst.map(rst2ast).map(toList)));
console.log( ls.prettyprint({kind:'block', children: rst.map(rst2ast).filter(function(elem) { return elem.val !== ';'; })}).replace(RegExp('\n    ', 'g'), '\n').slice(2,-2));
//console.log(util.inspect(rst, false, 100));
!function() { console.log('hello world')}();
