if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
def("storage", function(exports) {
    // outer: Object
    exports.restSet = function(rest) {
        // outer: Object
        rest.send({"err" : "set not implemented yet"});
    };
    exports.restSince = function(rest) {
        // outer: Object
        rest.send({"err" : "since not implemented yet"});
    };
    exports.restGet = function(rest) {
        // outer: Object
        rest.send({"err" : "get not implemented yet"});
    };
});
