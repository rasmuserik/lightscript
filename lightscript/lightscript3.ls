// TODO:
//
// refactor/cleanup, ie. id-function/filter/... in rst-ast-matcher
// pos+type as true part of ast, rather than opt
// java-backend
//
// Util {{{1
id = function(x) {
    return x;
};
pplist = function(list, indent) {
    indent = indent || "  ";
    if(!Array.isArray(list)) {
        return list;
    };
    result = list.map(function(elem) {
        return pplist(elem, indent + "  ");
    });
    len = 0;
    result.forEach(function(elem) {
        len = len + (elem.length + 1);
    });
    if(result[1]) {
        result[1] = result[0] + " " + JSON.stringify(result[1]).slice(1, - 1);
        result.shift();
    };
    if(len < 72) {
        return "[" + result.join(" ") + "]";
    } else if(true) {
        return "[" + result.join("\n" + indent) + "]";
    };
};
// Ast {{{1
Ast = function(kind, val, children, opt) {
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
    result = this.children.map(function(node) {
        return node.toList();
    });
    result.unshift(this.val);
    result.unshift(this.kind);
    return result;
};
Ast.prototype.toString = function() {
    return JSON.stringify(this.toList());
};
Ast.prototype.fromList = function(list) {
    if(Array.isArray(list)) {
        self = this;
        result = this.create(list[0], list[1], list.slice(2).map(function(child) {
            return self.fromList(child);
        }));
    } else if(true) {
        result = list;
    };
    return result;
};
// Ast Matcher {{{1
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
// MatcherPattern {{{2
MatcherPattern = function(pattern) {
    if(typeof pattern === "string") {
        if(pattern[0] === "?") {
            this.anyVal = pattern.slice(1);
        } else if(true) {
            this.str = pattern;
        };
    } else if(true) {
        this.kind = new MatcherPattern(pattern[0]);
        this.val = new MatcherPattern(pattern[1]);
        if(pattern[pattern.length - 1].slice(0, 2) === "??") {
            this.endglob = pattern[pattern.length - 1].slice(2);
            this.children = pattern.slice(2, - 1);
        } else if(true) {
            this.children = pattern.slice(2);
        };
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
        };
    } else if(this.children.length > ast.children.length) {
        matchResult.failure();
    } else if(!this.endglob && this.children.length !== ast.children.length) {
        matchResult.failure();
    } else if(true) {
        this.kind.match(ast.kind, matchResult);
        this.val.match(ast.val, matchResult);
        i = 0;
        while(i < this.children.length) {
            this.children[i].match(ast.children[i], matchResult);
            i = i + 1;
        };
        if(this.endglob) {
            matchResult.capture(this.endglob, ast.children.slice(i));
        };
    };
    return matchResult;
};
// MatchResult {{{2
MatchResult = function(fn) {
    this.captures = {};
    this.ok = true;
    this.rank = 0;
    this.fn = fn;
};
MatchResult.prototype.failure = function() {
    this.ok = false;
};
MatchResult.prototype.capture = function(key, val) {
    this.captures[key] = val;
};
MatchResult.prototype.increaseRanking = function() {
    this.rank = this.rank + 1;
};
// MatchEntry {{{2
MatchEntry = function(pattern, fn) {
    this.pattern = new MatcherPattern(pattern);
    this.fn = fn;
};
// Matcher {{{2
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
            return matcher.pattern.match(ast, new MatchResult(matcher.fn));
        }).filter(function(result) {
            return result.ok;
        }).sort(function(a, b) {
            return b.rank - a.rank;
        }).forEach(function(match) {
            if(!result) {
                result = match.fn(match.captures, ast);
            };
        });
    };
    return result;
};
Matcher.prototype.recursiveWalk = function(ast) {
    self = this;
    ast.children.map(function(child) {
        self.recursiveWalk(child);
    });
    this.match(ast);
};
Matcher.prototype.recursivePreTransform = function(ast) {
    self = this;
    ast = this.match(ast) || ast;
    return ast.create(ast.kind, ast.val, ast.children.map(function(child) {
        return self.recursivePreTransform(child);
    }));
};
Matcher.prototype.recursivePostTransform = function(ast) {
    self = this;
    t = ast.create(ast.kind, ast.val, ast.children.map(function(child) {
        return self.recursivePostTransform(child);
    }));
    return this.match(t) || t;
};
// Tokeniser {{{1
BufferPos = function(line, pos) {
    this.line = line;
    this.pos = pos;
};
BufferDescr = function(data, filename) {
    this.filename = filename;
    this.data = data;
};
TokenPos = function(start, end, buffer) {
    this.start = start;
    this.end = end;
    //this.buffer = buffer;
    };
