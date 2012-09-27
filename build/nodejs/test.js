if(typeof require==='function'){use=require('./module').use;def=require('./module').def}else{modules=window.modules||{};def=function(name,fn){modules[name]=fn};use=function(name){if(typeof modules[name]==='function'){var exports={};modules[name](exports);modules[name]=exports;}return modules[name];};}
def("test", function(exports) {
    // outer: use
    // outer: modules
    // outer: setTimeout
    // outer: clearTimeout
    // outer: true
    // outer: console
    // outer: this
    // outer: Object
    var test;
    test = {};
    test.name = "";
    test.error = function(description) {
        // outer: console
        // outer: this
        ++this.error;
        console.log(this.name + ":", description);
    };
    test.assertEqual = function(a, b, description) {
        // outer: this
        description = description || "test: " + a + " !== " + b;
        if(a === b) {
            ++this.ok;
        } else  {
            this.error("assertEqual " + description);
        };
    };
    test.assert = function(result, description) {
        // outer: this
        if(result) {
            ++this.ok;
        } else  {
            this.error("assert " + description);
        };
    };
    test.done = function() {
        // outer: clearTimeout
        // outer: true
        // outer: this
        // outer: console
        console.log(this.name + ": " + this.ok + "/" + (this.ok + this.error) + " tests ok");
        this.finished = true;
        clearTimeout(this.timeout);
    };
    test.create = function(name, timeout) {
        // outer: setTimeout
        // outer: this
        // outer: test
        // outer: Object
        var self;
        self = Object.create(test);
        self.error = self.ok = 0;
        timeout = timeout || 60000;
        self.name = this.name + name;
        self.timeout = setTimeout(function() {
            // outer: timeout
            // outer: self
            if(!self.finished) {
                self.error("test timed out after " + timeout + "ms");
                self.done();
            };
        }, timeout);
        return self;
    };
    exports.nodemain = function() {
        // outer: test
        // outer: use
        // outer: modules
        // outer: Object
        Object.keys(modules).forEach(function(moduleName) {
            var pname;
            // outer: test
            // outer: use
            var module;
            module = use(moduleName);
            if(module.test) {
                module.test(test.create(moduleName));
            };
            pname = "test" + use("util").platform;
            if(module[pname]) {
                module[pname](test.create(use("util".platform) + ":" + moduleName));
            };
        });
    };
});
