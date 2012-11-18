// Ast {{{1
Ast = function(kind, val, children, opt) {
    this.kind = kind;
    this.val = val;
    this.children = children || [];
    this.opt = opt || {};
};
Ast.prototype.create = function(kind, val, children) {
    return new Ast(kind, val, children, this.opt);
};
Ast.prototype.isa = function(kindval) {
    split = kindval.indexOf(":");
    kind = kindval.slice(0, split);
    val = kindval.slice(split + 1);
    return this.kind === kind && this.val === val;
};
Ast.prototype.deepCopy = function() {
    return new Ast(this.kind, this.val, this.children.map(function(child) {
        return child.deepCopy();
    }), this.opt);
};
Ast.prototype.toList = function() {
    var result = this.children.map(function(node) {
        return node.toList();
    });
    result.unshift(this.kind + ":" + this.val);
    return result;
};
Ast.prototype.toString = function() {
    return JSON.stringify(this.toList());
}
// Tokeniser {{{1
BufferPos = function(line, pos) {
    this.line = line;
    this.pos = pos;
}
BufferDescr = function(data, filename) {
    this.filename = filename;
    this.data = data;
}
TokenPos = function(start, end, buffer) {
    this.start = start;
    this.end = end;
    //this.buffer = buffer;
}
exports.tokenise = tokenise = function(buffer, filename) {
    var pos = 0;
    var lineno = 1;
    var newlinePos = 0;
    bufferDescr = new BufferDescr(buffer, filename);
    var start = new BufferPos(0,0);
    var one_of = function(str) {
        return str.indexOf(peek()) !== - 1;
    };
    var starts_with = function(str) {
        return peek(str.length) === str;
    };
    var peek = function(n, delta) {
        n = n || 1;
        delta = delta || 0;
        return buffer.slice(pos + delta, pos + delta + n);
    };
    var pop = function(n) {
        n = n || 1;
        newlinePos;
        var result = buffer.slice(pos, pos + n);
        result.split("").forEach(function(c) {
            if(c === "\n") {
                ++lineno; 
                newlinePos = pos;
            };
        });
        pos += n;
        return result;
    };
    var begin_token = function() {
        start = new BufferPos(lineno, pos - newlinePos);
    };
    var newToken = function(kind, val) {
        return new Ast(kind, val, [], {pos: new TokenPos(start, new BufferPos(lineno, pos - newlinePos), bufferDescr)});
    };
    var next = function() {
        var whitespace = " \t\r\n";
        var single_symbol = "(){}[]:;,`?";
        var joined_symbol = "=+-*/<>%!|&^~#.@";
        var ident = "_qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM$";
        var digits = "0123456789";
        var hexdigits = digits + "abcdefABCDEF";
        var s = undefined;
        var c = undefined;
        while(peek() && one_of(whitespace)) {
            pop();
        };
        begin_token();
        if(peek() === "") {
            result = undefined;
        } else if(starts_with("//")) {
            s = "";
            while(peek() && peek() !== "\n") {
                s += pop();
            };
            s += pop();
            result = newToken("note", s);
        } else if(starts_with("/*")) {
            s = "";
            while(peek() && peek(2) !== "*/") {
                s += pop();
            };
            s += pop(2);
            result = newToken("note", s);
        } else if(one_of("\"")) {
            s = "";
            var quote = pop();
            while(!starts_with(quote)) {
                c = pop();
                if(c === "\\") {
                    c = pop();
                    c = ({
                        n : "\n",
                      r : "\r",
                      t : "\t",
                    })[c] || c;
                };
                s += c;
            };
            pop();
            result = newToken("str", s);
        } else if(one_of(digits) || (peek() === "." && digits.indexOf(peek(1, 1)) !== - 1)) {
            s = pop();
            if(peek() !== "x") {
                while(peek() && one_of(".e" + digits)) {
                    s += pop();
                };
            } else  {
                s = pop(2);
                while(peek() && one_of(hexdigits)) {
                    s += pop();
                };
            };
            result = newToken("num", s);
        } else if(one_of(single_symbol)) {
            result = newToken("id", pop());
        } else if(one_of(joined_symbol)) {
            s = "";
            while(peek() && one_of(joined_symbol)) {
                s += pop();
            };
            result = newToken("id", s);
        } else if(one_of(ident)) {
            s = "";
            while(peek() && one_of(ident + digits)) {
                s += pop();
            };
            result = newToken("id", s);
        } else  {
            throw "Tokenisation error: " + peek().charCodeAt(0) + " (" + peek() + ") at pos " + pos;
        };
        return result;
    };
    var tokens = [];
    var token = next();
    while(token) {
        console.log("" + token);
        tokens.push(token);
        token = next();
    };
    return tokens;
};
// Parser {{{1
//
// implementation sketch:
//
// table: {
//    'foo': {
//    led: function...
//    nud: function...
//    ...
//    }
// }
// ... 
// led = function(node) {
//   obj = lookup(node);
//   return obj["led"](node, obj);
// }
// ...
// infix = function(id, bp) {
//  table[id] = {}
//  table[id].bp = bp;
//  table[id].led = ...
// }
// ...
// infix("/", 500)
// ...

