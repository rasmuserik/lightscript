
// Module system {{{1
var modules = {};
use = function(name) {
    var result = modules[name];
    if(typeof result === "function") {
        result = {};
        modules[name](result);
        modules[name] = result;
    };
    return result;
};
def = function(name, fn) {
    if(modules[name]) {
        throw name + " already defined";
    };
    modules[name] = fn;
};
// Util {{{1
def("util", function(exports) {
    exports.trycatch = Function("return function trycatch(fn,handle){try{return fn();}catch(e){return handle(e);}}")();
    exports.extend = function(a, b) {
        Object.keys(b).forEach(function(key) {
            a[key] = b[key];
        });
        return a;
    };
    exports.platform = undefined;
    if(typeof navigator !== "undefined" && navigator.userAgent) {
        exports.platform = "web";
    };
    if(typeof process !== "undefined" && process.versions && process.versions.node) {
        exports.platform = "node";
    };
    if(exports.platform === "node") {
        exports.nextTick = process.nextTick;
    } else  {
        exports.nextTick = function(f) {
            setTimeout(f, 0);
        };
    };
    exports.listpp = function(list, indent) {
        indent = indent || "  ";
        if(typeof (list) === "string") {
            return list;
        };
        var result = list.map(function(elem) {
            return exports.listpp(elem, indent + "  ");
        });
        var len = 0;
        result.forEach(function(elem) {
            len += elem.length + 1;
        });
        if(len < 72) {
            return "[" + result.join(" ") + "]";
        } else  {
            return "[" + result.join("\n" + indent) + "]";
        };
    };
    exports.list2obj = function(arr) {
        var result = {};
        arr.forEach(function(elem) {
            result[elem] = true;
        });
        return result;
    };
});
// Main {{{1
def("main", function(exports) {
    var util = use("util");
    util.nextTick(function() {
        var platform = util.platform;
        if(platform === "node") {
            var commandName = process.argv[2];
        };
        if(platform === "web") {
            commandName = window.location.hash.slice(1);
        };
        if(use(commandName) && use(commandName)[platform + "main"]) {
            use(commandName)[platform + "main"]();
        } else if(use(commandName) && use(commandName).main) {
            use(commandName)[platform + "main"]();
        } else if(use(platform) && use(platform).main) {
            use(platform).main();
        };
    });
});
use("main");
// Test {{{1
def("test", function(exports) {
    var test = {};
    test.name = "";
    test.error = function(description) {
        ++this.error;
        console.log(this.name + ":", description);
    };
    test.assertEqual = function(a, b, description) {
        description = description || "test: " + a + " !== " + b;
        if(a === b) {
            ++this.ok;
        } else  {
            this.error("assertEqual " + description);
        };
    };
    test.assert = function(result, description) {
        if(result) {
            ++this.ok;
        } else  {
            this.error("assert " + description);
        };
    };
    test.done = function() {
        console.log(this.name + ": " + this.ok + "/" + (this.ok + this.error) + " tests ok");
        this.finished = true;
        clearTimeout(this.timeout);
    };
    test.create = function(name, timeout) {
        var self = Object.create(test);
        self.error = self.ok = 0;
        timeout = timeout || 60000;
        self.name = this.name + name;
        self.timeout = setTimeout(function() {
            if(!self.finished) {
                self.error("test timed out after " + timeout + "ms");
                self.done();
            };
        }, timeout);
        return self;
    };
    exports.nodemain = function() {
        Object.keys(modules).forEach(function(moduleName) {
            var module = use(moduleName);
            if(module.test) {
                module.test(test.create(moduleName));
            };
            var pname = "test" + use("util").platform;
            if(module[pname]) {
                module[pname](test.create(use("util".platform) + ":" + moduleName));
            };
        });
    };
});
// Compiler {{{1
// Tokeniser {{{2
def("tokeniser", function(exports) {
    "use strict";
    var createToken = function(kind, val, pos) {
        return {
            kind : kind,
            val : val,
            pos : pos,
        };
    };
    exports.tokenise = function(buffer) {
        var pos = 0;
        var start = {lineno: 0, pos: 0};
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
            start = {
                lineno : lineno,
                pos : pos,
            };
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
                            c = {
                                "n" : "\n",
                                "r" : "\r",
                                "t" : "\t",
                            }[c] || c;
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
});
// Ast object {{{2
def("ast", function(exports) {
    var defaultAst = {
        create : function(arg) {
            var args = Array.prototype.slice.call(arguments, 0);
            var self = Object.create(defaultAst);
            self.pos = this.pos;
            if(typeof arg === "object") {
                self = use("util").extend(self, arg);
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
            throw {
                error : desc,
                token : this,
            };
        },
    };
    exports.create = function(arg) {
        var args = Array.prototype.slice.call(arguments, 0);
        return defaultAst.create.apply(defaultAst, args);
    };
    exports.test = function(test) {
        var ast = exports.create("kind1:val1", "arg1");
        test.assertEqual(ast.kind, "kind1");
        test.assertEqual(ast.val, "val1");
        test.assertEqual(ast.children[0], "arg1");
        test.assertEqual(typeof ast.create, "function", "has create function");
        ast = exports.create("kind2", "val2", "arg2");
        test.assertEqual(ast.kind, "kind2");
        test.assertEqual(ast.val, "val2");
        test.assertEqual(ast.children[0], "arg2");
        ast = exports.create({
            kind : "kind3",
            val : "val3",
            children : ["arg3"],
        });
        test.assertEqual(ast.kind, "kind3");
        test.assertEqual(ast.val, "val3");
        test.assertEqual(ast.children[0], "arg3");
        test.done();
    };
});
// Syntax {{{2
def("syntax", function(exports) {
    // main {{{3
    exports.nodemain = function() {
        var tokenise = use("tokeniser").tokenise;
        var filename = process.argv[3] || process.argv[1];
        var rsts = exports.parse(tokenise(require("fs").readFileSync(filename, "utf8")));
        var newCode = pplistlines(rsts, ";");
        if(exports.errors.length) {
            console.log("errors:", exports.errors);
        } else  {
            console.log(newCode);
            if(!process.argv[3]) {
                require("fs").writeFileSync(filename + "", newCode);
            };
        };
    };
    // toList {{{3
    exports.toList = function(ast) {
        var result = ast.children.map(exports.toList);
        result.unshift(ast.kind + ":" + ast.val);
        return result;
    };
    // setup, token lookup, default token {{{3
    exports.errors = [];
    var extend = use("util").extend;
    var tokenLookup = exports.tokenLookup = function(orig) {
        var proto = symb[orig.kind + ":"] || symb[orig.val] || (orig.val && symb[orig.val[orig.val.length - 1]]) || defaultToken;
        return extend(Object.create(proto), orig);
    };
    var defaultToken = use("ast").create({
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
    // parser {{{3
    var token = undefined;
    var nextToken = undefined;
    var parse = function(rbp) {
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
    exports.parse = function(tokens) {
        var pos = 0;
        nextToken = function() {
            token = tokenLookup(pos === tokens.length ? {
                kind : "eof",
                rparen : true,
            } : tokens[pos]);
            ++pos;
            return tokenLookup(token);
        };
        nextToken();
        var result = [];
        while(token.kind !== "eof") {
            result.push(parse());
        };
        return result;
    };
    // prettyprinter {{{3
    var indent = - 4;
    defaultToken.pp = function() {
        if(this.children.length === 0) {
            return this.val;
        } else if(this.children.length === 1) {
            return this.val + this.space + pp(this.children[0]);
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
    exports.prettyprint = function(stmts) {
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
        return pp(this.children[0]) + this.val[1] + compactlistpp(this.children.slice(1)) + this.val[2];
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
    // syntax constructors {{{3
    var nudPrefix = function() {
        var child = parse();
        if(parse.sep) {
            this.error("should be followed by a value, not a separator");
            child.error("missing something before this element");
        };
        this.children = [child];
    };
    var infixLed = function(left) {
        this.infix = true;
        this.children = [
            left,
            parse(this.bp - this.dbp),
        ];
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
        return extend(Object.create(defaultToken), {
            rparen : true,
            nud : function() {
                this.error("unmatched rparen");
            },
        });
    };
    var prefix = function(bp) {
        return extend(Object.create(defaultToken), {
            nud : nudPrefix,
            bp : bp,
        });
    };
    var sep = function() {
        return extend(Object.create(defaultToken), {
            sep : true,
            pp : function() {
                return "";
            },
        });
    };
    var special = function(ext) {
        return extend(Object.create(defaultToken), ext);
    };
    var list = function(rparen) {
        var readList = function(obj) {
            while(!token.rparen) {
                obj.children.push(parse());
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
    // syntax definition {{{3
    var symb = {
        "." : nospace(infix(1000)),
        "[" : list("]")(1000),
        "*[]" : special({pp : infixlistpp}),
        "]" : rparen(),
        "{" : list("}")(1000),
        "*{}" : special({pp : blockpp}),
        "}" : rparen(),
        "(" : list(")")(1000),
        "*()" : special({pp : infixlistpp}),
        ")" : rparen(),
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
        constructor : defaultToken,
        valueOf : defaultToken,
        toString : defaultToken,
        toLocaleString : defaultToken,
        hasOwnProperty : defaultToken,
        isPrototypeOf : defaultToken,
        propertyIsEnumerable : defaultToken,
        "return" : prefix(0),
        "throw" : prefix(0),
        "new" : prefix(0),
        "typeof" : prefix(0),
        "var" : prefix(0),
        "str:" : special({pp : stringpp}),
        "note:" : special({
            sep : true,
            pp : function() {
                if(this.val.slice(0, 2) === "//") {
                    return this.val.slice(0, - 1);
                } else  {
                    return this.val;
                };
            },
        }),
        "annotation:" : sep(),
    };
});
// rst2ast {{{2
def("rst2ast", function(exports) {
    // main {{{3
    exports.nodemain = function() {
        var tokenise = use("tokeniser").tokenise;
        var syntax = use("syntax");
        var filename = process.argv[3] || process.argv[1];
        var rsts = syntax.parse(tokenise(require("fs").readFileSync(filename, "utf8")));
        if(syntax.errors.length) {
            console.log("errors:", syntax.errors);
        } else  {
            rsts.forEach(function(rst) {
                var f = function(elem) {
                    console.log(elem.kind, elem.val);
                    elem.children.map(f);
                };
                //f(rst2ast(rst));
                console.log(use("util").listpp(use("syntax").toList(rst2ast(rst))));
            });
        };
    };
    // rst2ast {{{3
    var rst2ast = exports.rst2ast = function(ast) {
        // Before recursive transformation {{{4
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
        // transform children {{{4
        ast.children = ast.children.map(rst2ast);
        // After recursive transformation {{{4
        // parenthesie (x) -> x {{{5
        while(ast.isa("id:(") && ast.children.length === 1) {
            ast = ast.children[0];
        };
        // call {{{5
        if(ast.kind === "id" && ast.children.length > 0) {
            ast.kind = "call";
            ast.children = ast.children.filter(function(elem) {
                return !elem.isa("id:,");
            });
        };
        // remove var {{{5
        if(ast.isa("call:var")) {
            ast = ast.children[0];
        };
        // extract lhs and rhs {{{5
        var lhs = ast.children[0];
        var rhs = ast.children[1];
        // foo.bar -> foo.'bar' {{{5
        if(ast.isa("call:.")) {
            if(rhs.kind === "id") {
                rhs.kind = "str";
            };
        };
        // branches {{{5
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
        // = {{{5
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
        // *{} {{{5
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
        // else {{{5
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
        // method call {{{5
        if(ast.isa("call:*()")) {
            if(lhs.isa("call:.")) {
                ast.val = lhs.children[1].val;
                ast.children[0] = lhs.children[0];
            };
        };
        return ast;
    };
});
// code analysis {{{2
def("code_analysis", function(exports) {
    // functions in post-order traversal
    var fns = [];
    exports.analyse = function(asts) {
        fns = [];
        var global = use("ast").create("fn:0");
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
                if(fn.parent && (typeof fn.parent.scope[name] === "object" || !t.set)) {
                    t.boxed = true;
                    Object.keys(t).forEach(function(key) {
                        localVar(fn.parent, name)[key] = localVar(fn.parent, name)[key] || t[key];
                    });
                } else  {
                    t.local = true;
                    if(t.firstSet) {
                        t.firstSet.doTypeAnnotate = true;
                    }
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
            }
            localVar(parent, ast.val).set = true;
        };
        ast.children.forEach(function(elem) {
            localVars(elem, parent);
        });
    };
});
// ast2js {{{2
def("ast2js", function(exports) {
    // main {{{3
    exports.nodemain = function() {
        var tokenise = use("tokeniser").tokenise;
        var syntax = use("syntax");
        var filename = process.argv[3] || process.argv[1];
        var rsts = syntax.parse(tokenise(require("fs").readFileSync(filename, "utf8")));
        if(syntax.errors.length) {
            console.log("errors:", syntax.errors);
        } else  {
            /*
            rsts.forEach(function(rst) {
                var f = function(elem) {
                    console.log(elem.kind, elem.val);
                    elem.children.map(f);
                };
                //f(rst2ast(rst));
                //console.log(use("util").listpp(use("syntax").toList(rst)));
                var jsast = ast2js(use("rst2ast").rst2ast(rst));
                //console.log(use("util").listpp(use("syntax").toList(jsast)));
                console.log(use("syntax").prettyprint([jsast]));
            });
            */
            var asts = rsts.map(use("rst2ast").rst2ast);
            asts = use("code_analysis").analyse(asts);
            console.log(use("syntax").prettyprint(asts.map(function(ast) {
                return ast2js(ast);
            })));
        };
    };
    // Utility / definitions {{{3
    var str2obj = function(str) {
        return use("util").list2obj(str.split(" "));
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
    /// ast2js {{{3
    var ast2js = exports.ast2js = function(ast) {
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
            } else if(jsoperator[ast.val]) {
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
                var children = ast.children;
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
        return ast;
    };
});
// ast2rst {{{2
def("ast2rst", function(exports) {
    // main {{{3
    exports.nodemain = function() {
        var tokenise = use("tokeniser").tokenise;
        var syntax = use("syntax");
        var filename = process.argv[3] || process.argv[1];
        var rsts = syntax.parse(tokenise(require("fs").readFileSync(filename, "utf8")));
        if(syntax.errors.length) {
            console.log("errors:", syntax.errors);
        } else  {
            var asts = rsts.map(use("rst2ast").rst2ast);
            asts = use("code_analysis").analyse(asts);
            console.log(use("syntax").prettyprint(asts.map(function(ast) {
                return ast2rst(ast);
            })));
        };
    };
    // Utility / definitions {{{3
    var str2obj = function(str) {
        return use("util").list2obj(str.split(" "));
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
    /// ast2rst {{{3
    var ast2rst = exports.ast2rst = function(ast) {
        ast.children = ast.children.map(ast2rst);
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
                    if(lhs.kind === 'str' && isValidId(lhs.val)) {
                        lhs.kind = 'id';
                    }
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
            } else if(jsoperator[ast.val]) {
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
                var children = ast.children;
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
            var len = + ast.val;
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
                lhs = ast.create('call', 'var', lhs);
            }
            ast.children.unshift(lhs);
            ast.val = "=";
        };
        if(ast.kind === "block") {
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
        return ast;
    };
});
// Server {{{1
def("server", function(exports) {
    if(use("util").platform === "node") {
        exports.nodemain = function() {
            // # includes and initialisation {{{2
            var express = require("express");
            var mustache = require("mustache");
            var fs = require("fs");
            var logger = require("express-logger");
            var sqlite3 = require("sqlite3");
            var https = require("https");
            var db = new sqlite3.Database(process.env.HOME + "/data/db.sqlite3");
            db.run("CREATE TABLE IF NOT EXISTS userdata (store, key, val, timestamp, PRIMARY KEY (store, key))");
            // # Pages from markdown {{{2
            htmlTemplate = fs.readFileSync(__dirname + "/sites/solsort/template/html.mustache", "utf8");
            var name2url = function(name) {
                return name.replace(RegExp("[^a-zA-Z0-9._~/\\[\\]@!$&'()*+,;=-]", "g"), function(c) {
                    var subs = {
                        "Æ" : "AE",
                        "Ø" : "O",
                        "Å" : "AA",
                        "æ" : "ae",
                        "ø" : "o",
                        "å" : "aa",
                        "é" : "e",
                        "?" : "",
                        ":" : "",
                        " " : "_",
                    };
                    if(subs[c] === undefined) {
                        return "_";
                    } else  {
                        return subs[c];
                    };
                });
            };
            var file2entries = function(filename) {
                var result = {};
                fs.readFileSync(filename, "utf8").split("\n# ").slice(1).forEach(function(elem) {
                    var title = elem.split("\n")[0].trim();
                    if(result[title]) {
                        throw "duplicate title in \"" + filename + "\": " + title;
                    };
                    result[title] = {
                        title : title,
                        url : name2url(title),
                        html : require("markdown").markdown.toHTML("# " + elem),
                    };
                });
                return result;
            };
            var notes = file2entries(__dirname + "/sites/solsort/notes.md");
            // # Web content/server configuration {{{2
            var configureApp = function(app) {
                require("./sites/solsort/theodorelias/genindex.js").gen(htmlTemplate);
                app.use(function(req, res, next) {
                    res.removeHeader("X-Powered-By");
                    next();
                });
                app.stack.unshift({
                    route : "",
                    handle : logger({path : process.env.HOME + "/data/httpd.log"}),
                });
                app.use(express.bodyParser());
                Object.keys(notes).forEach(function(key) {
                    app.get("/" + notes[key].url, function(req, res) {
                        res.send(fixLinks(mustache.to_html(htmlTemplate, {
                            title : key,
                            body : notes[key].html,
                        })));
                    });
                });
                var fixLinks = function(html) {
                    return html.replace(RegExp("href=\"http(s?):\\/\\/([^\"]*)", "g"), function(_, s, url) {
                        return "href=\"/http" + s + "?" + url;
                    });
                };
                app.get("/githubLogin", function(req, res) {
                    https.get({
                        host : "github.com",
                        path : "/login/oauth/access_token?client_id=cc14f7f75ff01bdbb1e7&client_secret=d978cb4e2e1cdb35d4ae9e194b9c36fa0c2f607e&code=" + req.query.code + "&state=" + req.query.state,
                    }, function(con) {
                        con.on("data", function(data) {
                            res.send(req.query.callback + "(\"" + data + "\");", {"Content-Type" : "application/javascript"});
                        });
                    });
                });
                app.get("/store", storeHandle);
                app.post("/store", storeHandle);
                var storeHandle = function(req, res) {
                    console.log(req.query, req.body);
                    var query = req.query || {};
                    var body = req.body || {};
                    var store = query.store || body.store;
                    var key = query.key || body.key;
                    var newVal = query.val || body.val;
                    var prevVal = query.prev || body.prev;
                    if(!store) {
                        return res.send("Parameters: store, key[, val, prev]\nReturns current store/key-value, or sets it if val+prev is set (prev must be the current value in the database and val the new one).", {"Content-Type" : "text/plain"}, 400);
                    };
                    if(!key) {
                        var result = [];
                        db.all("SELECT key, timestamp FROM userdata WHERE store=$store;", {$store : store}, function(err, val) {
                            if(err) {
                                return res.send(String(err), {"Content-Type" : "text/plain"}, 500);
                            };
                            res.send(val, {"Content-Type" : "text/plain"});
                        });
                        return ;
                    };
                    db.get("SELECT * FROM userdata WHERE store=$store AND key=$key;", {
                        $store : store,
                        $key : key,
                    }, function(err, row) {
                        if(err) {
                            return res.send(String(err), {"Content-Type" : "text/plain"}, 500);
                        };
                        var val = row && row.val;
                        if(newVal !== undefined) {
                            console.log({
                                val : val,
                                prevVal : prevVal,
                            });
                            if(prevVal != val) {
                                return res.send(val, {"Content-Type" : "text/plain"}, 409);
                            };
                            return db.run("INSERT OR REPLACE INTO userdata VALUES ($store, $key, $val, $timestamp);", {
                                $store : store,
                                $key : key,
                                $val : newVal,
                                $timestamp : Date.now(),
                            }, function(err) {
                                if(err) {
                                    return res.send(String(err), {"Content-Type" : "text/plain"}, 500);
                                };
                                res.send("ok", {"Content-Type" : "text/plain"});
                            });
                        };
                        if(!row) {
                            return res.send("", {"Content-Type" : "text/plain"}, 404);
                        };
                        res.send(val, {"Content-Type" : "text/plain"});
                    });
                };
                app.get("/", function(req, res) {
                    fs.readFile(__dirname + "/sites/solsort/template/index.html.mustache", "utf8", function(err, frontpage) {
                        res.send(fixLinks(mustache.to_html(frontpage, {notes : Object.keys(notes).map(function(noteName) {
                            var title = notes[noteName].title;
                            return "<a class=\"solsortBtn\" href=\"/" + notes[noteName].url + "\">" + title.replace(RegExp(":", "g"), ":<br/>") + "</a>";
                        }).join("")})));
                    });
                });
                app.get("/te_fodsel", function(req, res) {
                    res.redirect("/theodorelias/?fodsel");
                });
                app.get("/skolevangen", function(req, res) {
                    res.redirect("https://www.facebook.com/groups/520346057991618");
                });
                app.get("/http", function(req, res) {
                    res.redirect("http://" + req.originalUrl.slice(6));
                });
                app.get("/https", function(req, res) {
                    res.redirect("https://" + req.originalUrl.slice(7));
                });
                app.get("*", express.static(__dirname + "/sites/solsort"));
                /*
app.get('*', function(req, res){
res.send(
mustache.to_html(htmlTemplate, {
title: 'Page not found :(', 
body: '<h1>The end of the Internet</h1>' +
'<p>Sorry, no page found (404) on this url</p>' +
'<p>You have reached the end of the internet</p>' +
'<p>Hope you enjoyed the web</p>' +
'<p>You may now turn off your device and go out in the world</p>' +
'<p>(or see if you can find the page your were looking for <a href="/">here</a>)</p>'}),
404);
});
*/
            };
            // # Setup the servers {{{2
            //
            exports.expressCreateServer = function(hook_name, args, callback) {
                configureApp(args.app);
                callback();
            };
            var app = express.createServer();
            console.log(app);
            exports.expressCreateServer(undefined, {app : app}, function() {
                app.listen(8080);
                console.log("listening on port 8080");
            });
        };
    };
});
// rest-api {{{1
def("restapi", function(exports) {
    var platform = use("util").platform;
    exports.nodemain = function() {
        console.log("hello world");
        // setup server
    };
    if(platform === "node") {
        exports.call = function(module, name, param, callback) {
            // call function directly a la
            if(use(module) && use(module).restable && use(module).restable[name] && typeof use(module)[name] === "function") {
                use(module)[name](param, callback);
            } else  {
                callback({error : "no such call"});
            };
        };
    } else if(platform === "web") {
        exports.call = function(module, param, callback) {
            // send jsonp-request to api.solsort.com
        };
    };
});
// web {{{1
def("web", function(exports) {
    exports.main = function() {
        console.log("here");
        // TODO: remove the following line
        solsort = exports;
        // # Utility functions {{{2
        // ## load an external .js file {{{3
        // TODO: callback parameter (+onreadychange etc.)
        exports.loadJS = function(url) {
            var scriptElem = document.createElement("script");
            scriptElem.src = url;
            document.body.appendChild(scriptElem);
        };
        // ## identity function {{{3
        exports.id = function(a) {
            return a;
        };
        // ## Throttle a function {{{3
        exports.throttledFn = function(fn, delay) {
            var lastRun = 0;
            var scheduled = false;
            return function(callback) {
                if(scheduled) {
                    return ;
                };
                var run = function() {
                    scheduled = false;
                    lastRun = Date.now();
                    fn();
                };
                scheduled = true;
                setTimeout(run, Math.max(0, delay - (Date.now() - lastRun)));
            };
        };
        // ## extract url parameters {{{3
        exports.getVars = function() {
            // TODO: unencode urlencoding
            var result = {};
            window.location.search.slice(1).split("&").forEach(function(s) {
                var t = s.split("=");
                result[t[0]] = t[1];
            });
            return result;
        };
        // ## jsonp {{{3
        exports.jsonp = function(uri, args, callback, callbackName) {
            // TODO: urlencode args
            // TODO: make reentrant
            // TODO: add timeout with error
            if(callback) {
                callbackName = callbackName || "callback";
                args[callbackName] = "solsortJSONP0";
                window.solsortJSONP0 = callback;
            };
            exports.loadJS(uri + "?" + Object.keys(args).map(function(key) {
                return key + "=" + args[key];
            }).join("&"));
        };
        exports.error = function(err) {
            exports.jsonp("http://solsort.com/clientError", {error : String(err)});
            alert("Error on solsort.com: \n" + err + "\nSorry, not quite bug free, if you are online, then the error has been reported...");
            throw err;
        };
        // # Storage  {{{2
        var stores = {};
        exports.Storage = function(storageName, mergeFunction) {
            if(stores[storageName]) {
                return stores[storageName];
            };
            // ## Private data {{{3
            var data = localStorage.getItem(storageName) || "{}";
            data = JSON.parse(storage.store);
            var syncCallbacks = [];
            // ## Synchronise with localStorage and server {{{3
            var sync = function() {
                var execSyncCallbacks = function() {
                    while(syncCallbacks.length) {
                        syncCallbacks.pop()();
                    };
                };
                localStorage.setItem(storageName, JSON.stringify(data));
                var user = localStorage.getItem("userId");
                if(!user) {
                    execSyncCallbacks();
                    return ;
                };
                // TODO: implement server-side sync
                execSyncCallbacks();
            };
            // ## Throttled version of synchronisation function {{{3
            var sync5s = exports.throttledFn(sync, 5000);
            var throttledSync = function(callback) {
                if(callback) {
                    syncCallbacks.push(callback);
                };
                sync5s();
            };
            // ## setters/getters {{{3
            var set = function(key, val) {
                data[key] = JSON.stringify(val);
                throttledSync();
            };
            var get = function(key) {
                return JSON.parse(data[key]);
            };
            // ## Create and return+cache store object {{{3
            var storage = {
                sync : throttledSync,
                set : set,
                get : get,
            };
            stores[storageName] = storage;
            return storage;
        };
        // # Login system {{{2
        // ## Update user interface: add loginbuttons to `#solsortLogin` {{{3
        var loginUI = function() {
            var solsortLogin = document.getElementById("solsortLogin");
            if(solsortLogin) {
                var userId = localStorage.getItem("userId");
                var userName = localStorage.getItem("userName");
                if(!userId) {
                    solsortLogin.innerHTML = "<ul class=\"nav\"><li class=\"dropdown\">" + "<a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">Login<b class=\"caret\"></b></a>" + "<ul class=\"dropdown-menu\">" + "<li><a href=\"javascript:use('web').loginGitHub()\"><span class=\"icon-github\"></span> github</a></li>" + "<li><a href=\"#\" onclick=\"use('web').loginFacebook()\"><span class=\"icon-facebook-sign\"></span> facebook</a></li>" + "<li><a href=\"#\" onclick=\"use('web').loginGoogle()\"><span class=\"icon-google-plus-sign\"></span> google</a></li>" + "</ul></li></ul>";
                } else  {
                    solsortLogin.innerHTML = "<ul class=\"nav\"><li><a onclick=\"use('web').logout();\">" + userName + "<span class=\"icon-" + {
                        github : "github",
                        facebook : "facebook-sign",
                        google : "google-plus-sign",
                    }[userId.split(":")[0]] + " icon-large\"></span>" + "logout" + "</a></li></ul>";
                };
            };
        };
        // ## Logout {{{3
        exports.logout = function() {
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
            loginUI();
        };
        // ## solsort.login {{{3
        exports.login = function() {
            var i = 0;
            while(i < arguments.length) {
                if(typeof arguments[i] === "function") {
                    var callback = arguments[i];
                };
                ++i;
            };
            var user = localStorage.getItem("userId");
            if(user) {
                return callback(user);
            };
            throw "not implemented yet";
        };
        // ## Internal utility functions {{{3
        // ### Log in to facebook {{{3
        exports.loginFacebook = function() {
            localStorage.setItem("logging in", "facebook");
            window.location = "https://www.facebook.com/dialog/oauth?client_id=201142456681777&redirect_uri=http://solsort.com/&scope=&response_type=token";
        };
        // ### Log in to github {{{4
        exports.loginGitHub = function() {
            localStorage.setItem("logging in", "github");
            window.location = "https://github.com/login/oauth/authorize?client_id=cc14f7f75ff01bdbb1e7";
        };
        // ### Log in to google {{{4
        exports.loginGoogle = function() {
            localStorage.setItem("logging in", "google");
            window.location = "https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/userinfo.profile&state=&redirect_uri=http://solsort.com/&response_type=token&client_id=500223099774.apps.googleusercontent.com";
        };
        // ### Utility for setting userid/username when logged in {{{4
        var loginAs = function(user, name) {
            localStorage.setItem("userId", user);
            localStorage.setItem("userName", name);
            exports.jsonp("http://solsort.com/", {
                user : user,
                name : name,
            });
            var loginFromUrl = localStorage.getItem("loginFromUrl");
            if(loginFromUrl) {
                localStorage.removeItem("loginFromUrl");
                window.location = loginFromUrl;
            };
        };
        // ### Handle second part of login, if magic cookie {{{4
        var loggingIn = localStorage.getItem("logging in");
        if(loggingIn) {
            localStorage.removeItem("logging in");
            if(loggingIn === "github") {
                exports.jsonp("http://solsort.com/githubLogin", exports.getVars(), function(access_token) {
                    access_token = access_token.replace(RegExp(".*access_token="), "").replace(RegExp("&.*"), "");
                    exports.jsonp("https://api.github.com/user", {access_token : access_token}, function(data) {
                        if(data.data.login) {
                            loginAs("github:" + data.data.login, data.data.name);
                            loginUI();
                        };
                    });
                });
            };
            if(loggingIn === "facebook") {
                var access_token = location.hash.replace(RegExp(".*access_token="), "").replace(RegExp("&.*"), "");
                exports.jsonp("https://graph.facebook.com/me", {access_token : access_token}, function(data) {
                    if(data.id) {
                        loginAs("facebook:" + data.id, data.name);
                        loginUI();
                    };
                });
            };
            if(loggingIn === "google") {
                access_token = location.hash.replace(RegExp(".*access_token="), "").replace(RegExp("&.*"), "");
                exports.jsonp("https://www.googleapis.com/oauth2/v1/userinfo", {access_token : access_token}, function(data) {
                    if(data.id) {
                        loginAs("google:" + data.id, data.name);
                        loginUI();
                    };
                });
            };
        };
        // # Various initialisation on page
        loginUI();
        exports.loadJS("http://solsort.com/store.js");
    };
});
// publish web sites {{{1
def("publish", function(exports) {
    exports.nodemain = function() {
        console.log("copying sites to /usr/share/nginx/www/");
        require("child_process").exec("cp -a sites/* /usr/share/nginx/www/", function(err, stdout, stderr) {
            console.log("done");
            if(err) {
                console.log("Error:", err);
            };
        });
    };
    if(1) {
        2;
    } else if(3) {
        4;
    } else  {
        5;
    };
});
