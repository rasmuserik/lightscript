exports.run = function(name) {
    canvas = document.getElementById('canvas');
    require('./' + name).init({canvas: canvas});
};
