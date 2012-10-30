exports.V2d = var V2d = function(x, y) {
    this.x = x;
    this.y = y;
};
V2d.prototype.add = function(v) {
    return new V2d(this.x + v.x, this.y + v.y);
};
V2d.prototype.sub = function(v) {
    return new V2d(this.x - v.x, this.y - v.y);
};
V2d.prototype.scale = function(a) {
    return new V2d(this.x * a, this.y * a);
};
V2d.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
V2d.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y;
};
V2d.prototype.norm = function() {
    var len = this.length();
    return this.scale(len ? 1 / len : 0);
};
V2d.prototype.dist = function(v) {
    d = this.sub(v);
    return Math.sqrt(d.dot(d));
}
V2d.prototype.neg = function(v) {
    return new V2d(-this.x, -this.y);
};
