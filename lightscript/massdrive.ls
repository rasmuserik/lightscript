(function() {
    var V2d = require("./v2d").V2d;
    canvas = ctx = w = h = undefined;
    particles = [];
    player = {p: new V2d(100,100)};
    tiles = {};
    newParticle = function(p, v) {
        particles.push({p:p, v:v, life: 100});
    }
    lastTime = Date.now();

    x0 = y0 = 0;
    psize = 5;
    gameloop = function() {
        //
        // world update
        // 
        shoot = function(x,y,vx, vy) {
            particles.push({p:new V2d(x,y), v: new V2d(vx, vy), life: 100});
        }
        shootup = function() {
            shoot(player.p.x +psize, player.p.y, Math.random() *2 - 1, - (Math.random() + Math.random()) * 8);
        }
        shootdown = function() {
            shoot(player.p.x +psize, player.p.y + 2*psize, Math.random() *2 - 1, (Math.random() + Math.random()) * 8);
        }
        shootleft = function() {
            shoot(player.p.x , player.p.y + psize, - (Math.random() + Math.random()) * 8, Math.random() *2 - 1);
        }
        shootright= function() {
            shoot(player.p.x + 2*psize, player.p.y + psize, (Math.random() + Math.random()) * 8, Math.random() *2 - 1);
        }
        shootup();
        shootdown();
        shootleft();
        shootright();
        // update life and position of particles
        i = particles.length; 
        while(particle = particles[--i]) {
            if(particle.life < 0) {
                particles[i] = particles.pop();
            } else {
                particle.life -= 5;
                particle.p = particle.p.add(particle.v);
            }
        }
        //
        // Draw loop
        // 
        // clear world
        ctx.fillStyle = "#000";
        ctx.fillRect(0,0,w, h);
        x0 = w/2 - player.p.x - psize;
        y0 = h/2 - player.p.y - psize;
        // draw particles
        particleLifeList = {};
        particles.forEach(function(particle) {
            if(particle.life > 0) {
                list = particleLifeList[particle.life|0];
                if(!list) {
                    particleLifeList[particle.life|0] = list = [];
                }
                list.push(particle);
            }
        });
        Object.keys(particleLifeList).forEach(function (key) {
            list = particleLifeList[key];
            ctx;
            ctx.fillStyle = 'rgba(255,0,0,' + ((list[0].life|0) / 100) + ')';
            list.forEach(function(particle) {
                ctx.fillRect((x0 + particle.p.x |0) + .5, (y0 + particle.p.y|0) + .5, 3, 3);
            });
        });
        // draw player
        ctx.fillStyle = '#66f';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 2*psize;
        ctx.shadowColor = '#fff';
        ctx.fillRect(x0 + player.p.x, y0 + player.p.y, 2*psize, 2*psize);
        ctx.shadowBlur = 0;
        // timing
        console.log(Date.now() - prevTime, mousex, mousey);
        prevTime = Date.now();
        setTimeout(gameloop, 50);
    }
    prevTime = Date.now();

    mousex = undefined;
    mousey = undefined;
    mouse= false;
    mousedown = function(e) { 
        mouse = true;
        mousex = e.clientX - x0;
        mousey = e.clientY - y0;
    }
    mouseup = function(e) {
        mouse = false;
        mousex = mousey = undefined;
    }
    mousemove= function(e) { 
        if(mouse) {
            mousex = e.clientX - x0;
            mousey = e.clientY - y0;
        } 
    }
    exports.run = function() {
        canvas = document.getElementById('canvas');
        canvas.onmousedown=mousedown;
        canvas.onmouseup=mouseup;
        canvas.onmousemove=mousemove;
        ctx = canvas.getContext('2d');
        h = ctx.height = canvas.height = canvas.offsetHeight;
        w = ctx.width = canvas.width = canvas.offsetWidth;
        gameloop();
    };
})();
