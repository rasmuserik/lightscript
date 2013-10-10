// {{{1 Personal language, scripts and content
//
// ![](https://ssl.solsort.com/_logo.png) [![ci](https://secure.travis-ci.org/rasmuserik/lightscript.png)](http://travis-ci.org/rasmuserik/lightscript)
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
// Utility library {{{1
// {{{2 Class
isClass = function(obj, cls) {
  return typeof obj === "object" && obj.constructor === cls;
};
// System utilities {{{2
//
// We need to distinguish between the different platforms:
isNode = typeof process === "object" && typeof process["versions"] === "object" && typeof process["versions"]["node"] === "string";
isBrowser = typeof navigator === "object" && typeof navigator["userAgent"] === "string" && navigator["userAgent"].indexOf("Mozilla") !== - 1;
//
// Implementation of try..catch as a library instead of a part of the language. 
// This also has the benefit that trycatch can be used in expressions:
trycatch = Function("return function trycatch(fn,handle){try{return fn();}catch(e){return handle(e);}}")();
// Array utilities {{{2
// `arraycopy` {{{3
// Sometimes we need to create a new array, from something arraylike. Especially for turning `arguments` into a real array.
arraycopy = function(arr) {
  return Array.prototype.slice.call(arr, 0);
};
// 
// List prettyprinter{{{3
//
// Show a list with neat linebreakins, - this is especially useful for dumping the listified abstract syntax tree.
//
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
  cache = {};
  return function() {
    args = arraycopy(arguments);
    return cache[args] || (cache[args] = fn.apply(this, args));
  };
};
//
// `nextTick` {{{3
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
normaliseString = function(Str) {
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
// {{{1 Testing
// {{{2 Constructor
Tester = function(name) {
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
// {{{2 done
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
// {{{2 equals
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
// {{{2 deepEquals
Tester.prototype.deepEquals = function(a, b, msg) {
  this.equals(JSON.stringify(a), JSON.stringify(b), msg || "deepEquals error");
};
// {{{2 assert
Tester.prototype.assert = function(bool, msg) {
  this.equals(bool, true, msg || "assert error");
};
// {{{2 error
Tester.prototype.error = function(msg) {
  this.assert(false, msg || "error");
};
// {{{2 addTest
_testcases = {};
addTest = function(name, fn) {
  _testcases[name] = fn;
};
// XML / HTML {{{1
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
// {{{3 canoniseJsonml
/*
canoniseJsonml = function(jsonml) {
  if(Array.isArray(jsonml) && !isObject(jsonml[1])) {
    console.log("HERE", jsonml);
    jsonml.unshift(jsonml[0]);
    jsonml[1] = {};
    i = 2;
    while(i < jsonml.length) {
      canoniseJsonml(jsonml[i]);
      ++i;
    }
  }
}
*/
// {{{3 jsonml2xml
jsonml2xml = function(jsonml) {
  acc = [];
  jsonml2XmlAcc(jsonml, acc);
  return acc.join("");
};
// The actual implementation. As the XML-string is built by appending to the
// `acc`umulator.
jsonml2XmlAcc = function(jsonml, acc) {
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
  result = {};
  Object.keys(xmlEntities).forEach(function(key) {
    result[xmlEntities[key]] = key;
  });
  return result;
}();
// {{{3 xmlEscape - escape xml string
xmlEscape = function(str) {
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
// html template {{{3
webpage = function(content, opt) {
  // TODO: refactor/remove this function when Xml-class done
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
  return new LsXml(["html", head, ["body"].concat(content).concat([["script", {src : "/solsort.js"}, ""]])]);
};
// {{{3 test
addTest("xml", function(test) {
  test.equals(xmlEscape("foo<bar> me & blah 'helo …æøå"), "foo&lt;bar&gt; me &amp; blah &apos;helo &#8230;&#230;&#248;&#229;", "escape");
  test.deepEquals(xml2jsonml("<foo bar=\"baz\">blah<boo/><me></me></foo>"), [["foo", {bar : "baz"}, "blah", ["boo"], ["me", ""]]], "parse xml");
  test.equals(jsonml2xml(["body", ["h1", "hello"], ["br", ""], ["img", {src : "a.png"}]]), "<body><h1>hello</h1><br></br><img src=\"a.png\" /></body>", "jsonml2xml");
  test.done();
});
// LightScript Language {{{1
ls2ast = ast2ls = ast2js = undefined;
nextTick(function() {
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
  // Language implementation{{{2
  // Ast {{{3
  // Constructor {{{4
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
  // Syntax (parser and prettyprinter) {{{3
  // Syntax object {{{4
  SyntaxObj = function(ast) {
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
  // Commas and semicolons {{{4
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
  // Add var definitions {{{4
  addVars = function(ast) {
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
    result = undefined;
    if(uppercase.indexOf(match["class"][0]) !== - 1) {
      result = ast.fromList(matchReplace(match, ["fn", "new", ["block", "", ["call", ":", ["id", "this"], ["id", "?class"]], "??args"], "?body"]));
    };
    return result;
  });
  astToRstTransform(["fn", "new", ["block", "", ["call", ":", ["id", "this"], ["id", "?class"]], "??args"], "?body"], ["call", "=", ["id", "?class"], ["fn", "", ["block", "", "??args"], "?body"]]);
  // Analysis {{{3
  analyse = function(node) {
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
    source = "function(){" + source + "}";
    tokens = tokenise(source);
    ast = parse(tokens)[0];
    ast = rstToAst.recursivePostTransform(ast);
    return ast;
  };
  ast2js = function(ast) {
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
    ast = ast.deepCopy();
    ast = astToRst.recursivePreTransform(ast);
    ast = addCommas(ast);
    pp = new PrettyPrinter();
    pp.pp(ast);
    result = pp.acc.join("").split("\n").slice(1, - 1).join("\n") + "\n";
    return result;
  };
});
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
//     http://localhost:4444/#foo/world?bar=true
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
// App Dispatch {{{3
_routes = {};
route = function(name, fn) {
  _routes[name] = fn;
};
// {{{2 App
App = function(args, param) {
  this.clientId = String(Math.random()).slice(2);
  this.args = args || [];
  this.param = param || {};
};
App.prototype.log = function() {
  args = arraycopy(arguments);
  // TODO: write log to file
  args.unshift(Date.now());
  console.log.apply(console, args);
};
App.prototype.dispatch = function() {
  routeName = this.args[0].split(".")[0];
  if(routeName[0] === "_") {
    routeName = "_";
  }(_routes[routeName] || _routes["default"])(this);
};
// {{{2 CmdApp
CmdApp = function() {
  this.param = param = {};
  this.args = process.argv.slice(2).filter(function(s) {
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
CmdApp.prototype.error = function(msg) {
  throw msg;
};
CmdApp.prototype.send = function(content) {
  this.log(content);
};
CmdApp.prototype.canvas2d = function(w, h) {
  this.err("canvas not supported in CmdApp");
};
CmdApp.prototype.done = function(result) {
  if(result) {
    this.send(result);
  };
};
if(isNode) {
  nextTick(function() {
    app = new CmdApp();
    app.dispatch();
  });
};
// {{{2 WebApp
WebApp = function() {
  this.param = param = {};
  paramString = location.href.split("?")[1];
  if(paramString) {
    paramString.split("&").forEach(function(singleParam) {
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
WebApp.prototype.error = function(msg) {
  throw msg;
};
WebApp.prototype.send = function(content) {
  // TODO
  document.body.innerHTML = content;
};
WebApp.prototype.canvas2d = function(w, h) {
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
    app = new WebApp();
    app.dispatch();
  });
};
// {{{2 HttpApp
HttpApp = function(req, res) {
  this.req = req;
  this.res = res;
  this.param = req.query;
  this.headers = {};
  this.args = req.url.slice(1).split("?")[0].split("/");
  clientId = ((req.headers.cookie || "").match(RegExp("Xz=([0-9][0-9][0-9][0-9][0-9]*)")) || [])[1];
  if(!clientId) {
    clientId = ("" + Math.random()).slice(2);
    this.headers["Set-Cookie"] = "Xz=" + clientId;
  };
  this.clientId = clientId;
};
HttpApp.prototype = Object.create(App.prototype);
HttpApp.prototype.error = function(args) {
  this.res.end("Error: " + JSON.stringify(arraycopy(args)));
};
HttpApp.prototype.send = function(content) {
  if(typeof content === "string") {
    if(this.headers["Content-Type"] === "text/plain") {
      this.content = this.content + content;
    } else if(true) {
      this.content = content;
      this.headers["Content-Type"] = "text/plain";
    };
  } else if(isClass(content, LsXml)) {
    this.content = "<!DOCTYPE html>" + content.toString();
    this.headers["Content-Type"] = "text/html";
  } else if(true) {
    this.content = content;
  };
};
HttpApp.prototype.canvas2d = function(w, h) {
  this.error("not implemented");
};
HttpApp.prototype.done = function(result) {
  if(result) {
    this.send(result);
  };
  resultCode = 200;
  this.res.writeHead(resultCode, this.headers);
  this.res.end(this.content);
};
route("httpapp", function(app) {
  express = require("express");
  server = express();
  server.use(express.static(__dirname));
  server.use(function(req, res, next) {
    httpApp = new HttpApp(req, res);
    httpApp.dispatch();
  });
  port = 4444;
  server.listen(port);
  console.log("starting web server on port", port);
});
// {{{2 CallApp TODO
CallApp = function(args) {
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
CallApp.prototype.error = function(err) {
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
  app = new CallApp(arraycopy(arguments));
  app.dispatch();
};
// {{{1 Applications
// {{{2 Default
route("default", function(app) {
  if(isNode) {
    app.done(webpage([["h1", "hello"]]));
  } else if(isBrowser) {
    app.done("hi");
  };
});
route("text", function(app) {
  app.send("Hello\n");
  app.done("world");
});
// Solsort website / server {{{2
// express handler {{{3
handler = function(req, res, next) {
  if(req.url[1] === "_") {
    res.end(webpage([["h1", "hello"]]));
  } else if(true) {
    next();
  };
};
// static data {{{3
files = {};
// devserver {{{3
route("devserver", function(app) {
  call(app, "gencontent");
  express = require("express");
  server = express();
  server.use(express.static(__dirname));
  server.use(handler);
  port = 4444;
  server.listen(port);
  console.log("starting web server on port", port);
});
// gencontent
route("gencontent", function(app) {
  // TODO
  console.log(mtime("/solsort.ls"));
});
// {{{2 test
route("test", function(app) {
  foreach(_testcases, function(name, fn) {
    fn(new Tester(name));
  });
});
// pp - prepare (prettyprint+gendoc) route {{{2
//
// prettyprints file, and generates documentation.
//
route("pp", function(app) {
  app.log("prettyprinting");
  gendoc();
  loadfile("/solsort.ls", function(err, source) {
    ast = ls2ast(source);
    savefile("/../solsort.ls", ast2ls(ast));
    app.done();
  });
});
// compile and prettyprint {{{2
route("compile", function(app) {
  app.log("compiling...");
  loadfile("/solsort.ls", function(err, source) {
    ast = ls2ast(source);
    savefile("/solsort.js", ast2js(ast));
    app.done();
  });
});
route("prettyprint", function(app) {
  app.log("prettyprinting");
  loadfile("/solsort.ls", function(err, source) {
    ast = ls2ast(source);
    savefile("/solsort.pp", ast2ls(ast));
    app.done();
  });
});
// gendoc - Documentation generation {{{2
gendoc = function() {
  console.log("generating docs");
  loadfile("/solsort.ls", function(err, source) {
    lines = [];
    commentRE = RegExp("^ *// ?");
    wasCode = false;
    source.split("\n").forEach(function(line) {
      if(line.match(commentRE)) {
        line = line.replace(commentRE, "");
        line = line.replace(RegExp("(.*){" + "{{([0-9])(.*)"), function(_, pre, header, post) {
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
// {{{1 Notes
// 
// These notes are articles, that will automatically be convereted to articles on the solsort.com website.
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
