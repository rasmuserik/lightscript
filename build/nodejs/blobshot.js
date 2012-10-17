(function() {
    // outer: document
    // outer: console
    // outer: null
    // outer: Object
    // outer: Date
    // outer: Math
    // outer: window
    // outer: exports
    var blobMain;
    var animate;
    var gameOver;
    var h;
    var w;
    var canvas;
    var ctx;
    var size;
    var newBullet;
    var bullets;
    // outer: undefined
    var bulletSource;
    var score;
    // outer: true
    var running;
    var bulletSize;
    var count;
    // outer: Array
    var enemies;
    // outer: false
    var started;
    // outer: require
    var V2d;
    V2d = require("./v2d").V2d;
    // webcanvas, exports.run
    started = false;
    enemies = [];
    count = 0;
    bulletSize = 0;
    running = true;
    score = 0;
    bulletSource = undefined;
    bullets = [];
    newBullet = undefined;
    size = 100;
    ctx = undefined;
    canvas = undefined;
    w = undefined;
    h = undefined;
    gameOver = function() {
        // outer: exports
        // outer: canvas
        // outer: score
        // outer: h
        // outer: w
        // outer: size
        // outer: window
        // outer: ctx
        // outer: false
        // outer: running
        running = false;
        ctx["fillStyle"] = "#fff";
        window.setTimeout(function() {
            // outer: exports
            // outer: canvas
            // outer: score
            // outer: h
            // outer: w
            // outer: size
            // outer: ctx
            ctx["fillStyle"] = "#000";
            ctx["shadowColor"] = "#fff";
            ctx["shadowBlur"] = size;
            ctx["font"] = size * 4 + "px Sans Serif";
            ctx["textBaseline"] = "middle";
            ctx["textAlign"] = "center";
            ctx.fillText("GAME OVER", w / 2, h / 3);
            ctx.fillText("Score: " + score, w / 2, h * 2 / 3);
            canvas["onmousedown"] = function(e) {
                // outer: exports
                exports.run();
            };
        }, 1000);
    };
    animate = function(list, color) {
        // outer: Math
        // outer: h
        // outer: w
        // outer: gameOver
        // outer: size
        // outer: ctx
        // outer: Array
        var result;
        result = [];
        ctx["fillStyle"] = color;
        list.forEach(function(obj) {
            // outer: Math
            // outer: result
            // outer: h
            // outer: w
            // outer: gameOver
            // outer: size
            // outer: ctx
            ctx.beginPath();
            obj["pos"] = obj["pos"].add(obj["v"]);
            if(obj["pos"]["x"] < 0 - size) {
                gameOver.call();
            };
            if(obj["dead"] || w + size * 4 < obj["pos"]["x"] || obj["pos"]["y"] < 0 - size || h + size < obj["pos"]["y"]) {} else  {
                result.push(obj);
            };
            ctx.arc(obj["pos"]["x"], obj["pos"]["y"], obj["size"], Math["PI"] * 2, 0);
            ctx.fill();
        });
        return result;
    };
    blobMain = function() {
        // outer: true
        // outer: blobMain
        // outer: window
        // outer: bulletSource
        // outer: bullets
        // outer: console
        // outer: newBullet
        // outer: null
        // outer: animate
        // outer: V2d
        // outer: Math
        // outer: Object
        // outer: enemies
        // outer: count
        // outer: score
        // outer: h
        // outer: w
        // outer: ctx
        // outer: size
        // outer: bulletSize
        // outer: Date
        var startTime;
        // outer: undefined
        // outer: running
        if(!running) {
            return undefined;
        };
        startTime = Date.now();
        bulletSize = bulletSize + size / 40;
        ctx["fillStyle"] = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 0, w, h);
        ctx["fillStyle"] = "#fff";
        ctx["textBaseline"] = "top";
        ctx["font"] = size + "px Sans Serif";
        ctx.fillText("Score: " + score, size * 2, 0);
        count = count + 1;
        if(enemies["length"] < count / 100) {
            enemies.push({
                size : size * Math.random() + .5,
                pos : new V2d(w + size * 2, Math.random() * (h - size)),
                v : new V2d(Math.random() * size * (- 0.9), 0),
            });
        };
        enemies = animate.call(null, enemies, "#f00");
        if(newBullet) {
            console.log("newbullet");
            bullets.push({
                size : bulletSize,
                pos : bulletSource,
                v : newBullet.sub(bulletSource).norm().scale(size),
            });
            bulletSize = 1;
            score = Math.max(0, score - 1);
            newBullet = undefined;
        };
        bullets = animate.call(null, bullets, "#080");
        score;
        bullets.forEach(function(bullet) {
            // outer: true
            // outer: enemies
            // outer: score
            score;
            enemies.forEach(function(enemy) {
                // outer: score
                // outer: true
                // outer: bullet
                if(bullet["pos"].sub(enemy["pos"]).length() < bullet["size"] + enemy["size"]) {
                    bullet["dead"] = true;
                    enemy["dead"] = true;
                    score = 20 + score;
                };
            });
        });
        window.setTimeout(blobMain, Math.max(0, 50 - (Date.now() - startTime)));
    };
    canvas = ctx = w = h = undefined;
    exports.run = function() {
        // outer: console
        // outer: blobMain
        // outer: started
        // outer: newBullet
        // outer: Math
        // outer: Object
        // outer: count
        // outer: score
        // outer: bullets
        // outer: Array
        // outer: enemies
        var i;
        var wallcount;
        // outer: V2d
        // outer: bulletSource
        // outer: size
        // outer: true
        // outer: running
        // outer: w
        // outer: h
        // outer: ctx
        // outer: document
        // outer: canvas
        canvas = document.getElementById("canvas");
        canvas.onmousedown = function() {
            // outer: console
            console.log("blahblah");
        };
        ctx = canvas.getContext("2d");
        h = ctx.height = canvas.height = canvas.offsetHeight;
        w = ctx.width = canvas.width = canvas.offsetWidth;
        running = true;
        size = h / 30;
        bulletSource = new V2d(0, h / 2);
        wallcount = 30;
        i = 0;
        enemies = [];
        bullets = [];
        score = 0;
        count = 0;
        while(i <= wallcount) {
            bullets.push({
                pos : new V2d(Math.random() * size, i * h / wallcount),
                v : new V2d(0, 0),
                size : h / wallcount,
            });
            i = i + 1;
        };
        newBullet;
        canvas["onmousedown"] = function(e) {
            // outer: console
            var E;
            // outer: V2d
            // outer: newBullet
            newBullet = new V2d(e["clientX"], e["clientY"]);
            E = e;
            console.log("here!!!");
        };
        if(!started) {
            blobMain.call();
        };
    };
})();
