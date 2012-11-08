var test = {};
test.name = "";
test.error = function(description) {
    ++this.error;
    console.log(this.name + ":", description);
};
test.assertEqual = function(a, b, description) {
    description = description || "test: " + a + " !== " + b;
    if(a === b) {
        ++this.ok;
    } else  {
        this.error("assertEqual " + description);
    };
};
test.assert = function(result, description) {
    if(result) {
        ++this.ok;
    } else  {
        this.error("assert " + description);
    };
};
test.done = function() {
    console.log(this.name + ": " + this.ok + "/" + (this.ok + this.error) + " tests ok");
    this.finished = true;
    clearTimeout(this.timeout);
};
test.create = function(name, timeout) {
    var self = Object.create(test);
    self.error = self.ok = 0;
    timeout = timeout || 60000;
    self.name = this.name + name;
    self.timeout = setTimeout(function() {
        if(!self.finished) {
            self.error("test timed out after " + timeout + "ms");
            self.done();
        };
    }, timeout);
    return self;
};
var runTest = function(moduleName) {
    var module = require("./" + moduleName);
    if(!module) {
        return ;
    };
    if(module.test) {
        module.test(test.create(moduleName));
    };
};
exports.main = function() {
    require("./module").list().forEach(function(moduleName) {
        console.log(moduleName);
        runTest(moduleName);
    });
};
