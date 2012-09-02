// Util {{{1
var extend = function(a, b) { Object.keys(b).forEach(function(key) { a[key] = b[key]; }); return a; }
var treeMap = function(tree, fn) {
    var node = fn(tree);
    node.children = node.children.map(fn);
    return node;
}

// Pretty print {{{1
var defaultPP = function(acc, indent) {
    if(this.kind === 'string' || this.kind === 'number' || this.kind === 'annotation') {
        acc.push(this.val);
        if(this.children.length > 0) {
            this.syntaxError('prettyprinting, but has children');
        }
    } else if(this.val === ';') {
    } else {
        if(this.kind === 'call') {
            if(this.val === '()') {
                tokenLookup(this.children[0]).pp(acc, indent);
                acc.push('(');
                var sep = '';
                this.children.slice(1).forEach(function(child){
                    acc.push(sep);
                    tokenLookup(child).pp(acc, indent);
                    sep = ', ';
                });
                acc.push(')');
            } else {
                tokenLookup(this.children[0]).pp(acc, indent);
                acc.push('.' + this.val + '(');
                var sep = '';
                this.children.slice(1).forEach(function(child){
                    acc.push(sep);
                    tokenLookup(child).pp(acc, indent);
                    sep = ', ';
                });
                acc.push(')');

            }
        } else if(this.kind === 'identifier') {
            acc.push(this.val);
        } else {
            this.children.forEach(function(child) {
                tokenLookup(child).pp(acc, indent);
            });
        }
    }
};
exports.prettyprint = function(obj) {
    acc = [];
    tokenLookup(obj).pp(acc, 0);
    return acc.join('');
}

// Symbol/token lookup/construction {{{1
var defaultToken = {
    nud: function() { },
    bp: 0,
    children: [],
    pp: defaultPP,
    syntaxError: function(desc) {
        console.log({error: 'syntax', desc: desc, token: this});
    }
};

var tokenLookup = function(orig) {
    var proto = symb[orig.val] || (orig.val && symb[orig.val[orig.val.length - 1]]) || defaultToken;
    return extend(Object.create(proto), orig);
}

// Syntax {{{1
var nudPrefix = function() { this.children = [parse()];};
var infix = function(bp) {
    return extend(Object.create(defaultToken), {
        led: function(left) { 
            this.infix = true;
            this.children = [left, parse(this.bp)]; 
        },
        nud: nudPrefix,
        bp: bp
    });
}
var infixr = function(bp) {
    return extend(Object.create(defaultToken), {
        led: function(left) { 
            this.infix = true;
            this.children = [left, parse(this.bp - 1)]; 
        },
        nud: nudPrefix,
        bp: bp
    });
}

var rparen = function() {
    return extend(Object.create(defaultToken), {rparen: true, 
                  nud: function() { this.syntaxError('unmatched rparen')}});
}
var prefix = function() { return extend(Object.create(defaultToken), {nud: nudPrefix})}
var sep = function() { return extend(Object.create(defaultToken), {sep:true});}
var list = function(rparen) { 
    var readList = function(obj) {
        while (!token.rparen) { obj.children.push(parse()); }
        if(token.val !== rparen) {
            obj.syntaxError('Paren mismatch begin');
            token.syntaxError('Paren mismatch end');
        }
        nextToken();
    }
    return function(bp) { 
        return extend(Object.create(defaultToken), {
            led: function(left) {
                this.children = [left];
                this.infix = true;
                readList(this)
            },
            nud: function() { this.children = []; readList(this); },
            bp: bp
        });
    } 
}

// Symbol definition table {{{2
var symb = {
    '.': infix(1000),
    '[': list(']')(1000), ']': rparen(),
    '{': list('}')(1000), '}': rparen(),
    '(': list(')')(1000), ')': rparen(),
    '#': prefix(), '@': prefix(),
    '++': prefix(), '--': prefix(),
    '!': prefix(), '~': prefix(),
    'return': prefix(), 'throw': prefix(),
    'var': prefix(),
    '*': infix(900), '/': infix(900), '%': infix(900),
    '-': infix(800), '+': infix(800),
    '>>>': infix(700), '>>': infix(700), '<<': infix(700),
    '<=': infix(600), '>=': infix(600), '>': infix(600), '<': infix(600),
    '==': infix(500), '!=': infix(500), '!==': infix(500), '===': infix(500),
    '^': infix(400), '|': infix(400), '&': infix(400),
    '&&': infix(300), '||': infix(300),
    ':': infixr(200), '?': infixr(200),
    'else': infixr(200), 
    '=': infixr(100),
    ',': sep(), ';': sep(),
};
// Parser {{{1
var token;
var nextToken;

var parse = function(rbp) {
    rbp = rbp || 0;
    var left;
    var t = token;
    nextToken();
    t.nud();
    left = t;
    while (rbp < token.bp && !t.sep) {
        t = token;
        nextToken();
        t.led(left);
        left = t;
    }
    return left;
};

exports.parse = function(tokens) {
    var pos = 0;
    nextToken = function() {
        token = tokenLookup(pos === tokens.length ? {kind: 'eof', rparen: true} : tokens[pos]);
        ++pos;
        return tokenLookup(token);
    }
    nextToken();

    var result = [];
    while(token.kind !== 'eof') {
        result.push(parse());
    }
    return result;
}
