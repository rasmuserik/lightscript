// outer: true
// outer: Object
// outer: exports
// Set functions based on hashmaps;
exports.fromArray = function(arr) {
    // outer: true
    // outer: Object
    var result;
    result = {};
    arr.forEach(function(elem) {
        // outer: true
        // outer: result
        result[elem] = true;
    });
    return result;
};
