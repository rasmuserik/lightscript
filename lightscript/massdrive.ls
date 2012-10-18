(function() {
    var V2d = require("./v2d").V2d;
    canvas = ctx = w = h = undefined;
    particles = [];
    player = {};
    tiles = {};
    newParticle = function(p, v) {
        particles.push({p:p, v:v, life: 100});
    }
    lastTime = Date.now();

    gameloop = function() {
        //
        // world update
        // 
        i = 2;
        while(--i) {
            //newParticle(new V2d(100,100), new V2d(Math.random() *8- 4, Math.random() *8- 4));
            newParticle(new V2d(100,100), new V2d(Math.random() *2- 1, (Math.random() + Math.random()) * 8));
        }
        i = particles.length; 
        // update life and position of particles
        while(particle = particles[--i]) {
            if(particle.life < 0) {
                particles[i] = particles.pop();
            } else {
                particle.life -= Math.random() * 5;
                particle.p = particle.p.add(particle.v);
            }
        }
        //
        // Draw loop
        // 
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
        ctx.fillStyle = "#000";
        ctx.fillRect(0,0,w, h);
        blah = 0;
        Object.keys(particleLifeList).forEach(function (key) {
            list = particleLifeList[key];
            ctx;
            ctx.fillStyle = 'rgba(255,0,0,' + ((list[0].life|0) / 100) + ')';
            list.forEach(function(particle) {
                ++blah;
                ctx.fillRect((particle.p.x |0) + .5, (particle.p.y|0) + .5, 3, 3);
            });
        });
        //console.log(particles.length, blah);
        setTimeout(gameloop, 50);
    }
    exports.run = function() {
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        h = ctx.height = canvas.height = canvas.offsetHeight;
        w = ctx.width = canvas.width = canvas.offsetWidth;
        gameloop();
    };
})();
