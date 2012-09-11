// Util {{{1
var extend = function(a, b) { Object.keys(b).forEach(function(key) { a[key] = b[key]; }); return a; }
// Symbol/token lookup/construction {{{1
var defaultToken = {
    nud: function() { },
    bp: 0,
    dbp: 0,
    space: ' ',
    children: [],
    assert: function(ok, desc) {
        if(!ok) {
            this.error(desc);
        }
    },
    error: function(desc) {
        console.log({error: 'syntax', desc: desc, token: this});
    }
};

var tokenLookup = exports.tokenLookup = function(orig) {
    var proto = symb[orig.kind] || symb[orig.val] || (orig.val && symb[orig.val[orig.val.length - 1]]) || defaultToken;
    return extend(Object.create(proto), orig);
}

// Syntax {{{1
var nudPrefix = function() { 
    var child = parse();
    if(parse.sep) {
        this.error('should be followed by a value, not a separator');
        child.error('missing something before this element');
    }
    this.children = [child];
};
var infixLed = function(left) { 
    this.infix = true;
    this.children = [left, parse(this.bp - this.dbp)]; 
};
var infix = function(bp) {
    return extend(Object.create(defaultToken), {
          led: infixLed,
           pp: require('./prettyprint').ppInfix,
           nud: nudPrefix,
           bp: bp
    });
}
var infixr = function(bp) {
    return extend(Object.create(defaultToken), {
           led: infixLed,
           nud: nudPrefix,
           pp: require('./prettyprint').ppInfix,
           bp: bp,
           dbp: 1
    });
}

var rparen = function() {
    return extend(Object.create(defaultToken), {rparen: true, 
        nud: function() { this.error('unmatched rparen')}});
}
var prefix = function() { return extend(Object.create(defaultToken), {nud: nudPrefix})}
var sep = function() { return extend(Object.create(defaultToken), {sep:true});}
var list = function(rparen) { 
    var readList = function(obj) {
        while (!token.rparen) { obj.children.push(parse()); }
        if(token.val !== rparen) {
            obj.error('Paren mismatch begin');
            token.error('Paren mismatch end');
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

// Symbol definition table {{{1
var symb = {
    '.': infix(1000),
    '[': list(']')(1000), ']': rparen(),
    '{': list('}')(1000), '}': rparen(),
    '(': list(')')(1000), ')': rparen(),
    '#': prefix(), '@': prefix(),
    '++': prefix(), '--': prefix(),
    '!': prefix(), '~': prefix(),
    '`': prefix(), 
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
    constructor: defaultToken,
    valueOf: defaultToken,
    toString: defaultToken,
    toLocaleString: defaultToken,
    hasOwnProperty: defaultToken,
    isPrototypeOf: defaultToken,
    propertyIsEnumerable: defaultToken,
    comment: sep()
};
symb['.'].space = '';
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
1+2*(3+4)*5*(6*7)*8 - 2 - (3 - 5);
1 || 2 || (3 || 4) || 5;
