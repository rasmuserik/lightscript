var files;
var handler;
var webpage;
var ast2ls;
var ast2js;
var ls2ast;
var analyse;
var uppercase;
var addVars;
var addCommas;
var astTransform;
var astToRstTransform;
var rstToAstTransform;
var astToRst;
var rstToAst;
var matchReplace;
var noSeps;
var notSep;
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
var routes;
var jsonml2xml;
var xmlEscape;
var savefile;
var loadfile;
var mtime;
var foreach;
var extendExcept;
var extend;
var normaliseString;
var sleep;
var nextTick;
var memoise;
var id;
var pplist;
var arraycopy;
var trycatch;
var isBrowser;
var isNode;
// {{{1 Personal language, scripts and content
//
// ![](https://ssl.solsort.com/_logo.png) [![ci](https://secure.travis-ci.org/rasmuserik/lightscript.png)](http://travis-ci.org/rasmuserik/lightscript)
//
// Warning: this is a personal project, look at it on own risk. Not intended for other to work with (but feel free to peek at it nontheless).
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
// Utility library {{{1
//
// System utilities {{{2
//
// We need to distinguish between the different platforms:
isNode = typeof process === "object" && typeof process["versions"] === "object" && typeof process["versions"]["node"] === "string";
isBrowser = typeof navigator === "object" && typeof navigator["userAgent"] === "string" && navigator["userAgent"].indexOf("Mozilla") !== - 1;
//
// Implementation of try..catch as a library instead of a part of the language. 
//
// This also has the benefit that trycatch can be used in expressions.
trycatch = Function("return function trycatch(fn,handle){try{return fn();}catch(e){return handle(e);}}")();
//
// Array utilities {{{2
//
// Create a new array, from something arraylike, also useful for turning `arguments` into a real array {{{3
arraycopy = function(arr) {
  return Array.prototype.slice.call(arr, 0);
};
// 
// Prettyprint a list {{{3
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
//
// Function utilities {{{2
//
// Identity function {{{3
id = function(x) {
  return x;
};
//
// Memoise a function {{{3
memoise = function(fn) {
  var cache;
  cache = {};
  return function() {
    var args;
    args = arraycopy(arguments);
    return cache[args] || (cache[args] = fn.apply(this, args));
  };
};
//
// `nextTick` utility function  {{{3
if(isNode) {
  nextTick = process.nextTick;
} else if(true) {
  nextTick = function(fn) {
    setTimeout(fn, 0);
  };
};
// 
// `sleep` better syntax for setTimeout, with seconds instead of ms {{{3
sleep = function(s, fn) {
  return setTimeout(fn, s * 1000);
};
//
// String utilities {{{2
//
// Create a url-friendly string {{{3
normaliseString = function(Str) {
  return String(str).toLowerCase().replace("æ", "ae").replace("ø", "o").replace("å", "aa").replace(RegExp("[^a-zA-Z0-9]+", "g"), "-");
};
// Object utilities {{{2
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
// foreach {{{2
foreach = function(obj, fn) {
  Object.keys(obj).forEach(function(key) {
    fn(key, obj[key]);
  });
};
// files {{{2
// mtime {{{3
if(isNode) {
  mtime = function(fname) {
    return trycatch(function() {
      return require("fs").statSync(__dirname + fname).mtime.getTime();
    }, function() {
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
// savefile {{{3
savefile = function(filename, content, callback) {
  if(isNode) {
    require("fs").writeFile(__dirname + filename, content, callback);
  };
  if(isBrowser) {
    console.log("savefile", filename, content);
    throw "not implemented";
  };
};
// XML {{{2
xmlEscape = function(str) {
  return str.replace(RegExp("&", "g"), "&amp;").replace(RegExp("<", "g"), "&lt;");
};
jsonml2xml = function(jsonml) {
  var pos;
  var result;
  if(typeof jsonml === "string") {
    return xmlEscape(jsonml);
  };
  if(typeof jsonml === "number") {
    return String(jsonml);
  };
  result = "<" + jsonml[0];
  pos = 2;
  if(jsonml[1] && jsonml[1].constructor === Object) {
    console.log("HERE", jsonml[1]);
    foreach(jsonml[1], function(key, val) {
      result = result + (" " + key + "=\"" + val + "\"");
    });
  } else if(true) {
    pos = 1;
  };
  if(pos === jsonml.length) {
    return result + "/>";
  };
  result = result + ">";
  while(pos < jsonml.length) {
    result = result + jsonml2xml(jsonml[pos]);
    pos = pos + 1;
  };
  return result + ("</" + jsonml[0] + ">");
};
// App Dispatch {{{1
routes = {};
routes["default"] = function() {
  console.log("default route");
};
nextTick(function() {
  var app;
  var args;
  if(isNode) {
    args = process.argv.slice(2).filter(function(arg) {
      return arg[0] !== "-";
    });
  } else if(isBrowser) {
    args = (location.hash || location.pathname).slice(1).split("/");
  };
  app = new App({args : args});
  (routes[args[0]] || routes["default"])(app);
});
App = function(opt) {
  this.args = opt.args;
};
// LightScript Language {{{1
//
// {{{2 Notes
// This language is in development and heavy flux, no need to look at it yet.
// 
// Code also interspersed with other projects.
// 
// # Why
// 
// I want 
// - reusable code across different platforms: JavaScript, Java, embedded C, (Python, PHP, ...).
// - closures, first class functions, types, extensible syntax(operator overloading etc.) ...
// - treat code as data, staged computation, ...
// 
// Design critierias:
// - KISS - Keep It Simple
// - Friendly abstract syntax tree.
// - Minimal abstraction of host language.
// - Bijective mapping between AST and prettyprinted source.
// 
// # Version 3
// 
// Milestones:
// - Prettyprint itself (running on lightscript2)
// - Run itself on Java (running on lightscript2)
// - Run itself on JavaScript
// - Run itself on C
// 
// Based on version 2, but limited to base library for compiler etc.
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
//     - storage (key-value-store)
//     - system (fork, webworker/cluster/..., ...)
//     - http(s)-client+server
//     - uuid
//     - Math
//     - RegExp
// - Platforms
//     - prettyprint
//     - Java (source or bytecode)
//     - JavaScript (NB: generate as https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API via uglify2 or similar)
//     - C (or llvm)
//     - Python
//     - PHP
//     - ActionScript/Flash (for IE)
// - Language (restrictions from JavaScript, in initial version, waiting for other targets + macro system)
//     - distinction between `foo.bar` as prototype-access (static), and `foo["bar"]` as dictionary/array-access.
//     - class-patterns: `X = function(...}; X.prototype.foo = function...` is method definition and only allowed place for `this`. `X` must be static.
//     - module-pattern: `modulename = require("./modulename");` is only way to access modules.
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
// # LightScript Language
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
//     - application
//     - (servlet / google-appengine)
//     - (android)
//     - (j2me, nokia store, getjar)
// - C
//     - unix
//     - TI-dev-board (embedded, limited to 64KB RAM)
//     - pebble
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
// # Hacking notes
// Data layers
// - Raw syntax tree - generic syntax, both used for parsing, and also for generating code for c-like languages.
//     - `kind` required, kind of node: `str`, `note`, `num`, `id`/anything-else
//     - `val` required, data connected to the node, ie. identifier/symbol, string content, comment, or number value
//     - `pos` position in the source file of the node
//     - `children` required, array of child nodes
// - Abstract syntax tree 
//     - `kind`: `id`, `str`, `note`, `num`, `call`, `fn`, `branch`, `assign`, `block`
//     - `val`: method-name on `call`, number of args on `fn`, identifier-name on `assign`
//         branch-vals:`cond`, `?:`, `while`, `throw`, `return`, `||`, `&&`
//     - `children`
//     - `pos`
// 
// # Libs
// - webapi-dispatch
// - sync'ed storage
//     - open(owner, storageName, mergeFn);
//     - get(key), set(key, val)
// ## TODO
// - file upload
// - image catalog
// - content-editor
//     - content editing with mercury
// - update lightscript.net
// 
// # Roadmap
// 
// - change build to build for specific platforms with extra parameter
// - platform-specific code
//     - remove if, if already resolved to true/false/undefined;
//     - compile-time dest-platform information
//     - `if(``compiler.toNodejs) { ... }`
// - app-framework
// - port old apps
//     - timelogger
//     - notescore
//     - dkcities / europe version
//     - `tsar_tnoc` + cute-graphics
// - refactor, document and cleanup
// - outerscope global should have var, - like functions
// - js-codegen: make everything expression-like
// - simplify AST - less branch-nodes, always with return value, ie: `(branch:|| a b)` to `(branch:cond (assign:_tmpN a) a b)` etc.
// - Java backend
// - macro system
// - more tests and docs
// - Static type system / type inference - rework type inference (including boxing) (fix bug {var x{ { { x=...} } } })
// - sourcemaps
// - C backend
// 
// Notes {{{2
// TODO:
//
// code analysis
// java-backend
// generalise tree matcher 
// - transform functions between tree and arbitrary object
// - match filter
// refactor/cleanup, ie. id-function/filter/... in rst-ast-matcher
//
//
// Node types
// - call
// - fn
// - block
// - note
// - assign
// - branch
// - id
// - str
// - num
//
// Language implementation{{{2
// Ast {{{3
// Constructor {{{4
Ast = function(kind, val, children, pos) {
  this.kind = kind;
  this.val = val || "";
  this.children = children || [];
  this.pos = pos;
  this.opt = {};
  this.parent = undefined;
};
// Ast.create {{{4
Ast.prototype.create = function(kind, val, children) {
  return new Ast(kind, val, children, this.pos);
};
// Ast.isa {{{4
Ast.prototype.isa = function(kind, val) {
  return this.kind === kind && this.val === val;
};
// Ast.deepCopy {{{4
Ast.prototype.deepCopy = function() {
  return new Ast(this.kind, this.val, this.children.map(function(child) {
    return child.deepCopy();
  }), this.pos);
};
// Ast.toList {{{4
Ast.prototype.toList = function() {
  var result;
  result = this.children.map(function(node) {
    return node.toList();
  });
  result.unshift(this.val);
  result.unshift(this.kind);
  return result;
};
// Ast.toString {{{4
Ast.prototype.toString = function() {
  return pplist(this.toList());
};
// Ast.fromList {{{4
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
// Ast.error {{{4
Ast.prototype.error = function(desc) {
  throw "Error: " + desc + " at pos: " + JSON.stringify(this.pos);
};
// Ast Matcher {{{3
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
// Tokeniser {{{3
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
// Syntax (parser and prettyprinter) {{{3
// Syntax object {{{4
SyntaxObj = function(ast) {
  var syntaxData;
  this.ast = ast;
  syntaxData = table[ast.kind + ":"] || table[ast.val] || (ast.val && table[ast.val[ast.val.length - 1]]) || table["default:"];
  this.bp = syntaxData[0] || 0;
  this.opt = syntaxData[1] || {};
};
// Parser {{{4
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
// Prettyprinter {{{4
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
PrettyPrinter.prototype.pp = function(ast, bp) {
  var syn;
  var bp;
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
// Syntax definition {{{4
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
// Transformations of syntax tree (RST to/from AST) {{{3
// Setup {{{4
notSep = function(ast) {
  return ast.kind !== "id" || (ast.val !== ";" && ast.val !== ",");
};
noSeps = function(list) {
  return list.filter(notSep);
};
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
rstToAst = new Matcher();
astToRst = new Matcher();
rstToAstTransform = function(from, to, filter) {
  var filter;
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
// Commas and semicolons {{{4
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
// transformations {{{4
rstToAstTransform(["call", "*{}", ["id", "module"], "??body"], ["call", "*()", ["fn", "", ["block", ""], ["block", "", "??body"]]]);
astTransform(["call", "||", "?p1", "?p2"], ["branch", "||", "?p1", "?p2"]);
astTransform(["call", "&&", "?p1", "?p2"], ["branch", "&&", "?p1", "?p2"]);
astTransform(["call", "=", ["call", "*[]", "?obj", "?idx"], "?val"], ["call", "*[]=", "?obj", "?idx", "?val"]);
astTransform(["call", "=", ["call", ".", "?obj", "?member"], "?val"], ["call", ".=", "?obj", "?member", "?val"]);
astTransform(["call", "throw", "?result"], ["branch", "throw", "?result"]);
astTransform(["call", "return", "?result"], ["branch", "return", "?result"]);
astTransform(["call", "typeof", "?result"], ["call", "typeof", "?result"]);
astTransform(["call", "var", "?result"], ["call", "var", "?result"]);
astTransform(["call", "*()", "??args"], ["call", "*()", "??args"]);
astTransform(["call", ".", "?obj", ["id", "?id"]], ["call", ".", "?obj", ["str", "?id"]]);
astTransform(["call", "*{}", ["call", "*()", ["id", "function"], "??args"], "??body"], ["fn", "", ["block", "", "??args"], ["block", "", "??body"]]);
astTransform(["call", "*{}", ["call", "*()", ["id", "while"], "?cond"], "??body"], ["branch", "for", ["block", ""], "?cond", ["block", "", "??body"]]);
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
  var result;
  var prio;
  prio = (table[match["method"]] || [])[0];
  if(prio) {
    result = undefined;
  } else if(true) {
    result = ast.fromList(matchReplace(match, ["call", "*()", ["call", ".", "?obj", ["id", "?method"]], "??args"], noSeps));
  };
  return result;
});
// Array and HashMap Literals {{{4
rstToAstTransform(["id", "[", "??elems"], ["call", "new", ["id", "Vector"], "??elems"]);
astToRst.pattern(["call", "new", ["id", "Vector"], "??elems"], function(match, ast) {
  var elems;
  elems = [];
  match["elems"].forEach(function(elem) {
    elems.push(elem);
  });
  return ast.fromList(["id", "["].concat(elems));
});
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
astToRst.pattern(["call", "new", ["id", "HashMap"], "??elems"], function(match, ast) {
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
astToRst.pattern(["branch", "cond", "??branches"], function(match, ast) {
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
// Analysis {{{3
analyse = function(node) {
  var subanalysis;
  var parentFn;
  var vars;
  var fns;
  // Accumulators {{{4
  fns = [];
  vars = {};
  node.opt["vars"] = vars;
  // arguments{{{4
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
  // Analyse subtree {{{4
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
  // Analyse subfunctions {{{4
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
  ast = astToRst.recursivePreTransform(ast);
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
  ast = astToRst.recursivePreTransform(ast);
  ast = addCommas(ast);
  pp = new PrettyPrinter();
  pp.pp(ast);
  result = pp.acc.join("").split("\n").slice(1, - 1).join("\n") + "\n";
  return result;
};
// routes {{{2
routes["compile"] = function() {
  console.log("compiling...");
  loadfile("/solsort.ls", function(err, source) {
    var ast;
    ast = ls2ast(source);
    savefile("/solsort.js", ast2js(ast));
  });
};
routes["pp"] = function() {
  console.log("prettyprinting");
  loadfile("/solsort.ls", function(err, source) {
    var ast;
    ast = ls2ast(source);
    savefile("/../solsort.ls", ast2ls(ast));
  });
};
routes["prettyprint"] = function() {
  console.log("prettyprinting");
  loadfile("/solsort.ls", function(err, source) {
    var ast;
    ast = ls2ast(source);
    savefile("/solsort.ls", ast2ls(ast));
  });
};
// Solsort website / server {{{1
// html template {{{2
webpage = function(content, opt) {
  var head;
  var opt;
  opt = opt || {};
  head = ["head"];
  head.push(["title", opt.title || "solsort.com"]);
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
  return "<!DOCTYPE html>" + jsonml2xml(["html", head, ["body"].concat(content).concat([["script", {src : "/solsort.js"}, ""]])]);
};
// express handler {{{2
handler = function(req, res, next) {
  if(req.url[1] === "_") {
    res.end(webpage([["h1", "hello"]]));
  } else if(true) {
    next();
  };
};
// static data {{{2
files = {};
// routes {{{2
routes["devserver"] = function(app) {
  var port;
  var server;
  var express;
  routes["content"](app);
  express = require("express");
  server = express();
  server.use(express.static(__dirname));
  server.use(handler);
  port = 4444;
  server.listen(port);
  console.log("starting web server on port", port);
};
routes["content"] = function(app) {
  console.log(mtime("/solsort.ls"));
  // TODO
  };
// Applications {{{1
// Documentation generation {{{2
routes["gendoc"] = function(app) {
  console.log("generating docs");
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
        line = line.replace(RegExp("(.*){{{([0-9])(.*)"), function(_, pre, header, post) {
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
    savefile("/../README.md", lines.join("\n"));
  });
};
