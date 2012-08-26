var EOFToken = {};

// Util
function extend(a, b) { Object.keys(b).forEach(function(key) { a[key] = b[key]; }); return a; }

// Current token
// Token prototype
var defaultToken = {
    nud: function() { },
    led: function(left) { this.syntaxError('not an operator'); },
    bp: 0,
    children: [],
    syntaxError: function(desc) {
        throw {error: 'syntax', desc: desc, token: this};
    }
};

// current token and function go get it
var token;
var nextToken;


function tokenLookup(orig) {
    var proto;
    if(orig.kind === 'symbol') {
        proto = symbSuffixes[orig.val[orig.val.length - 1]];
    } else {
        proto = defaultToken;
    }
    return extend(Object.create(proto), orig);
}

function ledFn(fn) {
    return function(bp) { 
        var result = Object.create(defaultToken);
        result.led = function(left) { this.infix = true; fn(left) }; 
        result.bp = bp; 
        return result;
    }
}
var infix = ledFn(function(left) { this.children = [left, parse(this.bp)];});
var infixr = ledFn(function(left) { this.children = [left, parse(this.bp - 1)];});
var infixparen = ledFn(function(left) { this.children = this.readList([left]);});

function rparen() { return extend(Object.create(defaultToken), {rparen:true, nud: function() { this.syntaxError('unmatched rparen')}}); }
function prefix() { return extend(Object.create(defaultToken), {nud: function() { this.children = [parse()];}});}
function sep() { return extend(Object.create(defaultToken), {sep:true});}
function list(rparen) { 
    function readList(obj) {
        while (!token.rparen) {
            obj.children.push(parse());
        }
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
            nud: function() {
                this.children = [];
                readList(this);
            },
            bp: bp
        });
    } 
}

var symbSuffixes = {
    '.': [infix, 700],
    '[': [list('}'), 600],
    ']': [rparen],
    '{': [list('}'), 600],
    '}': [rparen],
    '(': [list(')'), 600],
    ')': [rparen],
    '#': [prefix],
    '@': [prefix],
    '`': [prefix],
    '!': [prefix],
    '*': [infix, 200],
    '/': [infix, 200],
    '%': [infix, 200],
    '+': [infix, 200],
    '-': [infix, 200],
    ':': [infixr, 200],
    '?': [infixr, 200],
    '<': [infix, 200],
    '>': [infix, 200],
    '=': [infixr, 200],
    '~': [infix, 200],
    '^': [infix, 300],
    '|': [infix, 300],
    '&': [infix, 300],
    ',': [infix, 200],
    ';': [sep, 100],
};

Object.keys(symbSuffixes).forEach(function(symb){
    var t = symbSuffixes[symb];
    symbSuffixes[symb] = t[0](t[1]);
});

function parse(rbp) {
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
        token = tokenLookup(pos === tokens.length ? {kind: 'eof', rparen: true} : tokens[pos++]);
        return tokenLookup(token);
    }
    nextToken();

    var result = [];
    while(token.kind !== 'eof') {
        result.push(parse());
    }
    return result;
}
