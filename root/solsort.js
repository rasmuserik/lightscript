var gendoc;
var renderPost;
var loadPosts;
var markdown2html;
var posts;
var cachedRead;
var circles;
var renderEntry;
var index;
var uccorgDashboard;
var getWebuntisData;
var call;
var appSeq;
var route;
var _routes;
var defaultStyle;
var styleToText;
var jsName2CssName;
var xmlEscape;
var xmlEntitiesReverse;
var xmlEntities;
var jsonml2XmlAcc;
var jsonml2xml;
var xml2jsonml;
var logObject;
var log;
var xhrPost;
var savefile;
var loadCacheFile;
var loadfile;
var mtime;
var serverPID;
var socket;
var loadjs;
var _jsCache;
var urlGet;
var deepExtend;
var deepCopy;
var foreach;
var extendExcept;
var extend;
var isObject;
var normaliseString;
var sleep;
var memoiseAsync;
var memoise;
var id;
var binarySearchFn;
var pplist;
var asyncSeqMap;
var arraycopy;
var isClass;
var ast2js;
var ast2ls;
var ls2ast;
var thisTick;
var nextTick;
var trycatch;
var PID;
var newId;
var isBrowser;
var isNode;
var base64encode;
var base64dict;
var addTest;
var _testcases;
// {{{1 Personal language, scripts and content
//
// ![solsort](https://ssl.solsort.com/_logo.png) [![ci](https://secure.travis-ci.org/rasmuserik/lightscript.png)](http://travis-ci.org/rasmuserik/lightscript)
//
// Warning: this is a personal project, look at it on own risk. Not intended for other to work with (but feel free to peek at it nonetheless).
//
// This file contains
//
// - Utility library + platform abstraction
// - LightScript personal scripting language
// - solsort.com website
// - notes (textual content for the solsort.com website)
// - Applications
//
// and is written in the LightScript language itself, using a literate programming style.
// This text is both documentation and source code.
// 
// {{{1 Backlog
//
// - lightscript: clean partition into separate backends
// - lightscript: (){{{ }}} function syntax
// - improve test framework
// - debug server-crashes
// - solsort advanced index with circle-graph
//
// {{{1 System
// {{{2 addTest
_testcases = {};
addTest = function(name, fn) {
  _testcases[name] = fn;
};
// {{{2 base64 encode
base64dict = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
base64encode = function(buf) {
  var num;
  var result;
  var dict;
  var pos;
  var str;
  var buf;
  if(typeof buf === "string") {
    str = buf;
    buf = new Uint8Array(str.length);
    pos = 0;
    while(pos < str.length) {
      buf[pos] = str.charCodeAt(pos);
      pos = pos + 1;
    };
  };
  dict = dict || base64dict;
  pos = 0;
  result = "";
  while(pos < buf.length) {
    num = buf[pos];
    pos = pos + 1;
    num = num << 8;
    if(pos < buf.length) {
      num = num + buf[pos];
    };
    pos = pos + 1;
    num = num << 8;
    if(pos < buf.length) {
      num = num + buf[pos];
    };
    pos = pos + 1;
    result = result + (dict[num >> 18 & 63] + dict[num >> 12 & 63] + dict[num >> 6 & 63] + dict[num & 63]);
  };
  if(pos == buf.length + 1) {
    result = result.slice(0, - 1) + dict[64];
  };
  if(pos == buf.length + 2) {
    result = result.slice(0, - 2) + dict[64] + dict[64];
  };
  return result;
};
addTest("base64", function(test) {
  test.equals(base64encode("any carnal pleasure."), "YW55IGNhcm5hbCBwbGVhc3VyZS4=");
  test.equals(base64encode("any carnal pleasure"), "YW55IGNhcm5hbCBwbGVhc3VyZQ==");
  test.equals(base64encode("any carnal pleasur"), "YW55IGNhcm5hbCBwbGVhc3Vy");
  test.done();
});
// platform {{{2
//
// We need to distinguish between the different platforms:
isNode = typeof process === "object" && typeof process["versions"] === "object" && typeof process["versions"]["node"] === "string";
isBrowser = typeof navigator === "object" && typeof navigator["userAgent"] === "string" && navigator["userAgent"].indexOf("Mozilla") !== - 1;
// {{{2 Identifier
newId = function() {
  var i;
  var buf;
  var len;
  len = 9;
  if(isNode) {
    buf = require("crypto").randomBytes(len);
  } else if(true) {
    buf = [];
    i = 0;
    while(i < len) {
      buf.push(Date.now() * Math.random() & 255);
      i = i + 1;
    };
  };
  return base64encode(buf);
};
PID = newId();
// {{{2 try-catch
// Implementation of try..catch as a library instead of a part of the language. 
// This also has the benefit that trycatch can be used in expressions:
trycatch = Function("return function trycatch(fn,handle){try{return fn();}catch(e){return handle(e);}}")();
// `nextTick` {{{2
// Optimised function on node.js can trivially be emulated in the browser.
//
if(isNode) {
  nextTick = process.nextTick;
};
if(isBrowser) {
  nextTick = function(fn) {
    setTimeout(fn, 0);
  };
};
// {{{2 thisTick
thisTick = function(fn) {
  fn();
};
// LightScript Language {{{1
ls2ast = ast2ls = ast2js = undefined;
nextTick(function() {
  var analyse;
  var uppercase;
  var astTransform;
  var astToRstPattern;
  var astToRstTransform;
  var astToJsTransform;
  var astToLsTransform;
  var rstToAstTransform;
  var matchReplace;
  var astToJs;
  var astToLs;
  var rstToAst;
  var noSeps;
  var addVars;
  var addCommas;
  var table;
  var notepp;
  var strpp;
  var listpp;
  var parse;
  var parseExpr;
  var nextToken;
  var token;
  var readList;
  var tokenise;
  var notSep;
  // {{{2 Notes
  //
  // LightScript is a programming language designed for easy program transformation.
  //
  // Code in the language maps to a simple AST, which contains both code and comments. 
  // Then there is a reverse mapping that generate a canonical source code from the AST.
  // This means that it is possible to edit source code, and apply transformations to the AST interchangeably.
  //
  // Currently it is just a JavaScript dialect (with inferred `var`-statements), 
  // but it is intended to target other languages later on. (First Java, then C/llvm, and then maybe PHP or python).
  //
  // Language design criterias are
  // - KISS - Keep It Simple
  // - Friendly abstract syntax tree.
  // - Minimal abstraction of host language.
  // - Bijective mapping between AST and prettyprinted source.
  //
  // {{{3 Roadmap / cross-platform notes
  //
  // The long time goal/requirements is
  // - treat code as data, staged computation, ...
  // - reusable code across different platforms: JavaScript, Java, C, (Python, PHP, .net, ...).
  // - closures, first class functions, types, extensible syntax(operator overloading etc.) ...
  //
  // - Types
  //     - Dictionary (ie. Java Hashmap, Python Dict, JavaScript Object, ....)
  //     - Array (ie. Java Vector, Python Array, JavaScript Object, ...)
  //     - Number (ie. Java double/int-number-wrapper, python number, JavaScript Number, ...)
  //     - Function (ie. Java custom class, Python function w default value, js function, ...)
  //     - Class (ie. Java Class, Python class, JavaScript prototype object, ...)
  //     - ( Tuple (ie. Java Object Array, Python tuple, JavaScript array, ...) )
  //     - ( Integral types (int, byte, ...) )
  //     - ( range/yield )
  // - Library
  //     - file (filesystem)
  //     - net (a la socket.io, ...)
  //     - storage (key-value-store via levelup)
  //     - system (fork, webworker/cluster/..., ...)
  //     - http(s)-client+server
  //     - uuid
  //     - Math
  //     - RegExp
  // - Platforms
  //     - prettyprint
  //     - Java source
  //     - JavaScript
  //     - C(llvm)
  //     - Python
  //     - PHP
  // - Language (restrictions from JavaScript, in initial version, waiting for other targets + macro system)
  //     - distinction between `foo.bar` as prototype-access (static), and `foo["bar"]` as dictionary/array-access.
  //     - class-patterns: `X = function(...}; X.prototype.foo = function...` is method definition and only allowed place for `this`. `X` must be static.
  //     - only `"` for strings, `'` is going to be used for quote later on.
  //     - control-structures: if-else, while, `&&`, `||`
  //     - `return` only allowed in function-top-scope (to be implemented generally later OR be functional-like return last val)
  // - AST (`kind`, `val`, `children`, `type`, `pos`)
  //     - `kind`: `id`, `str`, `note`, `num`, `call`, `fn`, `control`, `assign`, (`quote`, `unquote`)
  //     - fn: `val` is number of parameters, `children` contains parameters, then body
  //     - note: `val` is note/comment-string, `children` is node the note concerns
  //     - control: `|| p v`, `&& p v`, `?: p v v`, `if-else (p v)* v?`, `if-body v*` only in if-else-children, `while p v*`
  //     - assign: `val` is id as in id, child is value to assign
  //     - (unquote: val is optional compiletime result as json)
  // 
  // Intended Features:
  // - C-family syntax, generalised
  // - Easy to transform Abstract Syntax Tree
  // - Reversable macros 
  // - staged programming
  // - Mapping from AST back to source code
  // - Stong static typing, including a var/Any type (dynamic a la JavaScript values)
  // - Highly portable, with different backends / packaging
  // - Good integration with host-language (javascript/java/c/...)
  // 
  // Intended backends / packaging:
  // - JavaScript (with codemaps, via mozilla-AST)
  //     - node-server
  //     - html5-app
  //     - (NB: mozilla ignite)
  //     - (note:http://developers.facebook.com/html5/distribution/?_fb_noscript=1 http://5apps.com)
  //     - (firefox-plugin)
  //     - (phonegap-app)
  //     - (mozilla-marketplace)
  //     - (chrome-plugin)
  //     - (chrome-app)
  //     - (facebook-app)
  // - Java
  //     - android
  //     - (application)
  //     - (gwt)
  //     - (servlet / google-appengine)
  //     - (j2me, nokia store, getjar)
  // - C
  //     - OS-X
  //     - (unix)
  //     - (TI-dev-board (embedded, limited to 64KB RAM))
  //     - (pebble)
  //     - (lego)
  //     - (arduino)
  //     - (iOS)
  //     - (symbian, nokia store)
  //     - (blackberry)
  // - (Python for scientific computing)
  // - (OpenCL for performance)
  // - (interpreted stack-language)
  // - (php - drupal module)
  // 
  // TODO: {{{3
  //
  // code analysis
  // java-backend
  // generalise tree matcher 
  // - transform functions between tree and arbitrary object
  // - match filter
  // refactor/cleanup, ie. id-function/filter/... in rst-ast-matcher
  //
  // Ast {{{2
  // Constructor {{{3
  //
  // Raw syntax tree - generic syntax, both used for parsing, and also for generating code for c-like languages.
  //
  // - `kind` required, kind of node: `str`, `note`, `num`, `id`/anything-else
  // - `val` required, data connected to the node, ie. identifier/symbol, string content, comment, or number value
  // - `pos` position in the source file of the node
  // - `children` required, array of child nodes
  //
  // Abstract syntax tree 
  //
  // - `kind`: `id`, `str`, `note`, `num`, `call`, `fn`, `branch`, `assign`, `block`
  // - `val`: method-name on `call`, number of args on `fn`, identifier-name on `assign`
  //   branch-vals:`cond`, `?:`, `while`, `throw`, `return`, `||`, `&&`
  // - `children`
  // - `pos`
  //
  Ast = function(kind, val, children, pos) {
    this.kind = kind;
    this.val = val || "";
    this.children = children || [];
    this.pos = pos;
    this.opt = {};
    this.parent = undefined;
  };
  // Ast.create {{{3
  Ast.prototype.create = function(kind, val, children) {
    return new Ast(kind, val, children, this.pos);
  };
  // Ast.isa {{{3
  Ast.prototype.isa = function(kind, val) {
    return this.kind === kind && this.val === val;
  };
  // Ast.deepCopy {{{3
  Ast.prototype.deepCopy = function() {
    return new Ast(this.kind, this.val, this.children.map(function(child) {
      return child.deepCopy();
    }), this.pos);
  };
  // Ast.toList {{{3
  Ast.prototype.toList = function() {
    var result;
    result = this.children.map(function(node) {
      return node.toList();
    });
    result.unshift(this.val);
    result.unshift(this.kind);
    return result;
  };
  // Ast.toString {{{3
  Ast.prototype.toString = function() {
    return pplist(this.toList());
  };
  // Ast.fromList {{{3
  Ast.prototype.fromList = function(list) {
    var result;
    var self;
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
  // Ast.error {{{3
  Ast.prototype.error = function(desc) {
    throw "Error: " + desc + " at pos: " + JSON.stringify(this.pos);
  };
  // notSep {{{3
  notSep = function(ast) {
    return ast.kind !== "id" || ast.val !== ";" && ast.val !== ",";
  };
  // Tokeniser {{{2
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
  tokenise = function(buffer, filename) {
    var currentToken;
    var tokens;
    var next;
    var newToken;
    var beginToken;
    var pop;
    var peek;
    var startsWith;
    var oneOf;
    var start;
    var bufferDescr;
    var newlinePos;
    var lineno;
    var pos;
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
      var delta;
      var n;
      n = n || 1;
      delta = delta || 0;
      return buffer.slice(pos + delta, pos + delta + n);
    };
    pop = function(n) {
      var result;
      var n;
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
      var quote;
      var result;
      var c;
      var s;
      var hexdigits;
      var digits;
      var ident;
      var joinedSymbol;
      var singleSymbol;
      var whitespace;
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
      } else if(oneOf(digits) || peek() === "." && digits.indexOf(peek(1, 1)) !== - 1) {
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
  // Syntax (parser and prettyprinter) {{{2
  // Syntax object {{{3
  SyntaxObj = function(ast) {
    var syntaxData;
    this.ast = ast;
    syntaxData = table[ast.kind + ":"] || table[ast.val] || ast.val && table[ast.val[ast.val.length - 1]] || table["default:"];
    this.bp = syntaxData[0] || 0;
    this.opt = syntaxData[1] || {};
  };
  // Parser {{{3
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
    var left;
    var t;
    var rbp;
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
    var result;
    var pos;
    pos = 0;
    nextToken = function() {
      var ast;
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
    var paren;
    var ast;
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
  // Prettyprinter {{{3
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
    var indent;
    if(!this.prevWasNewline) {
      indent = (indent || 0) + this.indent;
      this.str("\n");
      while(indent > 0) {
        this.str("  ");
        indent = indent - 1;
      };
      this.prevWasNewline = true;
    };
  };
  PrettyPrinter.prototype.str = function(str) {
    this.acc.push(str);
    this.prevWasNewline = false;
  };
  PrettyPrinter.prototype.pp = function(ast, bp, isLeft) {
    var syn;
    var bp;
    bp = bp || 0;
    syn = new SyntaxObj(ast);
    if(syn.bp && syn.bp < bp || isLeft && syn.opt["noinfix"] && syn.bp < bp) {
      this.str("(");
    };
    syn.pp(this);
    if(syn.bp && syn.bp < bp || isLeft && syn.opt["noinfix"] && syn.bp < bp) {
      this.str(")");
    };
  };
  listpp = function(isInfix, newlineLength, prefixSpace) {
    return function(obj, pp) {
      var space;
      var list;
      var ast;
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
    var space;
    var children;
    var ast;
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
      pp.pp(children[0], this.bp, true);
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
  // Syntax definition {{{3
  table = {
    "." : [1200, {nospace : true}],
    "[" : [1200, {pp : listpp(false, 10, ""), paren : "]"}],
    "*[]" : [1200, {pp : listpp(true, 10, "")}],
    "(" : [1200, {pp : listpp(false, 1, ""), paren : ")"}],
    "*()" : [1200, {pp : listpp(true, 20, "")}],
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
    "&" : [460],
    "^" : [430],
    "|" : [400],
    "&&" : [350],
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
  // Transformations of syntax tree (RST to/from AST) {{{2
  // Ast Matcher {{{3
  //
  // Pattern matching notes:
  //
  //     matcher = new Matcher();
  //     matcher.pattern(["id", "*{}", ["id", "*()", ["id:function"], "?a"], "??b"],  function(match) { ... });
  //     matcher.pattern(["id", "*{}", "?a"], function(match) { ... });
  //     matcher.pattern(["str", "?a"], function(match) { ... }); 
  //     matcher.pattern(["id", "?operator", "?lhs", "??rhs"]: function(match, ast) {
  //         return ast.create('call', match["operator"], [match["lhs"]].concat(match["rhs"]));
  //     }); 
  //     matcher.pattern(["id", "var", "?val"]: function(match, ast) {
  //          return match["val"];
  //     }); 
  //
  //     matcher.pattern(["id:=", ["id:.", ["id:.", ["id:?class"] [id:prototype]] ["id:?member"]] "?value"], function(match) {
  //     })
  //
  // matcher function
  //
  // parameter: match object with bound vars, and match.ast = full node, match.parent = parent node
  //
  // try most specific match first. If result is undefined, try next match
  //
  // MatcherPattern {{{4
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
    var i;
    if(this.anyVal) {
      matchResult.capture(this.anyVal, ast);
    } else if(this.str !== undefined) {
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
  // MatchResult {{{4
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
  // MatchEntry {{{4
  MatchEntry = function(pattern, fn) {
    this.pattern = new MatcherPattern(pattern);
    this.fn = fn;
  };
  // Matcher {{{4
  Matcher = function() {
    this.table = {};
  };
  Matcher.prototype.pattern = function(pattern, fn) {
    var matchers;
    this.table[pattern[0]] = matchers = this.table[pattern[0]] || [];
    matchers.push(new MatchEntry(pattern, fn));
  };
  Matcher.prototype.match = function(ast) {
    var matchers;
    var result;
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
    var self;
    self = this;
    ast.children.map(function(child) {
      self.recursiveWalk(child);
    });
    this.match(ast);
  };
  Matcher.prototype.recursivePreTransform = function(ast) {
    var self;
    var ast;
    self = this;
    ast = this.match(ast) || ast;
    return ast.create(ast.kind, ast.val, ast.children.map(function(child) {
      return self.recursivePreTransform(child);
    }));
  };
  Matcher.prototype.recursivePostTransform = function(ast) {
    var t;
    var self;
    self = this;
    t = ast.create(ast.kind, ast.val, ast.children.map(function(child) {
      return self.recursivePostTransform(child);
    }));
    return this.match(t) || t;
  };
  // Transformation library and matcher instantations{{{3
  // Add commas and semicolons {{{4
  addCommas = function(ast) {
    var lastchild;
    var children;
    var addlast;
    var skipfirst;
    var sep;
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
  // Add var definitions {{{4
  addVars = function(ast) {
    var vars;
    ast.children = ast.children.map(addVars);
    if(ast.kind === "fn") {
      vars = ast.opt["vars"];
      if(!vars) {
        ast.error("Trying to add var statements to function with out var-analysis data");
      };
      Object.keys(vars).forEach(function(id) {
        if(!vars[id]["parent"] && vars[id]["assign"]) {
          ast.children[1].children.unshift(ast.fromList(["call", "var", ["id", id]]));
        };
      });
    };
    return ast;
  };
  //{{{4 noSeps utility function for filtering away separators from lists 
  noSeps = function(list) {
    return list.filter(notSep);
  };
  //{{{4 Definition of matchers: rstToAst, astToLs and astToJs
  rstToAst = new Matcher();
  astToLs = new Matcher();
  astToJs = new Matcher();
  //{{{4 structural transformations via matchReplace, and -To-Transform
  //{{{5 matchReplace
  matchReplace = function(match, elem, filter) {
    var result;
    var tail;
    var filter;
    var elem;
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
  //{{{5 rstToAstTransform
  rstToAstTransform = function(from, to, filter) {
    var filter;
    filter = filter || noSeps;
    rstToAst.pattern(from, function(match, ast) {
      return ast.fromList(matchReplace(match, to, filter));
    });
  };
  //{{{5 astToLsTransform
  astToLsTransform = function(from, to, filter) {
    astToLs.pattern(from, function(match, ast) {
      return ast.fromList(matchReplace(match, to, filter));
    });
  };
  //{{{5 astToJsTransform
  astToJsTransform = function(from, to, filter) {
    astToJs.pattern(from, function(match, ast) {
      return ast.fromList(matchReplace(match, to, filter));
    });
  };
  //{{{4 shorthands for defining patterns/transforms on both JS and LS
  astToRstTransform = function(from, to, filter) {
    astToJsTransform(from, to, filter);
    astToLsTransform(from, to, filter);
  };
  astToRstPattern = function(pattern, fn) {
    astToJs.pattern(pattern, fn);
    astToLs.pattern(pattern, fn);
  };
  astTransform = function(from, to, opts) {
    rstToAstTransform(from, to);
    astToRstTransform(to, from);
  };
  //{{{3 LightScript transformations
  // Drop parenthesis in ast
  rstToAstTransform(["id", "(", "?val"], "?val");
  // Function definitions, possibly switch to other syntax
  rstToAstTransform(["call", "*{}", ["call", "*()", ["id", "function"], "??args"], "??body"], ["fn", "", ["block", "", "??args"], ["block", "", "??body"]]);
  rstToAstTransform(["call", "*{}", ["call", "*()", ["id", "fn"], "??args"], "??body"], ["fn", "", ["block", "", "??args"], ["block", "", "??body"]]);
  astToLsTransform(["fn", "", ["block", "", "??args"], ["block", "", "??body"]], ["call", "*{}", ["call", "*()", ["id", "function"], "??args"], "??body"]);
  //{{{4 ++ += -- -= *=  transformed to binop + assignment
  rstToAst.pattern(["call", "*=", "?target", "?val"], function(match, ast) {
    return rstToAst.match(ast.fromList(matchReplace(match, ["call", "=", "?target", ["call", "*", "?target", "?val"]])));
  });
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
  //{{{3 JavaScript transform
  astToJsTransform(["fn", "", ["block", "", "??args"], ["block", "", "??body"]], ["call", "*{}", ["call", "*()", ["id", "function"], "??args"], "??body"]);
  astToJsTransform(["call", "var", "?result"], ["call", "var", "?result"]);
  //{{{3 Common transformations for Js and Ls
  //{{{4 control flow
  astTransform(["call", "||", "?p1", "?p2"], ["branch", "||", "?p1", "?p2"]);
  astTransform(["call", "&&", "?p1", "?p2"], ["branch", "&&", "?p1", "?p2"]);
  astTransform(["call", "return", "?result"], ["branch", "return", "?result"]);
  astTransform(["call", "*{}", ["call", "*()", ["id", "while"], "?cond"], "??body"], ["branch", "for", ["block", ""], "?cond", ["block", "", "??body"]]);
  // should throw be a branch, or just a special function call?...
  astTransform(["call", "throw", "?result"], ["branch", "throw", "?result"]);
  //{{{4 subscripting and assignment
  astTransform(["call", "=", ["call", "*[]", "?obj", "?idx"], "?val"], ["call", "*[]=", "?obj", "?idx", "?val"]);
  astTransform(["call", "=", ["call", ".", "?obj", "?member"], "?val"], ["call", ".=", "?obj", "?member", "?val"]);
  astTransform(["call", "=", ["id", "?name"], "?val"], ["assign", "?name", "?val"]);
  astTransform(["call", ".", "?obj", ["id", "?id"]], ["call", ".", "?obj", ["str", "?id"]]);
  //{{{4 functions, and function/method-application
  astTransform(["call", "*()", "??args"], ["call", "*()", "??args"]);
  rstToAstTransform(["call", "*()", ["call", ".", "?obj", ["str", "?method"]], "??args"], ["call", "?method", "?obj", "??args"]);
  astToRstPattern(["call", "?method", "?obj", "??args"], function(match, ast) {
    var result;
    var prio;
    prio = (table[match["method"]] || [])[0];
    // if it has a priority in the table, it means that it is an infix JS operator, and not an ordinary method call, so for now, just emit it as an infix operator. On long term we should take type into consideration.
    if(prio) {
      // returning undefined means no transformation done.
      result = undefined;
    } else if(true) {
      result = ast.fromList(matchReplace(match, ["call", "*()", ["call", ".", "?obj", ["id", "?method"]], "??args"], noSeps));
    };
    return result;
  });
  //{{{4 builtin special "functions"
  astTransform(["call", "typeof", "?result"], ["call", "typeof", "?result"]);
  astTransform(["call", "new", ["call", "*()", "?class", "??args"]], ["call", "new", "?class", "??args"]);
  //{{{4 Array Literals
  rstToAstTransform(["id", "[", "??elems"], ["call", "new", ["id", "Vector"], "??elems"]);
  astToRstPattern(["call", "new", ["id", "Vector"], "??elems"], function(match, ast) {
    var elems;
    elems = [];
    match["elems"].forEach(function(elem) {
      elems.push(elem);
    });
    return ast.fromList(["id", "["].concat(elems));
  });
  //{{{4 Object Literals
  rstToAst.pattern(["id", "{", "??elems"], function(match, ast) {
    var result;
    var args;
    var ok;
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
  astToRstPattern(["call", "new", ["id", "HashMap"], "??elems"], function(match, ast) {
    var i;
    var elems;
    var list;
    list = [];
    elems = match["elems"];
    i = 0;
    while(i < elems.length) {
      list.push(["call", ":", elems[i], elems[i + 1]]);
      i = i + 2;
    };
    return ast.fromList(["id", "{"].concat(list));
  });
  // If-else {{{4
  rstToAst.pattern(["call", "*{}", ["call", "*()", ["id", "if"], "?p"], "??body"], function(match, ast) {
    return ast.fromList(["branch", "cond", match["p"], ["block", ""].concat(match["body"].filter(notSep))]);
  });
  rstToAst.pattern(["call", "else", ["branch", "cond", "??cond1"], ["branch", "cond", "??cond2"]], function(match, ast) {
    return ast.fromList(["branch", "cond"].concat(match["cond1"]).concat(match["cond2"]));
  });
  rstToAst.pattern(["call", "else", ["branch", "cond", "??cond"], ["id", "{", "??body"]], function(match, ast) {
    return ast.fromList(["branch", "cond"].concat(match["cond"]).concat([["id", "true"], ["block", ""].concat(match["body"].filter(notSep))]));
  });
  astToRstPattern(["branch", "cond", "??branches"], function(match, ast) {
    var lhs;
    var rhs;
    var cond;
    var body;
    var branches;
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
  // Class {{{4
  astTransform(["call", "=", ["call", ".", ["call", ".", ["id", "?class"], ["str", "prototype"]], ["str", "?member"]], ["fn", "", ["block", "", "??args"], "?body"]], ["fn", "?member", ["block", "", ["call", ":", ["id", "this"], ["id", "?class"]], "??args"], "?body"]);
  uppercase = "QWERTYUIOPASDFGHJKLZXCVBNM";
  rstToAst.pattern(["call", "=", ["id", "?class"], ["fn", "", ["block", "", "??args"], "?body"]], function(match, ast) {
    var result;
    result = undefined;
    if(uppercase.indexOf(match["class"][0]) !== - 1) {
      result = ast.fromList(matchReplace(match, ["fn", "new", ["block", "", ["call", ":", ["id", "this"], ["id", "?class"]], "??args"], "?body"]));
    };
    return result;
  });
  astToRstTransform(["fn", "new", ["block", "", ["call", ":", ["id", "this"], ["id", "?class"]], "??args"], "?body"], ["call", "=", ["id", "?class"], ["fn", "", ["block", "", "??args"], "?body"]]);
  // Analysis {{{2
  analyse = function(node) {
    var subanalysis;
    var parentFn;
    var vars;
    var fns;
    // Accumulators {{{3
    fns = [];
    vars = {};
    node.opt["vars"] = vars;
    // arguments{{{3
    parentFn = node.opt["parentFn"];
    if(parentFn) {
      Object.keys(parentFn.opt.vars).forEach(function(id) {
        if(parentFn.opt.vars[id]["parent"] || parentFn.opt.vars[id]["assign"]) {
          vars[id] = {parent : true};
        };
      });
      node.children[0].children.forEach(function(id) {
        if(id.isa("call", ":")) {
          if(id.children[0].kind !== "id" || id.children[1].kind !== "id") {
            id.error("not typed id");
          };
          vars[id.children[0].val] = {arg : true, type : id.children[1].val};
        } else if(id.kind === "id") {
          vars[id.val] = {arg : true};
        } else if(true) {
          id.error("Analysis: id is not an \"id\"");
        };
      });
    };
    // Analyse subtree {{{3
    subanalysis = function(node) {
      node.children.forEach(function(child) {
        child.parent = node;
      });
      if(node.kind === "fn") {
        fns.push(node);
      } else if(true) {
        if(node.kind === "assign") {
          vars[node.val] = vars[node.val] || {};
          vars[node.val]["assign"] = true;
        } else if(node.kind === "id") {
          vars[node.val] = vars[node.val] || {};
          vars[node.val]["access"] = true;
        };
        node.children.forEach(function(child) {
          subanalysis(child);
        });
      };
    };
    subanalysis(node.children[1]);
    node.children[1].children.forEach(function(child) {
      subanalysis(child);
    });
    // Analyse subfunctions {{{3
    fns.forEach(function(childFn) {
      childFn.opt["parentFn"] = node;
      analyse(childFn);
    });
  };
  // API {{{2
  ls2ast = function(source) {
    var ast;
    var tokens;
    var source;
    source = "function(){" + source + "}";
    tokens = tokenise(source);
    ast = parse(tokens)[0];
    ast = rstToAst.recursivePostTransform(ast);
    return ast;
  };
  ast2js = function(ast) {
    var pp;
    var ast;
    ast = ast.deepCopy();
    analyse(ast);
    ast = addVars(ast);
    ast = astToJs.recursivePreTransform(ast);
    ast = addCommas(ast);
    pp = new PrettyPrinter();
    pp.pp(ast);
    return pp.acc.join("").split("\n").slice(1, - 1).join("\n") + "\n";
  };
  ast2ls = function(ast) {
    var result;
    var pp;
    var ast;
    ast = ast.deepCopy();
    ast = astToLs.recursivePreTransform(ast);
    ast = addCommas(ast);
    pp = new PrettyPrinter();
    pp.pp(ast);
    result = pp.acc.join("").split("\n").slice(1, - 1).join("\n") + "\n";
    return result;
  };
});
// Utility library {{{1
// {{{2 Class
isClass = function(obj, cls) {
  return typeof obj === "object" && obj.constructor === cls;
};
// Array utilities {{{2
// `arraycopy` {{{3
// Sometimes we need to create a new array, from something arraylike. Especially for turning `arguments` into a real array.
arraycopy = function(arr) {
  return Array.prototype.slice.call(arr, 0);
};
//{{{3 asyncSeqMap
asyncSeqMap = function(arr, fn, cb) {
  var handleEntry;
  var acc;
  var i;
  i = 0;
  acc = [];
  handleEntry = function() {
    if(i >= arr.length) {
      cb(undefined, acc);
    } else if(true) {
      fn(arr[i], function(err, data) {
        acc.push(data);
        if(err) {
          cb(err, acc);
        } else if(true) {
          i = i + 1;
          handleEntry();
        };
      });
    };
  };
  handleEntry();
};
// List prettyprinter{{{3
//
// Show a list with neat linebreakins, - this is especially useful for dumping the listified abstract syntax tree.
//
pplist = function(list, indent) {
  var len;
  var result;
  var indent;
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
  if(result[1] !== undefined) {
    result[1] = result[0] + " " + JSON.stringify(result[1]).slice(1, - 1);
    result.shift();
  };
  if(len < 72) {
    return "[" + result.join(" ") + "]";
  } else if(true) {
    return "[" + result.join("\n" + indent) + "]";
  };
};
//{{{3 binary search
binarySearchFn = function(array, cmp) {
  var result;
  var mid;
  var end;
  var start;
  start = 0;
  end = array.length;
  while(start < end) {
    mid = start + end >> 1;
    result = cmp(array[mid]);
    if(result < 0) {
      start = mid + 1;
    } else if(true) {
      end = mid;
    };
  };
  return start;
};
addTest("binarySearchFn", function(test) {
  var cmp;
  var arr;
  arr = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9
  ];
  cmp = function(a) {
    return function(b) {
      return b - a;
    };
  };
  test.equals(binarySearchFn(arr, cmp(- 1)), 0);
  test.equals(binarySearchFn(arr, cmp(10)), 10);
  test.equals(binarySearchFn(arr, cmp(5)), 5);
  test.equals(binarySearchFn(arr, cmp(3)), 3);
  test.done();
});
//
// Function utilities {{{2
// `id` {{{3
// The identity function is sometimes neat to have around.
//
id = function(x) {
  return x;
};
//
// `memoise` {{{3
// Being able to memoise a function, can be very useful for performance, and also easy caching of data into memory.
//
memoise = function(fn) {
  var cache;
  cache = {};
  return function() {
    var args;
    args = arraycopy(arguments);
    return cache[args] || (cache[args] = fn.apply(this, args));
  };
};
// memoiseAsync
memoiseAsync = function(fn) {
  var cache;
  cache = {};
  return function() {
    var callback;
    var argsKey;
    var args;
    args = arraycopy(arguments);
    argsKey = String(args.slice(- 1));
    callback = args[args.length - 1];
    if(cache[argsKey] !== undefined) {
      callback(null, cache[argsKey]);
    } else if(true) {
      args[args.length - 1] = function(err, result) {
        if(!err) {
          cache[argsKey] = result;
        };
        callback(err, result);
      };
      fn.apply(this, args);
    };
  };
};
//
// `sleep` {{{3
// - a more readable version of setTimeout, with reversed parameters, and time in seconds instead of milliseconds.
//
sleep = function(s, fn) {
  return setTimeout(fn, s * 1000);
};
//
// String utilities {{{2
// `normaliseString` {{{3
// We need to cleanup and canonise strings, if they should be used in urls.
normaliseString = function(str) {
  return String(str).toLowerCase().replace("æ", "ae").replace("ø", "o").replace("å", "aa").replace(RegExp("[^a-zA-Z0-9_]+", "g"), "-");
};
// Object utilities {{{2
// {{{3 isObject
isObject = function(obj) {
  return isClass(obj, Object);
};
// extend(dst, src) {{{3
extend = function(dst, src) {
  Object.keys(src).forEach(function(key) {
    dst[key] = src[key];
  });
  return dst;
};
// extendExcept(dst, src, ignore) {{{3
extendExcept = function(dst, src, except) {
  Object.keys(src).forEach(function(key) {
    if(!except[key]) {
      dst[key] = src[key];
    };
  });
  return dst;
};
// foreach {{{3
foreach = function(obj, fn) {
  Object.keys(obj).forEach(function(key) {
    fn(key, obj[key]);
  });
};
//{{{3 deepCopy
deepCopy = function(obj) {
  var result;
  if(isObject(obj)) {
    result = {};
    foreach(obj, function(key, val) {
      result[key] = deepCopy(val);
    });
  } else if(Array.isArray(obj)) {
    result = [];
    obj.forEach(function(elem) {
      result.push(deepCopy(elem));
    });
  } else if(typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean" || typeof obj === "undefined") {
    result = obj;
  } else if(true) {
    throw "unexpected type in deepcopy";
  };
  return result;
};
//{{{deepExtend 
deepExtend = function(dst, src) {
  Object.keys(src).forEach(function(key) {
    if(isObject(src[key])) {
      if(!isObject(dst[key])) {
        dst[key] = {};
      };
      deepExtend(dst[key], src[key]);
    } else if(true) {
      dst[key] = src[key];
    };
  });
  return dst;
};
// I/O {{{2
// urlGet
if(isNode) {
  //TODO: more features + portability
  urlGet = function(req, cb) {
    require("request")(req, cb);
  };
};
// {{{3 loadjs 
_jsCache = {};
loadjs = function(modulename, callback) {
  if(_jsCache[modulename]) {
    return callback(null, _jsCache[modulename]);
  };
  loadfile("/" + modulename + ".js", function(err, src) {
    var result;
    var fn;
    if(err) {
      throw err;
    };
    fn = new Function("exports", src);
    result = {};
    fn(result);
    _jsCache[modulename] = result;
    callback(null, result);
  });
};
// {{{3 socket.io
if(isNode) {
  socket = require("socket.io-client").connect("http://localhost:9999");
} else if(true) {
  /*socket = window.io.connect(location.hostname === "localhost" ? "/" : "//ssl.solsort.com/");*/
  socket = window.io.connect("/");
  serverPID = undefined;
  socket.on("serverPID", function(pid) {
    if(serverPID && serverPID !== pid) {
      location.reload();
    };
    serverPID = pid;
  });
};
// mtime {{{3
if(isNode) {
  mtime = function(fname) {
    return trycatch(function() {
      return require("fs").statSync(__dirname + fname).mtime.getTime();
    }, function(err) {
      return 0;
    });
  };
};
// loadfile {{{3
loadfile = function(filename, callback) {
  var xhr;
  if(isNode) {
    require("fs").readFile(__dirname + filename, "utf8", callback);
  };
  if(isBrowser) {
    //TODO: error handling
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4) {
        callback(null, xhr.responseText);
      };
    };
    xhr.open("GET", filename, true);
    xhr.send();
  };
};
// loadCacheFile
loadCacheFile = memoiseAsync(loadfile);
// savefile {{{3
savefile = function(filename, content, callback) {
  if(isNode) {
    require("fs").writeFile(__dirname + filename, content, callback);
  };
  if(isBrowser) {
    console.log("savefile", filename, content);
    callback();
    throw "not implemented";
  };
};
// xhr post json object
xhrPost = function(url, obj, done) {
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  if(done) {
    xhr.onload = function() {
      done(null, this.responseText);
    };
  };
  xhr.send(Object.keys(obj).map(function(key) {
    return key + "=" + encodeURIComponent(JSON.stringify(obj[key]));
  }).join("&"));
};
// {{{2 Log writer
log = function() {
  logObject({
    log : arraycopy(arguments),
    type : "nodejs",
    pid : PID
  });
};
logObject = undefined;
if(isNode) {
  thisTick(function() {
    var logStringToFile;
    var writeStream;
    var fname;
    var logDir;
    var writeLog;
    var prevTime;
    var child_process;
    var fs;
    var startLogServer;
    var connection;
    var isServer;
    var net;
    net = require("net");
    isServer = false;
    connection = undefined;
    //
    // log server
    startLogServer = function() {
      var server;
      isServer = true;
      server = net.createServer(function(con) {
        var str;
        str = "";
        con.on("data", function(chunk) {
          var arr;
          str = str + chunk;
          arr = str.split("\n");
          arr.slice(0, - 1).forEach(logStringToFile);
          str = arr[arr.length - 1];
        });
        con.on("end", function() {
          if(str.trim()) {
            logStringToFile(str);
          };
        });
      });
      server.listen(7096);
    };
    //
    // log function
    logObject = function(obj) {
      obj.date = Date.now();
      obj.pid = PID;
      console.log((obj.log || []).map(function(elem) {
        if(typeof elem === "string") {
          return elem;
        } else if(true) {
          return JSON.stringify(elem);
        };
      }).join(" "));
      //
      // send to log server
      if(!isServer && connection === undefined) {
        connection = net.createConnection(7096);
        connection.on("end", function() {
          connection = undefined;
        });
        connection.on("error", function() {
          startLogServer();
          connection = undefined;
        });
      };
      if(isServer) {
        logStringToFile(JSON.stringify(obj));
      } else if(true) {
        connection.write(JSON.stringify(obj) + "\n");
      };
    };
    //
    // log writer
    fs = require("fs");
    child_process = require("child_process");
    prevTime = 0;
    writeLog = undefined;
    logDir = __dirname + "/../logs";
    fname = undefined;
    writeStream = undefined;
    if(!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    };
    logStringToFile = function(str) {
      var oldname;
      var name;
      var now;
      console.log("logging:", str);
      now = new Date();
      name = logDir + "/";
      name = name + (now.getUTCFullYear() + "-");
      name = name + (("" + (now.getUTCMonth() + 101)).slice(1) + "-");
      name = name + (("0" + now.getUTCDate()).slice(- 2) + ".log");
      if(fname !== name) {
        if(fname) {
          oldname = fname;
          writeStream.on("close", function() {
            child_process.exec("bzip2 " + oldname);
          });
          writeStream.end();
        };
        writeStream = fs.createWriteStream(name, {flags : "a"});
        fname = name;
      };
      writeStream.write(str + "\n");
    };
  });
} else if(true) {
  // TODO
  logObject = function(obj) {
    console.log(obj);
  };
};
// XML {{{2
// LsXml class {{{3
LsXml = function(obj) {
  if(typeof obj === "string") {
    this._jsonml = xml2jsonml(obj);
  } else if(Array.isArray(obj) && typeof obj[0] === "string") {
    this._jsonml = [obj];
  } else if(true) {
    this._jsonml = obj;
  };
  //this._jsonml.forEach(canoniseJsonml);
  };
LsXml.prototype.jsonml = function() {
  return this._jsonml;
};
LsXml.prototype.toString = function() {
  return this._jsonml.map(jsonml2xml).join("");
};
// {{{3 xml2jsonml
//
// Parse an XML-string.
// Actually this is not a full implementation, but just
// the basic parts to get it up running.
// Nonetheless it is Good Enough(tm) for most uses.
//
// Known deficiencies: CDATA is not supported, will accept even
// non-well-formed documents, <?... > <!... > are not really handled, ...
xml2jsonml = function(xml) {
  var parent_tag;
  var value_terminator;
  var attr;
  var has_attributes;
  var attributes;
  var newtag;
  var read_until;
  var is_a;
  var next_char;
  var tag;
  var stack;
  var pos;
  var c;
  var whitespace;
  if(typeof xml !== "string") {
    JsonML_Error("Error: jsonml.parseXML didn't receive a string as parameter");
  };
  // white space definition
  whitespace = " \n\r\t";
  // the current char in the string that is being parsed
  c = xml[0];
  // the position in the string
  pos = 0;
  // stack for handling nested tags
  stack = [];
  // current tag being parsed
  tag = [];
  // read the next char from the string
  next_char = function() {
    c = (pos = pos + 1) < xml.length ? xml[pos] : undefined;
  };
  // check if the current char is one of those in the string parameter
  is_a = function(str) {
    return str.indexOf(c) !== - 1;
  };
  // return the string from the current position to right before the first
  // occurence of any of symb. Translate escaped xml entities to their value
  // on the fly.
  read_until = function(symb) {
    var entity;
    var buffer;
    buffer = [];
    while(c && !is_a(symb)) {
      if(c === "&") {
        next_char();
        entity = read_until(";");
        if(entity[0] === "#") {
          if(entity[1] === "x") {
            c = String.fromCharCode(parseInt(entity.slice(2), 16));
          } else if(true) {
            c = String.fromCharCode(parseInt(entity.slice(1), 10));
          };
        } else if(true) {
          c = xmlEntities[entity];
          if(!c) {
            JsonML_Error("error: unrecognisable xml entity: " + entity);
          };
        };
      };
      buffer.push(c);
      next_char();
    };
    return buffer.join("");
  };
  // The actual parsing
  while(is_a(whitespace)) {
    next_char();
  };
  while(c) {
    if(is_a("<")) {
      next_char();
      // `<?xml ... >`, `<!-- -->` or similar - skip these
      if(is_a("?!")) {
        if(xml.slice(pos, pos + 3) === "!--") {
          pos = pos + 3;
          while(xml.slice(pos, pos + 2) !== "--") {
            pos = pos + 1;
          };
        };
        read_until(">");
        next_char();
        // `<sometag ...>` - handle begin tag
        } else if(!is_a("/")) {
        // read tag name
        newtag = [read_until(whitespace + ">/")];
        // read attributes
        attributes = {};
        has_attributes = 0;
        while(c && is_a(whitespace)) {
          next_char();
        };
        while(c && !is_a(">/")) {
          has_attributes = 1;
          attr = read_until(whitespace + "=>");
          if(c === "=") {
            next_char();
            value_terminator = whitespace + ">/";
            if(is_a("\"'")) {
              value_terminator = c;
              next_char();
            };
            attributes[attr] = read_until(value_terminator);
            if(is_a("\"'")) {
              next_char();
            };
          } else if(true) {
            JsonML_Error("something not attribute in tag");
          };
          while(c && is_a(whitespace)) {
            next_char();
          };
        };
        if(has_attributes) {
          newtag.push(attributes);
        };
        // end of tag, is it `<.../>` or `<...>`
        if(is_a("/")) {
          next_char();
          if(!is_a(">")) {
            JsonML_Error("expected \">\" after \"/\" within tag");
          };
          tag.push(newtag);
        } else if(true) {
          stack.push(tag);
          tag = newtag;
        };
        next_char();
        // `</something>` - handle end tag
        } else if(true) {
        next_char();
        if(read_until(">") !== tag[0]) {
          JsonML_Error("end tag not matching: " + tag[0]);
        };
        next_char();
        parent_tag = stack.pop();
        if(tag.length <= 2 && !Array.isArray(tag[1]) && typeof tag[1] !== "string") {
          tag.push("");
        };
        parent_tag.push(tag);
        tag = parent_tag;
      };
      // actual content / data between tags
      } else if(true) {
      tag.push(read_until("<"));
    };
  };
  return tag;
};
// {{{3 jsonml2xml
jsonml2xml = function(jsonml) {
  var acc;
  acc = [];
  jsonml2XmlAcc(jsonml, acc);
  return acc.join("");
};
// The actual implementation. As the XML-string is built by appending to the
// `acc`umulator.
jsonml2XmlAcc = function(jsonml, acc) {
  var attributes;
  var pos;
  if(Array.isArray(jsonml)) {
    acc.push("<");
    acc.push(jsonml[0]);
    pos = 1;
    attributes = jsonml[1];
    if(attributes && !Array.isArray(attributes) && typeof attributes !== "string") {
      Object.keys(attributes).forEach(function(key) {
        acc.push(" ");
        acc.push(key);
        acc.push("=\"");
        acc.push(xmlEscape(attributes[key]));
        acc.push("\"");
      });
      pos = pos + 1;
    };
    if(pos < jsonml.length) {
      acc.push(">");
      while(pos < jsonml.length) {
        jsonml2XmlAcc(jsonml[pos], acc);
        pos = pos + 1;
      };
      acc.push("</");
      acc.push(jsonml[0]);
      acc.push(">");
    } else if(true) {
      acc.push(" />");
    };
  } else if(true) {
    acc.push(xmlEscape(String(jsonml)));
  };
};
// {{{3 xmlEntities XML escaped entity table
xmlEntities = {
  quot : "\"",
  amp : "&",
  apos : "'",
  lt : "<",
  gt : ">"
};
// {{{3 xmlEntitiesReverse
// Generate a reverse xml entity table.
xmlEntitiesReverse = function() {
  var result;
  result = {};
  Object.keys(xmlEntities).forEach(function(key) {
    result[xmlEntities[key]] = key;
  });
  return result;
}();
// {{{3 xmlEscape - escape xml string
xmlEscape = function(str) {
  var s;
  var code;
  var c;
  var result;
  var i;
  var str;
  str = String(str);
  i = 0;
  result = "";
  while(i < str.length) {
    c = str[i];
    code = c.charCodeAt(0);
    s = xmlEntitiesReverse[c];
    if(s) {
      result = result + ("&" + s + ";");
    } else if(code >= 128) {
      result = result + ("&#" + code + ";");
    } else if(true) {
      result = result + c;
    };
    i = i + 1;
  };
  return result;
};
// {{{3 xml Error handler
JsonML_Error = function(desc) {
  throw desc;
};
// {{{3 test
addTest("xml", function(test) {
  test.equals(xmlEscape("foo<bar> me & blah 'helo …æøå"), "foo&lt;bar&gt; me &amp; blah &apos;helo &#8230;&#230;&#248;&#229;", "escape");
  test.deepEquals(xml2jsonml("<foo bar=\"baz\">blah<boo/><me></me></foo>"), [["foo", {bar : "baz"}, "blah", ["boo"], ["me", ""]]], "parse xml");
  test.equals(jsonml2xml(["body", ["h1", "hello"], ["br", ""], ["img", {src : "a.png"}]]), "<body><h1>hello</h1><br></br><img src=\"a.png\" /></body>", "jsonml2xml");
  test.done();
});
// HTML {{{2
jsName2CssName = function(str) {
  return str.replace(RegExp("[A-Z]", "g"), function(c) {
    return "-" + c.toLowerCase();
  });
};
styleToText = function(obj) {
  var str;
  str = "";
  Object.keys(obj).forEach(function(selector) {
    str = str + (selector + "{");
    Object.keys(obj[selector]).forEach(function(prop) {
      str = str + (jsName2CssName(prop) + ":" + obj[selector][prop] + ";");
    });
    str = str + "}";
  });
  return str;
};
defaultStyle = {body : {
  margin : "0",
  padding : "0",
  fontFamily : "Ubuntu,sans-serif"
}};
// {{{3 constructor
HTML = function() {
  var args;
  args = arraycopy(arguments);
  this._content = [];
  this._style = deepCopy(defaultStyle);
  this._title = "solsort.com";
  this.icon = undefined;
};
//{{{3 addStyle
HTML.prototype.addStyle = function(obj) {
  deepExtend(this._style, obj);
};
// {{{3 title
HTML.prototype.title = function(title) {
  this._title = title;
  return this;
};
// {{{3 content
HTML.prototype.content = function() {
  this._content = arraycopy(arguments);
  return this;
};
// {{{3 toLsXml
HTML.prototype.toLsXml = function() {
  var body;
  var head;
  var opt;
  // TODO: refactor/remove this function when Xml-class done
  opt = opt || {};
  head = ["head"];
  head.push(["title", this._title]);
  head.push(["meta", {"http-equiv" : "content-type", content : "text/html;charset=UTF-8"}]);
  head.push(["meta", {"http-equiv" : "X-UA-Compatible", content : "IE=edge,chrome=1"}]);
  head.push(["meta", {name : "HandheldFriendly", content : "True"}]);
  head.push(["meta", {name : "viewport", content : "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=0"}]);
  head.push(["meta", {name : "format-detection", content : "telephone=no"}]);
  /*
  head.push(["meta", {name: "apple-mobile-web-app-capable", content : "yes"}]);
  head.push(["meta", {name: "apple-mobile-web-app-status-bar-style", content : "black"}]);
  */
  if(opt.icon) {
    head.push(["link", {rel : "icon", content : opt.icon}]);
    head.push(["link", {rel : "shortcut-icon", content : opt.icon}]);
    head.push(["link", {rel : "apple-touch-icon-precomposed", content : opt.icon}]);
  };
  head.push(["style", styleToText(this._style)]);
  head.push(["style", "@font-face{font-family:Ubuntu; font-weight:400; src: url(/font/ubuntu-latin1.ttf) format(truetype);}"]);
  head.push(["style", "@font-face{font-family:Ubuntu; font-weight:700; src: url(/font/ubuntu-bold-latin1.ttf) format(truetype);}"]);
  body = ["body"];
  body = body.concat(this._content);
  body.push(["script", {src : "/socket.io/socket.io.js"}, ""]);
  body.push(["script", {src : "/solsort.js"}, ""]);
  return new LsXml(["html", head, body]);
};
// {{{3 toString
HTML.prototype.toString = function() {
  return "<!DOCTYPE html>" + this.toLsXml().toString();
};
// {{{2 Testing
// {{{3 Constructor
Tester = function(name) {
  var self;
  var timeout;
  timeout = 5;
  this.testCount = 0;
  this.errors = [];
  this.name = name;
  self = this;
  this.timeout = sleep(timeout, function() {
    self.error("timeout after " + timeout + "s");
    self.done();
  });
};
// {{{3 done
Tester.prototype.done = function() {
  clearTimeout(this.timeout);
  if(this.errors.length) {
    console.log(this.errors);
  };
  console.log(this.name + ": " + this.errors.length + " errors out of " + this.testCount + " tests");
  if(this.errors.length) {
    throw this.errors;
  };
};
// {{{3 equals
Tester.prototype.equals = function(a, b, msg) {
  this.testCount = this.testCount + 1;
  if(a !== b) {
    this.errors.push({
      val : a,
      expected : b,
      msg : msg || "equals error"
    });
  };
};
// {{{3 deepEquals
Tester.prototype.deepEquals = function(a, b, msg) {
  this.equals(JSON.stringify(a), JSON.stringify(b), msg || "deepEquals error");
};
// {{{3 assert
Tester.prototype.assert = function(bool, msg) {
  this.equals(bool, true, msg || "assert error");
};
// {{{3 error
Tester.prototype.error = function(msg) {
  this.assert(false, msg || "error");
};
//{{{2 GraphLayout
GraphLayout = function() {
  this._nodes = [];
  this._edges = [];
  this._needsUpdate = false;
};
GraphLayout.prototype.addEdge = function(a, b) {
  var found;
  this._ensureNode(a);
  this._ensureNode(b);
  found = false;
  this._edges.forEach(function(edge) {
    if(edge.source === a && edge.target === b) {
      found = true;
    };
  });
  if(!found) {
    this._edges.push({source : a, target : b});
  };
  this.start();
};
GraphLayout.prototype.removeEdge = function(a, b) {
  this._edges = this._edges.filter(function(edge) {
    return edge.source !== a || edge.target !== b;
  });
  this.start();
};
GraphLayout.prototype.clearEdges = function() {
  this._edges = [];
};
GraphLayout.prototype._ensureNode = function(id) {
  if(!this._nodes[id]) {
    this._nodes[id] = {};
  };
};
GraphLayout.prototype.getX = function(nodeId) {
  return this._nodes[nodeId].x || 0;
};
GraphLayout.prototype.getY = function(nodeId) {
  return this._nodes[nodeId].y || 0;
};
GraphLayout.prototype.dim = function() {
  var maxX;
  var maxY;
  var minX;
  var minY;
  minY = minX = Number.MAX_VALUE;
  maxY = maxX = Number.MIN_VALUE;
  this._nodes.forEach(function(node) {
    if(node && node.x !== undefined && node.y !== undefined) {
      minY = Math.min(minY, node.y);
      minX = Math.min(minX, node.x);
      maxY = Math.max(maxY, node.y);
      maxX = Math.max(maxX, node.x);
    };
  });
  return [minX, minY, maxX, maxY];
};
GraphLayout.prototype.start = function() {
  var self;
  self = this;
  loadjs("js/d3.v3.min", function() {
    self.d3force = self.graph || window.d3.layout.force();
    self.d3force.charge(- 120).linkDistance(30).nodes(self._nodes).links(self._edges);
    self.d3force.on("tick", function() {
      if(self.update) {
        self.update(self);
      };
    });
    self.d3force.start();
  });
};
// {{{1 App Router
// {{{2 Notes
// {{{3 Router
//
// There are different routes
//
// - kinds of dispatch/platforms
//   - process.argv
//   - http-req.url
//   - function call
//   - browser.location
//   - (browser-js-api)
//   - (deployment ie. phonegap, browser-plugin, ...)
//   - (other platforms)
// - kinds of interaction
//   - static delivery
//   - dynamic interaction
// - kinds of content
//   - text
//   - DOM/html/xml + evt. styling
//   - json
//   - canvas/image
//   - (general browser api)
//   - (webgl/opengl-es)
//
//     routes["foo"] =  function(app) {
//       if(app.param["bar"]) {
//         app.done("hey " + app.args[1]);
//       } else {
//         app.done("hello " + app.args[1]);
//       }
//     };
//
//     call("foo", "world", function(err, data) {
//     });
//     call("foo", "world", {bar: true}, function(err, data) {
//     });
//
//     HTTP/GET /foo/world
//     HTTP/GET /foo/world?bar=true
//     HTTP/GET /foo/world?callback=blah
//
//     ./run.sh foo --bar=true world
//
//     http://localhost:9999/#foo/world?bar=true
//
// {{{3 App class
//
// - methods
//   - User related
//     - clientId
//     - param
//     - args
//     - log(args...)
//     - error(args...)
//     - send(content) - text appends, dom/json replaces, (^L texts replaces)
//     - canvas2d([w, h]) - return canvas to draw on
//     - done([content])
//   - router-related
//     - routeName
//     - dispatch()
// - base class
//   - cmd disptach
//   - fncall
//
// - kinds of functionality
//   - generate static html/dom
// - command-line dynamic writing to stdout
// - http-requests static generating pages
// - browser-url dynamic interacting with dom
// - rpc static returning json (both as http-rest, functioncalls, and later ipc)
//
// {{{2 Routing
_routes = {};
route = function(name, fn) {
  _routes[name] = fn;
};
// {{{2 App
appSeq = 0;
App = function(args, param) {
  this.seq = appSeq = appSeq + 1;
  this.clientId = this.clientId || newId();
  this.args = this.args || args || [];
  this.param = this.param || param || {};
};
App.prototype.log = function() {
  logObject({
    log : arraycopy(arguments),
    appType : this.appType,
    seq : this.seq,
    pid : PID,
    clientId : this.clientId
  });
};
App.prototype.error = function(msg) {
  this.log({error : msg});
  throw msg;
};
App.prototype.dispatch = function() {
  var routeName;
  routeName = this.args[0].split(".")[0];
  this.log("dispatch", routeName, this.args, this.param);
  if(routeName[0] === "_") {
    routeName = "_";
  }(_routes[routeName] || _routes["default"])(this);
};
// {{{2 CmdApp
CmdApp = function() {
  var param;
  this.seq = appSeq = appSeq + 1;
  this.clientId = newId();
  this.param = param = {};
  this.args = process.argv.slice(2).filter(function(s) {
    var val;
    var keyval;
    var s;
    if(s[0] === "-") {
      s = s.slice(1);
      if(s[0] === "-") {
        s = s.slice(1);
      };
      keyval = s.split("=");
      val = keyval.slice(1).join("=") || true;
      param[keyval[0]] = val;
      return false;
    } else if(true) {
      return true;
    };
  });
};
CmdApp.prototype = Object.create(App.prototype);
CmdApp.prototype.appType = "cmd";
CmdApp.prototype.send = function(content) {
  this.log(content);
};
CmdApp.prototype.canvas2d = function(w, h) {
  this.error("canvas not supported in CmdApp");
};
CmdApp.prototype.done = function(result) {
  if(result) {
    this.send(result);
  };
  process.exit();
};
if(isNode) {
  nextTick(function() {
    var app;
    app = new CmdApp();
    app.dispatch();
  });
};
// {{{2 WebApp
WebApp = function() {
  var paramString;
  var param;
  this.clientId = newId();
  this.param = param = {};
  paramString = location.href.split("?")[1];
  if(paramString) {
    paramString.split("&").forEach(function(singleParam) {
      var paramArgs;
      paramArgs = singleParam.split("=");
      if(paramArgs.length > 1) {
        param[paramArgs[0]] = paramArgs.slice(1).join("=");
      } else if(true) {
        param[singleParam] = true;
      };
    });
  };
  this.args = (location.hash || location.pathname).slice(1).split("?")[0].split("/");
};
WebApp.prototype = Object.create(App.prototype);
WebApp.prototype.appType = "web";
WebApp.prototype.log = function() {
  var args;
  args = arraycopy(arguments);
  xhrPost("/_", {data : {log : args, clientTime : Date.now()}});
  console.log.apply(console, args);
};
WebApp.prototype.send = function(content) {
  var content;
  // TODO
  content = content.toString().replace(new RegExp(" href=\"http(s?)://", "g"), function(_, secure) {
    return " href=\"/_" + secure + "/";
  });
  document.body.innerHTML = content;
};
WebApp.prototype.canvas2d = function(w, h) {
  var h;
  var w;
  h = h || innerHeight;
  w = w || innerHeight;
  // TODO
  if(this._canvas) {
    return this._canvas;
  };
  document.body.innerHTML = "<canvas id=canvas height=" + h + " width=" + w + "></canvas>";
  return this._canvas = document.getElementById("canvas").getContext("2d");
};
WebApp.prototype.done = function(result) {
  if(result) {
    this.send(result);
  };
};
if(isBrowser) {
  nextTick(function() {
    var app;
    app = new WebApp();
    app.dispatch();
  });
};
// {{{2 HttpApp
HttpApp = function(req, res) {
  var clientId;
  this.seq = appSeq = appSeq + 1;
  this.resultCode = 200;
  this.req = req;
  this.res = res;
  this.param = extend(extend({}, req.query), req.body);
  this.headers = {};
  this.args = req.url.slice(1).split("?")[0].split("/");
  clientId = ((req.headers.cookie || "").match(RegExp("Xz=([a-zA-Z0-9+/=]+)")) || [])[1];
  if(!clientId) {
    clientId = newId();
  };
  this.headers["Set-Cookie"] = "Xz=" + clientId + "; Max-Age=" + 60 * 60 * 24 * 200;
  this.clientId = clientId;
};
HttpApp.prototype = Object.create(App.prototype);
HttpApp.prototype.appType = "http";
HttpApp.prototype.error = function(args) {
  this.log({error : args, url : this.req.url});
  this.res.end((new HTML()).content(["pre", "Error: " + JSON.stringify(args)]));
};
HttpApp.prototype.send = function(content) {
  if(typeof content === "string") {
    if(this.headers["Content-Type"] === "text/plain") {
      this.content = this.content + content;
    } else if(true) {
      this.content = content;
      this.headers["Content-Type"] = "text/plain";
    };
  } else if(isClass(content, HTML)) {
    this.content = content.toString();
    this.headers["Content-Type"] = "text/html";
    this.content = this.content.replace(new RegExp(" href=\"http(s?)://", "g"), function(_, secure) {
      return " href=\"/_" + secure + "/";
    });
  } else if(true) {
    this.content = content;
  };
};
HttpApp.prototype.canvas2d = function(w, h) {
  this.error("not implemented");
};
HttpApp.prototype.redirect = function(url) {
  this.resultCode = 307;
  this.headers["Location"] = url;
};
HttpApp.prototype.raw = function(mimetype, data) {
  this.headers["Content-Type"] = mimetype;
  this.content = data;
};
HttpApp.prototype.done = function(result) {
  if(result) {
    this.send(result);
  };
  this.res.writeHead(this.resultCode, this.headers);
  this.res.end(this.content);
  this.log("done", this.req.url, this.req.headers);
};
// {{{2 CallApp TODO
CallApp = function(args) {
  this.seq = appSeq = appSeq + 1;
  this.clientId = newId();
  this.app = args[0];
  this.callback = args[args.length - 1];
  if(typeof args[args.length - 2] === "object") {
    this.param = args[args.length - 2];
    this.args = args.slice(0, - 2);
  } else if(true) {
    this.param = {};
    this.args = args.slice(0, - 1);
  };
};
CallApp.prototype = Object.create(App.prototype);
CallApp.prototype.appType = "call";
CallApp.prototype.error = function(err) {
  this.log({error : err});
  this.callback(err, this.content);
};
CallApp.prototype.send = function(content) {
  this.content = content;
};
CallApp.prototype.canvas2d = function(w, h) {
  this.err("canvas not supported in CallApp");
};
CallApp.prototype.done = function(result) {
  if(result) {
    this.callback(undefined, result);
  } else if(true) {
    this.callback(undefined, this.content);
  };
};
call = function() {
  var app;
  app = new CallApp(arraycopy(arguments));
  app.dispatch();
};
// {{{1 Applications
//{{{2 server
route("server", function(app) {
  var io;
  var port;
  var httpServer;
  var server;
  var express;
  //
  // express setup
  express = require("express");
  server = express();
  server.use(function(req, res, next) {
    res.header("Cache-Control", "public, max-age=" + 60 * 60 * 24 * 100);
    res.removeHeader("X-Powered-By");
    next();
  });
  server.use(express.static(__dirname));
  server.use(function(req, res, next) {
    res.header("Cache-Control", "public, max-age=0");
    next();
  });
  server.use(express.static(__dirname + "/../../oldweb"));
  server.use(express.bodyParser());
  server.use(function(req, res, next) {
    var httpApp;
    res.header("Cache-Control", "public, max-age=" + 60 * 60);
    httpApp = new HttpApp(req, res);
    httpApp.dispatch();
  });
  //
  // http server
  httpServer = require("http").createServer(server);
  port = app.param["port"] || 9999;
  httpServer.listen(port);
  app.log("starting devserver on port " + port);
  //
  // socket.io
  io = require("socket.io").listen(httpServer);
  io.set("log level", 1);
  io.sockets.on("connection", function(sock) {
    app.log("socket.io connect", sock.id, sock.handshake.headers);
    sock.emit("serverPID", PID);
    sock.on("disconnect", function() {
      app.log("socket.io disconnect", sock.id);
    });
  });
});
//{{{2 uccorg
//{{{3 notes
//
// - webuntis
//   - locations (36): rum/lokale
//   - subject (700+)s: fag/emne (både fag og eksamener etd.)
//   - lessons (28000+): timetable-entry
//   - groups (150+): hold+årgang
//   - evt. teachers (160+) - underviser-individ
// - api
//   - /activities/date
//   - /location
//   - /state
//     
//
//{{{3 getWebuntisData
getWebuntisData = memoiseAsync(function(processData) {
  var createData;
  var webuntis;
  var untisCall;
  //{{{4 `webuntis` api call
  untisCall = 0;
  webuntis = function(name, cb) {
    loadCacheFile("/../apikey.webuntis", function(err, apikey) {
      var apikey;
      apikey = apikey.trim();
      if(err) {
        return cb(err);
      };
      console.log("webuntis", name, untisCall = untisCall + 1);
      urlGet("https://api.webuntis.dk/api/" + name + "?api_key=" + apikey, function(err, result, content) {
        if(err) {
          return cb(err);
        };
        cb(null, JSON.parse(content));
      });
    });
  };
  //{{{4 `createData` - extract full dataset from webuntis api
  createData = function(dataDone) {
    var result;
    result = {
      sync : {started : (new Date()).toISOString()},
      locations : {},
      subjects : {},
      lessons : {},
      groups : {},
      teachers : {}
    };
    asyncSeqMap(Object.keys(result), function(datatype, cb) {
      webuntis(datatype, function(err, data) {
        if(err) {
          cb(err);
        };
        console.log(err, data[0]["untis_id"]);
        asyncSeqMap(data, function(obj, cb) {
          id = obj["untis_id"];
          webuntis(datatype + "/" + id, function(err, data) {
            result[datatype][id] = data;
            cb(err);
          });
        }, function(err) {
          cb(err);
        });
      });
    }, function(err) {
      var lessons;
      var untisCmp;
      untisCmp = function(a, b) {
        return Number(a.untisId) - Number(b.untisId);
      };
      result["locations"].sort(untisCmp);
      result["subjects"].sort(untisCmp);
      result["teachers"].sort(untisCmp);
      result["groups"].sort(untisCmp);
      lessons = {};
      foreach(result["lessons"], function(_, lesson) {
        var date;
        date = lesson.start.slice(0, 10);
        lessons[date] = lessons[date] || [];
        lessons[date].push(lesson);
      });
      result["lessons"] = lessons;
      result["sync"]["done"] = (new Date()).toISOString();
      dataDone(err, result);
    });
  };
  //{{{4 try load cached data from file, or otherwise call createData, and cache it
  loadCacheFile("/../webuntisdata", function(err, data) {
    if(err) {
      createData(function(err, data) {
        if(err) {
          return processData(err, data);
        };
        savefile("/../webuntisdata", JSON.stringify(data, null, 4), function() {
          processData(err, data);
        });
      });
    } else if(true) {
      processData(false, JSON.parse(data));
    };
  });
});
//{{{3 process raw apidata
//{{{3 Dashboard
uccorgDashboard = function(app) {
  var html;
  html = new HTML();
  html.content(["h1", "...dashboard..."]);
  app.done(html);
};
//{{{3 route uccorg
route("uccorg", function(app) {
  var path;
  path = app.args[1];
  if(isBrowser) {
    if(path === "dashboard") {
      return uccorgDashboard(app);
    } else if(true) {
      return app.done();
    };
  };
  getWebuntisData(function(err, data) {
    var maxtime;
    var html;
    var pos;
    var when;
    var result;
    if(app.args[1] === "activities") {
      result = data["lessons"];
      when = Number(new Date(app.args[2]));
      pos = binarySearchFn(data["lessons"], function(lesson) {
        var lessonTime;
        lessonTime = Number(new Date(lesson.start));
        return lessonTime - when;
      });
      result = data["lessons"].slice(pos, pos + 100);
      result = result.map(function(lesson) {
        return lesson.start;
      });
      html = new HTML();
      html.content(["pre", JSON.stringify(result, null, 4)]);
      app.done(html);
    } else if(app.args[1] === "test") {
      result = {acc : []};
      maxtime = 0;
      data["lessons"].forEach(function(lesson) {
        var time;
        time = Number(new Date(lesson.end)) - Number(new Date(lesson.start));
        if(time > maxtime) {
          maxtime = time;
          result.lesson = lesson;
          result.start = lesson.start;
          result.end = lesson.end;
          result.acc.push(maxtime + " " + lesson.start + "-" + lesson.end);
        };
      });
      result["maxtime"] = maxtime;
      html = new HTML();
      html.content(["pre", JSON.stringify(result, null, 4)]);
      app.done(html);
    } else if(true) {
      html = new HTML();
      html.content(["h1", "API for UCC organism"]);
      app.done(html);
    };
  });
});
// {{{2 devserver
route("devserver", function(app) {
  var compiling;
  var startServer;
  var spawn;
  var server;
  server = undefined;
  spawn = require("child_process").spawn;
  startServer = function() {
    server = spawn("node", [__dirname + "/solsort.js", "server"]);
    server.on("exit", startServer);
    server.stdout.pipe(process.stdout);
    server.stderr.pipe(process.stderr);
  };
  startServer();
  setInterval(function() {
    server.kill();
  }, 1000 * 60 * 25);
  compiling = false;
  require("fs").watch(__dirname + "/..", function() {
    var dst;
    var src;
    if(compiling) {
      return undefined;
    };
    compiling = true;
    src = "/../solsort.ls";
    dst = "/solsort.js";
    sleep(0.3, function() {
      compiling = false;
      if(mtime(src) > mtime(dst)) {
        loadfile(src, function(err, source) {
          var js;
          var ast;
          if(err) {
            throw err;
          };
          ast = ls2ast(source);
          js = ast2js(ast);
          savefile(dst, js, function() {
            server.kill();
            compiling = false;
          });
        });
      };
    });
  });
});
// {{{2 Default / index
// {{{3 Index as JSON
index = [
  {
    "name" : "Rasmus Erik",
    "link" : "/rasmuserik.html",
    "desc" : "Contact info, and more about the creator of these things"
  },
  {
    "name" : "BibTekKonf BibGraph",
    "title" : "Slides: BibTekKonf BibGraph",
    "date" : "2013-10-26",
    "tags" : "talk, presentation, bibtekkonf, bibgraph",
    "link" : "/slides/bibtekkonf2013-bibgraph",
    "desc" : "Slides fra BibTekKonf præsentation om visualisering ud fra ADHL-data"
  },
  {
    "name" : "Hack4dk",
    "date" : "2013-09-28",
    "tags" : "",
    "link" : "/hack4dk",
    "desc" : "Hack4dk hackathon hacks: graph visualisation from wikipedia, image recognition, and art quiz"
  },
  {
    "name" : "Summer Hacks",
    "title" : "Slides: Summer Hacks",
    "date" : "2013-08-14",
    "tags" : "copenhagenjs, talk, presentation, bibgraph, skolevej",
    "link" : "/slides/cphjs2013-summer-hacks",
    "desc" : "Slides for presentation at CopenhagenJS on various summer hacks: BibGraph and Skolevej"
  },
  {
    "name" : "BibGraph",
    "date" : "2013-08-02",
    "tags" : "coffeescript, dbc, adhl, d3, visualisation, graph",
    "link" : "http://bibgraph.solsort.com/",
    "desc" : "Visualisation of relations between books and other library materials, generated from the ADHL statistics about danish co-loans"
  },
  {
    "name" : "Skolevej",
    "date" : "2013-07-08",
    "tags" : "coffeescript, hammertime, gis, leaflet, openstreetmap",
    "link" : "http://skolevej.solsort.com/",
    "source" : "https://github.com/rasmuserik/app-skolevej",
    "desc" : "Demo/frontend of editor for safe school routes - made for Hammertime / Odense Kommune",
    "time" : "24 hrs"
  },
  {
    "name" : "html5cnug",
    "title" : "Slides: HTML5",
    "date" : "2013-05-22",
    "tags" : "presentation, html5, cnug",
    "link" : "/slides/cnug2013-html5/",
    "source" : "https://github.com/rasmuserik/app-speeding",
    "desc" : "Slides for presentation done at CNUG.dk",
    "time" : "3 days study/preparation for presentation, 1 hour presentation"
  },
  {
    "name" : "speeding",
    "title" : "Speeding visualisation",
    "tags" : "coffeescript, hammertime, visualisation",
    "date" : "2013-05-15",
    "link" : "http://speeding.solsort.com",
    "source" : "https://github.com/rasmuserik/app-speeding",
    "desc" : "Visualiseringskode for vejdirektoratet - layout baseret på tidligere udgave",
    "time" : "5 hours trying to optimise original outsourced code, then 10 hours reimplementing it"
  },
  {
    "name" : "Dragimation",
    "date" : "2013-04-30",
    "tags" : "coffeescript, hammertime, visualisation, html5",
    "link" : "http://dragimation.solsort.com",
    "source" : "https://github.com/rasmuserik/app-dragimation",
    "desc" : "Dragging animation special effect - as requested for the development of legoland billund resort web page."
  },
  {
    "name" : "CombiGame",
    "link" : "http://old.solsort.com/#combigame",
    "desc" : "Logical game, inspired by a card game",
    "date" : "2012-03-26"
  },
  {
    "name" : "Tsar Tnoc",
    "link" : "/tsartnoc",
    "desc" : "Result of a ludum dare hackathon.",
    "date" : "2012-07-15"
  },
  {
    "name" : "BlobShot",
    "link" : "http://blobshot.solsort.com",
    "desc" : "Result of the 5apps hackathon.",
    "date" : "2012-05-06"
  },
  {
    "name" : "NoteScore",
    "desc" : "Note learning app",
    "link" : "/notescore",
    "Android App" : "https://market.android.com/details?id=dk.solsort.notescore",
    "Source" : "https://github.com/rasmuserik/notescore",
    "date" : "2011-08"
  },
  {
    "name" : "dkcities",
    "title" : "Danske Byer",
    "link" : "/danske-byer",
    "source" : "https://github.com/rasmuserik/dkcities",
    "desc" : "Learning \"game\" for the geography of Denmark.",
    "date" : "2011-08"
  },
  {
    "name" : "CuteEngine",
    "link" : "/cute-engine",
    "Source" : "https://github.com/rasmuserik/planetcute",
    "desc" : "Game engine experiment",
    "date" : "2011-08",
    "time" : "3 days"
  },
  {
    "name" : "Productivity Hacks",
    "link" : "/notes/productivity-hacks",
    "desc" : "Notes for a presentation on productivity hacks. Keywords of my aproaches to handle the world.",
    "date" : "2013-04-30"
  },
  {
    "name" : "EuroCards",
    "tags" : "card game",
    "link" : "/notes/eurocards",
    "desc" : "top-trump like card game for learning facts about european countries",
    "date" : "2012-06-20"
  },
  {
    "name" : "Pricing scale",
    "link" : "/notes/pricing-scale",
    "desc" : "Tool for pricing and estimating cost.",
    "date" : "2013"
  },
  {
    "name" : "Skrivetips",
    "lang" : "da",
    "link" : "/notes/skrivetips",
    "desc" : "Tips / noter om skrivning, herunder også struktur for videnskabelige rapporter. Tips for effective writing (in Danish).",
    "date" : "2005"
  },
  {
    "name" : "Presentation evaluation notes",
    "link" : "/notes/presentation-evaluation",
    "desc" : "Checklist / notes for giving feedback on presentations. Useful for Toastmasters and similar.",
    "date" : "2012-03-18"
  }
];
// {{{3 render entry
renderEntry = function(entry) {
  return ["a", {class : "entry", href : entry.link}, ["h2", {class : "header"}, entry.title || entry.name], ["img", {
    width : "300",
    height : "200",
    src : "/icons/app-" + normaliseString(entry.name) + ".png"
  }], ["div", {class : "desc"}, entry.desc]];
};
// {{{3 default route
route("default", function(app) {
  var html;
  html = new HTML();
  html.addStyle({
    h1 : {textAlign : "center"},
    ".entries" : {textAlign : "center"},
    ".entry" : {
      textAlign : "left",
      display : "inline-block",
      width : "340px",
      verticalAlign : "text-top",
      color : "black",
      textColor : "black",
      textDecoration : "none",
      margin : "10px",
      padding : "0px 20px 40px 20px",
      border : "1px solid #ccc",
      borderRadius : "10px"
    },
    ".entry img" : {
      border : "1px solid #ccc",
      marginLeft : "20px",
      marginRight : "20px",
      marginBottom : "20px"
    }
  });
  html.content(["h1", "solsort.com"], ["div", {class : "entries"}].concat(index.map(renderEntry)));
  app.done(html);
});
// {{{2 circles
circles = function(app) {
  var i;
  var graph;
  var nodes;
  var html;
  var size;
  var h;
  var w;
  w = window.innerWidth;
  h = window.innerHeight;
  size = 150;
  html = new HTML();
  html.addStyle({body : {backgroundColor : "#bad"}, ".circle" : {
    borderRadius : "1000px",
    position : "absolute",
    boxShadow : "3px 3px 10px rgba(0,0,0,0.5)"
  }});
  html.content.apply(html, index.map(function(entry) {
    var name;
    name = normaliseString(entry.name);
    return ["a", {href : entry.link}, ["img", {
      id : name,
      class : "circle",
      src : "/icons/app-" + normaliseString(entry.name) + ".png",
      width : size,
      height : size
    }]];
  }));
  app.send(html);
  nodes = index.map(function(entry) {
    return document.getElementById(normaliseString(entry.name));
  });
  nodes.forEach(function(node) {
    var style;
    style = node.style;
    style.top = (Math.random() * (h - size) | 0) + "px";
    style.left = (Math.random() * (w - size) | 0) + "px";
  });
  graph = new GraphLayout();
  i = 1;
  while(i < nodes.length) {
    graph.addEdge(i - 1, i);
    i = i + 1;
  };
  graph.update = function() {
    var j;
    var dim;
    dim = graph.dim();
    j = 0;
    while(j < nodes.length) {
      nodes[j].style.left = (graph.getX(j) - dim[0]) / (dim[2] - dim[0]) * 900 + "px";
      nodes[j].style.top = (graph.getY(j) - dim[1]) / (dim[3] - dim[1]) * 500 + "px";
      j = j + 1;
    };
  };
};
if(isBrowser) {
  route("circles", circles);
};
//{{{2 _
if(isNode) {
  cachedRead = memoiseAsync(require("fs").readFile);
  route("_", function(app) {
    var url;
    var type;
    type = app.args[app.args.length - 1].split(".").slice(- 1)[0];
    if(type === "gif") {
      cachedRead(__dirname + "/../../oldweb/img/webbug.gif", function(err, data) {
        if(err) {
          return app.error(err);
        };
        app.raw("image/gif", data);
        app.done();
      });
    } else if(type === "png") {
      cachedRead(__dirname + "/../../oldweb/img/logicon.png", function(err, data) {
        if(err) {
          return app.error(err);
        };
        app.raw("image/png", data);
        app.done();
      });
    } else if(app.args[1] !== undefined && (app.args[0] === "_" || app.args[0] === "_s")) {
      url = "http" + (app.args[0][1] || "") + "://";
      url = url + app.args.slice(1).join("/");
      app.redirect(url);
      app.done();
    } else if(true) {
      app.done("");
    };
  });
};
// {{{2 notes
posts = undefined;
route("notes", function(app) {
  if(!posts) {
    loadPosts(app);
  } else if(true) {
    renderPost(app);
  };
});
markdown2html = function(md, callback) {
  loadjs("markdown", function(err, markdown) {
    var htmlTree;
    console.log(1, md);
    htmlTree = markdown.toHTMLTree(md);
    console.log(2);
    callback(null, htmlTree);
  });
};
loadPosts = function(app) {
  gendoc(function(err, markdownString) {
    var markdownString;
    markdownString = markdownString.replace(new RegExp("^[\\s\\S]*\n# Posts[^#]*"), "\n");
    posts = {};
    markdownString.split("\n## ").slice(1).forEach(function(post) {
      var title;
      var post;
      title = post.split("\n")[0].trim();
      post = "## " + post;
      posts[normaliseString(title)] = post;
    });
    renderPost(app);
  });
};
renderPost = function(app) {
  var title;
  title = normaliseString((app.args[1] || "").trim());
  markdown2html(posts[title] || "", function(err, result) {
    var html;
    result[0] = "div";
    html = new HTML();
    html.title(posts[title].split("\n")[0].replace("##", "").trim());
    html.addStyle({"body" : {margin : "1ex 10% 0 10%"}, ".solsortLogoText" : {textDecoration : "none"}});
    html.content(["a", {class : "solsortLogoText", href : "/"}, ["img", {src : "/img/logicon.png"}], " solsort.com"], result);
    app.done(html);
  });
};
// {{{2 test
route("test", function(app) {
  foreach(_testcases, function(name, fn) {
    fn(new Tester(name));
  });
  sleep(10, function() {
    // TODO: app done on test done, or app.error on test error
    app.done();
  });
});
// pp - prepare (prettyprint+gendoc) route {{{2
//
// prettyprints file, and generates documentation.
//
route("pp", function(app) {
  app.log(app.appType);
  if(app.appType === "http") {
    return app.done((new HTML()).content());
  };
  app.log("prettyprinting");
  loadfile("/solsort.ls", function(err, source) {
    var ast;
    ast = ls2ast(source);
    savefile("/../solsort.ls", ast2ls(ast), function() {
      gendoc(function(err, markdownString) {
        if(err) {
          return app.error(err);
        };
        savefile("/../README.md", markdownString, function() {
          app.done();
        });
      });
    });
  });
});
// compile and prettyprint {{{2
route("compile", function(app) {
  var ast;
  app.log("compiling...");
  if(app.param["code"]) {
    console.log(app.param["code"]);
    ast = ls2ast(app.param["code"]);
    app.send(pplist(ast.toList()));
    app.done(ast2js(ast));
  } else if(true) {
    loadfile("/solsort.ls", function(err, source) {
      ast = ls2ast(source);
      savefile("/solsort.js", ast2js(ast), function() {
        app.done();
      });
    });
  };
});
route("prettyprint", function(app) {
  app.log("prettyprinting");
  loadfile("/solsort.ls", function(err, source) {
    var ast;
    ast = ls2ast(source);
    savefile("/solsort.pp", ast2ls(ast), function() {
      app.done();
    });
  });
});
// gendoc - Documentation generation {{{2
gendoc = function(callback) {
  loadfile("/solsort.ls", function(err, source) {
    var wasCode;
    var commentRE;
    var lines;
    lines = [];
    commentRE = RegExp("^ *// ?");
    wasCode = false;
    source.split("\n").forEach(function(line) {
      var line;
      if(line.match(commentRE)) {
        line = line.replace(commentRE, "");
        line = line.replace(RegExp("(.*){" + "{{([0-9])(.*)"), function(_, pre, header, post) {
          var result;
          var header;
          result = pre + post;
          header = + header;
          while(header > 0) {
            result = "#" + result;
            header = header - 1;
          };
          return result;
        });
        if(wasCode) {
          lines.push("");
        };
        lines.push(line);
        wasCode = false;
      } else if(true) {
        if(!wasCode) {
          lines.push("");
        };
        lines.push("    " + line);
        wasCode = true;
      };
    });
    callback(false, lines.join("\n"));
  });
};
// {{{1 Posts
// 
// These notes are articles, that will automatically be convereted to articles on the solsort.com website.
//
// {{{2 Productivity hacks
//
// Notes from presentation.
//
// {{{3 Tactical vs strategic thinking
// Planning on different levels, frees up focus. Work more efficiently when not thinking about direction.
//
// {{{4 Daily review
//
// Review previous day • Think once a day • Choose tasks
// 
// {{{4 Exercise, food, sleep~dream
//
// Physical prerequisite for persistent performance
//
// {{{4 Gratitude, reiterate direction
//
// Daily reaffirm direction • Focus on gratitude
// 
// {{{4 Pomodoros
//
// 25 minute timebox • Atomic units • Task estimation • Record activity • Small, easy to start • Work fit allocated time (¿Parkinsons? law)
//
// {{{4 Empty inbox
//
// Frees mental space • clutter tolerance, same amount of work
// 
// {{{4 Daylog
//
// Todolist • getting things out of the head • moving to done
// 
// {{{4 Backlog
//
// Temporal backlog in daylog • Categorised backlog in separate file • Capture system
// 
// {{{4 Review Biweekly and Quarterly
//
// Overall direction • Look back • Review backlog and goals • Temporal backlog
// 
// {{{3 Sources
// {{{4 Getting Things Done
// Empty inbox • Capture system • Not keeping stuff in the head
//
// {{{4 Scrum (and Lean)
// 14 day sprints • Retrospective • Daily Scrum • Kanban - daylog • Measure and optimise
//
// {{{4 Junto
// Pomodoros • Network peering
// {{{2 Pricing scale
//
//
// Nice round numbers, both for Euros and DKK(Danish currency)
//
// Price doubles approximately per two steps
//
// Exponential scale, a la planning poker
//
// Useful tool for estimating/finding price without sweating the details
//
//        DKK         (+VAT)         Euro
//     
//         15            (3.75)         2
//         30            (7.5)          4
//         45           (11.25)         6
//         60           (15)            8
//         90           (22.5)         12
//        120           (30)           16
//        180           (45)           24
//        240           (60)           32
//        360           (90)           48
//        480          (120)           64
//        720          (180)           96
//        960          (240)          128
//       1440          (360)          192
//       1920          (480)          256
//       2880          (720)          384
//       3600          (900)          480
//       4800         (1200)          640
//       7200         (1800)          960
//       9600         (2400)         1280
//      14400         (3600)         1920
//      19200         (4800)         2560
//      28800         (7200)         3840
//      36000         (9000)         4800
//      48000        (12000)         6400
//      72000        (18000)         9600
//      96000        (24000)        12800
//     144000        (36000)        19200
//     192000        (40800)        25600
//     288000        (70200)        38400
//     360000        (90000)        48000
//     480000       (120000)        64000
//     720000       (180000)        96000
//
// {{{2 EuroCards
// 
// ![EuroCards](/img/IMG_2596-eurocards.jpg)
// 
// (English description, see below)
// 
// Kortspil til brug i geografi-undervisningen.
// 
// Foreløbigt blot en prototype / proof-of-concept.
// 
// Tænker måske at søge tipsmidler til at lave en dansk udgave af dette, der dækker hele verden i stedet for blot Europa. Kontakt mig gerne hvis du vil være med til at lave en sådan ansøgning, eller vil spilteste det.
// 
// Spillet kan købes [online](https://www.thegamecrafter.com/games/EuroCards), eller ved at fange mig personligt (DKK 100).
// 
// {{{3 In English
// 
// EuroCards is a [Top Trumps](http://en.wikipedia.org/wiki/Top_Trumps) like geography game with cards with facts about the European countries.
// 
// You can buy it from [TheGameCrafter](https://www.thegamecrafter.com/games/EuroCards).
// 
// {{{3 Credits
// 
// - Data from CIA
// - Satellite image from NASA
// 
// {{{2 Fototips 
// 
// Forskellige tips, trick og ting at huske.
// 
// * There are no rules for good photographs, there are only good photographs.
// * Den fotograferede fokuserer øjnene på filmen bag ved linsen.
// * Der er altid to personer i et billede, fotografen og beskueren.
// * The negative is the score, and the print is the performance.
// * Blitz når det er lyst, lad være når det er mørkt.
// * Øjnene går fra venstre op mod højre
// * Farvernes komplement og effekt.
// * Perfection of imperfection.
// * Skyggerne skaber formen.
// * Omgivelser som rammer.
// * Udnyt dybdeuskarphed.
// * Kalibrering af kamera.
// * Øjne tiltrækkes af lys.
// * f/8 and being there.
// * Kunsten er at se.
// * Det gyldne snit.
// * Farvepsykologi.
// * Negative space.
// * Rules of thirds.
// * Gråtoner.
// 
// ----
// Rasmus Erik, 2006
// 
// {{{2 Opskrift: Hummus
// ![Hummus](/img/IMG_1556-hummus.jpg)
// 
// - 500g kogte kikærter
// - ½dl vand
// - Et lille hvidløg
// - Saften af 3-4 citroner
// - Et drys spidskommen
// - En lille skefuld tahin
// 
// Ingredienserne blendes
// 
// Pynt:
// - Et drys paprika
// - Basilikum
// 
// ----
// Rasmus Erik, July 2012
// 
// {{{2 Opskrift: Karry Dolmers
// ![Dolmers](/img/IMG_1535-dolmers.jpg)
// 
// Ingredienser:
// 
// - 4 almindelige løg
// - 1 rødløg
// - smør til stegning
// - karry
// - 4 fed hvidløg
// - ½kg basmatiris
// - 400g vinblade i saltlage
// 
// Salsa:
// 
// - 1 lille hvidløg
// - ½dl olivenolie
// - 140g tomatkoncentrat
// 
// Karry og løg steges i smør, og herefter tilsættes risen.
// Dolmers formes: Først nippes stilken af vinbladet, og derefter lægges en klump ris på bladet, siderne foldes op omkring risen og den rulles til en dolmer. Dolmerne pakkes derefter tæt i en gryde, og vand til kogning hældes derefter i gryden. Til sidst koges de en halv time - tre kvarter.
// 
// ----
// Rasmus Erik, July 2012
// 
// {{{2 Opskrift: Kartoffelæggekage
// 
// ![Tortilla](/img/IMG_1476-tortilla.jpg)
// 
// Ingredienser:
// 
// - Kartofler
//     - 1½kg kartofler
//     - Olivenolie
//     - Krydderier (paprika, rosmarin, salt)
// - Jævning
//     - 4 æg
//     - Mælk
//     - Majsstivelse (Maizena)
// - Pynt
//     - Rød peber
//     - Salat
//     - Agurk
//     - Forskellige tomater
// 
// Kartoflerne steges med krydderier og olivenolie. Jævningen piskes sammen og hældes ud over kartoflerne. Det hele steges til jævningen stivner, og tortillaen vendes derefter og steger videre. Til sidst anrettes med skåren grønt.
// 
// ----
// 
// Rasmus Erik, 2012 July 8th.
// 
// {{{2 Opskrift: Ovnbagt laks med kartofler og persillesovs
// ![Ovnbagt laks med kartofler og persillesovs](/img/IMG_1560-laks-kartoffel-persillesovs.jpg)
// 
// Ingredienser:
// 
// - Laks
//     - Laksestykker
//     - ½ citron per laksestykke
//     - Timian
//     - 1 tsk. smør per laksestykke
//     - Salt
// - Persillesovs
//     - Smør
//     - Mel
//     - Mælk
//     - Persille
// - Kartofler
// 
// Laksestykkerne indpakkes enkeltvis i staniol, og overhældes med citronsaft, timian, salt og smør. Lægges herefter i ovenen ved 180° i ca. en halv time. Kartoflerne koges. Smør til persillesovs smeltes, og mel piske i og når det begynder at blive stift tilsættes mælk og hakket persille under omrøring.
// 
// ----
// Rasmus Erik, July 2012
// 
// {{{2 Presentation evaluation
// 
// - preparation/intro
//     - talk with speaker, what kind of feedback do you want?
//     - manual / goal of this speech
//     - read-up on evaluating, sharpen your saw
// - parts to look at
//     - effect
//         - personal, enriching, inspiring
//         - purpose: inform/persuade/entertain/inspire
//         - audience reception, focus on audience
//         - humor, enthusiasm, personality
//     - content
//         - concrete vs. abstract
//         - past, future, present
//         - rhetorical devices
//     - tools
//         - visuals and props
//         - notes
//         - supporting material / research
//         - quotes
//     - body language
//         - eye contact - one complet thought
//         - posture open/close, confidence, direction/focus
//         - face/smile
//         - gestures/hands
//         - use of floor
//     - vocal variety
//         - speed
//         - volume
//         - pitch
//         - pauses
//         - articulation
//     - language
//         - words: simple/slang/jargon/technical
//         - images/vividness
//         - active vs. passive
//         - grammar
//     - structure
//         - opening: approach, hook, clear intent
//         - outline: chrono/spatial/causal/comparative/topical/problem-solving
//         - transitions
//         - closing - consise, summary, memorable/call to action
//         - overall structure
// - presentation
//     - make a point from  the speech, teach a lesson to all
//     - sandwich / CRC - commend recommend commend/conclude
//     - intro
//         - she/he showed us ..., thanks
//         - purpose of the speech
//         - summarize the speech
//     - concrete points from the speech
//     - focus on a few points in depth
//     - talk about how it impacts the audience, rather than what you would do as speaker
//     - personal opinion, personal dequalifiers, girafsprog, my point of view
//     - presentation
//         - notes - careful, not look in them much
//         - 'and', not 'but'
//         - avoid cliches
//         - job: improve the speaker, not speaking yourself
//     - start with the end in mind
// 
// ----
// Rasmus Erik 2012-03-18
// 
// {{{2 CombiGame
// CombiGame is a mobile app, web game and card game. Try it:
// 
// - [online](/solsort/#combigame) (runs in a web browser)
//     - [android version](https://play.google.com/store/apps/details?id=com.solsort.combigame)
// - as a cardgame
//     - [buy it online from TheGameCrafter](https://www.thegamecrafter.com/games/combigame)
//     - catch me in person ;) and try it or buy it (DKK 120)
// 
// Game objectives: spot combinations of three figures where color, count, shape and fill, are either the same or all different.
// 
// For example the figures in:
// 
// ![combigame combi](/img/combigame-combi.png)
// 
// are a valid combination, as they have different color, count and shape, and the same fill,
// whereas:
// 
// ![combigame invalid](/img/combigame-invalid.png)
// 
// are invalid as the color is neither all different or the same.
// 
// The card game goes as follows:
// 
// - put 12 cards on table face up
// - when a player spots a valid combination, she tap on the table to indicate that she spotted it first, and the collect the combination
// - when no valid combinations can be spotted, deal 3 more cards from the deck face up
// - when all of the deck is dealt, and no more combinations can be spotted, the player who collected most combinations won.
// 
// When played on a phone/tablet/computer, the computer deals such that there is always at least one valid combination 12 figures on the screen.
// 
// In the online version, it is possible to click on the hint-button to see examples of valid combinations.
// 
// {{{3 Credits
// 
// Rules are mostly the same as the [Set card game](http://en.wikipedia.org/wiki/Set_%28game%29), which is highly recommendable. 
// 
// The goal of the original version of CombiGame was just to play Set on the smartphone (with new graphics), - later on it expanded onto physical cards as well.
// 
// {{{2 Biblioteksting
// 
// - http://dbc-bibgraph.solsort.com
// 
// {{{2 MiniLD#36: Contrasts
// 
// Entry for [MiniLD#36](http://www.ludumdare.com/compo/2012/07/01/mini-ld-36-contrasts/).
// 
// {{{4 Try it in Chrome/Firefox at <http://solsort.com/tsar_tnoc/>.
// 
// Works in recent Chrome/Firefox/... will probably fail miserably with other browsers.
// 
// ![screenshot](/tsar_tnoc/screenshot.jpg)
// 
// 
// A simple game where you collect tokens and avoid monsters.
// 
// Goal:
// 
// - get to as high a level as possible before getting eaten
// 
// Features:
// 
// - game engine written from scratch in 4 days
// - improvised jazzy music <http://solsort.com/tsar_tnoc/audio/jazzy.ogg>
// - original odd graphics
// - procedural level generation
// - focus was more on prototyping experiment than actual game...
// 
// Source code at: <http://github.com/rasmuserik/contrast>
// 
// 
// ----
// Rasmus Erik, July 2012
// 
// {{{2 Skrivetips
// {{{3 Tommelfingerregler for skrivning
// 
// * Brug aktiv tale
// * Brug navneord og udsagnsord
// * Brug positive udsagn
// * Et emne per afsnit
//     * Start afsnittet med emnet
// * Gentag, gentag, gentag - på forskellig måde
// * Præsenter lignende ideer ens
// * Hold forfatteren i baggrunden
// * Vær forsigtig med "at være"
// * Vær forsigtig med fremmedord
// * Vær forsigtig med tillægsord
// * Fjern overflødige ord
// * Læs korrektur og omskriv
// * Skriv klart, uden overflødige detaljer
// * Brug ordrækkefølgen til at strukturere indholdet
// * Brug både visuelt, auditivt, kinestetisk og auditivt-digitalt sprog.
// 
// Vær opmærksom på:
// 
// * Formål med kommunikationen
// * Målgruppen
// * Tilgængelighed
//     * Resumé
//     * Opslagsord til indeks
//     * Nøgleord til søgning
//     * Opbygning og overskrifter
//     * Referencer og kilder
// 
// {{{3 Tekststruktur for rapporter
// 
// Skabelon og huskeliste der kan anvendes ved udarbejdelse af naturvidenskabelige rapporter, artikler og lignende. 
// 
// * Pre-tekst 
//     * _Titel, forfatter, organisation_
//     * Abstract
//     * Nøgleord, klassifikationskoder, emne
//     * Indholdsfortegnelse
//     * Forord (Formål. Målgruppe/forudsætninger. Læsevejledning. Årsag/baggrunden for dette dokument. Tak.)
// * Start-tekst 
//     * _Problemformulering_ (Hvilket problem. Hvorfor interessant. Afgrænsning.)
//     * Introduktion til emnet/litteraturen
// * Hoved-tekst
//     * _Metode_ (Hvordan løses problemet. Antagelser. Model, algoritme, analysemetode, eksperimentbeskrivelse og opstilling af hypotese. Beskrevet så andre vil kunne udføre det samme. Ingen resulater endnu.)
//     * _Resultater_ (Præsentation af resultaterne.)
//     * _Diskussion_ (Hvad betyder resultaterne. Sætte i perspektiv. Ideer til videre studier.)
// * Slut-tekst 
//     * _Konklusion_ (Hvad er resultatet af argumentationen i hovedteksten. Ingen ny information.)
// * Post-tekst 
//     * _Litteraturliste_ (Kilder.)
//     * Litteraturliste (Foreslag til videre læsning.)
//     * Noter (Hvis de ikke er placeret som fodnoter, hvilket er bedre.)
//     * Indeks
//     * Bilag
// 
// ----
// Rasmus Erik, 2005
// 
// {{{2 Privacy
// 
// Like most other websites, this site may serve you cookies, and by using it you accept that. You can disable/remove the cookies in your browser if you please.
// 
// Please protect your own privacy online!
// 
// Good tools/tips:
// - NoScript plugin
// - Ghostery
// - startpage.com
// - Using different browsers for web browsing and logged in services (google, facebook, twitter, etc.)
// 
// {{{2 HTML5
// 
// - http://solsort.com/slides/
//
//{{{2 JavaScript platform
//
// Features:
// - TypedArrays
// - SIMD: mapPar etc.
// - threads: WebWorkers
// - network: webrtc, websocket, ajax
// - graphics: canvas, webgl, dom(inkl. svg)
// - input: touch, webrtc-video-capture, geo, accel
// - performance: (hidden classes, generational GC, )
//
// Major Compilers:
// - C/C++ llvm emscripten
// - Java gwt
//
// Implementations:
// - spidermonkey+gecko
// - v8+blink|node
// - JSC+webkit
// - nashorn+java
// - chakra(ie)
