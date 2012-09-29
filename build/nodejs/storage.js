if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
def("storage", function(exports) {
    // outer: Object
    // outer: use
    var util;
    util = use("util");
    exports.restapi = function(args, rest) {
        // outer: Object
        rest.done({"restapi" : args});
    };
});
