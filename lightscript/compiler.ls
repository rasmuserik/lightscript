// Compiler {{{1
exports.ls2js = function(ls) {
    var rsts = parse(tokenise(ls));
    var asts = rsts.map(rst2ast);
    asts = analyse(asts);
    return prettyprint(asts.map(function(ast) {
        return ast2js(ast);
    }));
};
exports.ls2ls = function(ls) {
    var rsts = parse(tokenise(ls));
    var asts = rsts.map(rst2ast);
    asts = analyse(asts);
    return prettyprint(asts.map(function(ast) {
        return ast2rst(ast);
    })).slice(1);
};
// Tokeniser {{{1
tokenise = undefined;
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
Ast = undefined;
(function() {
    var defaultAst = {
        create : function(arg) {
            var args = Array.prototype.slice.call(arguments, 0);
            var self = Object.create(defaultAst);
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
        },
        isa : function(kindval) {
            kindval = kindval.split(":");
            this.assertEqual(kindval.length, 2);
            return this.kind === kindval[0] && this.val === kindval[1];
        },
        assertEqual : function(a, b) {
            if(a !== b) {
                this.error("assert error: " + a + " !== " + b);
            };
        },
        error : function(desc) {
            throw require("util").inspect({error : desc, token : this});
        },
        toList : function() {
            var result = this.children.map(function(node) {
                return node.toList();
            });
            result.unshift(ast.kind + ":" + ast.val);
            return result;
        },
    };
    Ast = function(arg) {
        var args = Array.prototype.slice.call(arguments, 0);
        return defaultAst.create.apply(defaultAst, args);
    };
})();
exports.test = function(test) {
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
    // setup, token lookup, default token {{{2
    var extend = require("./util").extend;
    var tokenLookup = function(orig) {
        var proto = symb[orig.kind + ":"] || symb[orig.val] || (orig.val && symb[orig.val[orig.val.length - 1]]) || defaultToken;
        return extend(Object.create(proto), orig);
    };
    var defaultToken = Ast({
        nud : function() {},
        bp : 0,
        dbp : 0,
        space : " ",
        children : [],
        assert : function(ok, desc) {
            if(!ok) {
                this.error(desc);
            };
        },
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
        var result = "";
        if(node.bp && node.bp < prio) {
            result += "(";
        };
        result += pp(node);
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
MacroSystem = undefined;
(function() {
    var kindPart = function(pattern) {
        return pattern.split(":")[0];
    };
    var valPart = function(pattern) {
        return pattern.split(":").slice(1).join(":");
    };
    var addMacro = function(table, pattern, fn) {
        var kind = kindPart(pattern);
        if(!table[kind]) {
            table[kind] = {};
        };
        table[kind][valPart(pattern)] = fn;
    };
    var executeMacros = function(table, node) {
        var valTable = table[node.kind];
        if(valTable) {
            var fn = valTable[node.val] || valTable[""];
        };
        if(fn) {
            node = fn(node) || node;
        };
        return node;
    };
    var MacroPrototype = {
        preMacro : function(pattern, fn) {
            addMacro(this.preMacros, pattern, fn);
        },
        postMacro : function(pattern, fn) {
            addMacro(this.postMacros, pattern, fn);
        },
        execute : function(tree) {
            var self = this;
            tree = executeMacros(this.preMacros, tree);
            tree.children = tree.children.map(function(elem) {
                return self.execute(elem);
            });
            return executeMacros(this.postMacros, tree);
        },
    };
    MacroSystem = function() {
        var self = Object.create(MacroPrototype);
        self.preMacros = {};
        self.postMacros = {};
        return self;
    };
})();
// rst2ast {{{1
rst2ast = undefined;
(function() {
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
        // branches {{{4
        // return
        if(ast.isa("call:return")) {
            ast.kind = "branch";
        };
        // throw 
        if(ast.isa("call:return")) {
            ast.kind = "branch";
        };
        // &&
        if(ast.isa("call:&&")) {
            ast.kind = "branch";
        };
        // ||
        if(ast.isa("call:||")) {
            ast.kind = "branch";
        };
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
                return ;
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
            return ;
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
// ast2js {{{1
ast2js = undefined;
(function() {
    // Utility / definitions {{{2
    var str2obj = function(str) {
        return require("./util").list2obj(str.split(" "));
    };
    var jsoperator = str2obj("= === !== < <= > >= += -= *= /= ! | & ^ << >> ~ - + ++ -- * / ! % *() *[] typeof throw return");
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
    /// ast2js {{{2
    ast2js = function(ast) {
        ast.children = ast.children.map(ast2js);
        var lhs = ast.children[0];
        var rhs = ast.children[1];
        if(ast.kind === "call") {
            if(ast.val === ".") {
                // foo.'bar' -> foo.bar
                if(rhs.kind === "str") {
                    rhs.kind = "id";
                };
            } else if(ast.val === "new" && lhs.isa("id:Array")) {
                ast.children = ast.children.slice(1);
                ast.val = "[";
            } else if(ast.val === "new" && lhs.isa("id:Object")) {
                var children = [];
                while(ast.children.length > 1) {
                    rhs = ast.children.pop();
                    lhs = ast.children.pop();
                    children.push(ast.create("id", ":", lhs, rhs));
                };
                ast.children = children.reverse();
                ast.val = "{";
            } else if(ast.val === "new") {
                // do nothing
            } else if(ast.val === "[]=") {
                lhs = ast.create("id:*[]", ast.children[0], ast.children[1]);
                ast.children.shift();
                ast.children[0] = lhs;
                ast.val = "=";
            } else if(ast.val === ".=") {
                lhs = ast.create("id:.", ast.children[0], ast.children[1]);
                ast.children[1].kind = "id";
                ast.children.shift();
                ast.children[0] = lhs;
                ast.val = "=";
            } else if(jsoperator["hasOwnProperty"](ast.val)) {
                //operators - do nothing
            } else  {
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
        };
        if(ast.kind === "branch") {
            var unblock = function(node) {
                if(node.kind === "block") {
                    return node.children;
                } else  {
                    return [node];
                };
            };
            if(ast.val === "cond") {
                children = ast.children;
                rhs = undefined;
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
                ast = rhs;
            } else if(ast.val === "while") {
                ast.val = "*{}";
                ast.children[0] = ast.create("id:*()", ast.create("id:while"), ast.children[0]);
                ast.children = ast.children.concat(unblock(ast.children.pop()));
            } else if(ast.val === "?:") {
                rhs = ast.create("id", ":", ast.children[1], ast.children[2]);
                ast.children.pop();
                ast.children[1] = rhs;
                ast.val = "?";
            } else if(ast.val === "return") {
                // do nothing
            } else if(ast.val === "throw") {
                // do nothing
            };
        };
        if(ast.kind === "fn") {
            // TODO: var
            var len = + ast.val;
            lhs = ast.create("id:*()", ast.create("id:function"));
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
        if(ast.kind === "assign") {
            // =
            lhs = ast.create("id", ast.val);
            ast.children.unshift(lhs);
            ast.val = "=";
        };
        if(ast.kind === "block") {
            if(ast.children.length === 1) {
                return ast.children[0];
            } else  {
                children = [];
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
        };
        return ast;
    };
})();
// ast2rst {{{1
ast2rst = undefined;
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
    // Utility functions {{2
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
    macroJsCallMethod = function(ast) {
        // foo.bar(), foo['x'](bar)
        if(isValidId(ast.val)) {
            var lhs = ast.create("id:.", ast.create("id", ast.val));
        } else  {
            lhs = ast.create("id:*[]", ast.create("str", ast.val));
        };
        lhs.children.unshift(ast.children[0]);
        ast.children[0] = lhs;
        ast.val = "*()";
    }
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
    }
    var macroJsWhile = function(ast) {
        ast.val = "*{}";
        ast.children[0] = ast.create("id:*()", ast.create("id:while"), ast.children[0]);
        ast.children = ast.children.concat(unblock(ast.children.pop()));
    }
    var macroJsInfixIf = function(ast) {
        var rhs = ast.create("id", ":", ast.children[1], ast.children[2]);
        ast.children.pop();
        ast.children[1] = rhs;
        ast.val = "?";
    }
    var macroFnDef = function(ast) {
        var len = + ast.val;
        var lhs = ast.create("id:*()", ast.create("id:function"));
        lhs.children = lhs.children.concat(ast.children.slice(0, len));
        ast.children = ast.children.slice(len);
        ast.children.unshift(lhs);
        ast.kind = "id";
        ast.val = "*{}";
    }
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
        if(ast.children.length === 1) {
            return ast.children[0];
        } else  {
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
    };
    // ast2rst-macros
    var macros = MacroSystem();
    macros.postMacro("call:.", macroLhsStr2Id);
    macros.postMacro("call:new", macroNew);
    macros.postMacro("call:[]=", macroPut2Assign("id:*[]"));
    macros.postMacro("call:.=", fog(macroPut2Assign("id:."), macroLhsStr2Id));
    jsoperator.forEach(function(operatorName) {
        //operators - do nothing
        macros.postMacro("call:" + operatorName, function() {});
    });
    macros.postMacro("call", macroJsCallMethod)
    macros.postMacro("branch:cond", macroCond2IfElse);
    macros.postMacro("branch:while", macroJsWhile);
    macros.postMacro("branch:?:", macroJsInfixIf);
    macros.postMacro("fn", macroFnDef);
    macros.postMacro("assign", macroLsAssign);
    macros.postMacro("block", macroFlattenBlock);
    /// ast2rst {{{2
    ast2rst = function(ast) {
        return macros.execute(ast);
    };
})();
