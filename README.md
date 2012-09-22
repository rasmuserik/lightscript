# General

# Solsort
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

# Intended backends

- JavaScript
    - node-server
    - firefox-plugin
    - chrome-app
    - facebook-app
    - html5-app
    - phonegap-app
- Java
    - servlet / google-appengine
    - PC application
    - android
- C or llvm
    - pebble
    - TI-dev-board
    - lego
    - arduino
    - iOS
    - unix

# LightScript Language
New version of lightscript in progress

## TODO
- bug: prefix-parenthesis
- token/rst-rename symbol,,number,... id,num,str,comment 
- rst2sst
- sst2rst
- type inference
- sst2js
- sst2java
- js-syntax
    - (function() {...})()
    - for(;;)

## (Intended) Features

- C-family syntax, generalised
- Two levels of Abstract Syntax Tree
- Reversable macros
- Mapping from AST back to source code
- Stong static typing, including a var type (dynamic a la JavaScript values)
- Different backends
    - JavaScript (web including codemaps)
    - Java (server, desktop, android, (ios))
    - C (embedded systems, running in less than 64KB of RAM)
    - (OpenCL for computation)

## Internal

Stages
- Tokenisation (implemented)
- Parsing to raw syntax (implemented)
- Macro transformation rst2ast (implemented)
- Macro transformation ast2sst
- Macro transformation sst2ast
- sst2js

Data representations
- LightScript source code
- Raw syntax tree - generic syntax 
    - `kind` required, kind of node: `id`, `str`, `note`, `num`
    - `val` required, data connected to the node, ie. identifier/symbol, string content, comment, or number value
    - `pos` position in the source file of the node
    - `children` required, array of child nodes
- Simplified syntax tree 
    - `kind`: `id`, `str`, `note`, `num`, `call`, `fn`, `branch`, `assign`, `block`
    - `val`: method-name on `call`, number of args on `fn`, branch-type(`cond`, `while`, ...) on `branch`, identifier-name on `assign`
    - `type`
    - `children`
    - `pos`
- Stack language
- Executable
