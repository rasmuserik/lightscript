module.exports = function(fn, handle) {
    try {
        return fn();
    } catch(e) {
        return handle(e);
    }
}
