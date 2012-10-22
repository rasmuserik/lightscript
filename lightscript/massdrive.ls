(function() {
    require("./canvasapp");
    exports.init = function() {
        exports.run();
    };
    var V2d = require("./v2d").V2d;
    var canvas = var ctx = var w = var h = undefined;
    var particles = [];
    var player = {
        p : new V2d(32, 32),
        v : new V2d(0, 0),
        a : new V2d(0, 0),
    };
    var tiles = {};
    var newParticle = function(p, v) {
        particles.push({
            p : p,
            v : v,
            life : 100,
        });
    };
    var mapData = {};
    var map = function(x, y) {
        var data = mapData[(x & ~63) + "," + (y & ~63)];
        if(!data) {
            mapData[(x & ~63) + "," + (y & ~63)] = data = {filled : Math.random() < .1 ? true : false};
        };
        return data;
    };
    var goals = [];
    (function() {
        var i = 0;
        while(i < 5) {
            var x = Math.random() * 20 - 10 | 0;
            var y = Math.random() * 20 - 10 | 0;
            x = x * 64 + 32;
            y = y * 64 + 32;
            var goal = new V2d(x, y);
            goal.id = i;
            goals.push(goal);
            map(x, y).filled = false;
            map(x, y).goal = goal;
            ++i;
        };
    })();
    var lastTime = Date.now();
    var x0 = var y0 = 0;
    var psize = 10;
    var collisiontest = function() {
        particles.forEach(function(particle) {
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
        var goaltile = tiles[0].goal && tiles[0] || (tiles[1].goal && tiles[1]);
        goaltile = goaltile || (tiles[2].goal && tiles[2]) || (tiles[3].goal && tiles[3]);
        if(goaltile) {
            goaltile.goal = undefined;
        };
    };
    var gameloop = function() {
        //
        // world update
        // 
        var shoot = function(x, y, vx, vy) {
            var newParticle = {
                p : new V2d(x, y),
                v : new V2d(vx, vy),
                life : Math.random() * 100,
            };
            particles.push(newParticle);
            player.a = player.a.sub(newParticle.v.scale(newParticle.life * 0.001));
            newParticle.v = newParticle.v.add(player.v);
        };
        var shootpower = function() {
            return 10 + Math.random() * 20;
        };
        var shootblur = function() {
            return Math.random() * 8 - 4;
        };
        var shootup = function() {
            shoot(player.p.x, player.p.y - psize, shootblur(), - shootpower());
        };
        var shootdown = function() {
            shoot(player.p.x, player.p.y + psize, shootblur(), shootpower());
        };
        var shootleft = function() {
            shoot(player.p.x - psize, player.p.y, - shootpower(), shootblur());
        };
        var shootright = function() {
            shoot(player.p.x + psize, player.p.y, shootpower(), shootblur());
        };
        // handle player interaction
        if(mouse) {
            var i = mouse.length() / 5 | 0 || 1;
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
        while(var particle = particles[--i]) {
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
        var xs = [];
        var ys = [];
        var x = - 63;
        while(x < w) {
            if(!(x - x0 & 63)) {
                xs.push(x - x0 | 0);
                //     ctx.fillRect(x,0,1,h); 
            };
            ++x;
        };
        var y = - 63;
        while(y < h) {
            if(!(y - y0 & 63)) {
                ys.push(y - y0 | 0);
                //     ctx.fillRect(0,y,w,1); 
            };
            ++y;
        };
        ctx.shadowBlur = 0;
        // draw particles
        var particleLifeList = {};
        particles.forEach(function(particle) {
            if(particle.life > 0) {
                var list = particleLifeList[particle.life | 0];
                if(!list) {
                    particleLifeList[particle.life | 0] = list = [];
                };
                list.push(particle);
            };
        });
        Object.keys(particleLifeList).forEach(function(key) {
            var list = particleLifeList[key];
            ctx;
            ctx.fillStyle = "rgba(255,0,0," + (list[0].life | 0) / 100 + ")";
            list.forEach(function(particle) {
                ctx.fillRect((x0 + particle.p.x | 0) + .5, (y0 + particle.p.y | 0) + .5, 3, 3);
            });
        });
        xs.forEach(function(x) {
            ys.forEach(function(y) {
                var tile = map(x, y);
                if(tile.filled) {
                    ctx.fillStyle = "#ccc";
                    ctx.fillRect(x0 + x + 1 | 0, y0 + y + 1 | 0, 63, 63);
                };
                if(tile.goal) {
                    ctx.fillStyle = "#040";
                    ctx.beginPath();
                    ctx.arc(x0 + x + 32.5 | 0, y0 + y + 32.5 | 0, 24, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = "#cfc";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.font = "32px sans-serif";
                    ctx.shadowBlur = 16;
                    ctx.shadowColor = "#fff";
                    ctx.fillText(tile.goal.id, x0 + x + 32.5 | 0, y0 + y + 32.5 | 0);
                    ctx.shadowBlur = 0;
                };
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
    var prevTime = Date.now();
    var mouse = undefined;
    var mousemoves = [];
    var mousedown = function(x, y) {
        mousemoves = [new V2d(x, y)];
        mousemoves[0].time = Date.now();
        var mousetime = Date.now();
        mouse = undefined;
    };
    var mousemove = function(x, y) {
        if(mousemoves.length) {
            var i = 0;
            var now = Date.now();
            while(mousemoves[i] && mousemoves[i].time < now - 200) {
                ++i;
            };
            i -= 2;
            if(i) {
                mousemoves = mousemoves.slice(i);
            };
            var cursor = new V2d(x, y);
            cursor.time = now;
            mousemoves.push(cursor);
            mouse = new V2d(x, y).sub(mousemoves[0]);
        };
    };
    var mouseup = function() {
        mousemoves = [];
        mouse = undefined;
    };
    exports.run = function() {
        mouse = undefined;
        canvas = document.getElementById("canvas");
        canvas.onmousedown = function(e) {
            mousedown(e.clientX, e.clientY);
        };
        canvas.onmouseup = function(e) {
            mousemove(e.clientX, e.clientY);
            mouseup();
        };
        canvas.onmouseout = function(e) {
            mouseup();
        };
        canvas.onmousemove = function(e) {
            mousemove(e.clientX, e.clientY);
        };
        canvas.addEventListener("touchstart", function(e) {
            mousedown(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }, false);
        canvas.addEventListener("touchmove", function(e) {
            mousemove(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }, false);
        canvas.addEventListener("touchend", function(e) {
            mouseup();
            e.preventDefault();
        }, false);
        ctx = canvas.getContext("2d");
        h = ctx.height = canvas.height = canvas.offsetHeight;
        w = ctx.width = canvas.width = canvas.offsetWidth;
        gameloop();
    };
})();
