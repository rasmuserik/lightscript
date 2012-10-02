if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
// Compiler {{{1
def("compiler", function(exports) {
    // outer: Number
    // outer: ;
    // outer: false
    // outer: JSON
    var ast;
    // outer: require
    // outer: use
    // outer: this
    // outer: arguments
    // outer: true
    // outer: Array
    // outer: Object
    var ast2rst;
    var ast2js;
    var analyse;
    var rst2ast;
    var prettyprint;
    var parse;
    var Ast;
    // outer: undefined
    var tokenise;
    exports.ls2js = function(ls) {
        // outer: ast2js
        // outer: prettyprint
        // outer: analyse
        // outer: rst2ast
        var asts;
        // outer: tokenise
        // outer: parse
        var rsts;
        rsts = parse(tokenise(ls));
        asts = rsts.map(rst2ast);
        asts = analyse(asts);
        return prettyprint(asts.map(function(ast) {
            // outer: ast2js
            return ast2js(ast);
        }));
    };
    exports.ls2ls = function(ls) {
        // outer: ast2rst
        // outer: prettyprint
        // outer: analyse
        // outer: rst2ast
        var asts;
        // outer: tokenise
        // outer: parse
        var rsts;
        rsts = parse(tokenise(ls));
        asts = rsts.map(rst2ast);
        asts = analyse(asts);
        return prettyprint(asts.map(function(ast) {
            // outer: ast2rst
            return ast2rst(ast);
        })).slice(1);
    };
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
                "kind" : kind,
                "val" : val,
                "pos" : pos,
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
            start = {"lineno" : 0, "pos" : 0};
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
                start = {"lineno" : lineno, "pos" : pos};
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
                                    "n" : "\n",
                                    "r" : "\r",
                                    "t" : "\t",
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
        // outer: ast
        // outer: require
        // outer: use
        // outer: this
        // outer: arguments
        // outer: Array
        // outer: Ast
        // outer: Object
        var defaultAst;
        defaultAst = {
            "create" : function(arg) {
                var splitpos;
                // outer: use
                // outer: this
                // outer: defaultAst
                // outer: Object
                var self;
                // outer: arguments
                // outer: Array
                var args;
                args = Array.prototype.slice.call(arguments, 0);
                self = Object.create(defaultAst);
                self.pos = this.pos;
                if(typeof arg === "object") {
                    self = use("util").extend(self, arg);
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
            },
            "isa" : function(kindval) {
                // outer: this
                kindval = kindval.split(":");
                this.assertEqual(kindval.length, 2);
                return this.kind === kindval[0] && this.val === kindval[1];
            },
            "assertEqual" : function(a, b) {
                // outer: this
                if(a !== b) {
                    this.error("assert error: " + a + " !== " + b);
                };
            },
            "error" : function(desc) {
                // outer: this
                // outer: Object
                // outer: require
                throw require("util").inspect({"error" : desc, "token" : this});
            },
            "toList" : function() {
                // outer: ast
                // outer: this
                var result;
                result = this.children.map(function(node) {
                    return node.toList();
                });
                result.unshift(ast.kind + ":" + ast.val);
                return result;
            },
        };
        Ast = function(arg) {
            // outer: defaultAst
            // outer: arguments
            // outer: Array
            var args;
            args = Array.prototype.slice.call(arguments, 0);
            return defaultAst.create.apply(defaultAst, args);
        };
    })();
    exports.test = function(test) {
        // outer: Array
        // outer: Object
        // outer: Ast
        // outer: ast
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
            "kind" : "kind3",
            "val" : "val3",
            "children" : ["arg3"],
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
        // outer: use
        var extend;
        // setup, token lookup, default token {{{2
        extend = use("util").extend;
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
            "nud" : function() {},
            "bp" : 0,
            "dbp" : 0,
            "space" : " ",
            "children" : [],
            "assert" : function(ok, desc) {
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
                token = tokenLookup(pos === tokens.length ? {"kind" : "eof", "rparen" : true} : tokens[pos]);
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
                "led" : infixLed,
                "nud" : nudPrefix,
                "bp" : bp,
            });
        };
        infixr = function(bp) {
            // outer: nudPrefix
            // outer: infixLed
            // outer: defaultToken
            // outer: Object
            // outer: extend
            return extend(Object.create(defaultToken), {
                "led" : infixLed,
                "nud" : nudPrefix,
                "bp" : bp,
                "dbp" : 1,
            });
        };
        rparen = function() {
            // outer: this
            // outer: true
            // outer: defaultToken
            // outer: Object
            // outer: extend
            return extend(Object.create(defaultToken), {"rparen" : true, "nud" : function() {
                // outer: this
                this.error("unmatched rparen");
            }});
        };
        prefix = function(bp) {
            // outer: nudPrefix
            // outer: defaultToken
            // outer: Object
            // outer: extend
            return extend(Object.create(defaultToken), {"nud" : nudPrefix, "bp" : bp});
        };
        sep = function() {
            // outer: true
            // outer: defaultToken
            // outer: Object
            // outer: extend
            return extend(Object.create(defaultToken), {"sep" : true, "pp" : function() {
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
                    "led" : function(left) {
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
                    "nud" : function() {
                        // outer: readList
                        // outer: Array
                        // outer: this
                        this.children = [];
                        readList(this);
                    },
                    "bp" : bp,
                    "pp" : function() {
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
            "*[]" : special({"pp" : infixlistpp, "bp" : 1200}),
            "]" : rparen(),
            "(" : list(")")(1200),
            "*()" : special({"pp" : infixlistpp, "bp" : 1200}),
            ")" : rparen(),
            "{" : list("}")(1100),
            "*{}" : special({"pp" : blockpp, "bp" : 1100}),
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
                "led" : function(left) {
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
                            "kind" : "id",
                            "val" : "",
                            "pos" : this.pos,
                        }));
                    };
                },
                "nud" : nudPrefix,
                "bp" : 200,
                "dbp" : 1,
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
            "str:" : special({"pp" : stringpp}),
            "note:" : special({"sep" : true, "pp" : function() {
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
    // rst2ast {{{1
    rst2ast = undefined;
    (function() {
        // outer: false
        // outer: Array
        // outer: true
        // outer: rst2ast
        // rst2ast {{{2
        rst2ast = function(ast) {
            // outer: false
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
        // outer: Number
        // outer: true
        // outer: ;
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
            // outer: ;
            // outer: Object
            Object.keys(fn.scope).forEach(function(name) {
                // outer: localVar
                // outer: Object
                // outer: true
                // outer: ;
                // outer: fn
                var t;
                t = fn.scope[name];
                if(t.argument) {
                    return ;
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
            // outer: ;
            // outer: fns
            // outer: Number
            var argc;
            // outer: Object
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
                // outer: parent
                // outer: localVars
                localVars(elem, parent);
            });
        };
    })();
    // ast2js {{{1
    ast2js = undefined;
    (function() {
        // outer: Object
        // outer: undefined
        // outer: Array
        // outer: true
        // outer: false
        // outer: use
        // outer: ast2js
        var isValidId;
        var reserved;
        var num;
        var validIdSymbs;
        var jsoperator;
        var str2obj;
        // Utility / definitions {{{2
        str2obj = function(str) {
            // outer: use
            return use("util").list2obj(str.split(" "));
        };
        jsoperator = str2obj("= === !== < <= > >= += -= *= /= ! | & ^ << >> ~ - + ++ -- * / ! % *() *[] typeof throw return");
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
        /// ast2js {{{2
        ast2js = function(ast) {
            var extractBlocks;
            // outer: Object
            var len;
            // outer: undefined
            var unblock;
            // outer: isValidId
            // outer: jsoperator
            // outer: Array
            var children;
            var rhs;
            var lhs;
            // outer: ast2js
            ast.children = ast.children.map(ast2js);
            lhs = ast.children[0];
            rhs = ast.children[1];
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
                    children = [];
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
                unblock = function(node) {
                    // outer: Array
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
            };
            return ast;
        };
    })();
    // ast2rst {{{1
    ast2rst = undefined;
    (function() {
        // outer: undefined
        // outer: Array
        // outer: true
        // outer: false
        // outer: use
        // outer: ast2rst
        var isValidId;
        var reserved;
        var num;
        var validIdSymbs;
        var jsoperator;
        var str2obj;
        // Utility / definitions {{{2
        str2obj = function(str) {
            // outer: use
            return use("util").list2obj(str.split(" "));
        };
        jsoperator = str2obj("= === !== < <= > >= += -= *= /= ! | & ^ << >> ~ - + ++ -- * / ! % *() *[] typeof throw return");
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
        /// ast2rst {{{2
        ast2rst = function(ast) {
            var extractBlocks;
            var len;
            // outer: undefined
            var unblock;
            // outer: jsoperator
            // outer: isValidId
            // outer: Array
            var children;
            var rhs;
            var lhs;
            // outer: ast2rst
            ast.children = ast.children.map(ast2rst);
            lhs = ast.children[0];
            rhs = ast.children[1];
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
                unblock = function(node) {
                    // outer: Array
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
                len = + ast.val;
                lhs = ast.create("id:*()", ast.create("id:function"));
                lhs.children = lhs.children.concat(ast.children.slice(0, len));
                ast.children = ast.children.slice(len);
                ast.children.unshift(lhs);
                ast.kind = "id";
                ast.val = "*{}";
            };
            if(ast.kind === "assign") {
                // =
                lhs = ast.create("id", ast.val);
                if(ast.doTypeAnnotate) {
                    //lhs = ast.create('call', ':', lhs, ast.type || ast.create('id:Any'));
                    lhs = ast.create("call", "var", lhs);
                };
                ast.children.unshift(lhs);
                ast.val = "=";
            };
            if(ast.kind === "block") {
                if(ast.children.length === 1) {
                    return ast.children[0];
                } else  {
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
            };
            return ast;
        };
    })();
});
