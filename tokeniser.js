!function(){
/*globals exports:true*/
'use strict';

var createToken = function(kind, val, pos) {
    return {
        kind: kind, 
        val: val,
        pos: pos
    };
};

exports.tokenise = function(buffer) {
    var pos = 0;
    var start;
    var lineno = 0;
    
    var one_of = function(str) {
        return str.indexOf(peek()) !== -1;
    }
    
    var starts_with = function(str) {
        return peek(str.length) === str;
    }
    
    var peek = function(n, delta) {
        n = n || 1;
        delta = delta || 0;
        return buffer.slice(pos+delta, pos+delta+n);
    }
    
    var pop = function(n) {
        n = n || 1;
        var result = buffer.slice(pos, pos+n);
        result.split('').forEach(function(c) {
            if(c === '\n') {
                ++lineno;
            }
        });
        pos += n;
        return result;
    }
    
    var begin_token = function() {
        start = {lineno: lineno, pos: pos};
    }
    
    var newToken = function(kind, val) {
        var result = createToken(kind, val, {start: start, end: {lineno: lineno, pos: pos} });
        return result;
    }
    
    var next = function() {
        var whitespace = ' \t\r\n';
        var single_symbol = '(){}[]:;,`?';
        var joined_symbol = '=+-*/<>%!|&^~#.@';
        var ident = '_qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM$';
        var digits = '0123456789';
        var hexdigits = digits + 'abcdefABCDEF';
        var s;
        var c;
        var quote;
    
        // repeat until token parsed
        while(true) {
    
            // Keep track of postion
            begin_token();
    
            // End of file
            if(peek() === '') {
                return undefined;

            // Whitespace
            } else if(one_of(whitespace)) {
                pop();
    
            // // Comment
            } else if(starts_with('//')) {
                s = '';
                while(peek() && peek() !== '\n') {
                    s += pop();
                }
                s += pop();
                return newToken('comment', s);

            // /* Comment
            } else if(starts_with('/*')) {
                s = '';
                while(peek() && peek(2) !== '*/') {
                    s += pop();
                }
                s += pop(2);
                return newToken('comment', s);
    
            // String
            } else if(one_of('\'"')) {
                s = quote = pop();
                while(!starts_with(quote)) {
                    c = pop();
                    if(c === '\\') {
                        c = pop();
                        c = {'n': '\n', 'r': '\r', 't': '\t'}[c] || c;
                    }
                    s += c;
                }
    
                // remove end-quote
                s += pop();
                return newToken('string', s);
    
            // Number
            } else if(one_of(digits) || (peek() === '.' && digits.indexOf(peek(1,1)) !== -1)) {
                s = pop();
    
                // normal or hexadecimal
                if(peek() !== 'x') {
                    while(peek() && one_of('.e' + digits)) {
                        s += pop();
                    }
                } else {
                    s = pop(2);
                    while(peek() && one_of(hexdigits)) {
                        s += pop();
                    }
                }
                return newToken('number', s);
    
            // Symbol
            } else if(one_of(single_symbol)) {
                return newToken('symbol', pop());
            } else if(one_of(joined_symbol)) {
                s = '';
                while(peek() && one_of(joined_symbol)) {
                    s += pop();
                }
                return newToken('symbol', s);
    
            // Identifier
            } else if(one_of(ident)) {
                s = '';
                while(peek() && one_of(ident + digits)) {
                    s += pop();
                }
                return newToken('identifier', s);
    
            } else {
                throw 'Tokenisation error: ' + peek().charCodeAt(0) + ' (' + peek() + ') at pos ' + pos;
            }
        }
    }
    var result = [];
    var token = next();
    while(token) {
        result.push(token);
        token = next();
    }
    return result;
};

}();
