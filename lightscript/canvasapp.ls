exports.run = function(name) {
    var canvas = document.getElementById("canvas");
    require("./" + name).init({canvas : canvas});
};
