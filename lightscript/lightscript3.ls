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
    result.unshift(this.val);
    result.unshift(this.kind);
    return result;
};
Ast.prototype.toString = function() {
    return JSON.stringify(this.toList());
};
Ast.prototype.createFromList = function(list) {
    if(Array.isArray(list)) {
        var kind = list[0];
        var val = list[1];
        var result = this.create(kind, val, list.slice(2).map(astFromList));
    } else  {
        result = list;
    };
    return result;
};
// Ast transformations {{{1
// Matcher {{{2
// Pattern matching notes
// matcher = new Matcher();
// matcher.pattern(["id", "*{}", ["id", "*()", ["id:function"], "?a"], "??b"],  function(match) { ... });
// matcher.pattern(["id", "*{}", "?a"], function(match) { ... });
// matcher.pattern(["str", "?a"], function(match) { ... }); 
// matcher.pattern(["id", "?operator", "?lhs", "??rhs"]: function(match, ast) {
//     return ast.create('call', match["operator"], [match["lhs"]].concat(match["rhs"]));
// }); 
// matcher.pattern(["id", "var", "?val"]: function(match, ast) {
//      return match["val"];
// }); 
//
// matcher.pattern(["id:=", ["id:.", ["id:.", ["id:?class"] [id:prototype]] ["id:?member"]] "?value"], function(match) {
// })
//
// matcher function
// parameter: match object with bound vars, and match.ast = full node, match.parent = parent node
// try most specific match first. If result is undefined, try next match
//
// MatcherPattern {{{3
MatcherPattern = function(pattern) {
    if(typeof(pattern) === "string") {
        if(pattern[0] === "?") {
            this.anyVal = pattern.slice(1);
        } else {
            this.str = pattern;
        }
    } else {
        this.kind = new MatcherPattern(pattern[0]);
        this.val = new MatcherPattern(pattern[1]);
        this.children = pattern.slice(2);
        if(pattern[pattern.length - 1].slice(0, 2) === "??") {
            this.endglob = pattern[pattern.length - 1].slice(2);
            this.children = pattern.slice(0, -1);
        } 
        this.children = this.children.map(function(child) {
            return new MatcherPattern(child);
        });
    };
};
MatcherPattern.prototype.match = function(ast, matchResult) {
    if(this.anyVal) {
        matchResult.capture(this.anyVal, ast);
    } else if(this.str) {
        matchResult.increaseRanking();
        if(ast !== this.str) {
            matchResult.failure();
        }
    } else if(!this.endglob && this.children.length !== ast.children.length) {
        matchResult.failure();
    } else {
        this.kind.match(ast.kind, matchResult);
        this.val.match(ast.val, matchResult);
        i = 0;
        while(i < this.children.length) {
            this.children[i].match(ast.children[i], matchResult);
            ++i;
        }
        if(this.endglob) {
            matchResult.capture(this.endglob, ast.children.slice(i));
        }
    }
    return matchResult;
};
// MatchResult {{{3
MatchResult = function(fn) {
    this.captures = {};
    this.ok = true;
    this.rank = 0;
    this.fn = fn;
}
MatchResult.prototype.failure = function() {
    this.ok = false;
}
MatchResult.prototype.capture = function(key, val) {
    this.captures[key] = val;
}
MatchResult.prototype.increaseRanking = function() {
    ++this.rank;
}
// MatchEntry {{{3
MatchEntry = function(pattern, fn) {
    this.pattern = new MatcherPattern(pattern);
    this.fn = fn;
}
// Matcher {{{3
Matcher = function() {
    this.table = {};
};
Matcher.prototype.pattern = function(pattern, fn) {
    this.table[pattern[0]] = matchers = this.table[pattern[0]] || [];
    matchers.push(new MatchEntry(pattern, fn));
};
Matcher.prototype.match = function(ast) {
    result = undefined;
    matchers = this.table[ast.kind];
    if(matchers) {
        matchers.map(function(matcher) {
            console.log(matcher);
            return matcher.pattern.match(ast, new MatchResult(matcher.fn));
        }).filter(function(result) {
            return result.ok;
        }).sort(function(a, b) {
            return a.rank - b.rank;
        }).forEach(function(match) {
            if(!result) {
                result = match.fn(match.captures, ast);
            }
        });
    }
    return result;
};
Matcher.prototype.recursiveWalk = function(ast) {
    self = this;
    ast.children.map(function(child) {
        self.recursiveWalk(child);
    });
    this.match(ast);
};
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
            pop();
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
    this.indent = - 1;
    this.acc = [];
    this.prevWasNewline = false;
};
PrettyPrinter.prototype.increaseIndent = function() {
    ++this.indent;
};
PrettyPrinter.prototype.decreaseIndent = function() {
    --this.indent;
};
PrettyPrinter.prototype.newline = function(indent) {
    if(!this.prevWasNewline) {
    indent = (indent || 0) + this.indent;
    this.str("\n");
    while(indent > 0) {
        this.str("    ");
        --indent;
    };
    this.prevWasNewline = true;
    }
};
PrettyPrinter.prototype.str = function(str) {
    this.acc.push(str);
    this.prevWasNewline = false;
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
var listpp = function(isInfix, newlineLength, prefixSpace) {
    return function(obj, pp) {
        var ast = obj.ast;
        if(isInfix) {
            pp.pp(ast.children[0]);
            pp.str(prefixSpace);
            pp.str(ast.val[1]);
            var list = ast.children.slice(1);
        } else  {
            pp.str(ast.val);
            list = ast.children;
        };
        pp.increaseIndent();
        space = "";
        list.map(function(child) {
            return new SyntaxObj(child);
        }).map(function(child) {
            if(!child.opt["sep"]) {
            if(list.length > newlineLength) {
                pp.newline();
            } else {
                pp.str(space);
                space = " ";
            };
            }
            child.pp(pp);
        });
        pp.decreaseIndent();
        if(list.length > newlineLength) {
            pp.newline();
        };
        if(isInfix) {
            pp.str(ast.val[2]);
        } else {
            pp.str(obj.opt["paren"]);
        }
    };
};
var strpp = function(obj, pp) {
    pp.str(JSON.stringify(obj.ast.val));
};
var notepp = function(obj, pp) {
    pp.newline();
    pp.str(obj.ast.val);
    pp.newline();
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
    "[" : [1200, {pp : listpp(false, 4, ""), paren: "]"}],
    "*[]" : [1200, {pp : listpp(true, 4, "")}],
    "(" : [1200, {pp : listpp(false, 1, ""), paren: ")"}],
    "*()" : [1200, {pp : listpp(true, 10, "")}],
    "{" : [1100, {pp : listpp(false, 4, ""), paren: "}"}],
    "*{}" : [1200, {pp : listpp(true, 0, " ")}],
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
    "note:" : [0, {sep : true, pp: notepp}],
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
    source = "module{" + source + "}";
    var tokens = tokenise(source);
    var ast = parse(tokens)[0];
    var pp = new PrettyPrinter();
    pp.pp(ast);
    console.log(pp.acc.join(""));
    matcher = new Matcher();
    ids = {};
    matcher.pattern(["id", "?id"], function(match, ast) {
        ids[match["id"]] = true;
    });
    matcher.recursiveWalk(ast);
    console.log(Object.keys(ids));
};
