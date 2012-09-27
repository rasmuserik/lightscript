def("test", function(exports) {
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
    exports.nodemain = function() {
        Object.keys(modules).forEach(function(moduleName) {
            var module = use(moduleName);
            if(module.test) {
                module.test(test.create(moduleName));
            };
            var pname = "test" + use("util").platform;
            if(module[pname]) {
                module[pname](test.create(use("util".platform) + ":" + moduleName));
            };
        });
    };
});
