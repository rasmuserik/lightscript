# LightScript
New version of lightscript in progress

## TODO
- prettyprinter
- split syntax into syntax, parser and prettyprinter
- fix pos in tokeniser
- ast2sst
- sst2ast
- type inference
- sst2js
- sst2java

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
        - method-invocations
            - most things are method invocations, including subscript, comparison, fn-call, assignment, throw
        - if-else
            - includes or/and
        - do-while
        - code blocks
        - function-closure
        - assignment
        - literals (string, num, array)
- Stack language
- Executable

