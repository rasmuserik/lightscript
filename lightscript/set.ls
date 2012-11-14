// Set functions based on hashmaps;
exports.fromArray = function(arr) {
    var result = {};
    arr.forEach(function(elem) {
        result[elem] = true;
    });
    return result;
};
