util = require('util');
ls = require('./lightscript');
rst2ast = require('./rst2ast');
var filename = process.argv[2];
if(!filename) {
    console.log('usage: node pp.js filename\nprints to stdout');
}
var rst = ls.parse(ls.tokenise(require('fs').readFileSync(filename, 'utf8')));
console.log(ls.prettyprint({kind:'block', children: rst.map(rst2ast).filter(function(elem) { return elem.val !== ';'; })}).replace(RegExp('\n    ', 'g'), '\n').slice(2,-2));