exports.tokenise = tokenise = function(buffer, filename) {
    pos = 0;
    lineno = 1;
    newlinePos = 0;
    bufferDescr = new BufferDescr(buffer, filename);
    start = new BufferPos(0, 0);
    oneOf = function(str) {
        return str.indexOf(peek()) !== - 1;
    };
    startsWith = function(str) {
        return peek(str.length) === str;
    };
    peek = function(n, delta) {
        n = n || 1;
        delta = delta || 0;
        return buffer.slice(pos + delta, pos + delta + n);
    };
    pop = function(n) {
        lineno;
        n = n || 1;
        newlinePos;
        result = buffer.slice(pos, pos + n);
        result.split("").forEach(function(c) {
            if(c === "\n") {
                lineno = lineno + 1;
                newlinePos = pos;
            };
        });
        pos = pos + n;
        return result;
    };
    beginToken = function() {
        start = new BufferPos(lineno, pos - newlinePos);
    };
    newToken = function(kind, val) {
        return new Ast(kind, val, [], {pos : new TokenPos(start, new BufferPos(lineno, pos - newlinePos), bufferDescr)});
    };
    next = function() {
        whitespace = " \t\r\n";
        singleSymbol = "(){}[]:;,`?";
        joinedSymbol = "=+-*/<>%!|&^~#.@";
        ident = "_qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM$";
        digits = "0123456789";
        hexdigits = digits + "abcdefABCDEF";
        s = undefined;
        c = undefined;
        while(peek() && oneOf(whitespace)) {
            pop();
        };
        beginToken();
        if(peek() === "") {
            result = undefined;
        } else if(startsWith("//")) {
            s = "";
            while(peek() && peek() !== "\n") {
                s = s + pop();
            };
            pop();
            result = newToken("note", s);
        } else if(startsWith("/*")) {
            s = "";
            while(peek() && peek(2) !== "*/") {
                s = s + pop();
            };
            s = s + pop(2);
            result = newToken("note", s);
        } else if(oneOf("\"")) {
            s = "";
            quote = pop();
            while(!startsWith(quote)) {
                c = pop();
                if(c === "\\") {
                    c = pop();
                    c = ({
                        n : "\n",
                        r : "\r",
                        t : "\t"
                    })[c] || c;
                };
                s = s + c;
            };
            pop();
            result = newToken("str", s);
        } else if(oneOf(digits) || (peek() === "." && digits.indexOf(peek(1, 1)) !== - 1)) {
            s = pop();
            if(peek() !== "x") {
                while(peek() && oneOf(".e" + digits)) {
                    s = s + pop();
                };
            } else if(true) {
                s = pop(2);
                while(peek() && oneOf(hexdigits)) {
                    s = s + pop();
                };
            };
            result = newToken("num", s);
        } else if(oneOf(singleSymbol)) {
            result = newToken("id", pop());
        } else if(oneOf(joinedSymbol)) {
            s = "";
            while(peek() && oneOf(joinedSymbol)) {
                s = s + pop();
            };
            result = newToken("id", s);
        } else if(oneOf(ident)) {
            s = "";
            while(peek() && oneOf(ident + digits)) {
                s = s + pop();
            };
            result = newToken("id", s);
        } else if(true) {
            throw "Tokenisation error: " + peek().charCodeAt(0) + " (" + peek() + ") at pos " + pos;
        };
        return result;
    };
    tokens = [];
    currentToken = next();
    while(currentToken) {
        tokens.push(currentToken);
        currentToken = next();
    };
    return tokens;
};
// Syntax {{{1
// Syntax object {{{2
SyntaxObj = function(ast) {
    this.ast = ast;
    syntaxData = table[ast.kind + ":"] || table[ast.val] || (ast.val && table[ast.val[ast.val.length - 1]]) || table["default:"];
    this.bp = syntaxData[0] || 0;
    this.opt = syntaxData[1] || {};
};
// Parser {{{2
readList = function(paren, ast) {
    while(!token.opt["rparen"]) {
        ast.children.push(parseExpr());
    };
    if(token.ast.val !== paren) {
        throw JSON.stringify({
            err : "paren mismatch",
            start : ast,
            end : token.ast
        });
    };
    nextToken();
};
token = undefined;
nextToken = undefined;
parseExpr = function(rbp) {
    rbp = rbp || 0;
    t = token;
    nextToken();
    t.nud();
    left = t;
    while(rbp < token.bp && !t.opt["sep"]) {
        t = token;
        nextToken();
        t.led(left.ast);
        left = t;
    };
    return left.ast;
};
parse = function(tokens) {
    pos = 0;
    nextToken = function() {
        if(pos < tokens.length) {
            ast = tokens[pos];
            pos = pos + 1;
        } else if(true) {
            ast = new Ast("eof");
        };
        token = new SyntaxObj(ast);
        return token;
    };
    nextToken();
    result = [];
    while(token.ast.kind !== "eof") {
        result.push(parseExpr());
    };
    return result;
};
SyntaxObj.prototype.led = function(left) {
    ast = this.ast;
    if(this.opt["paren"]) {
        paren = this.opt["paren"];
        ast.val = "*" + ast.val + paren;
        ast.children = [left];
        readList(paren, ast);
    } else if(this.opt["noinfix"]) {
        throw ast + " must not occur as infix.";
    } else if(true) {
        ast.children = [left, parseExpr(this.bp - (this.opt["dbp"] || 0))];
    };
    ast.kind = "call";
};
SyntaxObj.prototype.nud = function() {
    if(this.opt["paren"]) {
        readList(this.opt["paren"], this.ast);
    } else if(this.opt["noinfix"] || this.bp) {
        this.ast.children = [parseExpr(this.bp)];
        this.ast.kind = "call";
    };
};
// Prettyprinter {{{2
PrettyPrinter = function() {
    this.indent = - 1;
    this.acc = [];
    this.prevWasNewline = false;
};
PrettyPrinter.prototype.increaseIndent = function() {
    this.indent = this.indent + 1;
};
PrettyPrinter.prototype.decreaseIndent = function() {
    this.indent = this.indent - 1;
};
PrettyPrinter.prototype.newline = function(indent) {
    if(!this.prevWasNewline) {
        indent = (indent || 0) + this.indent;
        this.str("\n");
        while(indent > 0) {
            this.str("    ");
            indent = indent - 1;
        };
        this.prevWasNewline = true;
    };
};
PrettyPrinter.prototype.str = function(str) {
    this.acc.push(str);
    this.prevWasNewline = false;
};
PrettyPrinter.prototype.pp = function(ast, bp) {
    bp = bp || 0;
    syn = new SyntaxObj(ast);
    if(syn.bp && syn.bp < bp) {
        this.str("(");
    };
    syn.pp(this);
    if(syn.bp && syn.bp < bp) {
        this.str(")");
    };
};
listpp = function(isInfix, newlineLength, prefixSpace) {
    return function(obj, pp) {
        ast = obj.ast;
        if(isInfix) {
            pp.pp(ast.children[0], obj.bp);
            pp.str(prefixSpace);
            pp.str(ast.val[1]);
            list = ast.children.slice(1);
        } else if(true) {
            pp.str(ast.val);
            list = ast.children;
        };
        if(list.length > newlineLength) {
            pp.increaseIndent();
        };
        space = "";
        list.map(function(child) {
            return new SyntaxObj(child);
        }).map(function(child) {
            if(!child.opt["sep"]) {
                if(list.length > newlineLength) {
                    pp.newline();
                } else if(true) {
                    pp.str(space);
                    space = " ";
                };
            };
            child.pp(pp);
        });
        if(list.length > newlineLength) {
            pp.decreaseIndent();
            pp.newline();
        };
        if(isInfix) {
            pp.str(ast.val[2]);
        } else if(true) {
            pp.str(obj.opt["paren"]);
        };
    };
};
strpp = function(obj, pp) {
    pp.str(JSON.stringify(obj.ast.val));
};
notepp = function(obj, pp) {
    pp.newline();
    pp.str(obj.ast.val);
    pp.newline();
};
SyntaxObj.prototype.pp = function(pp) {
    ast = this.ast;
    children = ast.children;
    if(this.opt["nospace"]) {
        space = "";
    } else if(true) {
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
        pp.pp(children[1], this.bp + 1 - (this.opt["dbp"] || 0));
    } else if(true) {
        pp.str("-:<");
        pp.str(ast.kind + " " + ast.val);
        ast.children.forEach(function(child) {
            pp.str(" | ");
            pp.pp(child);
        });
        pp.str(">:-");
    };
};
// Syntax definition {{{2
table = {
    "." : [1200, {nospace : true}],
    "[" : [1200, {pp : listpp(false, 10, ""), paren : "]"}],
    "*[]" : [1200, {pp : listpp(true, 10, "")}],
    "(" : [1200, {pp : listpp(false, 1, ""), paren : ")"}],
    "*()" : [1200, {pp : listpp(true, 10, "")}],
    "{" : [1100, {pp : listpp(false, 4, ""), paren : "}"}],
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
    "note:" : [0, {sep : true, pp : notepp}],
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
    "default:" : []
};
// rst to ast {{{1
// Setup {{{2
notSep = function(ast) {
    return ast.kind !== "id" || (ast.val !== ";" && ast.val !== ",");
};
noSeps = function(list) {
    return list.filter(notSep);
};
matchReplace = function(match, elem, filter) {
    filter = filter || id;
    if(Array.isArray(elem)) {
        tail = undefined;
        if(elem[elem.length - 1].slice(0, 2) === "??") {
            tail = filter(match[elem[elem.length - 1].slice(2)]);
            elem = elem.slice(0, - 1);
        };
        result = elem.map(function(child) {
            return matchReplace(match, child, filter);
        });
        if(tail) {
            result = result.concat(tail);
        };
    } else if(typeof elem === "string" && elem[0] === "?") {
        result = match[elem.slice(1)];
    } else if(true) {
        result = elem;
    };
    return result;
};
rstToAst = new Matcher();
astToRst = new Matcher();
rstToAstTransform = function(from, to, filter) {
    filter = filter || noSeps;
    rstToAst.pattern(from, function(match, ast) {
        return ast.fromList(matchReplace(match, to, filter));
    });
};
astToRstTransform = function(from, to, filter) {
    astToRst.pattern(from, function(match, ast) {
        return ast.fromList(matchReplace(match, to, filter));
    });
};
astTransform = function(from, to, opts) {
    rstToAstTransform(from, to);
    astToRstTransform(to, from);
};
// Commas and semicolons {{{2
addCommas = function(ast) {
    ast.children = ast.children.map(addCommas);
    sep = undefined;
    if(ast.isa("call", "*{}")) {
        skipfirst = true;
        addlast = true;
        sep = new Ast("id", ";");
    };
    if(ast.isa("call", "*()")) {
        skipfirst = true;
        sep = new Ast("id", ",");
    };
    if(ast.isa("id", "[") || ast.isa("id", "{")) {
        sep = new Ast("id", ",");
    };
    if(sep) {
        children = [];
        ast.children.forEach(function(child) {
            children.push(child);
            if(!skipfirst && child.kind !== "note") {
                children.push(sep);
            };
            skipfirst = false;
        });
        lastchild = children[children.length - 1];
        if(!addlast && lastchild === sep) {
            children.pop();
        };
        ast.children = children;
    };
    return ast;
};
// transformations {{{2
astTransform(["call", "*{}", ["id", "module"], "??body"], ["block", "module", "??body"]);
astTransform(["call", "||", "?p1", "?p2"], ["branch", "||", "?p1", "?p2"]);
astTransform(["call", "&&", "?p1", "?p2"], ["branch", "&&", "?p1", "?p2"]);
astTransform(["call", "=", ["call", "*[]", "?obj", "?idx"], "?val"], ["call", "*[]=", "?obj", "?idx", "?val"]);
astTransform(["call", "=", ["call", ".", "?obj", "?member"], "?val"], ["call", ".=", "?obj", "?member", "?val"]);
astTransform(["call", "throw", "?result"], ["branch", "throw", "?result"]);
astTransform(["call", "return", "?result"], ["branch", "return", "?result"]);
astTransform(["call", "typeof", "?result"], ["call", "typeof", "?result"]);
astTransform(["call", "*()", "??args"], ["call", "*()", "??args"]);
astTransform(["call", ".", "?obj", ["id", "?id"]], ["call", ".", "?obj", ["str", "?id"]]);
astTransform(["call", "*{}", ["call", "*()", ["id", "function"], "??args"], "??body"], ["fn", " ", ["block", " ", "??args"], ["block", " ", "??body"]]);
astTransform(["call", "*{}", ["call", "*()", ["id", "while"], "?cond"], "??body"], ["branch", "for", ["block", " "], "?cond", ["block", " ", "??body"]]);
astTransform(["call", "=", ["id", "?name"], "?val"], ["assign", "?name", "?val"]);
astTransform(["call", "new", ["call", "*()", "?class", "??args"]], ["call", "new", "?class", "??args"]);
rstToAstTransform(["call", "*()", ["call", ".", "?obj", ["str", "?method"]], "??args"], ["call", "?method", "?obj", "??args"]);
rstToAstTransform(["call", "var", "?val"], "?val");
rstToAstTransform(["id", "(", "?val"], "?val");
rstToAst.pattern(["call", "+=", "?target", "?val"], function(match, ast) {
    return rstToAst.match(ast.fromList(matchReplace(match, ["call", "=", "?target", ["call", "+", "?target", "?val"]])));
});
rstToAst.pattern(["call", "-=", "?target", "?val"], function(match, ast) {
    return rstToAst.match(ast.fromList(matchReplace(match, ["call", "=", "?target", ["call", "-", "?target", "?val"]])));
});
rstToAst.pattern(["call", "++", "?target"], function(match, ast) {
    return rstToAst.match(ast.fromList(matchReplace(match, ["call", "+=", "?target", ["num", "1"]])));
});
rstToAst.pattern(["call", "--", "?target"], function(match, ast) {
    return rstToAst.match(ast.fromList(matchReplace(match, ["call", "-=", "?target", ["num", "1"]])));
});
astToRst.pattern(["call", "?method", "?obj", "??args"], function(match, ast) {
    prio = (table[match["method"]] || [])[0];
    if(prio) {
        result = undefined;
    } else if(true) {
        result = ast.fromList(matchReplace(match, ["call", "*()", ["call", ".", "?obj", ["id", "?method"]], "??args"], noSeps));
    };
    return result;
});
// Array and HashMap Literals {{{2
rstToAstTransform(["id", "[", "??elems"], ["call", "new", ["id", "Array"], "??elems"]);
astToRst.pattern(["call", "new", ["id", "Array"], "??elems"], function(match, ast) {
    elems = [];
    match["elems"].forEach(function(elem) {
        elems.push(elem);
    });
    return ast.fromList(["id", "["].concat(elems));
});
rstToAst.pattern(["id", "{", "??elems"], function(match, ast) {
    ok = true;
    args = [];
    match["elems"].forEach(function(child) {
        if(child.isa("call", ":") && child.children.length === 2) {
            args.push(child.children[0]);
            args.push(child.children[1]);
        } else if(notSep(child)) {
            ok = false;
        };
    });
    result = undefined;
    if(ok) {
        result = ast.fromList(["call", "new", ["id", "HashMap"]].concat(args));
    };
    return result;
});
astToRst.pattern(["call", "new", ["id", "HashMap"], "??elems"], function(match, ast) {
    list = [];
    elems = match["elems"];
    i = 0;
    while(i < elems.length) {
        list.push(["call", ":", elems[i], elems[i + 1]]);
        i = i + 2;
    };
    return ast.fromList(["id", "{"].concat(list));
});
// If-else {{{2
rstToAst.pattern(["call", "*{}", ["call", "*()", ["id", "if"], "?p"], "??body"], function(match, ast) {
    return ast.fromList(["branch", "cond", match["p"], ["block", " "].concat(match["body"].filter(notSep))]);
});
rstToAst.pattern(["call", "else", ["branch", "cond", "??cond1"], ["branch", "cond", "??cond2"]], function(match, ast) {
    return ast.fromList(["branch", "cond"].concat(match["cond1"]).concat(match["cond2"]));
});
rstToAst.pattern(["call", "else", ["branch", "cond", "??cond"], ["id", "{", "??body"]], function(match, ast) {
    return ast.fromList(["branch", "cond"].concat(match["cond"]).concat([["id", "true"], ["block", " "].concat(match["body"].filter(notSep))]));
});
astToRst.pattern(["branch", "cond", "??branches"], function(match, ast) {
    branches = match["branches"];
    body = branches.pop();
    cond = branches.pop();
    rhs = ["call", "*{}", ["call", "*()", ["id", "if"], cond]].concat(body.children);
    while(branches.length > 0) {
        body = branches.pop();
        cond = branches.pop();
        lhs = ["call", "*{}", ["call", "*()", ["id", "if"], cond]].concat(body.children);
        rhs = ["call", "else", lhs, rhs];
    };
    return ast.fromList(rhs);
});
// Main for testing {{{1
exports.nodemain = function(file) {
    file = file || "lightscript3";
    source = require("fs").readFileSync(__dirname + "/../../lightscript/" + file + ".ls", "utf8");
    source = "module{" + source + "}";
    tokens = tokenise(source);
    ast = parse(tokens)[0];
    ast = rstToAst.recursivePostTransform(ast);
    ast = astToRst.recursivePreTransform(ast);
    ast = addCommas(ast);
    //console.log(pplist(ast.toList()));
    pp = new PrettyPrinter();
    pp.pp(ast);
    console.log(pp.acc.join("").split("\n").slice(1, - 1).join("\n"));
    names = {};
    recursiveVisit = function(ast) {
        names[ast.kind] = obj = names[ast.kind] || {};
        obj[ast.val] = true;
        ast.children.map(recursiveVisit);
    };
    recursiveVisit(ast);
    Object.keys(names).forEach(function(kind) {
        names[kind] = Object.keys(names[kind]).sort();
    });
    //console.log(names);
    /*
    */
    //console.log(pplist(rstToAst.recursiveTransform(ast).toList()));
};
