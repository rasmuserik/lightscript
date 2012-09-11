// Pretty print {{{1

var acc = [];
var indent = 0;
var newline = function() {
    var result = '\n';
    var n = indent;
    while(n) {
        result += ' ';
        --n;
    }
    return result;
}
var exprList = function(arr, separator) {
    var sep = '';
    arr.forEach(function(elem) {
        acc.push(sep);
        pp(elem);
        sep = separator;
    });
}
var parenList = function(arr) {
    acc.push('(');
    exprList(arr, ', ');
    acc.push(')');
}
var fBlock = function(node) {
    var len = node.children.length;
    node.assert(node.children[len-1].kind === 'block', 'Expected block after function');
    acc.push(node.children[0].val);
    parenList(node.children.slice(1, -1));
    acc.push(' ');
    pp(node.children[len-1]);
}
var fPrefix = function(node) {
    node.assert(node.children.length === 2, 'prettyprint prefix must have length 1');
    acc.push(node.children[0].val);
    acc.push(' ');
    pp(node.children[1]);
}
var ifelse = function(node) {
    var len = node.children.length;
    acc.push('if');
    parenList(node.children.slice(1, 2));
    acc.push(' ');
    pp(node.children[2]);
    if(node.children.length === 4) {
        acc.push(' else ');
        pp(node.children[3]);
    }
}
var list = function(listEnd) {
    return function(node) {
        acc.push(node.children[0].val);
        if(node.children.length < 4) {
            exprList(node.children.slice(1), ', ');
        } else  {
            indent += 4;
            acc.push(newline());
            exprList(node.children.slice(1), ',' + newline());
            indent -= 4;
            acc.push(newline());
        }
        acc.push(listEnd);
    }
}
var mPrefix = function(node) {
    acc.push(node.val);
    node.assert(node.children.length === 1, 'prettyprint');
    pp(node.children[0]);
}
var specialFn = {
    'function': fBlock,
    'while': fBlock,
    'var': fPrefix,
    'return': fPrefix,
    'throw': fPrefix,
    'if': ifelse,
    '{': list('}'),
    '[': list(']'),
};
var mSubscript = function(node) {
    node.assert(node.children.length === 2, 'subscript wrong length');
    pp(node.children[0]);
    acc.push('[');
    pp(node.children[1]);
    acc.push(']');
}
var specialMethod = {
    '++': mPrefix,
    '--': mPrefix,
    '!': mPrefix,
    '~': mPrefix,
    '`': mPrefix,
    '@': mPrefix,
    '#': mPrefix,
    '[': mSubscript,
};
var pp = function(node) {
    node = require('./syntax').tokenLookup(node);
    if(node.pp) {
        node.pp();
    } else if(node.kind === 'string') {
        acc.push(JSON.stringify(node.val.slice(1, -1)));
        node.assert(node.children.length === 0, 'prettyprinting, string with children');

    } else if(node.kind === 'annotation' && node.val.slice(0,2) === '//') {
        acc.push(node.val.slice(0,-1));
        node.assert(node.children.length === 0, 'prettyprinting, but has children');
    } else if(node.kind === 'number' || node.kind === 'annotation') {
        acc.push(node.val);
        node.assert(node.children.length === 0, 'prettyprinting, but has children');
    } else if(node.val === ';') {
    } else if(node.kind === 'call') {
        if(node.val === '()') {
            if(node.children[0].kind === 'identifier' && specialFn[node.children[0].val]) {
                specialFn[node.children[0].val](node);
            } else {
                pp(node.children[0]);
                parenList(node.children.slice(1));
            }
        } else {
            if(specialMethod[node.val]) {
                specialMethod[node.val](node);
            } else {
                pp(node.children[0]);
                acc.push('.' + node.val);
                parenList(node.children.slice(1));
            }
        }
    } else if(node.kind === 'block') {
        acc.push('{');
        indent += 4;
        node.children.forEach(function(child) {
            acc.push(newline());
            pp(child);
            if(child.kind !== 'annotation') {
                acc.push(';');
            }
        });
        indent -= 4;
        acc.push(newline());
        acc.push('}');
    } else if(node.kind === 'identifier') {
        acc.push(node.val);
    } else {
        node.error('cannot prettyprint');
        acc.push(node.kind + ':' + node.val + ' ');
        node.children.forEach(function(child) {
            require('./syntax').tokenLookup(child).pp(acc, indent);
        });
    }
};
var ppPrio = function(node, prio) {
    if(node.bp && node.bp < prio) {
        acc.push('(');
    }
    pp(node);
    if(node.bp && node.bp < prio) {
        acc.push(')');
    }
}
exports.ppInfix = function() {
    if(this.children.length === 1) {
        acc.push(this.space + this.val + this.space);
        pp(this.children[0]);
    } else if(this.children.length === 2) {
        ppPrio(this.children[0], this.bp);
        acc.push(this.space + this.val + this.space);
        ppPrio(this.children[1], this.bp + 1 - this.dbp);
    } else {
        this.error('cannot prettyprint infix mus have 1 <= parameters <= 2');
    }
}
exports.prettyprint = function(obj) {
    acc = [];
    indent = 0;
    pp(obj);
    return acc.join('');
}