infix = function(id, bp, nospace) { };
infixr = function(id, bp) {};
list = function(id, rparen, bp) {};
prefix = function(id, bp, nospace) {};
rparen = function(id) {};
sep = function(id) {};
special = function(id, opt) {};
defaultToken = function(id) {};

blockpp = infixlistpp = undefined;
// Syntax definition {{{2
table = {
    ".": [infix, 1200, {nospace: true}],
    "[": [list, 1200, {rparen: "]"}],
    "*[]": [special, 1200, {pp : infixlistpp}],
    "]": [rparen],
    "(": [list, 1200, {rparen: ")"}],
    "*()": [special, 1200, {pp : infixlistpp}],
    ")": [rparen],
    "{": [list, "}", 1100],
    "*{}": [special, 1200, {pp : blockpp}],
    "}": [rparen],
    "#": [prefix, 1000, {nospace: true}],
    "@": [prefix, 1000, {nospace: true}],
    "++": [prefix, 1000, {nospace: true}],
    "--": [prefix, 1000, {nospace: true}],
    "!": [prefix, 1000, {nospace: true}],
    "~": [prefix, 1000, {nospace: true}],
    "`": [prefix, 1000, {nospace: true}],
    "*": [infix, 900],
    "/": [infix, 900],
    "%": [infix, 900],
    "-": [infix, 800],
    "+": [infix, 800],
    ">>>": [infix, 700],
    ">>": [infix, 700],
    "<<": [infix, 700],
    "<=": [infix, 600],
    ">=": [infix, 600],
    ">": [infix, 600],
    "<": [infix, 600],
    "==": [infix, 500],
    "!=": [infix, 500],
    "!==": [infix, 500],
    "===": [infix, 500],
    "^": [infix, 400],
    "|": [infix, 400],
    "&": [infix, 400],
    "&&": [infix, 300],
    "||": [infix, 300],
    ":": [infixr, 200],
    "?": [infixr, 200],
    "else": [infixr, 200],
    "=": [infixr, 100],
    ",": [sep],
    ";": [sep],
    "constructor": [defaultToken],
    "valueOf": [defaultToken],
    "toString": [defaultToken],
    "toLocaleString": [defaultToken],
    "hasOwnProperty": [defaultToken],
    "isPrototypeOf": [defaultToken],
    "propertyIsEnumerable": [defaultToken],
    "return": [prefix],
    "throw": [prefix],
    "new": [prefix],
    "typeof": [prefix],
    "var": [prefix],
    "str:": [defaultToken],
    "note:": [sep], 
}

// Main for testing {{{1
exports.nodemain = function(file) {
    file = file || "lightscript3";
    source = require("fs").readFileSync(__dirname + "/../../lightscript/" + file + ".ls", "utf8");
    tokens = tokenise(source);
//    ast = parse(tokens);
};

