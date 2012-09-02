// Util {{{1
var extend = function(a, b) { Object.keys(b).forEach(function(key) { a[key] = b[key]; }); return a; }
var treeMap = function(tree, fn) {
    var node = fn(tree);
    node.children = node.children.map(fn);
    return node;
}

// Symbol/token lookup/construction {{{1
var defaultToken = {
    nud: function() { },
    bp: 0,
    children: [],
    pp: function(acc, indent) {
        var i;
        acc.push('[');
        acc.push(this.kind);
        acc.push(':');
        acc.push(this.val);
        this.children.forEach(function(child) {
            acc.push(' ');
            tokenLookup(child).pp(acc, indent);
        });
        acc.push(']');
    },
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
var ledFn = function(fn) {
    return function(bp) { 
        var result = Object.create(defaultToken);
        result.led = fn;
        result.nud = nudPrefix;
        result.bp = bp; 
        return result;
    }
}
var infix = ledFn(function(left) { 
    this.infix = true;
    this.children = [left, parse(this.bp)];
});
var infixr = ledFn(function(left) { 
    this.infix = true;
    this.children = [left, parse(this.bp - 1)]; 
});

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
// Pretty print {{{1
exports.prettyprint = function(obj) {
    acc = [];
    tokenLookup(obj).pp(acc, 0);
    return acc.join('');
}
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
