exports.nodemain = function() {
    console.log(process.cwd() + '/build/cfx');
    require('child_process').exec("cfx run", {cwd: process.cwd() + '/build/cfx'});
}
