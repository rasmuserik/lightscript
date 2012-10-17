// Compiler {{{1
codegen = undefined;
(function() {
    // outer: ast2rst
    // outer: ast2js
    // outer: prettyprint
    // outer: analyse
    // outer: this
    // outer: addMacro
    // outer: compiletime
    // outer: rst2ast
    // outer: tokenise
    // outer: parse
    // outer: Object
    // outer: runMacro
    // outer: undefined
    // outer: exports
    // outer: codegen
    var ls2compiler;
    var applyMacros;
    applyMacros = function(macros, compiler) {
        // outer: runMacro
        // outer: undefined
        var doIt;
        var relations;
        relations = function(ast) {
            // outer: relations
            // outer: undefined
            var prev;
            prev = undefined;
            ast.children.forEach(function(child) {
                // outer: ast
                // outer: prev
                // outer: relations
                relations(child);
                if(prev) {
                    child.prev = prev;
                    prev.next = child;
                };
                child.parent = ast;
                prev = child;
            });
        };
        doIt = function(ast) {
            // outer: macros
            // outer: runMacro
            // outer: doIt
            if(ast.kind === "compiletime") {
                return ast;
            };
            ast.children = ast.children.map(doIt);
            return runMacro(macros, ast);
        };
        compiler.asts.forEach(relations);
        compiler.asts = compiler.asts.map(doIt);
    };
    ls2compiler = function(src) {
        // outer: this
        // outer: addMacro
        // outer: applyMacros
        // outer: compiletime
        // outer: rst2ast
        // outer: tokenise
        // outer: parse
        // outer: Object
        var compiler;
        compiler = {
            asts : parse(tokenise(src)).map(rst2ast),
            forwardMacros : {},
            reverseMacros : {},
            macro : function(pattern, fn) {
                // outer: this
                // outer: addMacro
                addMacro(this.forwardMacros, pattern, fn);
            },
            unmacro : function(pattern, fn) {
                // outer: this
                // outer: addMacro
                addMacro(this.reverseMacros, pattern, fn);
            },
        };
        compiletime(compiler);
        applyMacros(compiler.forwardMacros, compiler);
        return compiler;
    };
    codegen = function(astTransform, asts) {
        // outer: prettyprint
        // outer: analyse
        asts = analyse(asts);
        asts = asts.map(astTransform);
        return prettyprint(asts).slice(1);
    };
    exports.ls2js = function(ls) {
        // outer: ls2compiler
        // outer: ast2js
        // outer: codegen
        return codegen(ast2js, ls2compiler(ls).asts);
    };
    exports.ls2ls = function(ls) {
        // outer: ast2rst
        // outer: codegen
        // outer: analyse
        // outer: applyMacros
        // outer: ls2compiler
        var compiler;
        compiler = ls2compiler(ls);
        applyMacros(compiler.reverseMacros, compiler);
        compiler.asts = analyse(compiler.asts);
        return codegen(ast2rst, compiler.asts);
    };
})();
// compile-time-execution {{{1
compiletime = undefined;
(function() {
    // outer: JSON
    // outer: console
    // outer: require
    // outer: Function
    // outer: ast2js
    // outer: codegen
    // outer: Array
    // outer: compiletime
    var platform;
    // outer: use
    var util;
    util = use("util");
    platform = util.platform;
    compiletime = function(compiler) {
        // outer: JSON
        // outer: console
        // outer: require
        // outer: util
        // outer: Function
        var fn;
        // outer: ast2js
        // outer: codegen
        var code;
        // outer: platform
        var ast;
        var i;
        var deepcopy;
        var visitAsts;
        var compiletimevals;
        // outer: Array
        var compiletimeasts;
        var asts;
        asts = compiler.asts;
        compiletimeasts = [];
        compiletimevals = [];
        visitAsts = function(asts) {
            // outer: visitAsts
            // outer: compiletimeasts
            asts.forEach(function(ast) {
                // outer: visitAsts
                // outer: compiletimeasts
                if(ast.kind === "compiletime") {
                    ast.assertEqual(ast.children.length, 1);
                    compiletimeasts.push(ast);
                } else  {
                    visitAsts(ast.children);
                };
            });
        };
        visitAsts(asts);
        deepcopy = function(ast) {
            // outer: deepcopy
            var result;
            result = ast.create(ast);
            result.children = ast.children.map(deepcopy);
            return result;
        };
        asts = compiletimeasts.map(function(ast) {
            return ast.children[0];
        }).map(deepcopy);
        i = 0;
        while(i < asts.length) {
            ast = asts[i];
            if(!ast.isa("branch:cond") && !ast.isa("branch:while") && !ast.isa("branch:return")) {
                asts[i] = ast.create("call:[]=", ast.create("id:__compiletimevals"), ast.create("num", i), ast);
            };
            ++i;
        };
        if(platform === "node" || platform === "web") {
            code = codegen(ast2js, asts);
            fn = Function("__compiletimevals", "compiler", "require", code);
            util.trycatch(function() {
                // outer: require
                // outer: compiler
                // outer: compiletimevals
                // outer: fn
                fn(compiletimevals, compiler, require);
            }, function(err) {
                // outer: console
                console.log("compile-time error", err);
                if(err.stack) {
                    console.log(err.stack);
                };
            });
        } else  {
            throw "unsupported platform";
        };
        i = 0;
        while(i < compiletimeasts.length) {
            compiletimeasts[i].val = util.trycatch(function() {
                // outer: i
                // outer: compiletimevals
                // outer: JSON
                return JSON.stringify(compiletimevals[i]);
            }, function() {}) || "undefined";
            ++i;
        };
    };
})();
// Tokeniser {{{1
tokenise = undefined;
(function() {
    // outer: true
    // outer: undefined
    // outer: Array
    // outer: Object
    // outer: tokenise
    var createToken;
    "use strict";
    createToken = function(kind, val, pos) {
        // outer: Object
        return {
            kind : kind,
            val : val,
            pos : pos,
        };
    };
    tokenise = function(buffer) {
        // outer: true
        // outer: undefined
        // outer: createToken
        var token;
        // outer: Array
        var tokens;
        var next;
        var newToken;
        var begin_token;
        var pop;
        var peek;
        var starts_with;
        var one_of;
        var lineno;
        // outer: Object
        var start;
        var pos;
        pos = 0;
        start = {lineno : 0, pos : 0};
        lineno = 0;
        one_of = function(str) {
            // outer: peek
            return str.indexOf(peek()) !== - 1;
        };
        starts_with = function(str) {
            // outer: peek
            return peek(str.length) === str;
        };
        peek = function(n, delta) {
            // outer: pos
            // outer: buffer
            n = n || 1;
            delta = delta || 0;
            return buffer.slice(pos + delta, pos + delta + n);
        };
        pop = function(n) {
            // outer: lineno
            // outer: pos
            // outer: buffer
            var result;
            n = n || 1;
            result = buffer.slice(pos, pos + n);
            result.split("").forEach(function(c) {
                // outer: lineno
                if(c === "\n") {
                    ++lineno;
                };
            });
            pos += n;
            return result;
        };
        begin_token = function() {
            // outer: pos
            // outer: lineno
            // outer: Object
            // outer: start
            start = {lineno : lineno, pos : pos};
        };
        newToken = function(kind, val) {
            // outer: pos
            // outer: lineno
            // outer: start
            // outer: createToken
            var result;
            result = createToken(kind, val, "l" + start.lineno + "p" + start.pos + "-l" + lineno + "p" + pos);
            return result;
        };
        next = function() {
            // outer: pos
            // outer: Object
            var quote;
            // outer: newToken
            // outer: starts_with
            // outer: pop
            // outer: one_of
            // outer: peek
            // outer: begin_token
            // outer: true
            var c;
            // outer: undefined
            var s;
            var hexdigits;
            var digits;
            var ident;
            var joined_symbol;
            var single_symbol;
            var whitespace;
            whitespace = " \t\r\n";
            single_symbol = "(){}[]:;,`?";
            joined_symbol = "=+-*/<>%!|&^~#.@";
            ident = "_qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM$";
            digits = "0123456789";
            hexdigits = digits + "abcdefABCDEF";
            s = undefined;
            c = undefined;
            while(true) {
                begin_token();
                if(peek() === "") {
                    return undefined;
                } else if(one_of(whitespace)) {
                    pop();
                } else if(starts_with("//")) {
                    s = "";
                    while(peek() && peek() !== "\n") {
                        s += pop();
                    };
                    s += pop();
                    return newToken("note", s);
                } else if(starts_with("/*")) {
                    s = "";
                    while(peek() && peek(2) !== "*/") {
                        s += pop();
                    };
                    s += pop(2);
                    return newToken("note", s);
                } else if(one_of("'\"")) {
                    s = "";
                    quote = pop();
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
                    return newToken("str", s);
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
                    return newToken("num", s);
                } else if(one_of(single_symbol)) {
                    return newToken("id", pop());
                } else if(one_of(joined_symbol)) {
                    s = "";
                    while(peek() && one_of(joined_symbol)) {
                        s += pop();
                    };
                    return newToken("id", s);
                } else if(one_of(ident)) {
                    s = "";
                    while(peek() && one_of(ident + digits)) {
                        s += pop();
                    };
                    return newToken("id", s);
                } else  {
                    throw "Tokenisation error: " + peek().charCodeAt(0) + " (" + peek() + ") at pos " + pos;
                };
            };
        };
        tokens = [];
        token = next();
        while(token) {
            tokens.push(token);
            token = next();
        };
        return tokens;
    };
})();
// Ast object {{{1
Ast = undefined;
(function() {
    // outer: require
    // outer: this
    // outer: Object
    // outer: arguments
    // outer: Array
    // outer: Ast
    Ast = function() {
        // outer: Ast
        // outer: arguments
        // outer: Array
        var args;
        args = Array.prototype.slice.call(arguments, 0);
        return Ast.prototype.create.apply(Ast.prototype, args);
    };
    Ast.prototype.create = function(arg) {
        var splitpos;
        // outer: require
        // outer: this
        // outer: Ast
        // outer: Object
        var self;
        // outer: arguments
        // outer: Array
        var args;
        args = Array.prototype.slice.call(arguments, 0);
        self = Object.create(Ast.prototype);
        self.pos = this.pos;
        if(typeof arg === "object") {
            self = require("./util").extend(self, arg);
        } else if(typeof arg === "string") {
            splitpos = arg.indexOf(":");
            if(splitpos === - 1) {
                self.kind = args.shift();
                self.val = args.shift();
            } else  {
                args.shift();
                self.kind = arg.slice(0, splitpos);
                self.val = arg.slice(splitpos + 1);
            };
            self.children = args;
        };
        return self;
    };
    Ast.prototype.isa = function(kindval) {
        // outer: this
        kindval = kindval.split(":");
        this.assertEqual(kindval.length, 2);
        return this.kind === kindval[0] && this.val === kindval[1];
    };
    Ast.prototype.assertEqual = function(a, b) {
        // outer: this
        if(a !== b) {
            this.error("assert error: " + a + " !== " + b);
        };
    };
    Ast.prototype.error = function(desc) {
        // outer: this
        // outer: Object
        // outer: require
        throw require("util").inspect({error : desc, token : this});
    };
    Ast.prototype.toList = function() {
        // outer: this
        var result;
        result = this.children.map(function(node) {
            return node.toList();
        });
        result.unshift(this.kind + ":" + this.val);
        return result;
    };
})();
exports.test = function(test) {
    // outer: Array
    // outer: Object
    // outer: Ast
    var ast;
    ast = Ast("kind1:val1", "arg1");
    test.assertEqual(ast.kind, "kind1");
    test.assertEqual(ast.val, "val1");
    test.assertEqual(ast.children[0], "arg1");
    test.assertEqual(typeof ast.create, "function", "has create function");
    ast = Ast("kind2", "val2", "arg2");
    test.assertEqual(ast.kind, "kind2");
    test.assertEqual(ast.val, "val2");
    test.assertEqual(ast.children[0], "arg2");
    ast = Ast({
        kind : "kind3",
        val : "val3",
        children : ["arg3"],
    });
    test.assertEqual(ast.kind, "kind3");
    test.assertEqual(ast.val, "val3");
    test.assertEqual(ast.children[0], "arg3");
    test.done();
};
// Syntax {{{1
parse = undefined;
prettyprint = undefined;
(function() {
    // outer: JSON
    // outer: this
    // outer: true
    var symb;
    var nospace;
    var list;
    var special;
    var sep;
    var prefix;
    var rparen;
    var infixr;
    var infix;
    var infixLed;
    var nudPrefix;
    var stringpp;
    var blockpp;
    var pplistlines;
    var newline;
    var infixlistpp;
    var compactlistpp;
    var listpp;
    var ppPrio;
    // outer: prettyprint
    var pp;
    var indent;
    // outer: parse
    var parseExpr;
    var nextToken;
    // outer: undefined
    var token;
    // outer: Array
    // outer: Object
    // outer: Ast
    var defaultToken;
    var tokenLookup;
    // outer: require
    var extend;
    // setup, token lookup, default token {{{2
    extend = require("./util").extend;
    tokenLookup = function(orig) {
        // outer: Object
        // outer: extend
        // outer: defaultToken
        // outer: symb
        var proto;
        proto = symb[orig.kind + ":"] || symb[orig.val] || (orig.val && symb[orig.val[orig.val.length - 1]]) || defaultToken;
        return extend(Object.create(proto), orig);
    };
    defaultToken = Ast({
        nud : function() {},
        bp : 0,
        dbp : 0,
        space : " ",
        children : [],
        assert : function(ok, desc) {
            // outer: this
            if(!ok) {
                this.error(desc);
            };
        },
    });
    // parser {{{2
    token = undefined;
    nextToken = undefined;
    parseExpr = function(rbp) {
        var left;
        // outer: nextToken
        // outer: token
        var t;
        rbp = rbp || 0;
        t = token;
        nextToken();
        t.nud();
        left = t;
        while(rbp < token.bp && !t.sep) {
            t = token;
            nextToken();
            if(!t.led) {
                t.error("expect led, which doesn't exists");
            };
            t.led(left);
            left = t;
        };
        return left;
    };
    parse = function(tokens) {
        // outer: true
        // outer: Object
        // outer: tokenLookup
        // outer: parseExpr
        // outer: token
        // outer: Array
        var result;
        // outer: nextToken
        var pos;
        pos = 0;
        nextToken = function() {
            // outer: true
            // outer: Object
            // outer: tokens
            // outer: pos
            // outer: tokenLookup
            // outer: token
            token = tokenLookup(pos === tokens.length ? {kind : "eof", rparen : true} : tokens[pos]);
            ++pos;
            return tokenLookup(token);
        };
        nextToken();
        result = [];
        while(token.kind !== "eof") {
            result.push(parseExpr());
        };
        return result;
    };
    // prettyprinter {{{2
    indent = - 4;
    defaultToken.pp = function() {
        // outer: pp
        var result;
        // outer: ppPrio
        // outer: this
        if(this.children.length === 0) {
            return this.val;
        } else if(this.children.length === 1) {
            return this.val + this.space + ppPrio(this.children[0], this.bp);
        } else if(this.children.length === 2) {
            result = "";
            result += ppPrio(this.children[0], this.bp);
            result += this.space + this.val + this.space;
            result += ppPrio(this.children[1], this.bp + 1 - this.dbp);
            return result;
        } else  {
            return "<([" + this.val + "|" + this.children.map(pp).join(", ") + "])>";
            this.error("cannot prettyprint...");
        };
    };
    pp = function(node) {
        // outer: tokenLookup
        return tokenLookup(node).pp();
    };
    prettyprint = function(stmts) {
        // outer: pplistlines
        return pplistlines(stmts, ";");
    };
    ppPrio = function(node, prio) {
        // outer: pp
        var result;
        result = "";
        if(node.bp && node.bp < prio) {
            result += "(";
        };
        result += pp(node);
        if(node.bp && node.bp < prio) {
            result += ")";
        };
        return result;
    };
    listpp = function(nodes) {
        // outer: compactlistpp
        // outer: pplistlines
        if(nodes.length > 2) {
            return pplistlines(nodes, ",");
        } else  {
            return compactlistpp(nodes);
        };
    };
    compactlistpp = function(nodes) {
        // outer: pp
        var args;
        args = nodes.filter(function(elem) {
            return elem.val !== "," || elem.kind !== "id";
        });
        return args.map(pp).join(", ");
    };
    infixlistpp = function() {
        // outer: compactlistpp
        // outer: this
        // outer: ppPrio
        return ppPrio(this.children[0], this.bp) + this.val[1] + compactlistpp(this.children.slice(1)) + this.val[2];
    };
    newline = function() {
        // outer: indent
        var n;
        var result;
        result = "\n";
        n = indent;
        while(n > 0) {
            result += " ";
            --n;
        };
        return result;
    };
    pplistlines = function(nodes, sep) {
        // outer: tokenLookup
        // outer: newline
        // outer: indent
        var listline;
        var result;
        nodes = nodes.filter(function(elem) {
            // outer: sep
            return elem.val !== sep || elem.kind !== "id";
        });
        result = "";
        if(nodes.length === 0) {
            return result;
        };
        listline = function(node) {
            // outer: sep
            // outer: newline
            var lines;
            // outer: tokenLookup
            node = tokenLookup(node);
            lines = newline() + node.pp();
            if(!node.sep) {
                lines += sep;
            };
            return lines;
        };
        indent += 4;
        result += nodes.map(listline).join("");
        indent -= 4;
        result += newline();
        return result;
    };
    blockpp = function() {
        // outer: pplistlines
        // outer: this
        // outer: pp
        return pp(this.children[0]) + " {" + pplistlines(this.children.slice(1).filter(function(elem) {
            return elem.val !== ";" || elem.kind !== "id";
        }), ";") + "}";
    };
    stringpp = function() {
        // outer: this
        // outer: JSON
        return JSON.stringify(this.val);
    };
    // syntax constructors {{{2
    nudPrefix = function() {
        // outer: Array
        // outer: this
        // outer: parseExpr
        var child;
        child = parseExpr(this.bp);
        if(parseExpr.sep) {
            this.error("should be followed by a value, not a separator");
            child.error("missing something before this element");
        };
        this.children = [child];
    };
    infixLed = function(left) {
        // outer: parseExpr
        // outer: Array
        // outer: true
        // outer: this
        this.infix = true;
        this.children = [left, parseExpr(this.bp - this.dbp)];
    };
    infix = function(bp) {
        // outer: nudPrefix
        // outer: infixLed
        // outer: defaultToken
        // outer: Object
        // outer: extend
        return extend(Object.create(defaultToken), {
            led : infixLed,
            nud : nudPrefix,
            bp : bp,
        });
    };
    infixr = function(bp) {
        // outer: nudPrefix
        // outer: infixLed
        // outer: defaultToken
        // outer: Object
        // outer: extend
        return extend(Object.create(defaultToken), {
            led : infixLed,
            nud : nudPrefix,
            bp : bp,
            dbp : 1,
        });
    };
    rparen = function() {
        // outer: this
        // outer: true
        // outer: defaultToken
        // outer: Object
        // outer: extend
        return extend(Object.create(defaultToken), {rparen : true, nud : function() {
            // outer: this
            this.error("unmatched rparen");
        }});
    };
    prefix = function(bp) {
        // outer: nudPrefix
        // outer: defaultToken
        // outer: Object
        // outer: extend
        return extend(Object.create(defaultToken), {nud : nudPrefix, bp : bp});
    };
    sep = function() {
        // outer: true
        // outer: defaultToken
        // outer: Object
        // outer: extend
        return extend(Object.create(defaultToken), {sep : true, pp : function() {
            return "";
        }});
    };
    special = function(ext) {
        // outer: defaultToken
        // outer: Object
        // outer: extend
        return extend(Object.create(defaultToken), ext);
    };
    list = function(rparen) {
        // outer: listpp
        // outer: true
        // outer: Array
        // outer: this
        // outer: defaultToken
        // outer: Object
        // outer: extend
        // outer: nextToken
        // outer: parseExpr
        // outer: token
        var readList;
        readList = function(obj) {
            // outer: nextToken
            // outer: rparen
            // outer: parseExpr
            // outer: token
            while(!token.rparen) {
                obj.children.push(parseExpr());
            };
            if(token.val !== rparen) {
                obj.error("Paren mismatch begin");
                token.error("Paren mismatch end");
            };
            nextToken();
        };
        return function(bp) {
            // outer: listpp
            // outer: readList
            // outer: true
            // outer: Array
            // outer: rparen
            // outer: this
            // outer: defaultToken
            // outer: Object
            // outer: extend
            return extend(Object.create(defaultToken), {
                led : function(left) {
                    // outer: readList
                    // outer: true
                    // outer: Array
                    // outer: rparen
                    // outer: this
                    this.val = "*" + this.val + rparen;
                    this.children = [left];
                    this.infix = true;
                    readList(this);
                },
                nud : function() {
                    // outer: readList
                    // outer: Array
                    // outer: this
                    this.children = [];
                    readList(this);
                },
                bp : bp,
                pp : function() {
                    // outer: rparen
                    // outer: listpp
                    // outer: this
                    return this.val + listpp(this.children) + rparen;
                },
            });
        };
    };
    nospace = function(node) {
        node.space = "";
        return node;
    };
    // syntax definition {{{2
    symb = {
        "." : nospace(infix(1200)),
        "[" : list("]")(1200),
        "*[]" : special({pp : infixlistpp, bp : 1200}),
        "]" : rparen(),
        "(" : list(")")(1200),
        "*()" : special({pp : infixlistpp, bp : 1200}),
        ")" : rparen(),
        "{" : list("}")(1100),
        "*{}" : special({pp : blockpp, bp : 1100}),
        "}" : rparen(),
        "#" : nospace(prefix(1000)),
        "@" : nospace(prefix(1000)),
        "++" : nospace(prefix(1000)),
        "--" : nospace(prefix(1000)),
        "!" : nospace(prefix(1000)),
        "~" : nospace(prefix(1000)),
        "`" : nospace(prefix(1000)),
        "*" : infix(900),
        "/" : infix(900),
        "%" : infix(900),
        "-" : infix(800),
        "+" : infix(800),
        ">>>" : infix(700),
        ">>" : infix(700),
        "<<" : infix(700),
        "<=" : infix(600),
        ">=" : infix(600),
        ">" : infix(600),
        "<" : infix(600),
        "==" : infix(500),
        "!=" : infix(500),
        "!==" : infix(500),
        "===" : infix(500),
        "^" : infix(400),
        "|" : infix(400),
        "&" : infix(400),
        "&&" : infix(300),
        "||" : infix(300),
        ":" : infixr(200),
        "?" : infixr(200),
        "else" : special({
            led : function(left) {
                // outer: defaultToken
                // outer: Object
                // outer: extend
                var child1;
                // outer: this
                // outer: infixLed
                infixLed.call(this, left);
                child1 = this.children[1];
                if(child1.val === "{" && child1.kind === "id") {
                    child1.val = "*{}";
                    child1.children.unshift(extend(Object.create(defaultToken), {
                        kind : "id",
                        val : "",
                        pos : this.pos,
                    }));
                };
            },
            nud : nudPrefix,
            bp : 200,
            dbp : 1,
        }),
        "=" : infixr(100),
        "," : sep(),
        ";" : sep(),
        "constructor" : defaultToken,
        "valueOf" : defaultToken,
        "toString" : defaultToken,
        "toLocaleString" : defaultToken,
        "hasOwnProperty" : defaultToken,
        "isPrototypeOf" : defaultToken,
        "propertyIsEnumerable" : defaultToken,
        "return" : prefix(0),
        "throw" : prefix(0),
        "new" : prefix(0),
        "typeof" : prefix(0),
        "var" : prefix(0),
        "str:" : special({pp : stringpp}),
        "note:" : special({sep : true, pp : function() {
            // outer: this
            if(this.val.slice(0, 2) === "//") {
                return this.val.slice(0, - 1);
            } else  {
                return this.val;
            };
        }}),
        "annotation:" : sep(),
    };
})();
// macro system {{{1
addMacro = undefined;
runMacro = undefined;
(function() {
    // outer: Object
    // outer: runMacro
    // outer: addMacro
    var valPart;
    var kindPart;
    kindPart = function(pattern) {
        return pattern.split(":")[0];
    };
    valPart = function(pattern) {
        return pattern.split(":").slice(1).join(":");
    };
    addMacro = function(table, pattern, fn) {
        var orig_fn;
        // outer: Object
        var table_kind;
        // outer: valPart
        var val;
        // outer: kindPart
        var kind;
        kind = kindPart(pattern);
        val = valPart(pattern);
        table_kind = table[kind];
        if(!table_kind) {
            table[kind] = table_kind = {};
        };
        orig_fn = table_kind[val];
        table_kind[val] = orig_fn ? function(ast) {
            // outer: orig_fn
            // outer: fn
            return fn(ast) || orig_fn(ast);
        } : fn;
    };
    runMacro = function(table, node) {
        var fn;
        var valTable;
        valTable = table[node.kind];
        if(valTable) {
            fn = valTable[node.val] || valTable[""];
        };
        if(!fn) {
            valTable = table[""];
            if(valTable) {
                fn = valTable[node.val] || valTable[""];
            };
        };
        if(fn) {
            node = fn(node) || node;
        };
        return node;
    };
})();
// rst2ast {{{1
rst2ast = undefined;
(function() {
    // outer: false
    // outer: runMacro
    // outer: Array
    // outer: true
    // outer: rst2ast
    // outer: addMacro
    // outer: Object
    var postMacros;
    postMacros = {};
    "call:return call:throw call:&& call:||".split(" ").forEach(function(pattern) {
        // outer: postMacros
        // outer: addMacro
        addMacro(postMacros, pattern, function(ast) {
            ast.kind = "branch";
        });
    });
    addMacro(postMacros, "call:`", function(ast) {
        ast.kind = "compiletime";
    });
    // rst2ast {{{2
    rst2ast = function(ast) {
        // outer: false
        // outer: postMacros
        // outer: runMacro
        var lhs;
        // outer: rst2ast
        var rhs;
        // outer: Array
        var children;
        // outer: true
        var isHashTable;
        // Before recursive transformation {{{3
        // Object
        if(ast.isa("id:{")) {
            isHashTable = true;
            children = [ast.create("id:Object")];
            ast.children.forEach(function(elem) {
                // outer: false
                // outer: isHashTable
                // outer: children
                if(elem.kind === "id" && elem.val === ":" && elem.children.length === 2) {
                    elem.children[0].kind = "str";
                    children = children.concat(elem.children);
                } else if(elem.isa("id:,")) {} else  {
                    isHashTable = false;
                    elem.error("unexpected in object literal");
                };
            });
            if(isHashTable) {
                ast.kind = "call";
                ast.val = "new";
                ast.children = children;
            };
        };
        // ?: (here because of the :)
        if(ast.isa("id:?") && ast.children.length === 2) {
            rhs = ast.children[1];
            if(rhs.kind === "id" && rhs.val === ":" && rhs.children.length === 2) {
                ast.children.push(rhs.children[1]);
                ast.children[1] = rhs.children[0];
                ast.kind = "branch";
                ast.val = "?:";
            };
        };
        // Array
        if(ast.isa("id:[")) {
            ast.children.unshift(ast.create("id:Array"));
            ast.val = "new";
        };
        // transform children {{{3
        ast.children = ast.children.map(rst2ast);
        // After recursive transformation {{{3
        // parenthesie (x) -> x {{{4
        while(ast.isa("id:(") && ast.children.length === 1) {
            ast = ast.children[0];
        };
        // call {{{4
        if(ast.kind === "id" && ast.children.length > 0) {
            ast.kind = "call";
            ast.children = ast.children.filter(function(elem) {
                return !elem.isa("id:,");
            });
        };
        // remove var {{{4
        if(ast.isa("call:var")) {
            ast = ast.children[0];
        };
        // extract lhs and rhs {{{4
        lhs = ast.children[0];
        rhs = ast.children[1];
        // foo.bar -> foo.'bar' {{{4
        if(ast.isa("call:.")) {
            if(rhs.kind === "id") {
                rhs.kind = "str";
            };
        };
        // run postMacros
        ast = runMacro(postMacros, ast);
        // = {{{4
        if(ast.isa("call:=")) {
            if(lhs.kind === "id") {
                ast.kind = "assign";
                ast.val = lhs.val;
                ast.children = ast.children.slice(1);
            };
            if(lhs.isa("call:*[]")) {
                ast.val = "[]=";
                ast.children.unshift(lhs.children[0]);
                ast.children[1] = lhs.children[1];
            };
            if(lhs.isa("call:.")) {
                ast.val = ".=";
                ast.children.unshift(lhs.children[0]);
                ast.children[1] = lhs.children[1];
            };
        };
        // *{} {{{4
        if(ast.isa("call:*{}")) {
            ast.children = ast.children.filter(function(elem) {
                return !elem.isa("id:;");
            });
            // while(a) { b }; 
            if(lhs.isa("call:*()") && lhs.children[0].isa("id:while")) {
                lhs.kind = "branch";
                lhs.val = "while";
                lhs.assertEqual(lhs.children.length, 2);
                lhs.children[0] = lhs.children[1];
                ast.children = ast.children.slice(1);
                ast.kind = "block";
                ast.val = "";
                lhs.children[1] = ast;
                ast = lhs;
            };
            // if(a) { b };
            if(lhs.isa("call:*()") && lhs.children[0].isa("id:if")) {
                lhs.kind = "branch";
                lhs.val = "cond";
                lhs.assertEqual(lhs.children.length, 2);
                lhs.children[0] = lhs.children[1];
                ast.children = ast.children.slice(1);
                ast.kind = "block";
                ast.val = "";
                lhs.children[1] = ast;
                ast = lhs;
            };
            // function(a, b) { c }; 
            if(lhs.isa("call:*()") && lhs.children[0].isa("id:function")) {
                ast.kind = "fn";
                ast.val = lhs.children.length - 1;
                ast.children = lhs.children.slice(1).concat(ast.children.slice(1));
            };
        };
        // else {{{4
        if(ast.isa("call:else")) {
            if(lhs.isa("branch:cond")) {
                if(rhs.isa("branch:cond")) {
                    ast.kind = "branch";
                    ast.val = "cond";
                    ast.children = lhs.children.concat(rhs.children);
                } else if(rhs.isa("call:*{}") && rhs.children[0].isa("id:")) {
                    rhs.kind = "block";
                    rhs.val = "";
                    rhs.children = rhs.children.slice(1);
                    ast.kind = "branch";
                    ast.val = "cond";
                    ast.children = lhs.children.concat([rhs]);
                };
            };
        };
        // method call {{{4
        if(ast.isa("call:*()")) {
            if(lhs.isa("call:.")) {
                ast.val = lhs.children[1].val;
                ast.children[0] = lhs.children[0];
            };
        };
        return ast;
    };
})();
// code analysis {{{1
analyse = undefined;
(function() {
    // outer: Number
    // outer: true
    // outer: undefined
    // outer: Object
    // outer: Ast
    var localVars;
    var localVar;
    var box;
    // outer: analyse
    // outer: Array
    var fns;
    // functions in post-order traversal
    fns = [];
    analyse = function(asts) {
        // outer: localVars
        // outer: box
        // outer: Object
        // outer: Ast
        var global;
        // outer: Array
        // outer: fns
        fns = [];
        global = Ast("fn:0");
        global.scope = {};
        global.children = asts;
        asts.forEach(function(elem) {
            // outer: global
            // outer: localVars
            localVars(elem, global);
        });
        fns.forEach(box);
        return asts;
    };
    box = function(fn) {
        // outer: localVar
        // outer: true
        // outer: undefined
        // outer: Object
        Object.keys(fn.scope).forEach(function(name) {
            // outer: localVar
            // outer: Object
            // outer: true
            // outer: undefined
            // outer: fn
            var t;
            t = fn.scope[name];
            if(t.argument) {
                return undefined;
            };
            if(!t.argument) {
                if(fn.parent && typeof fn.parent.scope[name] === "object" || !t.set) {
                    t.boxed = true;
                    Object.keys(t).forEach(function(key) {
                        // outer: t
                        // outer: name
                        // outer: fn
                        // outer: localVar
                        localVar(fn.parent, name)[key] = localVar(fn.parent, name)[key] || t[key];
                    });
                } else  {
                    t.local = true;
                    if(t.firstSet) {
                        t.firstSet.doTypeAnnotate = true;
                    };
                };
            };
        });
    };
    localVar = function(ast, name) {
        // outer: Object
        if(typeof ast.scope[name] !== "object") {
            ast.scope[name] = {};
        };
        return ast.scope[name];
    };
    localVars = function(ast, parent) {
        // outer: localVars
        // outer: true
        // outer: localVar
        // outer: fns
        // outer: Number
        var argc;
        // outer: undefined
        // outer: Object
        if(ast.kind === "compiletime") {
            ast.scope = {};
            ast.parent = undefined;
            parent = ast;
        };
        if(ast.kind === "fn") {
            ast.scope = {};
            ast.parent = parent;
            argc = Number(ast.val);
            ast.children.slice(0, argc).forEach(function(elem) {
                // outer: true
                // outer: localVar
                // outer: ast
                ast.assertEqual(elem.kind, "id");
                localVar(ast, elem.val).argument = true;
            });
            ast.children.slice(argc).forEach(function(elem) {
                // outer: ast
                // outer: localVars
                localVars(elem, ast);
            });
            fns.push(ast);
            return undefined;
        };
        if(ast.kind === "id") {
            localVar(parent, ast.val).get = true;
        } else if(ast.kind === "assign") {
            if(!localVar(parent, ast.val).set) {
                localVar(parent, ast.val).firstSet = ast;
            };
            localVar(parent, ast.val).set = true;
        };
        ast.children.forEach(function(elem) {
            // outer: parent
            // outer: localVars
            localVars(elem, parent);
        });
    };
})();
// ast2rst, ast2js {{{1
ast2js = undefined;
ast2rst = undefined;
(function() {
    // outer: runMacro
    // outer: Object
    // outer: Array
    // outer: true
    // outer: false
    // outer: require
    // outer: ast2rst
    var rstMacros;
    // outer: ast2js
    // outer: addMacro
    var jsMacros;
    var jsrstMacros;
    var macroJsAssign;
    var macroJsFn;
    var macroFlattenBlock;
    var macroLsAssign;
    var macroFnDef;
    var macroJsInfixIf;
    var macroJsWhile;
    var macroCond2IfElse;
    var macroNew;
    var macroJsCallMethod;
    var macroPut2Assign;
    var macroLhsStr2Id;
    var fog;
    var unblock;
    var isValidId;
    var reserved;
    var num;
    var validIdSymbs;
    var jsoperator;
    var str2obj;
    // Utility / definitions {{{2
    str2obj = function(str) {
        // outer: require
        return require("./util").list2obj(str.split(" "));
    };
    jsoperator = "= === !== < <= > >= += -= *= /= ! | & ^ << >> ~ - + ++ -- * / ! % *() *[] typeof throw return".split(" ");
    validIdSymbs = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890_$";
    num = "1234567890";
    reserved = str2obj("break case catch continue debugger default delete do else finally for function if in instanceof new return switch this throw try typeof var void while with class enum export extends import super implements interface let package private protected public static yield");
    isValidId = function(str) {
        // outer: true
        // outer: validIdSymbs
        var i;
        // outer: num
        // outer: false
        // outer: reserved
        if(reserved[str]) {
            return false;
        };
        if(num.indexOf(str[0]) !== - 1) {
            return false;
        };
        i = str.length;
        while(i) {
            --i;
            if(validIdSymbs.indexOf(str[i]) === - 1) {
                return false;
            };
        };
        return true;
    };
    // Utility functions {{{2
    unblock = function(node) {
        // outer: Array
        if(node.kind === "block") {
            return node.children;
        } else  {
            return [node];
        };
    };
    fog = function(f, g) {
        return function(ast) {
            // outer: g
            // outer: f
            return f(g(ast) || ast) || ast;
        };
    };
    // Macros {{{2
    macroLhsStr2Id = function(ast) {
        // foo.'bar' -> foo.bar
        if(ast.children[1].kind === "str") {
            ast.children[1].kind = "id";
        };
    };
    macroPut2Assign = function(memberVal) {
        return function(ast) {
            // outer: memberVal
            var lhs;
            lhs = ast.create(memberVal, ast.children[0], ast.children[1]);
            ast.children.shift();
            ast.children[0] = lhs;
            ast.val = "=";
        };
    };
    macroJsCallMethod = function(ast) {
        var lhs;
        // outer: isValidId
        // foo.bar(), foo['x'](bar)
        if(isValidId(ast.val)) {
            lhs = ast.create("id:.", ast.create("id", ast.val));
        } else  {
            lhs = ast.create("id:*[]", ast.create("str", ast.val));
        };
        lhs.children.unshift(ast.children[0]);
        ast.children[0] = lhs;
        ast.val = "*()";
    };
    macroNew = function(ast) {
        // outer: isValidId
        var lhs;
        var rhs;
        // outer: Array
        var children;
        if(ast.children[0] && ast.children[0].isa("id:Array")) {
            ast.children = ast.children.slice(1);
            ast.val = "[";
        } else if(ast.children[0] && ast.children[0].isa("id:Object")) {
            children = [];
            while(ast.children.length > 1) {
                rhs = ast.children.pop();
                lhs = ast.children.pop();
                if(lhs.kind === "str" && isValidId(lhs.val)) {
                    lhs.kind = "id";
                };
                children.push(ast.create("id", ":", lhs, rhs));
            };
            ast.children = children.reverse();
            ast.val = "{";
        };
    };
    macroCond2IfElse = function(ast) {
        var lhs;
        // outer: unblock
        var rhs;
        var children;
        children = ast.children;
        if(children.length & 1) {
            rhs = ast.create("id:*{}");
            rhs.children = unblock(children.pop());
            rhs.children.unshift(ast.create("id:"));
        };
        while(children.length) {
            lhs = ast.create("id:*{}");
            lhs.children = unblock(children.pop());
            lhs.children.unshift(ast.create("id:*()", ast.create("id:if"), children.pop()));
            if(rhs) {
                rhs = ast.create("id:else", lhs, rhs);
            } else  {
                rhs = lhs;
            };
        };
        return rhs;
    };
    macroJsWhile = function(ast) {
        // outer: unblock
        ast.val = "*{}";
        ast.children[0] = ast.create("id:*()", ast.create("id:while"), ast.children[0]);
        ast.children = ast.children.concat(unblock(ast.children.pop()));
    };
    macroJsInfixIf = function(ast) {
        var rhs;
        rhs = ast.create("id", ":", ast.children[1], ast.children[2]);
        ast.children.pop();
        ast.children[1] = rhs;
        ast.val = "?";
    };
    macroFnDef = function(ast) {
        var lhs;
        var len;
        len = + ast.val;
        lhs = ast.create("id:*()", ast.create("id:function"));
        lhs.children = lhs.children.concat(ast.children.slice(0, len));
        ast.children = ast.children.slice(len);
        ast.children.unshift(lhs);
        ast.kind = "id";
        ast.val = "*{}";
    };
    macroLsAssign = function(ast) {
        var lhs;
        // =
        lhs = ast.create("id", ast.val);
        if(ast.doTypeAnnotate) {
            //lhs = ast.create('call', ':', lhs, ast.type || ast.create('id:Any'));
            lhs = ast.create("call", "var", lhs);
        };
        ast.children.unshift(lhs);
        ast.val = "=";
    };
    macroFlattenBlock = function(ast) {
        var extractBlocks;
        // outer: Array
        var children;
        children = [];
        extractBlocks = function(elem) {
            // outer: children
            // outer: extractBlocks
            if(elem.kind === "block") {
                elem.children.map(extractBlocks);
            } else  {
                children.push(elem);
            };
        };
        extractBlocks(ast);
        ast.children = children;
    };
    macroJsFn = function(ast) {
        // outer: Object
        var lhs;
        var len;
        len = + ast.val;
        lhs = ast.create("id:*()", ast.create("id:function"));
        lhs.children = lhs.children.concat(ast.children.slice(0, len));
        ast.children = ast.children.slice(len);
        //ast.children.unshift(ast.create('str', 'XXX' + JSON.stringify(ast.scope)));
        Object.keys(ast.scope).forEach(function(varName) {
            // outer: ast
            if(ast.scope[varName].local) {
                ast.children.unshift(ast.create("id:var", ast.create("id", varName)));
            } else if(!ast.scope[varName].argument) {
                ast.children.unshift(ast.create("note", "// outer: " + varName + "\n"));
            };
        });
        ast.children.unshift(lhs);
        ast.kind = "id";
        ast.val = "*{}";
    };
    macroJsAssign = function(ast) {
        var lhs;
        // =
        lhs = ast.create("id", ast.val);
        ast.children.unshift(lhs);
        ast.val = "=";
    };
    // ast2 js/rst common macros {{{2
    jsrstMacros = function() {
        // outer: macroFlattenBlock
        // outer: macroJsInfixIf
        // outer: macroJsWhile
        // outer: macroCond2IfElse
        // outer: macroJsCallMethod
        // outer: jsoperator
        // outer: fog
        // outer: macroPut2Assign
        // outer: macroNew
        // outer: macroLhsStr2Id
        // outer: addMacro
        // outer: Object
        var macros;
        macros = {};
        addMacro(macros, "call:.", macroLhsStr2Id);
        addMacro(macros, "call:new", macroNew);
        addMacro(macros, "call:[]=", macroPut2Assign("id:*[]"));
        addMacro(macros, "call:.=", fog(macroPut2Assign("id:."), macroLhsStr2Id));
        jsoperator.forEach(function(operatorName) {
            // outer: macros
            // outer: addMacro
            //operators - do nothing
            addMacro(macros, "call:" + operatorName, function() {});
        });
        addMacro(macros, "call", macroJsCallMethod);
        addMacro(macros, "branch:cond", macroCond2IfElse);
        addMacro(macros, "branch:while", macroJsWhile);
        addMacro(macros, "branch:?:", macroJsInfixIf);
        addMacro(macros, "block", macroFlattenBlock);
        return macros;
    };
    // ast2js {{{2
    jsMacros = jsrstMacros();
    addMacro(jsMacros, "fn", macroJsFn);
    addMacro(jsMacros, "assign", macroJsAssign);
    addMacro(jsMacros, "compiletime", function(ast) {
        // outer: Array
        ast.children = [];
    });
    ast2js = function(ast) {
        // outer: jsMacros
        // outer: runMacro
        // outer: ast2js
        ast.children = ast.children.map(ast2js);
        return runMacro(jsMacros, ast);
    };
    // ast2rst {{{2
    rstMacros = jsrstMacros();
    addMacro(rstMacros, "fn", macroFnDef);
    addMacro(rstMacros, "assign", macroLsAssign);
    addMacro(rstMacros, "compiletime", function(ast) {
        ast.val = "`";
    });
    ast2rst = function(ast) {
        // outer: rstMacros
        // outer: runMacro
        // outer: ast2rst
        ast.children = ast.children.map(ast2rst);
        return runMacro(rstMacros, ast);
    };
})();
