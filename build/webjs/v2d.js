exports.V2d = V2d = function(x, y) {
    // outer: this
    this.x = x;
    this.y = y;
};
V2d.prototype.add = function(v) {
    // outer: this
    // outer: V2d
    return new V2d(this.x + v.x, this.y + v.y);
};
V2d.prototype.sub = function(v) {
    // outer: this
    // outer: V2d
    return new V2d(this.x - v.x, this.y - v.y);
};
V2d.prototype.scale = function(a) {
    // outer: this
    // outer: V2d
    return new V2d(this.x * a, this.y * a);
};
V2d.prototype.length = function() {
    // outer: this
    // outer: Math
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
V2d.prototype.dot = function(v) {
    // outer: this
    return this.x * v.x + this.y * v.y;
};
V2d.prototype.norm = function() {
    // outer: this
    var len;
    len = this.length();
    return this.scale(len ? 1 / len : 0);
};
