(function() {
    // outer: document
    // outer: setTimeout
    // outer: console
    // outer: false
    // outer: true
    // outer: Math
    // outer: exports
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
        // outer: console
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
            // outer: console
            // outer: psize
            // outer: player
            // outer: map
            if(map(particle.p.x, particle.p.y).filled) {
                particle.life = 0;
            };
            if(player.p.x - psize < particle.p.x && particle.p.x < player.p.x + psize) {
                if(player.p.y - psize < particle.p.y && particle.p.y < player.p.y + psize) {
                    console.log("particle collision");
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
        var particle;
        // outer: particles
        // outer: player
        // outer: Math
        var i;
        // outer: mouse
        var shootright;
        var shootleft;
        var shootdown;
        var shootup;
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
        shootup = function() {
            // outer: Math
            // outer: psize
            // outer: player
            // outer: shoot
            shoot(player.p.x, player.p.y - psize, Math.random() * 2 - 1, - (Math.random() + Math.random()) * 8);
        };
        shootdown = function() {
            // outer: Math
            // outer: psize
            // outer: player
            // outer: shoot
            shoot(player.p.x, player.p.y + psize, Math.random() * 2 - 1, (Math.random() + Math.random()) * 8);
        };
        shootleft = function() {
            // outer: Math
            // outer: psize
            // outer: player
            // outer: shoot
            shoot(player.p.x - psize, player.p.y, - (Math.random() + Math.random()) * 8, Math.random() * 2 - 1);
        };
        shootright = function() {
            // outer: Math
            // outer: psize
            // outer: player
            // outer: shoot
            shoot(player.p.x + psize, player.p.y, (Math.random() + Math.random()) * 8, Math.random() * 2 - 1);
        };
        // handle player interaction
        if(mouse) {
            i = 4;
            while(--i) {
                if(Math.random() * Math.abs(mouse.x - player.p.x) > Math.random() * Math.abs(mouse.y - player.p.y)) {
                    if(mouse.x < player.p.x) {
                        shootleft();
                    } else  {
                        shootright();
                    };
                } else  {
                    if(mouse.y < player.p.y) {
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
    exports.run = function() {
        // outer: undefined
        // outer: y0
        // outer: x0
        // outer: V2d
        // outer: gameloop
        // outer: w
        // outer: h
        // outer: ctx
        // outer: document
        // outer: canvas
        // outer: mouse
        mouse;
        canvas = document.getElementById("canvas");
        canvas.mousedown = function(e) {
            // outer: y0
            var mousey;
            // outer: x0
            // outer: V2d
            // outer: mouse
            mouse = new V2d(e.clientX - x0, mousey = e.clientY - y0);
        };
        canvas.mouseup = function(e) {
            // outer: undefined
            // outer: mouse
            mouse = undefined;
        };
        canvas.mousemove = function(e) {
            // outer: y0
            var mousey;
            // outer: x0
            // outer: V2d
            // outer: mouse
            if(mouse) {
                mouse = new V2d(e.clientX - x0, mousey = e.clientY - y0);
            };
        };
        canvas.touchdown = function(e) {
            // outer: y0
            var mousey;
            // outer: x0
            // outer: V2d
            // outer: mouse
            mouse = new V2d(e.touches[0].clientX - x0, mousey = e.touches[0].clientY - y0);
        };
        ctx = canvas.getContext("2d");
        h = ctx.height = canvas.height = canvas.offsetHeight;
        w = ctx.width = canvas.width = canvas.offsetWidth;
        gameloop();
    };
})();
