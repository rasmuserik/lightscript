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
        - evt. spirekor.dk
        - evt. eventyrheksen.dk
        - evt. lightscript.net
        - evt. annevoel.dk
            - evt. + galleri
        - evt. techtutor.dk
        - evt. minna tegning freelance
        - evt. quiz.solsort.com
        - evt. lightscript.net
- image catalog
- content-editor
    - content editing with mercury
- static via nginx

# LightScript Language
New version of lightscript in progress

## TODO
- bug: prefix-parenthesis
- ast2sst
- sst2ast
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
    - `kind` required, kind of node: `symbol`, `identifier`, `string`, `comment`, `number`
    - `val` required, data connected to the node, ie symbol/identifier/string/...
    - `infix` optional, true if this node comes from an infix operation, ie. `children[0]` is to the right of the node
    - `pos` position in the source file of the node
    - `children` required, array of child nodes
- Advanced syntax tree - tree which is prettyprinted
    - `kind`: `call`, `identifier`, `string`, `annotation`, `number`, `block`
    - `val`: method-name on `call`, value on `identifier`, `string`, `annotation` and `number`
    - `children`
    - `pos`
- Simplified syntax tree - cleaned up for code generation
    - language elements
        - annotation (first child skipped, second child emitted)
        - method-invocations
            - most things are method invocations, including subscript, comparison, fn-call, throw
        - if-else
            - includes or/and
        - while
        - code blocks
        - function-closure
        - identifier (resolution)
        - assignment (identifier)
        - literals (string, num)
- Stack language
- Executable

