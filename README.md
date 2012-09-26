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

# Apps
TODO:
- webapi-dispatch
- sync'ed storage
    - open(owner, storageName, mergeFn);
    - get(key), set(key, val)
- file upload
- several domains with common base
    - domains
        - api.solsort.com
            - database/dynamic content.
        - solsort.com / solsort.dk
            - konsulentvirksomhed
            - list of pages, with screenshot overlayed with url and description (solsort.dk first)
        - rasmuserik.com
            - personlig side m. noter etc.
        - skolevangen.dk
        - blaagaard-kdas.dk
            - dybe links til portal.ucc.dk, webmail etc.
            - links til facebook for kdas-grupper
            - link til techtutorer.blogspot.dk
            - pad.blaagaard-kdas.dk
            - shoutbox
                - shout-text, then login via github/facebook/google
            - kalender
            - announce
        - evt. spirekor.dk
        - evt. eventyrheksen.dk
        - evt. lightscript.net
        - evt. annevoel.dk
            - evt. + galleri
        - evt. techtutor.dk
            - om techtutor
                - Hvad
                - kontakt /info
                - ...
            - kurser
        - evt. minna tegning freelance
        - evt. quiz.solsort.com
        - evt. lightscript.net
- image catalog
- content-editor
    - content editing with mercury
- static via nginx

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
    - (note:http://developers.facebook.com/html5/distribution/?_fb_noscript=1)
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

# Roadmap

- restructure: lightscript/ build/
- app: REST-api
- app: persistant storage
- check if `!(foo&&bar)`-bug still exists and fix it - bug: prefix-parenthesis
- refactor rst2js/rst2ast
- Java backend
- open source repository (filter out personal stuff, api-keys etc. from private repos)
- C backend
- syntax-bug: (function() {...})()
- syntax: for(;;)
- Static type system / type inference
- type inference

# Changelog

- 2012-09-26 working transformation from AST to LightScript RST/source code
- 2012-09-25 working JavaScript backend / code generation via RST
- 2012-09-24 working transformation from RST to AST
- 2012-09-21 merged and refactored prettyprinting into the syntax module, killing hundreds of lines of code
- 2012-09-18 app: ported code for website from JavaScript to LightScript
- 2012-09-10 working prettyprinting of RST(Raw Syntax Tree)





