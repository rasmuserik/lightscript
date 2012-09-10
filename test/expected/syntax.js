// Util {{{1
var extend = function(a, b) {
    Object.keys(b).forEach(function(key) {
        a[key] = b[key];
    });
    return a;
};
// Pretty print {{{1
var ppInfix;
!function() {
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
        pp(node.children[0]);
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
        node = tokenLookup(node);
        if(node.pp) {
            node.pp();
        } else if(node.kind === "string") {
            acc.push(JSON.stringify(node.val.slice(1,  - 1)));
            node.assert(node.children.length === 0, "prettyprinting, string with children");
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
            node.syntaxError("cannot prettyprint");
            acc.push(node.kind + ":" + node.val + " ");
            node.children.forEach(function(child) {
                tokenLookup(child).pp(acc, indent);
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
    ppInfix = function() {
        if(this.children.length === 1) {
            acc.push(this.space + this.val + this.space);
            pp(this.children[0]);
        } else if(this.children.length === 2) {
            ppPrio(this.children[0], this.bp);
            acc.push(this.space + this.val + this.space);
            ppPrio(this.children[1], this.bp + 1 - this.dbp);
        } else {
            this.syntaxError("cannot prettyprint infix mus have 1 <= parameters <= 2");
        };
    };
    exports.prettyprint = function(obj) {
        acc = [];
        indent = 0;
        pp(obj);
        return acc.join("");
    };
}();
// Symbol/token lookup/construction {{{1
var defaultToken = {
    nud : function() {
    },
    bp : 0,
    dbp : 0,
    space : " ",
    children : [],
    assert : function(ok, desc) {
        if(!ok) {
            this.syntaxError(desc);
        };
    },
    syntaxError : function(desc) {
        console.log({
            error : "syntax",
            desc : desc,
            token : this
        });
    }
};
var objectPropertyToken = {
    constructor : defaultToken,
    valueOf : defaultToken,
    toString : defaultToken,
    toLocaleString : defaultToken,
    hasOwnProperty : defaultToken,
    isPrototypeOf : defaultToken,
    propertyIsEnumerable : defaultToken
};
var tokenLookup = function(orig) {
    var proto = objectPropertyToken[orig.val] || symb[orig.val] || (orig.val && symb[orig.val[orig.val.length - 1]]) || defaultToken;
    return extend(Object.create(proto), orig);
};
// Syntax {{{1
var nudPrefix = function() {
    this.children = [parse()];
};
var infixLed = function(left) {
    this.infix = true;
    this.children = [left, parse(this.bp - this.dbp)];
};
var infix = function(bp) {
    return extend(Object.create(defaultToken), {
        led : infixLed,
        pp : ppInfix,
        nud : nudPrefix,
        bp : bp
    });
};
var infixr = function(bp) {
    return extend(Object.create(defaultToken), {
        led : infixLed,
        nud : nudPrefix,
        pp : ppInfix,
        bp : bp,
        dbp : 1
    });
};
var rparen = function() {
    return extend(Object.create(defaultToken), {rparen : true, nud : function() {
        this.syntaxError("unmatched rparen");
    }});
};
var prefix = function() {
    return extend(Object.create(defaultToken), {nud : nudPrefix});
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
            obj.syntaxError("Paren mismatch begin");
            token.syntaxError("Paren mismatch end");
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
// Symbol definition table {{{1
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
    ";" : sep()
};
symb["."].space = "";
// Parser {{{1
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
1 + 2 * (3 + 4) * 5 * (6 * 7) * 8 - 2 - (3 - 5);
1 || 2 || (3 || 4) || 5;
