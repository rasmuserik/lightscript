// Module system {{{1
var modules = {};
var use = function(name) {
    return modules[name];
};
var def = function(name, fn) {
    if(modules[name]) {
        throw name + " already defined";
    };
    var module = {exports : {}};
    fn(module.exports, module);
    modules[name] = module.exports;
};
// Util {{{1
def("util", function(exports, module) {
    exports.trycatch = Function("return function trycatch(fn,handle){try{return fn();}catch(e){return handle(e);}}")();
    exports.extend = function(a, b) {
        Object.keys(b).forEach(function(key) {
            a[key] = b[key];
        });
        return a;
    };
    exports.platform = undefined;
    if(typeof(navigator) !== "undefined" && navigator.userAgent) {
        exports.platform = "web";
    };
    if(typeof(process) !== "undefined" && process.versions && process.versions.node) {
        exports.platform = "node";
    };
});
// Compiler {{{1
def("compiler", function(exports, module) {
    // Tokeniser {{{2
    def("tokeniser", function(exports, module) {
        "use strict";
        var createToken = function(kind, val, pos) {
            return {
                kind : kind,
                val : val,
                pos : pos
            };
        };
        exports.tokenise = function(buffer) {
            var pos = 0;
            var start;
            var lineno = 0;
            var one_of = function(str) {
                return str.indexOf(peek()) !==  - 1;
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
                var result = createToken(kind, val, {start : start, end : {lineno : lineno, pos : pos}});
                return result;
            };
            var next = function() {
                var whitespace = " \t\r\n";
                var single_symbol = "(){}[]:;,`?";
                var joined_symbol = "=+-*/<>%!|&^~#.@";
                var ident = "_qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM$";
                var digits = "0123456789";
                var hexdigits = digits + "abcdefABCDEF";
                var s;
                var c;
                var quote;
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
                        return newToken("comment", s);
                    } else if(starts_with("/*")) {
                        s = "";
                        while(peek() && peek(2) !== "*/") {
                            s += pop();
                        };
                        s += pop(2);
                        return newToken("comment", s);
                    } else if(one_of("'\"")) {
                        s = quote = pop();
                        while(!starts_with(quote)) {
                            c = pop();
                            if(c === "\\") {
                                c = pop();
                                c = {
                                    "n" : "\n",
                                    "r" : "\r",
                                    "t" : "\t"
                                }[c] || c;
                            };
                            s += c;
                        };
                        s += pop();
                        return newToken("string", s);
                    } else if(one_of(digits) || (peek() === "." && digits.indexOf(peek(1, 1)) !==  - 1)) {
                        s = pop();
                        if(peek() !== "x") {
                            while(peek() && one_of(".e" + digits)) {
                                s += pop();
                            };
                        } else {
                            s = pop(2);
                            while(peek() && one_of(hexdigits)) {
                                s += pop();
                            };
                        };
                        return newToken("number", s);
                    } else if(one_of(single_symbol)) {
                        return newToken("symbol", pop());
                    } else if(one_of(joined_symbol)) {
                        s = "";
                        while(peek() && one_of(joined_symbol)) {
                            s += pop();
                        };
                        return newToken("symbol", s);
                    } else if(one_of(ident)) {
                        s = "";
                        while(peek() && one_of(ident + digits)) {
                            s += pop();
                        };
                        return newToken("identifier", s);
                    } else {
                        throw "Tokenisation error: " + peek().charCodeAt(0) + " (" + peek() + ") at pos " + pos;
                    };
                };
            };
            var result = [];
            var token = next();
            while(token) {
                result.push(token);
                token = next();
            };
            return result;
        };
    });
    // Prettyprint {{{2
    def("prettyprint", function(exports, module) {
        exports.main = function() {
            if(use("util").platform === "node") {
                var ls = {};
                ls.tokenise = use("tokeniser").tokenise;
                var syntax = use("syntax");
                ls.parse = syntax.parse;
                ls.prettyprint = use("prettyprint").prettyprint;
                rst2ast = use("rst2ast");
                var filename = process.argv[1];
                var rst = ls.parse(ls.tokenise(require("fs").readFileSync(filename, "utf8")));
                var newCode = ls.prettyprint({kind : "block", children : rst.map(rst2ast).filter(function(elem) {
                    return elem.val !== ";";
                })}).replace(RegExp("\n    ", "g"), "\n").slice(2,  - 2) + "\n";
                if(syntax.errors.length) {
                    console.log("errors:", syntax.errors);
                } else {
                    require("fs").writeFileSync(filename + "", newCode);
                };
            } else {
                throw "TODO: can currently only prettyprint self on node";
            };
        };
        var acc = [];
        var indent = 0;
        var newline = function() {
            var result = "\n";
            var n = indent;
            while(n) {
                result += " ";
                --n;
            };
            return result;
        };
        var exprList = function(arr, separator) {
            var sep = "";
            arr.forEach(function(elem) {
                acc.push(sep);
                pp(elem);
                sep = separator;
            });
        };
        var parenList = function(arr) {
            acc.push("(");
            exprList(arr, ", ");
            acc.push(")");
        };
        var fBlock = function(node) {
            var len = node.children.length;
            node.assert(node.children[len - 1].kind === "block", "Expected block after function");
            acc.push(node.children[0].val);
            parenList(node.children.slice(1,  - 1));
            acc.push(" ");
            pp(node.children[len - 1]);
        };
        var fPrefix = function(node) {
            node.assert(node.children.length === 2, "prettyprint prefix must have length 1");
            acc.push(node.children[0].val);
            acc.push(" ");
            pp(node.children[1]);
        };
        var ifelse = function(node) {
            var len = node.children.length;
            acc.push("if");
            parenList(node.children.slice(1, 2));
            acc.push(" ");
            pp(node.children[2]);
            if(node.children.length === 4) {
                acc.push(" else ");
                pp(node.children[3]);
            };
        };
        var list = function(listEnd) {
            return function(node) {
                acc.push(node.children[0].val);
                if(node.children.length < 4) {
                    exprList(node.children.slice(1), ", ");
                } else {
                    indent += 4;
                    acc.push(newline());
                    exprList(node.children.slice(1), "," + newline());
                    indent -= 4;
                    acc.push(newline());
                };
                acc.push(listEnd);
            };
        };
        var mPrefix = function(node) {
            acc.push(node.val);
            node.assert(node.children.length === 1, "prettyprint");
            ppPrio(node.children[0], node.bp);
        };
        var specialFn = {
            "function" : fBlock,
            "while" : fBlock,
            "var" : fPrefix,
            "return" : fPrefix,
            "throw" : fPrefix,
            "if" : ifelse,
            "{" : list("}"),
            "[" : list("]")
        };
        var mSubscript = function(node) {
            node.assert(node.children.length === 2, "subscript wrong length");
            pp(node.children[0]);
            acc.push("[");
            pp(node.children[1]);
            acc.push("]");
        };
        var specialMethod = {
            "++" : mPrefix,
            "--" : mPrefix,
            "!" : mPrefix,
            "~" : mPrefix,
            "`" : mPrefix,
            "@" : mPrefix,
            "#" : mPrefix,
            "[" : mSubscript
        };
        var pp = function(node) {
            node = use("syntax").tokenLookup(node);
            if(node.pp) {
                node.pp();
            } else if(node.kind === "string") {
                acc.push(JSON.stringify(node.val.slice(1,  - 1)));
                node.assert(node.children.length === 0, "prettyprinting, string with children");
            } else if(node.kind === "annotation" && node.val.slice(0, 2) === "/*") {
                acc.push(node.val);
                node.assert(node.children.length === 0, "prettyprinting, but has children");
            } else if(node.kind === "annotation" && node.val.slice(0, 2) === "//") {
                acc.push(node.val.slice(0,  - 1));
                node.assert(node.children.length === 0, "prettyprinting, but has children");
            } else if(node.kind === "number" || node.kind === "annotation") {
                acc.push(node.val);
                node.assert(node.children.length === 0, "prettyprinting, but has children");
            } else if(node.val === ";") {
            } else if(node.kind === "call") {
                if(node.val === "()") {
                    if(node.children[0].kind === "identifier" && specialFn[node.children[0].val]) {
                        specialFn[node.children[0].val](node);
                    } else {
                        pp(node.children[0]);
                        parenList(node.children.slice(1));
                    };
                } else {
                    if(specialMethod[node.val]) {
                        specialMethod[node.val](node);
                    } else {
                        pp(node.children[0]);
                        acc.push("." + node.val);
                        parenList(node.children.slice(1));
                    };
                };
            } else if(node.kind === "block") {
                acc.push("{");
                indent += 4;
                node.children.forEach(function(child) {
                    acc.push(newline());
                    pp(child);
                    if(child.kind !== "annotation") {
                        acc.push(";");
                    };
                });
                indent -= 4;
                acc.push(newline());
                acc.push("}");
            } else if(node.kind === "identifier") {
                acc.push(node.val);
            } else {
                node.error("cannot prettyprint");
                acc.push(node.kind + ":" + node.val + " ");
                node.children.forEach(function(child) {
                    use("syntax").tokenLookup(child).pp(acc, indent);
                });
            };
        };
        var ppPrio = function(node, prio) {
            if(node.bp && node.bp < prio) {
                acc.push("(");
            };
            pp(node);
            if(node.bp && node.bp < prio) {
                acc.push(")");
            };
        };
        exports.ppInfix = function() {
            if(this.children.length === 1) {
                acc.push(this.space + this.val + this.space);
                pp(this.children[0]);
            } else if(this.children.length === 2) {
                ppPrio(this.children[0], this.bp);
                acc.push(this.space + this.val + this.space);
                ppPrio(this.children[1], this.bp + 1 - this.dbp);
            } else {
                this.error("cannot prettyprint infix mus have 1 <= parameters <= 2");
            };
        };
        exports.prettyprint = function(obj) {
            acc = [];
            indent = 0;
            pp(obj);
            return acc.join("");
        };
    });
    // Syntax {{{2
    def("syntax", function(exports, module) {
        exports.errors = [];
        var extend = use("util").extend;
        var defaultToken = {
            nud : function() {
            },
            bp : 0,
            dbp : 0,
            space : " ",
            children : [],
            assert : function(ok, desc) {
                if(!ok) {
                    this.error(desc);
                };
            },
            error : function(desc) {
                exports.errors.push({
                    error : "syntax",
                    desc : desc,
                    token : this
                });
            }
        };
        var tokenLookup = exports.tokenLookup = function(orig) {
            var proto = symb[orig.kind] || symb[orig.val] || (orig.val && symb[orig.val[orig.val.length - 1]]) || defaultToken;
            return extend(Object.create(proto), orig);
        };
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
            this.children = [left, parse(this.bp - this.dbp)];
        };
        var infix = function(bp) {
            return extend(Object.create(defaultToken), {
                led : infixLed,
                pp : use("prettyprint").ppInfix,
                nud : nudPrefix,
                bp : bp
            });
        };
        var infixr = function(bp) {
            return extend(Object.create(defaultToken), {
                led : infixLed,
                nud : nudPrefix,
                pp : use("prettyprint").ppInfix,
                bp : bp,
                dbp : 1
            });
        };
        var rparen = function() {
            return extend(Object.create(defaultToken), {rparen : true, nud : function() {
                this.error("unmatched rparen");
            }});
        };
        var prefix = function() {
            return extend(Object.create(defaultToken), {nud : nudPrefix, bp : 1000});
        };
        var sep = function() {
            return extend(Object.create(defaultToken), {sep : true});
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
                        this.children = [left];
                        this.infix = true;
                        readList(this);
                    },
                    nud : function() {
                        this.children = [];
                        readList(this);
                    },
                    bp : bp
                });
            };
        };
        var symb = {
            "." : infix(1000),
            "[" : list("]")(1000),
            "]" : rparen(),
            "{" : list("}")(1000),
            "}" : rparen(),
            "(" : list(")")(1000),
            ")" : rparen(),
            "#" : prefix(),
            "@" : prefix(),
            "++" : prefix(),
            "--" : prefix(),
            "!" : prefix(),
            "~" : prefix(),
            "`" : prefix(),
            "return" : prefix(),
            "throw" : prefix(),
            "var" : prefix(),
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
            "else" : infixr(200),
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
            "comment" : sep(),
            "annotation" : sep()
        };
        symb["."].space = "";
        var token;
        var nextToken;
        var parse = function(rbp) {
            rbp = rbp || 0;
            var left;
            var t = token;
            nextToken();
            t.nud();
            left = t;
            while(rbp < token.bp && !t.sep) {
                t = token;
                nextToken();
                t.led(left);
                left = t;
            };
            return left;
        };
        exports.parse = function(tokens) {
            var pos = 0;
            nextToken = function() {
                token = tokenLookup(pos === tokens.length ? {kind : "eof", rparen : true} : tokens[pos]);
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
    });
    // Rst2Ast {{{2
    def("rst2ast", function(exports, module) {
        var trycatch = use("util").trycatch;
        var clearSep = function(sepVal, arr) {
            return arr.filter(function(elem) {
                return !(elem.sep && elem.val === sepVal);
            });
        };
        var rst2ast = function(ast) {
            return trycatch(function() {
                return rst2astUnsafe(ast);
            }, function(err) {
                ast.error("Could not do rst2ast transformation; " + err);
                return ast;
            });
        };
        var rst2astUnsafe = function(ast) {
            var children;
            var lhs;
            if(ast.infix) {
                if(ast.val === "(") {
                    lhs = ast.children[0];
                    if(lhs.infix && lhs.val === "." && lhs.children[1].kind === "identifier") {
                        children = clearSep(",", ast.children).map(rst2ast);
                        children[0] = lhs.children[0];
                        return {
                            pos : ast.pos,
                            kind : "call",
                            val : lhs.children[1].val,
                            children : children
                        };
                    };
                    return {
                        pos : ast.pos,
                        kind : "call",
                        val : "()",
                        children : clearSep(",", ast.children).map(rst2ast)
                    };
                };
                if(ast.val === "else") {
                    lhs = rst2ast(ast.children[0]);
                    if(ast.children[1].val === "{" && !ast.children[1].infix) {
                        lhs.children.push({
                            pos : ast.children[1].pos,
                            kind : "block",
                            val : "block",
                            children : clearSep(";", ast.children[1].children).map(rst2ast)
                        });
                    } else {
                        lhs.children.push(rst2ast(ast.children[1]));
                    };
                    return lhs;
                };
                if(ast.val === "{") {
                    lhs = rst2ast(ast.children[0]);
                    lhs.children.push({
                        pos : ast.pos,
                        kind : "block",
                        val : "block",
                        children : clearSep(";", ast.children).slice(1).map(rst2ast)
                    });
                    return lhs;
                };
            } else {
                if(ast.val === "(" && ast.children.length === 1) {
                    return rst2ast(ast.children[0]);
                };
                if(ast.val === "(" || ast.val === "{" || ast.val === "[") {
                    children = clearSep(",", ast.children).map(rst2ast);
                    children.unshift({
                        pos : ast.pos,
                        kind : "identifier",
                        val : ast.val,
                        children : []
                    });
                    return {
                        pos : ast.pos,
                        kind : "call",
                        val : "()",
                        children : children
                    };
                };
                if(ast.val === "var" || ast.val === "return" || ast.val === "throw") {
                    return {
                        pos : ast.pos,
                        kind : "call",
                        val : "()",
                        children : [{
                            pos : ast.pos,
                            kind : "identifier",
                            val : ast.val,
                            children : []
                        }, rst2ast(ast.children[0])]
                    };
                };
            };
            if(ast.kind === "comment") {
                ast.kind = "annotation";
            };
            if(ast.kind === "symbol") {
                ast.kind = "call";
            };
            ast.children = ast.children.map(rst2ast);
            return ast;
        };
        module.exports = rst2ast;
    });
});
// Main {{{1
def("main", function(exports, module) {
    var platform = use("util").platform;
    var commandName;
    if(platform === "node") {
        commandName = process.argv[2];
    };
    if(platform === "web") {
        commandName = window.location.hash.slice(1);
    };
    if(commandName && modules[commandName] && modules[commandName].main) {
        modules[commandName].main();
    };
});
// Server {{{1
def("server", function(exports, module) {
    if(use('util').platform === 'node') {
        exports.main = function() {
// # includes and initialisation {{{2
var express = require('express');
var mustache = require('mustache');
var fs = require('fs');
var logger = require('express-logger');
var sqlite3 = require('sqlite3');
var https = require('https');

var db = new sqlite3.Database(process.env.HOME + '/data/db.sqlite3');
db.run('CREATE TABLE IF NOT EXISTS userdata (store, key, val, timestamp, PRIMARY KEY (store, key))');

// # Pages from markdown {{{2
htmlTemplate = fs.readFileSync(__dirname + '/html.mustache', 'utf8');

var name2url = function(name) {
    return name.replace(RegExp('[^a-zA-Z0-9._~/\\[\\]@!$&\'()*+,;=-]', 'g'), 
        function(c) {
            var subs = {
                'Æ': 'AE',
                'Ø': 'O',
                'Å': 'AA',
                'æ': 'ae',
                'ø': 'o',
                'å': 'aa',
                'é': 'e',
                '?': '',
                ':': '',
                ' ': '_'
            };
            if(subs[c] === undefined) {
                return '_';
            } else {
                return subs[c];
            }

        });
}

var file2entries = function(filename) {
    var result = {};
    fs.readFileSync(filename, 'utf8')
        .split('\n# ').slice(1)
        .forEach(function(elem){
            var title = elem.split('\n')[0].trim();
            if(result[title]) {
                throw 'duplicate title in "' + filename + '": ' + title
            }
            result[title] = {
                title: title,
                url: name2url(title),
                html: require( "markdown" ).markdown.toHTML( '# ' + elem)
            };
         });
    return result;
}
var notes = file2entries(__dirname + '/notes.md');

// # Web content/server configuration {{{2
var configureApp = function(app) { 
    require('./public/theodorelias/genindex.js').gen(htmlTemplate);
    app.use(function (req, res, next) {
        res.removeHeader("X-Powered-By");
        next();
    });
    app.stack.unshift({route: '', handle: logger({path: process.env.HOME + '/data/httpd.log'})});
    app.use(express.bodyParser());
    
    Object.keys(notes).forEach(function(key) {
        app.get('/'+notes[key].url, function(req, res) {
            res.send(fixLinks(mustache.to_html(htmlTemplate, {
                title: key,
                body: notes[key].html
            })));
        });
    });
    
    
    var fixLinks = function(html) {
        return html.replace(RegExp('href="http(s?):\\/\\/([^"]*)', 'g'), function(_,s,url) { return 'href="/http' + s + '?' + url });
    }
    
    app.get('/githubLogin', function(req, res) {
        https.get({host: 'github.com', path: '/login/oauth/access_token?client_id=cc14f7f75ff01bdbb1e7&client_secret=d978cb4e2e1cdb35d4ae9e194b9c36fa0c2f607e&code=' + req.query.code + '&state=' + req.query.state},
            function(con) {
                con.on('data', function(data) {
                    res.send(req.query.callback + '("' + data + '");', {'Content-Type':'application/javascript'});
                });
            });
    
    });
    
    app.get('/store', storeHandle);
    app.post('/store', storeHandle);
    
    var storeHandle = function(req, res){
        console.log(req.query, req.body);
        var query = req.query || {};
        var body = req.body || {};
        var store = query.store|| body.store;
        var key = query.key || body.key;
        var newVal = query.val || body.val;
        var prevVal = query.prev || body.prev;
    
        if(!store) {
            return res.send('Parameters: store, key[, val, prev]\nReturns current store/key-value, or sets it if val+prev is set (prev must be the current value in the database and val the new one).', {'Content-Type':'text/plain'}, 400);
        }
        if(!key) {
            var result = [];
            db.all('SELECT key, timestamp FROM userdata WHERE store=$store;', {$store: store}, function(err, val) {
                if(err) {
                    return res.send(String(err), {'Content-Type':'text/plain'}, 500);
                }
                res.send(val, {'Content-Type':'text/plain'});
            });
            return;
        }
        db.get('SELECT * FROM userdata WHERE store=$store AND key=$key;', 
            {$store: store, $key: key},
            function(err, row) {
                if(err) {
                    return res.send(String(err), {'Content-Type':'text/plain'}, 500);
                }
                var val = row && row.val;
                if(newVal !== undefined) {
                    console.log({val: val, prevVal: prevVal});
                    if(prevVal != val) {
                        return res.send(val, {'Content-Type':'text/plain'}, 409);
                    }
                    return db.run('INSERT OR REPLACE INTO userdata VALUES ($store, $key, $val, $timestamp);',
                        {$store: store, $key: key, $val: newVal, $timestamp: Date.now()}, function(err) {
                            if(err) {
                                return res.send(String(err), {'Content-Type':'text/plain'}, 500);
                            }
                            res.send('ok', {'Content-Type':'text/plain'});
                        });
                }
    
                if(!row) {
                    return res.send('', {'Content-Type':'text/plain'}, 404);
                }
                res.send(val, {'Content-Type':'text/plain'});
            });
    };
    
    
    app.get('/', function(req, res){
        fs.readFile(__dirname + '/index.html.mustache', 'utf8', function(err, frontpage) {
            res.send(fixLinks(
                mustache.to_html(frontpage, {
                    notes: Object.keys(notes).map(function(noteName) {
                        var title = notes[noteName].title;
                        return '<a class="solsortBtn" href="/' + notes[noteName].url + '">' + title.replace(/:/g, ':<br/>') + '</a>';
                    }).join('')
                })
            ));
        });
    });
    
    app.get('/te_fodsel', function(req, res) {
        res.redirect('/theodorelias/?fodsel');
    });

    app.get('/skolevangen', function(req, res) {
        res.redirect('https://www.facebook.com/groups/520346057991618');
    });
    
    app.get('/http', function(req, res) {
        res.redirect('http://' + req.originalUrl.slice(6));
    });
    
    app.get('/https', function(req, res) {
        res.redirect('https://' + req.originalUrl.slice(7));
    });
    
    app.get('*', express.static(__dirname + '/public'));
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
}

// # Setup the servers {{{2
//
exports.expressCreateServer = function(hook_name, args, callback) {
    var app = args.app;
    app.routes.routes.get = app.routes.routes.get.filter(function(route) {
        return ['/', '/favicon.ico', '/robots.txt'].indexOf(route.path) === -1;
    });
    configureApp(app);
    //console.log(require('util').inspect(app, false, 6));
    callback();
}


/*
if(!process.env.PORT) {
    https.createServer({
            key: fs.readFileSync('/root/ssl-keys/server.key', 'ascii'),
            cert: fs.readFileSync('/root/ssl-keys/server.crt', 'ascii')
        }, app).listen(443);
}
*/
} } });
