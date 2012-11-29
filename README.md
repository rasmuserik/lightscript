[![ci](https://secure.travis-ci.org/rasmuserik/lightscript.png)](http://travis-ci.org/rasmuserik/lightscript)
# LightScript - not really publishable / worth looking at for others at the moment.

This language is in development and heavy flux, no need to look at it yet.

Code also interspersed with other projects.

# Version 3

Based on version 2, but limited to base library for compiler etc.

- Types
    - Dictionary (ie. Java Hashmap, Python Dict, JavaScript Object, ....)
    - Array (ie. Java Vector, Python Array, JavaScript Object, ...)
    - Number (ie. Java double/int-number-wrapper, python number, JavaScript Number, ...)
    - Function (ie. Java custom class, Python function w default value, js function, ...)
    - Class (ie. Java Class, Python class, JavaScript prototype object, ...)
    - ( Tuple (ie. Java Object Array, Python tuple, JavaScript array, ...) )
    - ( Integral types (int, byte, ...) )
    - ( range/yield )
- Library
    - file (filesystem)
    - net (a la socket.io, ...)
    - storage (key-value-store)
    - system (fork, webworker/cluster/..., ...)
    - http(s)-client+server
    - uuid
    - Math
    - RegExp
- Platforms
    - prettyprint
    - Java
    - JavaScript (NB: generate as https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API via uglify2 or similar)
    - C
    - Python
    - PHP
    - ActionScript/Flash (for IE)
- Language (restrictions from JavaScript, in initial version, waiting for other targets + macro system)
    - distinction between `foo.bar` as prototype-access (static), and `foo["bar"]` as dictionary/array-access.
    - class-patterns: `X = function(...}; X.prototype.foo = function...` is method definition and only allowed place for `this`. `X` must be static.
    - module-pattern: `modulename = require("./modulename");` is only way to access modules.
    - only `"` for strings, `'` is going to be used for quote later on.
    - control-structures: if-else, while, `&&`, `||`
    - `return` only allowed in function-top-scope (to be implemented generally later)
- AST (`kind`, `val`, `children`, `type`, `pos`)
    - `kind`: `id`, `str`, `note`, `num`, `call`, `fn`, `control`, `assign`, (`quote`, `unquote`)
    - fn: `val` is number of parameters, `children` contains parameters, then body
    - note: `val` is note/comment-string, `children` is node the note concerns
    - control: `|| p v`, `&& p v`, `?: p v v`, `if-else (p v)* v?`, `if-body v*` only in if-else-children, `while p v*`
    - assign: `val` is id as in id, child is value to assign
    - (unquote: val is optional compiletime result as json)

# LightScript Language

Intended Features:
- C-family syntax, generalised
- Easy to transform Abstract Syntax Tree
- Reversable macros 
- staged programming
- Mapping from AST back to source code
- Stong static typing, including a var/Any type (dynamic a la JavaScript values)
- Highly portable, with different backends / packaging
- Good integration with host-language (javascript/java/c/...)

Intended backends / packaging:
- JavaScript (with codemaps)
    - node-server
    - html5-app
    - (NB: mozilla ignite)
    - (note:http://developers.facebook.com/html5/distribution/?_fb_noscript=1 http://5apps.com)
    - (firefox-plugin)
    - (phonegap-app)
    - (mozilla-marketplace)
    - (chrome-plugin)
    - (chrome-app)
    - (facebook-app)
- Java
    - application
    - (servlet / google-appengine)
    - (android)
    - (j2me, nokia store, getjar)
- C
    - unix
    - TI-dev-board (embedded, limited to 64KB RAM)
    - pebble
    - (lego)
    - (arduino)
    - (iOS)
    - (symbian, nokia store)
    - (blackberry)
- (OpenCL for performance)
- (interpreted stack-language)
- (php - drupal module)

# Hacking notes
Data layers
- Raw syntax tree - generic syntax, both used for parsing, and also for generating code for c-like languages.
    - `kind` required, kind of node: `str`, `note`, `num`, `id`/anything-else
    - `val` required, data connected to the node, ie. identifier/symbol, string content, comment, or number value
    - `pos` position in the source file of the node
    - `children` required, array of child nodes
- Abstract syntax tree 
    - `kind`: `id`, `str`, `note`, `num`, `call`, `fn`, `branch`, `assign`, `block`
    - `val`: method-name on `call`, number of args on `fn`, identifier-name on `assign`
        branch-vals:`cond`, `?:`, `while`, `throw`, `return`, `||`, `&&`
    - `children`
    - `pos`

# Libs
- webapi-dispatch
- sync'ed storage
    - open(owner, storageName, mergeFn);
    - get(key), set(key, val)
## TODO
- file upload
- image catalog
- content-editor
    - content editing with mercury
- update lightscript.net

# Roadmap

- change build to build for specific platforms with extra parameter
- platform-specific code
    - remove if, if already resolved to true/false/undefined;
    - compile-time dest-platform information
    - `if(``compiler.toNodejs) { ... }`
- app-framework
- port old apps
    - timelogger
    - notescore
    - dkcities / europe version
    - `tsar_tnoc` + cute-graphics
- refactor, document and cleanup
- outerscope global should have var, - like functions
- js-codegen: make everything expression-like
- simplify AST - less branch-nodes, always with return value, ie: `(branch:|| a b)` to `(branch:cond (assign:_tmpN a) a b)` etc.
- Java backend
- macro system
- more tests and docs
- Static type system / type inference - rework type inference (including boxing) (fix bug {var x{ { { x=...}}}})
- sourcemaps
- C backend

# Changelog

- 2012-10-20 firefox-plugins as target
- 2012-10-18 small touch-based game-engine-prototype: massdrive
- 2012-10-11 staged execution: backping'ed code is run at compiletime
- 2012-10-11 refactor ast2js/ast2rst
- 2012-10-02 change module-system to be similar to commonjs + code refactoring
- 2012-10-01 public github repository + travis-ci
- 2012-10-01 first version of storage up and running
- 2012-09-30 update test-framework to new build system
- 2012-09-28 rest-api
- 2012-09-27 build system + split up in several files + fully bootstrapped (ie. syntax may now start to diverge from JS)
- 2012-09-26 working transformation from AST to LightScript RST/source code
- 2012-09-25 working JavaScript backend / code generation via RST
- 2012-09-24 working transformation from RST to AST
- 2012-09-21 merged and refactored prettyprinting into the syntax module, killing hundreds of lines of code
- 2012-09-18 app: ported code for website from JavaScript to LightScript
- 2012-09-10 working prettyprinting of RST(Raw Syntax Tree)





