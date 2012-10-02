[![ci](https://secure.travis-ci.org/rasmuserik/lightscript.png)](http://travis-ci.org/rasmuserik/lightscript)
# LightScript - not really publishable / worth looking at for others at the moment.

This language is in development and heavy flux, no need to look at it yet.

Code also interspersed with other projects.

# LightScript Language

Intended Features:
- C-family syntax, generalised
- Easy to transform Abstract Syntax Tree
- Reversable macros 
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

- app: replace server.ls with publish.ls
- macro system
    - pattern matching
    - pre-macros with possible break, child-apply, post-macros
    - refactor rst2js/rst2ast
    - syntax: for(;;)
- Java backend
- more tests and docs
- Static type system / type inference - rework type inference (including boxing) (fix bug {var x{ { { x=...}}}})
- sourcemaps
- C backend

# Changelog

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





