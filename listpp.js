var listpp = function(list, acc, indent) {
    if (! acc) {
        acc = [];
        listpp(list, acc, 0);
        return acc . join("");
    };
    if (list . constructor !== Array) {
        var str = '' + list;
        acc . push(str);
        return str . length;
    };
    var len = 1;
    acc . push("[");
    var seppos = [];
    var first = true;
    var i = 0;
    while (i < list . length) {
        if (! first) {
            seppos . push(acc . length);
            acc . push("");
        };
        len = len + 1 + listpp(list[i], acc, indent + 1);
        first = false;
        i = i + 1;
    };
    var nspace = function (n) {
        var result = "";
        while (n > 0) {
            result = result + " ";
            n = n - 1;
        };
        return result;
    };
    var sep;
    if (len > 130 - indent) {
        sep = ",\n" + nspace(indent);
    } else {
        sep = ", ";
    };
    i = 0;
    while (i < seppos . length) {
        acc[seppos[i]] = sep;
        i = i + 1;
    };
    acc . push("]");
    return len;
};
module.exports = listpp;
