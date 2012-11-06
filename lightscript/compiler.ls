// Compiler {{{1
var codegen = undefined;
ls2compiler = undefined;
(function() {
    var applyMacros = function(macros, compiler) {
        var relations = function(ast) {
            var prev = undefined;
            ast.children.forEach(function(child) {
                relations(child);
                if(prev) {
                    child.prev = prev;
                    prev.next = child;
                };
                child.parent = ast;
                prev = child;
            });
        };
        var doIt = function(ast) {
            if(ast.kind === "compiletime") {
                return ast;
            };
            ast.children = ast.children.map(doIt);
            return runMacro(macros, ast);
        };
        compiler.asts.forEach(relations);
        compiler.asts = compiler.asts.map(doIt);
    };
    // orig build {{{2
    var ls2compiler = function(src, target) {
        var compiler = {
            asts : parse(tokenise(src)).map(rst2ast),
            forwardMacros : {},
            reverseMacros : {},
            macro : function(pattern, fn) {
                addMacro(this.forwardMacros, pattern, fn);
            },
            unmacro : function(pattern, fn) {
                addMacro(this.reverseMacros, pattern, fn);
            },
            target : target,
        };
        compiler[target] = true;
        compiletime(compiler);
        applyMacros(compiler.forwardMacros, compiler);
        return compiler;
    };
    codegen = function(astTransform, asts) {
        asts = analyse(asts);
        asts = asts.map(astTransform);
        return prettyprint(asts).slice(1);
    };
    exports.ls2mozjs = function(ls) {
        return codegen(ast2js, ls2compiler(ls, "mozjs").asts);
    };
    exports.ls2webjs = function(ls) {
        return codegen(ast2js, ls2compiler(ls, "webjs").asts);
    };
    exports.ls2nodejs = function(ls) {
        return codegen(ast2js, ls2compiler(ls, "nodejs").asts);
    };
    exports.ls2ls = function(ls) {
        var compiler = ls2compiler(ls, "lightscript");
        applyMacros(compiler.reverseMacros, compiler);
        compiler.asts = analyse(compiler.asts);
        return codegen(ast2rst, compiler.asts);
    };
    // for build2 {{{2
    exports.parsels = function(src) {
        return rst2ast(parse(tokenise("(function(){" + src + "})()"))[0]);
    };
    exports.applyMacros = function(opt) {
        //asts : [opt.ast.copy()],
        //console.log(require('util').inspect(opt.ast, true, null));
        //console.log(require('util').inspect(opt.ast.copy(), true, null));
        var compiler = {
            asts : [opt.ast.copy()],
            forwardMacros : {},
            reverseMacros : {},
            macro : function(pattern, fn) {
                addMacro(this.forwardMacros, pattern, fn);
            },
            unmacro : function(pattern, fn) {
                addMacro(this.reverseMacros, pattern, fn);
            },
            target : opt.platform,
        };
        compiler[opt.platform] = true;
        compiletime(compiler);
        applyMacros(opt.reverse ? compiler.forwardMacros : compiler.reverseMacros, compiler);
        return compiler.asts[0];
    };
    exports.optimise = function(ast) {
        return ast;
    };
    exports.ppjs = function(ast) {
        return tokenLookup(ast2js(analyse([ast])[0])).pp().split("\n").slice(1, - 1).join("\n") + "\n";
    };
    exports.ppls = function(ast) {
        return tokenLookup(ast2rst(analyse([ast])[0])).pp().split("\n").slice(1, - 1).join("\n") + "\n";
    };
})();
// compile-time-execution {{{1
var compiletime = undefined;
(function() {
    var util = require("./util");
    compiletime = function(compiler) {
        var asts = compiler.asts;
        var compiletimeasts = [];
        var compiletimevals = [];
        var visitAsts = function(asts) {
            asts.forEach(function(ast) {
                if(ast.kind === "compiletime") {
                    ast.assertEqual(ast.children.length, 1);
                    compiletimeasts.push(ast);
                } else  {
                    visitAsts(ast.children);
                };
            });
        };
        visitAsts(asts);
        var deepcopy = function(ast) {
            var result = ast.create(ast);
            result.children = ast.children.map(deepcopy);
            return result;
        };
        asts = compiletimeasts.map(function(ast) {
            return ast.children[0];
        }).map(deepcopy);
        var i = 0;
        while(i < asts.length) {
            var ast = asts[i];
            if(!ast.isa("branch:cond") && !ast.isa("branch:while") && !ast.isa("branch:return")) {
                asts[i] = ast.create("call:[]=", ast.create("id:__compiletimevals"), ast.create("num", i), ast);
            };
            ++i;
        };
        var code = codegen(ast2js, asts);
        var fn = Function("__compiletimevals", "compiler", "require", code);
        util.trycatch(function() {
            fn(compiletimevals, compiler, require);
        }, function(err) {
            console.log("compile-time error", err);
            if(err.stack) {
                console.log(err.stack);
            };
        });
        i = 0;
        while(i < compiletimeasts.length) {
            compiletimeasts[i].val = util.trycatch(function() {
                return JSON.stringify(compiletimevals[i]);
            }, function() {}) || "undefined";
            ++i;
        };
    };
})();
// Tokeniser {{{1
var tokenise = undefined;
(function() {
    "use strict";
    var createToken = function(kind, val, pos) {
        return {
            kind : kind,
            val : val,
            pos : pos,
        };
    };
    tokenise = function(buffer) {
        var pos = 0;
        var start = {lineno : 0, pos : 0};
        var lineno = 0;
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
            var result = buffer.slice(pos, pos + n);
            result.split("").forEach(function(c) {
                if(c === "\n") {
                    ++lineno;
                };
            });
            pos += n;
            return result;
        };
        var begin_token = function() {
            start = {lineno : lineno, pos : pos};
        };
        var newToken = function(kind, val) {
            var result = createToken(kind, val, "l" + start.lineno + "p" + start.pos + "-l" + lineno + "p" + pos);
            return result;
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
        var tokens = [];
        var token = next();
        while(token) {
            tokens.push(token);
            token = next();
        };
        return tokens;
    };
})();
// Ast object {{{1
var Ast = undefined;
(function() {
    Ast = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        return Ast.prototype.create.apply(Ast.prototype, args);
    };
    Ast.prototype.create = function(arg) {
        var args = Array.prototype.slice.call(arguments, 0);
        var self = Object.create(Ast.prototype);
        self.pos = this.pos;
        if(typeof arg === "object") {
            self = require("./util").extend(self, arg);
        } else if(typeof arg === "string") {
            var splitpos = arg.indexOf(":");
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
        kindval = kindval.split(":");
        this.assertEqual(kindval.length, 2);
        return this.kind === kindval[0] && this.val === kindval[1];
    };
    Ast.prototype.assertEqual = function(a, b) {
        if(a !== b) {
            this.error("assert error: " + a + " !== " + b);
        };
    };
    Ast.prototype.error = function(desc) {
        throw require("util").inspect({error : desc, token : this});
    };
    Ast.assert = function(ok, desc) {
        if(!ok) {
            this.error(desc);
        };
    };
    Ast.prototype.toList = function() {
        var result = this.children.map(function(node) {
            return node.toList();
        });
        result.unshift(this.kind + ":" + this.val);
        return result;
    };
    Ast.prototype.copy = function() {
        var result = Object.create(Ast.prototype);
        result.kind = this.kind;
        result.val = this.val;
        result.pos = this.pos;
        result.children = this.children.map(function(child) {
            return child.copy();
        });
        return result;
    };
})();
exports.test = function(test) {
    var ast = Ast("kind1:val1", "arg1");
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
var parse = undefined;
var prettyprint = undefined;
var tokenLookup = undefined;
(function() {
    // setup, token lookup, default token {{{2
    var extend = require("./util").extend;
    tokenLookup = function(ast) {
        var proto = symb[ast.kind + ":"] || symb[ast.val] || (ast.val && symb[ast.val[ast.val.length - 1]]) || defaultToken;
        ast = extend(Object.create(proto), ast);
        //console.log(ast.kind, ast.val, ast.bp, proto.bp, ast.pp === proto.pp);
        return ast;
    };
    var defaultToken = Ast({
        nud : function() {},
        bp : 0,
        dbp : 0,
        space : " ",
        children : [],
    });
    // parser {{{2
    var token = undefined;
    var nextToken = undefined;
    var parseExpr = function(rbp) {
        rbp = rbp || 0;
        var t = token;
        nextToken();
        t.nud();
        var left = t;
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
        var pos = 0;
        nextToken = function() {
            token = tokenLookup(pos === tokens.length ? {kind : "eof", rparen : true} : tokens[pos]);
            ++pos;
            return tokenLookup(token);
        };
        nextToken();
        var result = [];
        while(token.kind !== "eof") {
            result.push(parseExpr());
        };
        return result;
    };
    // prettyprinter {{{2
    var indent = - 4;
    defaultToken.pp = function() {
        //console.log('pp', this.kind, this.val, this.bp, this.children.map(function(child) { return [child.kind, child.val, child.bp]; }));
        if(this.children.length === 0) {
            return this.val;
        } else if(this.children.length === 1) {
            return this.val + this.space + ppPrio(this.children[0], this.bp);
        } else if(this.children.length === 2) {
            var result = "";
            result += ppPrio(this.children[0], this.bp);
            result += this.space + this.val + this.space;
            result += ppPrio(this.children[1], this.bp + 1 - this.dbp);
            return result;
        } else  {
            return "<([" + this.val + "|" + this.children.map(pp).join(", ") + "])>";
            this.error("cannot prettyprint...");
        };
    };
    var pp = function(node) {
        return tokenLookup(node).pp();
    };
    prettyprint = function(stmts) {
        return pplistlines(stmts, ";");
    };
    var ppPrio = function(node, prio) {
        node = tokenLookup(node);
        var result = "";
        if(node.bp && node.bp < prio) {
            result += "(";
        };
        result += node.pp();
        if(node.bp && node.bp < prio) {
            result += ")";
        };
        return result;
    };
    var listpp = function(nodes) {
        if(nodes.length > 2) {
            return pplistlines(nodes, ",");
        } else  {
            return compactlistpp(nodes);
        };
    };
    var compactlistpp = function(nodes) {
        var args = nodes.filter(function(elem) {
            return elem.val !== "," || elem.kind !== "id";
        });
        return args.map(pp).join(", ");
    };
    var infixlistpp = function() {
        return ppPrio(this.children[0], this.bp) + this.val[1] + compactlistpp(this.children.slice(1)) + this.val[2];
    };
    var newline = function() {
        var result = "\n";
        var n = indent;
        while(n > 0) {
            result += " ";
            --n;
        };
        return result;
    };
    var pplistlines = function(nodes, sep) {
        nodes = nodes.filter(function(elem) {
            return elem.val !== sep || elem.kind !== "id";
        });
        var result = "";
        if(nodes.length === 0) {
            return result;
        };
        var listline = function(node) {
            node = tokenLookup(node);
            var lines = newline() + node.pp();
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
    var blockpp = function() {
        return pp(this.children[0]) + " {" + pplistlines(this.children.slice(1).filter(function(elem) {
            return elem.val !== ";" || elem.kind !== "id";
        }), ";") + "}";
    };
    var stringpp = function() {
        return JSON.stringify(this.val);
    };
    // syntax constructors {{{2
    var nudPrefix = function() {
        var child = parseExpr(this.bp);
        if(parseExpr.sep) {
            this.error("should be followed by a value, not a separator");
            child.error("missing something before this element");
        };
        this.children = [child];
    };
    var infixLed = function(left) {
        this.infix = true;
        this.children = [left, parseExpr(this.bp - this.dbp)];
    };
    var infix = function(bp) {
        return extend(Object.create(defaultToken), {
            led : infixLed,
            nud : nudPrefix,
            bp : bp,
        });
    };
    var infixr = function(bp) {
        return extend(Object.create(defaultToken), {
            led : infixLed,
            nud : nudPrefix,
            bp : bp,
            dbp : 1,
        });
    };
    var rparen = function() {
        return extend(Object.create(defaultToken), {rparen : true, nud : function() {
            this.error("unmatched rparen");
        }});
    };
    var prefix = function(bp) {
        return extend(Object.create(defaultToken), {nud : nudPrefix, bp : bp});
    };
    var sep = function() {
        return extend(Object.create(defaultToken), {sep : true, pp : function() {
            return "";
        }});
    };
    var special = function(ext) {
        return extend(Object.create(defaultToken), ext);
    };
    var list = function(rparen) {
        var readList = function(obj) {
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
            return extend(Object.create(defaultToken), {
                led : function(left) {
                    this.val = "*" + this.val + rparen;
                    this.children = [left];
                    this.infix = true;
                    readList(this);
                },
                nud : function() {
                    this.children = [];
                    readList(this);
                },
                bp : bp,
                pp : function() {
                    return this.val + listpp(this.children) + rparen;
                },
            });
        };
    };
    var nospace = function(node) {
        node.space = "";
        return node;
    };
    // syntax definition {{{2
    var symb = {
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
                infixLed.call(this, left);
                var child1 = this.children[1];
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
var addMacro = undefined;
var runMacro = undefined;
(function() {
    var kindPart = function(pattern) {
        return pattern.split(":")[0];
    };
    var valPart = function(pattern) {
        return pattern.split(":").slice(1).join(":");
    };
    addMacro = function(table, pattern, fn) {
        var kind = kindPart(pattern);
        var val = valPart(pattern);
        var table_kind = table[kind];
        if(!table_kind) {
            table[kind] = table_kind = {};
        };
        var orig_fn = table_kind[val];
        table_kind[val] = orig_fn ? function(ast) {
            return fn(ast) || orig_fn(ast);
        } : fn;
    };
    runMacro = function(table, node) {
        var valTable = table[node.kind];
        if(valTable) {
            var fn = valTable[node.val] || valTable[""];
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
var rst2ast = undefined;
(function() {
    var postMacros = {};
    "call:return call:throw call:&& call:||".split(" ").forEach(function(pattern) {
        addMacro(postMacros, pattern, function(ast) {
            ast.kind = "branch";
        });
    });
    addMacro(postMacros, "call:`", function(ast) {
        ast.kind = "compiletime";
    });
    // rst2ast {{{2
    rst2ast = function(ast) {
        // Before recursive transformation {{{3
        // Object
        if(ast.isa("id:{")) {
            var isHashTable = true;
            var children = [ast.create("id:Object")];
            ast.children.forEach(function(elem) {
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
            var rhs = ast.children[1];
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
        var lhs = ast.children[0];
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
var analyse = undefined;
(function() {
    // functions in post-order traversal
    var fns = [];
    analyse = function(asts) {
        fns = [];
        var global = Ast("fn:0");
        global.scope = {};
        global.children = asts;
        asts.forEach(function(elem) {
            localVars(elem, global);
        });
        fns.forEach(box);
        return asts;
    };
    var box = function(fn) {
        Object.keys(fn.scope).forEach(function(name) {
            var t = fn.scope[name];
            if(t.argument) {
                return undefined;
            };
            if(!t.argument) {
                if(fn.parent && typeof fn.parent.scope[name] === "object" || !t.set) {
                    t.boxed = true;
                    Object.keys(t).forEach(function(key) {
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
    var localVar = function(ast, name) {
        if(typeof ast.scope[name] !== "object") {
            ast.scope[name] = {};
        };
        return ast.scope[name];
    };
    var localVars = function(ast, parent) {
        if(ast.kind === "compiletime") {
            ast.scope = {};
            ast.parent = undefined;
            parent = ast;
        };
        if(ast.kind === "fn") {
            ast.scope = {};
            ast.parent = parent;
            var argc = Number(ast.val);
            ast.children.slice(0, argc).forEach(function(elem) {
                ast.assertEqual(elem.kind, "id");
                localVar(ast, elem.val).argument = true;
            });
            ast.children.slice(argc).forEach(function(elem) {
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
            localVars(elem, parent);
        });
    };
})();
// ast2rst, ast2js {{{1
var ast2js = undefined;
var ast2rst = undefined;
(function() {
    // Utility / definitions {{{2
    var str2obj = function(str) {
        return require("./util").list2obj(str.split(" "));
    };
    var jsoperator = "= === !== < <= > >= += -= *= /= ! | & ^ << >> ~ - + ++ -- * / ! % *() *[] typeof throw return".split(" ");
    var validIdSymbs = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890_$";
    var num = "1234567890";
    var reserved = str2obj("break case catch continue debugger default delete do else finally for function if in instanceof new return switch this throw try typeof var void while with class enum export extends import super implements interface let package private protected public static yield");
    var isValidId = function(str) {
        if(reserved[str]) {
            return false;
        };
        if(num.indexOf(str[0]) !== - 1) {
            return false;
        };
        var i = str.length;
        while(i) {
            --i;
            if(validIdSymbs.indexOf(str[i]) === - 1) {
                return false;
            };
        };
        return true;
    };
    // Utility functions {{{2
    var unblock = function(node) {
        if(node.kind === "block") {
            return node.children;
        } else  {
            return [node];
        };
    };
    var fog = function(f, g) {
        return function(ast) {
            return f(g(ast) || ast) || ast;
        };
    };
    // Macros {{{2
    var macroLhsStr2Id = function(ast) {
        // foo.'bar' -> foo.bar
        if(ast.children[1].kind === "str") {
            ast.children[1].kind = "id";
        };
    };
    var macroPut2Assign = function(memberVal) {
        return function(ast) {
            var lhs = ast.create(memberVal, ast.children[0], ast.children[1]);
            ast.children.shift();
            ast.children[0] = lhs;
            ast.val = "=";
        };
    };
    var macroJsCallMethod = function(ast) {
        // foo.bar(), foo['x'](bar)
        if(isValidId(ast.val)) {
            var lhs = ast.create("id:.", ast.create("id", ast.val));
        } else  {
            lhs = ast.create("id:*[]", ast.create("str", ast.val));
        };
        lhs.children.unshift(ast.children[0]);
        ast.children[0] = lhs;
        ast.val = "*()";
    };
    var macroNew = function(ast) {
        if(ast.children[0] && ast.children[0].isa("id:Array")) {
            ast.children = ast.children.slice(1);
            ast.val = "[";
        } else if(ast.children[0] && ast.children[0].isa("id:Object")) {
            var children = [];
            while(ast.children.length > 1) {
                var rhs = ast.children.pop();
                var lhs = ast.children.pop();
                if(lhs.kind === "str" && isValidId(lhs.val)) {
                    lhs.kind = "id";
                };
                children.push(ast.create("id", ":", lhs, rhs));
            };
            ast.children = children.reverse();
            ast.val = "{";
        };
    };
    var macroJsCond2IfElse = function(ast) {
        var children = ast.children;
        if(children.length & 1) {
            var rhs = ast.create("id:*{}");
            rhs.children = unblock(children.pop());
            rhs.children.unshift(ast.create("id:"));
        };
        while(children.length) {
            var lhs = ast.create("id:*{}");
            var truthvalue = children.slice(- 2)[0];
            if(truthvalue.isa("compiletime:undefined") || truthvalue.isa("compiletime:false")) {
                children.pop();
                lhs.children = [];
            } else  {
                lhs.children = unblock(children.pop());
            };
            lhs.children.unshift(ast.create("id:*()", ast.create("id:if"), children.pop()));
            if(rhs) {
                rhs = ast.create("id:else", lhs, rhs);
            } else  {
                rhs = lhs;
            };
        };
        return rhs;
    };
    var macroCond2IfElse = function(ast) {
        var children = ast.children;
        if(children.length & 1) {
            var rhs = ast.create("id:*{}");
            rhs.children = unblock(children.pop());
            rhs.children.unshift(ast.create("id:"));
        };
        while(children.length) {
            var lhs = ast.create("id:*{}");
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
    var macroJsWhile = function(ast) {
        ast.val = "*{}";
        ast.children[0] = ast.create("id:*()", ast.create("id:while"), ast.children[0]);
        ast.children = ast.children.concat(unblock(ast.children.pop()));
    };
    var macroJsInfixIf = function(ast) {
        var rhs = ast.create("id", ":", ast.children[1], ast.children[2]);
        ast.children.pop();
        ast.children[1] = rhs;
        ast.val = "?";
    };
    var macroFnDef = function(ast) {
        var len = + ast.val;
        var lhs = ast.create("id:*()", ast.create("id:function"));
        lhs.children = lhs.children.concat(ast.children.slice(0, len));
        ast.children = ast.children.slice(len);
        ast.children.unshift(lhs);
        ast.kind = "id";
        ast.val = "*{}";
    };
    var macroLsAssign = function(ast) {
        // =
        var lhs = ast.create("id", ast.val);
        if(ast.doTypeAnnotate) {
            //lhs = ast.create('call', ':', lhs, ast.type || ast.create('id:Any'));
            lhs = ast.create("call", "var", lhs);
        };
        ast.children.unshift(lhs);
        ast.val = "=";
    };
    var macroFlattenBlock = function(ast) {
        var children = [];
        var extractBlocks = function(elem) {
            if(elem.kind === "block") {
                elem.children.map(extractBlocks);
            } else  {
                children.push(elem);
            };
        };
        extractBlocks(ast);
        ast.children = children;
    };
    var macroJsFn = function(ast) {
        var len = + ast.val;
        var lhs = ast.create("id:*()", ast.create("id:function"));
        lhs.children = lhs.children.concat(ast.children.slice(0, len));
        ast.children = ast.children.slice(len);
        //ast.children.unshift(ast.create('str', 'XXX' + JSON.stringify(ast.scope)));
        Object.keys(ast.scope).forEach(function(varName) {
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
    var macroJsAssign = function(ast) {
        // =
        var lhs = ast.create("id", ast.val);
        ast.children.unshift(lhs);
        ast.val = "=";
    };
    // ast2 js/rst common macros {{{2
    var jsrstMacros = function() {
        var macros = {};
        addMacro(macros, "call:.", macroLhsStr2Id);
        addMacro(macros, "call:new", macroNew);
        addMacro(macros, "call:[]=", macroPut2Assign("id:*[]"));
        addMacro(macros, "call:.=", fog(macroPut2Assign("id:."), macroLhsStr2Id));
        jsoperator.forEach(function(operatorName) {
            //operators - do nothing
            addMacro(macros, "call:" + operatorName, function() {});
        });
        addMacro(macros, "call", macroJsCallMethod);
        addMacro(macros, "branch:while", macroJsWhile);
        addMacro(macros, "branch:?:", macroJsInfixIf);
        addMacro(macros, "block", macroFlattenBlock);
        return macros;
    };
    // ast2js {{{2
    var jsMacros = jsrstMacros();
    addMacro(jsMacros, "branch:cond", macroJsCond2IfElse);
    addMacro(jsMacros, "fn", macroJsFn);
    addMacro(jsMacros, "assign", macroJsAssign);
    addMacro(jsMacros, "compiletime", function(ast) {
        ast.children = [];
    });
    ast2js = function(ast) {
        ast.children = ast.children.map(ast2js);
        return runMacro(jsMacros, ast);
    };
    // ast2rst {{{2
    var rstMacros = jsrstMacros();
    addMacro(rstMacros, "branch:cond", macroCond2IfElse);
    addMacro(rstMacros, "fn", macroFnDef);
    addMacro(rstMacros, "assign", macroLsAssign);
    addMacro(rstMacros, "compiletime", function(ast) {
        ast.val = "`";
    });
    ast2rst = function(ast) {
        ast.children = ast.children.map(ast2rst);
        return runMacro(rstMacros, ast);
    };
})();
// ast2java {{{1
// main {{{1
exports.nodemain = function() {
    src = require('fs').readFileSync('./lightscript/experiments.ls', 'utf8');
    console.log(src);
    ast = ls2compiler(src, "java").asts[0];
    console.log(ast.toList());
}
