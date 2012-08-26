ls = require('./lightscript');
console.log(
    ls.parse(ls.tokenise(require('fs').readFileSync('sample.lightscript', 'utf8')))
);
