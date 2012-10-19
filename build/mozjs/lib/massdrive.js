(function() {
    // outer: document
    // outer: setTimeout
    // outer: console
    // outer: false
    // outer: true
    // outer: Math
    // outer: exports
    var mouseup;
    var mousemove;
    var mousedown;
    var mousemoves;
    var mouse;
    var prevTime;
    var gameloop;
    var collisiontest;
    var psize;
    var y0;
    var x0;
    // outer: Date
    var lastTime;
    var map;
    var mapData;
    var newParticle;
    var tiles;
    // outer: Object
    var player;
    // outer: Array
    var particles;
    // outer: undefined
    var h;
    var w;
    var ctx;
    var canvas;
    // outer: require
    var V2d;
    V2d = require("./v2d").V2d;
    canvas = ctx = w = h = undefined;
    particles = [];
    player = {
        p : new V2d(32, 32),
        v : new V2d(0, 0),
        a : new V2d(0, 0),
    };
    tiles = {};
    newParticle = function(p, v) {
        // outer: Object
        // outer: particles
        particles.push({
            p : p,
            v : v,
            life : 100,
        });
    };
    mapData = {};
    map = function(x, y) {
        // outer: false
        // outer: true
        // outer: Math
        // outer: Object
        // outer: map
        var data;
        data = map[(x & ~63) + "," + (y & ~63)];
        if(!data) {
            map[(x & ~63) + "," + (y & ~63)] = data = {filled : Math.random() < .1 ? true : false};
        };
        return data;
    };
    lastTime = Date.now();
    x0 = y0 = 0;
    psize = 10;
    collisiontest = function() {
        // outer: h
        // outer: w
        // outer: ctx
        // outer: V2d
        // outer: psize
        // outer: player
        // outer: map
        // outer: Array
        // outer: tiles
        // outer: particles
        particles.forEach(function(particle) {
            // outer: h
            // outer: w
            // outer: ctx
            // outer: psize
            // outer: player
            // outer: map
            if(map(particle.p.x, particle.p.y).filled) {
                particle.life = 0;
            };
            if(player.p.x - psize < particle.p.x && particle.p.x < player.p.x + psize) {
                if(player.p.y - psize < particle.p.y && particle.p.y < player.p.y + psize) {
                    ctx.fillStyle = "rgba(255,0,0," + particle.life * .005 + ")";
                    ctx.fillRect(0, 0, w, h);
                    particle.life = 0;
                };
            };
        });
        tiles = [];
        tiles.push(map(player.p.x + psize, player.p.y + psize));
        tiles.push(map(player.p.x + psize, player.p.y - psize));
        tiles.push(map(player.p.x - psize, player.p.y + psize));
        tiles.push(map(player.p.x - psize, player.p.y - psize));
        if(tiles[0].filled || tiles[1].filled || tiles[2].filled || tiles[3].filled) {
            player.p = player.p.sub(player.v);
            player.v = new V2d(0, 0);
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.fillRect(0, 0, w, h);
        };
    };
    gameloop = function() {
        // outer: false
        // outer: true
        // outer: map
        // outer: gameloop
        // outer: setTimeout
        // outer: Date
        // outer: prevTime
        // outer: collisiontest
        // outer: Object
        var particleLifeList;
        var y;
        var x;
        var ys;
        // outer: Array
        var xs;
        // outer: y0
        // outer: psize
        // outer: x0
        // outer: h
        // outer: w
        // outer: ctx
        // outer: V2d
        // outer: player
        var particle;
        // outer: particles
        // outer: Math
        // outer: console
        var i;
        // outer: mouse
        var shootright;
        var shootleft;
        var shootdown;
        var shootup;
        var shootblur;
        var shootpower;
        var shoot;
        //
        // world update
        // 
        shoot = function(x, y, vx, vy) {
            // outer: player
            // outer: particles
            // outer: Math
            // outer: V2d
            // outer: Object
            var newParticle;
            newParticle = {
                p : new V2d(x, y),
                v : new V2d(vx, vy),
                life : Math.random() * 100,
            };
            particles.push(newParticle);
            player.a = player.a.sub(newParticle.v.scale(newParticle.life * 0.001));
            newParticle.v = newParticle.v.add(player.v);
        };
        shootpower = function() {
            // outer: Math
            return 10 + Math.random() * 20;
        };
        shootblur = function() {
            // outer: Math
            return Math.random() * 8 - 4;
        };
        shootup = function() {
            // outer: shootpower
            // outer: shootblur
            // outer: psize
            // outer: player
            // outer: shoot
            shoot(player.p.x, player.p.y - psize, shootblur(), - shootpower());
        };
        shootdown = function() {
            // outer: shootpower
            // outer: shootblur
            // outer: psize
            // outer: player
            // outer: shoot
            shoot(player.p.x, player.p.y + psize, shootblur(), shootpower());
        };
        shootleft = function() {
            // outer: shootblur
            // outer: shootpower
            // outer: psize
            // outer: player
            // outer: shoot
            shoot(player.p.x - psize, player.p.y, - shootpower(), shootblur());
        };
        shootright = function() {
            // outer: shootblur
            // outer: shootpower
            // outer: psize
            // outer: player
            // outer: shoot
            shoot(player.p.x + psize, player.p.y, shootpower(), shootblur());
        };
        // handle player interaction
        if(mouse) {
            i = mouse.length() / 5 | 0 || 1;
            console.log(i);
            while(--i) {
                if(Math.random() * Math.abs(mouse.x) > Math.random() * Math.abs(mouse.y)) {
                    if(mouse.x > 0) {
                        shootleft();
                    } else  {
                        shootright();
                    };
                } else  {
                    if(mouse.y > 0) {
                        shootup();
                    } else  {
                        shootdown();
                    };
                };
            };
        };
        // update life and position of particles
        i = particles.length;
        while(particle = particles[--i]) {
            if(particle.life < 0) {
                particles[i] = particles.pop();
            } else  {
                particle.life -= 1;
                particle.p = particle.p.add(particle.v);
                particle.v = particle.v.scale(0.95);
            };
        };
        // update player
        player.v = player.v.add(player.a);
        player.v = player.v.scale(0.95);
        player.p = player.p.add(player.v);
        player.a = new V2d(0, 0);
        //
        // Draw loop
        // 
        // clear world
        ctx.fillStyle = "#000";
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.fillRect(0, 0, w, h);
        x0 = w / 2 - player.p.x - psize;
        y0 = h / 2 - player.p.y - psize;
        // draw grid
        ctx.fillStyle = "#888";
        xs = [];
        ys = [];
        x = - 63;
        while(x < w) {
            if(!(x - x0 & 63)) {
                xs.push(x - x0 | 0);
                //     ctx.fillRect(x,0,1,h); 
            };
            ++x;
        };
        y = - 63;
        while(y < h) {
            if(!(y - y0 & 63)) {
                ys.push(y - y0 | 0);
                //     ctx.fillRect(0,y,w,1); 
            };
            ++y;
        };
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ccc";
        xs.forEach(function(x) {
            // outer: y0
            // outer: x0
            // outer: ctx
            // outer: false
            // outer: true
            // outer: Math
            // outer: Object
            // outer: map
            // outer: ys
            ys.forEach(function(y) {
                // outer: y0
                // outer: x0
                // outer: ctx
                // outer: false
                // outer: true
                // outer: Math
                // outer: Object
                // outer: x
                // outer: map
                var tile;
                tile = map[x + "," + y];
                if(!tile) {
                    map[x + "," + y] = tile = {filled : Math.random() < .2 ? true : false};
                };
                if(tile.filled) {
                    ctx.fillRect(x0 + x + 1 | 0, y0 + y + 1 | 0, 63, 63);
                };
            });
        });
        // draw particles
        particleLifeList = {};
        particles.forEach(function(particle) {
            // outer: Array
            // outer: particleLifeList
            var list;
            if(particle.life > 0) {
                list = particleLifeList[particle.life | 0];
                if(!list) {
                    particleLifeList[particle.life | 0] = list = [];
                };
                list.push(particle);
            };
        });
        Object.keys(particleLifeList).forEach(function(key) {
            // outer: y0
            // outer: x0
            // outer: ctx
            // outer: particleLifeList
            var list;
            list = particleLifeList[key];
            ctx;
            ctx.fillStyle = "rgba(255,0,0," + (list[0].life | 0) / 100 + ")";
            list.forEach(function(particle) {
                // outer: y0
                // outer: x0
                // outer: ctx
                ctx.fillRect((x0 + particle.p.x | 0) + .5, (y0 + particle.p.y | 0) + .5, 3, 3);
            });
        });
        // draw player
        ctx.fillStyle = "#66f";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "#fff";
        ctx.fillRect(x0 + player.p.x - psize, y0 + player.p.y - psize, 2 * psize + 1, 2 * psize + 1);
        ctx.shadowBlur = 0;
        // collision handling
        collisiontest();
        // timing
        //console.log(Date.now() - prevTime, mousex, mousey);
        prevTime = Date.now();
        setTimeout(gameloop, 40);
    };
    prevTime = Date.now();
    mouse = undefined;
    mousemoves = [];
    mousedown = function(x, y) {
        // outer: undefined
        // outer: mouse
        var mousetime;
        // outer: Date
        // outer: V2d
        // outer: Array
        // outer: mousemoves
        mousemoves = [new V2d(x, y)];
        mousemoves[0].time = Date.now();
        mousetime = Date.now();
        mouse = undefined;
    };
    mousemove = function(x, y) {
        // outer: mouse
        // outer: V2d
        var cursor;
        // outer: Date
        var now;
        var i;
        // outer: mousemoves
        if(mousemoves.length) {
            i = 0;
            now = Date.now();
            while(mousemoves[i] && mousemoves[i].time < now - 200) {
                ++i;
            };
            i -= 2;
            if(i) {
                mousemoves = mousemoves.slice(i);
            };
            cursor = new V2d(x, y);
            cursor.time = now;
            mousemoves.push(cursor);
            mouse = new V2d(x, y).sub(mousemoves[0]);
        };
    };
    mouseup = function() {
        // outer: undefined
        // outer: mouse
        // outer: Array
        // outer: mousemoves
        mousemoves = [];
        mouse = undefined;
    };
    exports.run = function() {
        // outer: mouseup
        // outer: mousemove
        // outer: mousedown
        // outer: gameloop
        // outer: w
        // outer: h
        // outer: ctx
        // outer: false
        // outer: document
        // outer: canvas
        // outer: undefined
        // outer: mouse
        mouse = undefined;
        canvas = document.getElementById("canvas");
        canvas.onmousedown = function(e) {
            // outer: mousedown
            mousedown(e.clientX, e.clientY);
        };
        canvas.onmouseup = function(e) {
            // outer: mouseup
            // outer: mousemove
            mousemove(e.clientX, e.clientY);
            mouseup();
        };
        canvas.onmouseout = function(e) {
            // outer: mouseup
            mouseup();
        };
        canvas.onmousemove = function(e) {
            // outer: mousemove
            mousemove(e.clientX, e.clientY);
        };
        canvas.addEventListener("touchstart", function(e) {
            // outer: mousedown
            mousedown(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }, false);
        canvas.addEventListener("touchmove", function(e) {
            // outer: mousemove
            mousemove(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }, false);
        canvas.addEventListener("touchend", function(e) {
            // outer: mouseup
            mouseup();
            e.preventDefault();
        }, false);
        ctx = canvas.getContext("2d");
        h = ctx.height = canvas.height = canvas.offsetHeight;
        w = ctx.width = canvas.width = canvas.offsetWidth;
        gameloop();
    };
})();
