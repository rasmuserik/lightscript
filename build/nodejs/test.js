
modules = modules;
platform = require("./util").platform;
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
runTest = function(moduleName) {
    // outer: require
    var pname;
    // outer: platform
    // outer: test
    // outer: ;
    // outer: use
    var module;
    module = use(moduleName);
    if(!module) {
        return ;
    };
    if(module.test) {
        module.test(test.create(moduleName));
    };
    if(module[platform + test]) {
        module.test(test.create(moduleName + "-" + platform));
    };
    pname = "test" + require("./util").platform;
    if(module[pname]) {
        module[pname](test.create(require("./util".platform) + ":" + moduleName));
    };
};
exports.main = function() {
    // outer: runTest
    // outer: console
    // outer: require
    require("./module").list().forEach(function(moduleName) {
        // outer: runTest
        // outer: console
        console.log(moduleName);
        runTest(moduleName);
    });
};
