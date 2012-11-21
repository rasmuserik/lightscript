// Ast {{{1
var Ast = function(kind, val, children, opt) {
    this.kind = kind;
    this.val = val || "";
    this.children = children || [];
    this.opt = opt || {};
};
Ast.prototype.create = function(kind, val, children) {
    return new Ast(kind, val, children, this.opt);
};
Ast.prototype.isa = function(kind, val) {
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
};
Ast.prototype.createFromList = function(list) {
    if(Array.isArray(list)) {
        var kindval = list[0];
        var splitpos = kindval.indexOf(":");
        var kind = kindval.slice(0, splitpos);
        var val = kindval.slice(splitpos + 1);
        var result = this.create(kind, val, list.slice(1).map(astFromList));
    } else  {
        result = list;
    };
    return result;
};
// Matcher {{{2
// Pattern matching notes
// matcher = new Matcher();
// matcher.pattern(["id:*{}", ["id:*()", ["id:function"], "?a"], "??b"],  function(match) { ... });
// matcher.pattern(["id:*{}", "?a"] : function(match) { ... });
// matcher.pattern(["str:?a"]: function(match) { ... }); 
//
// matcher function
// parameter: match object with bound vars, and match.ast = full node
// try most specific match first. If result is undefined, try next match
// Tokeniser {{{1
var BufferPos = function(line, pos) {
    this.line = line;
    this.pos = pos;
};
var BufferDescr = function(data, filename) {
    this.filename = filename;
    this.data = data;
};
var TokenPos = function(start, end, buffer) {
    this.start = start;
    this.end = end;
    //this.buffer = buffer;
};
exports.tokenise = var tokenise = function(buffer, filename) {
    var pos = 0;
    var lineno = 1;
    var newlinePos = 0;
    var bufferDescr = new BufferDescr(buffer, filename);
    var start = new BufferPos(0, 0);
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
        return new Ast(kind, val, [], {pos : new TokenPos(start, new BufferPos(lineno, pos - newlinePos), bufferDescr)});
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
            var result = undefined;
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
    var currentToken = next();
    while(currentToken) {
        tokens.push(currentToken);
        currentToken = next();
    };
    return tokens;
};
// Syntax {{{1
// Syntax object {{{2
var SyntaxObj = function(ast) {
    this.ast = ast;
    var syntaxData = table[ast.kind + ":"] || table[ast.val] || (ast.val && table[ast.val[ast.val.length - 1]]) || table["default:"];
    this.bp = syntaxData[0] || 0;
    this.opt = syntaxData[1] || {};
};
// Parser {{{2
var readList = function(paren, ast) {
    while(!token.opt["rparen"]) {
        ast.children.push(parseExpr());
    };
    if(token.ast.val !== paren) {
        throw JSON.stringify({
            err : "paren mismatch",
            start : ast,
            end : token.ast,
        });
    };
    nextToken();
};
var token = undefined;
var nextToken = undefined;
var parseExpr = function(rbp) {
    rbp = rbp || 0;
    var t = token;
    nextToken();
    t.nud();
    var left = t;
    while(rbp < token.bp && !t.opt["sep"]) {
        t = token;
        nextToken();
        t.led(left.ast);
        left = t;
    };
    return left.ast;
};
var parse = function(tokens) {
    var pos = 0;
    nextToken = function() {
        if(pos < tokens.length) {
            var ast = tokens[pos];
            ++pos;
        } else  {
            ast = new Ast("eof");
        };
        token = new SyntaxObj(ast);
        return token;
    };
    nextToken();
    var result = [];
    while(token.ast.kind !== "eof") {
        result.push(parseExpr());
    };
    return result;
};
SyntaxObj.prototype.led = function(left) {
    var ast = this.ast;
    if(this.opt["paren"]) {
        var paren = this.opt["paren"];
        ast.val = "*" + ast.val + paren;
        ast.children = [left];
        readList(paren, ast);
    } else if(this.opt["noinfix"]) {
        throw ast + " must not occur as infix.";
    } else  {
        ast.children = [left, parseExpr(this.bp - this.opt["dbp"])];
    };
};
SyntaxObj.prototype.nud = function() {
    if(this.opt["paren"]) {
        readList(this.opt["paren"], this.ast);
    } else if(this.opt["noinfix"]) {
        this.ast.children = [parseExpr(this.bp)];
    };
};
// Prettyprinter {{{2
var PrettyPrinter = function() {
    this.pos = 0;
    this.indent = 0;
    this.width = 80;
    this.singleLine = false;
    this.acc = [];
};
PrettyPrinter.prototype.increaseIndent = function() {
    ++this.indent;
};
PrettyPrinter.prototype.decreaseIndent = function() {
    --this.indent;
};
PrettyPrinter.prototype.newLine = function(indent) {
    indent = (indent || 0) + this.indent;
    this.str("\n");
    while(indent > 0) {
        this.str("        ");
        --indent;
    };
};
PrettyPrinter.prototype.str = function(str) {
    if(str.slice(- 1) === "\n") {
        if(this.singleLine) {
            // to be used for backtracking, for linebreaks in lists
            throw "hasNewLine";
        };
        this.pos = 0;
    };
    if(this.pos > this.width) {
        this.newLine(1);
    };
    this.pos += str.length;
    this.acc.push(str);
};
PrettyPrinter.prototype.pp = function(ast, bp) {
    bp = bp || 0;
    var syn = new SyntaxObj(ast);
    if(syn.bp && syn.bp < bp) {
        this.str("(");
    };
    syn.pp(this);
    if(syn.bp && syn.bp < bp) {
        this.str(")");
    };
};
// TODO: list pretty printing:
// 1) set this.singleLine=true and try to print list on current line
// 2) retry print one item per line instead
//
// OR: revert to lightscript2-like behaviour
PrettyPrinter.prototype.list = function(list) {
    var self = this;
    self.increaseIndent();
    var sep = "";
    list.map(function(child) {
        return new SyntaxObj(child);
    }).filter(function(obj) {
        return !obj.opt["sep"];
    }).map(function(child) {
        self.str(sep);
        child.pp(self);
        sep = ", ";
    });
    self.decreaseIndent();
};
var infixlistpp = function(synobj, pp) {
    var ast = synobj.ast;
    pp.pp(ast.children[0]);
    pp.str(ast.val[1]);
    pp.list(ast.children.slice(1));
    pp.str(ast.val[2]);
};
var listpp = function(synobj, pp) {
    var ast = synobj.ast;
    pp.str(ast.val);
    pp.list(ast.children);
    pp.str(synobj.opt["paren"]);
};
var strpp = function(obj, pp) {
    pp.str(JSON.stringify(obj.ast.val));
};
SyntaxObj.prototype.pp = function(pp) {
    var ast = this.ast;
    var children = ast.children;
    if(this.opt["nospace"]) {
        var space = "";
    } else  {
        space = " ";
    };
    if(this.opt["pp"]) {
        this.opt["pp"](this, pp);
    } else if(children.length === 0) {
        pp.str(ast.val);
    } else if(children.length === 1) {
        pp.str(ast.val + space);
        pp.pp(children[0], this.bp);
    } else if(children.length === 2) {
        pp.pp(children[0], this.bp);
        pp.str(space + ast.val + space);
        pp.pp(children[1], this.bp + 1 - this.opt["dbp"]);
    } else  {
        throw "prettyprint error, too long node: " + ast;
    };
};
// Syntax definition {{{2
var table = {
    "." : [1200, {nospace : true}],
    "[" : [1200, {paren : "]", pp : listpp}],
    "*[]" : [1200, {pp : infixlistpp}],
    "(" : [1200, {paren : ")", pp : listpp}],
    "*()" : [1200, {pp : infixlistpp}],
    "{" : [1100, {paren : "}", pp : listpp}],
    "*{}" : [1200, {pp : infixlistpp}],
    "#" : [1000, {nospace : true, noinfix : true}],
    "@" : [1000, {nospace : true, noinfix : true}],
    "++" : [1000, {nospace : true, noinfix : true}],
    "--" : [1000, {nospace : true, noinfix : true}],
    "!" : [1000, {nospace : true, noinfix : true}],
    "~" : [1000, {nospace : true, noinfix : true}],
    "`" : [1000, {nospace : true, noinfix : true}],
    "*" : [900],
    "/" : [900],
    "%" : [900],
    "-" : [800],
    "+" : [800],
    ">>>" : [700],
    ">>" : [700],
    "<<" : [700],
    "<=" : [600],
    ">=" : [600],
    ">" : [600],
    "<" : [600],
    "==" : [500],
    "!=" : [500],
    "!==" : [500],
    "===" : [500],
    "^" : [400],
    "|" : [400],
    "&" : [400],
    "&&" : [300],
    "||" : [300],
    ":" : [200, {dbp : 1}],
    "?" : [200, {dbp : 1}],
    "else" : [200, {dbp : 1}],
    "=" : [100, {dbp : 1}],
    "," : [0, {sep : true}],
    ";" : [0, {sep : true}],
    "note:" : [0, {sep : true}],
    "]" : [0, {rparen : true}],
    ")" : [0, {rparen : true}],
    "}" : [0, {rparen : true}],
    "eof:" : [0, {rparen : true}],
    "return" : [0, {noinfix : true}],
    "throw" : [0, {noinfix : true}],
    "new" : [0, {noinfix : true}],
    "typeof" : [0, {noinfix : true}],
    "var" : [0, {noinfix : true}],
    "str:" : [0, {pp : strpp}],
    "constructor" : [],
    "valueOf" : [],
    "toString" : [],
    "toLocaleString" : [],
    "hasOwnProperty" : [],
    "isPrototypeOf" : [],
    "propertyIsEnumerable" : [],
    "default:" : [],
};
// Main for testing {{{1
exports.nodemain = function(file) {
    file = file || "lightscript3";
    var source = require("fs").readFileSync(__dirname + "/../../lightscript/" + file + ".ls", "utf8");
    var tokens = tokenise(source);
    var asts = parse(tokens);
    var pp = new PrettyPrinter();
    asts.forEach(function(ast) {
        pp.pp(ast);
        //pp.str("\n");
    });
    console.log(pp.acc.join(""));
};
