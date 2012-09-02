var trycatch = require('./trycatch');
// Util {{{1
var clearSep = function(arr) {
    return arr.filter(function(elem) { return !elem.sep; });
}

// error handling {{{1
var rst2ast = function(ast) {
    return trycatch(function() { return rst2astUnsafe(ast) },
            function(err) { ast.syntaxError('Could not do rst2ast transformation; ' + err); return ast; });
};
// Main rst2ast function{{{1
var rst2astUnsafe = function(ast) {
    var children, lhs;
    if(ast.infix) {
        // function/method-call `(` {{{1
        if(ast.val === '(') {
            lhs = ast.children[0];
            if(lhs.infix && lhs.val === '.' && lhs.children[1].kind === 'identifier') {
                children = clearSep(ast.children).map(rst2ast);
                children[0] = lhs.children[0];
                return { pos: ast.pos,
                    kind: 'call',
                    val: lhs.children[1].val,
                    children: children }
            }
            return { pos: ast.pos,
                kind: 'call',
                val: '()',
                children: clearSep(ast.children).map(rst2ast)
            }
        } 
        // else (if-else) {{{1
        if(ast.val === 'else') {
            lhs = rst2ast(ast.children[0]);
            if(ast.children[1].val === '{' && !ast.children[1].infix) {
                lhs.children.push({
                    pos:ast.children[1].pos, kind: 'block', val: 'block', 
                    children: clearSep(ast.children[1].children).map(rst2ast)
                });
            } else {
                lhs.children.push(rst2ast(ast.children[1]));
            }
            return lhs;
        }

        // codeblocks {{{1
        if(ast.val === '{') {
            lhs = rst2ast(ast.children[0]);
            lhs.children.push({ pos: ast.pos,
                kind: 'block',
                val: 'block',
                children: clearSep(ast.children).slice(1).map(rst2ast)
            });
            return lhs;
        }
    } else {
        // (non-infix) parenthesis {{{1
        if(ast.val === '(' && ast.children.length === 1) {
            return rst2ast(ast.children[0]);
        }
        // tuples, hashtables and arrays {{{1
        if(ast.val === '(' || ast.val === '{' || ast.val === '[') {
            var children = clearSep(ast.children).map(rst2ast);
            children.unshift({pos:ast.pos, kind: 'identifier', val: ast.val, children: []})
            return {pos: ast.pos, kind: 'call', val: '()', children: children};
        }
        // var, return, throw {{{1
        if(ast.val === 'var' || ast.val === 'return' || ast.val === 'throw') {
            return {pos: ast.pos, kind: 'call', val: '()', children: [
                {pos:ast.pos, kind: 'identifier', val: ast.val, children: []},
                rst2ast(ast.children[0])
            ]};
        }

    }
    // Comments as annotations {{{1
    if(ast.kind === 'comment') {
        ast.kind = 'annotation';
    }
    // Symbols as method-calls {{{1
    if(ast.kind === 'symbol') {
        ast.kind = 'call';
    }
    // default {{{1
    ast.children = clearSep(ast.children).map(rst2ast);
    return ast;
}
module.exports = rst2ast;
