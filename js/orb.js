class Orb {
    constructor() {
        this.canvas = document.getElementById('orbCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.plasmaParticles = [];
        this.energyRings = [];
        this.hue = 180;
        this.baseHue = 180;
        this.brightness = 50;
        this.radius = 150;
        this.particleCount = 500;
        this.plasmaCount = 100;
        this.ringCount = 3;
        this.pulseFactor = 1;
        this.pulseSpeed = 0.02;
        this.movementIntensity = 0.5;
        this.centerX = 0;
        this.centerY = 0;
        this.centerZ = 0;
        this.perspective = 600;

        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationSpeedX = 0.1;
        this.rotationSpeedY = 0.1;
        this.baseRotationSpeed = 0.1;

        this.targetHue = this.hue;
        this.targetBrightness = this.brightness;
        this.currentIntensity = 0.5;
        this.lastMoodUpdate = Date.now();

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.createParticles();
        this.createEnergyRings();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.centerZ = 0;
    }

    setMovementIntensity(value) {
        this.movementIntensity = value;
    }

    setRotationSpeed(value) {
        this.baseRotationSpeed = value;
    }

    setBaseHue(value) {
        this.baseHue = value;
        this.targetHue = value;
    }

    setPulseSpeed(value) {
        this.pulseSpeed = value;
    }

    createEnergyRings() {
        this.energyRings = [];
        for (let i = 0; i < this.ringCount; i++) {
            this.energyRings.push({
                radius: this.radius * (1.2 + i * 0.2),
                rotation: Math.random() * Math.PI * 2,
                speed: 0.002 + Math.random() * 0.003,
                particles: []
            });

            const particlesPerRing = 180;
            for (let j = 0; j < particlesPerRing; j++) {
                const angle = (j / particlesPerRing) * Math.PI * 2;
                this.energyRings[i].particles.push({
                    angle: angle,
                    radius: this.energyRings[i].radius + (Math.random() - 0.5) * 20,
                    size: 2 + Math.random() * 3,
                    pulseOffset: Math.random() * Math.PI * 2
                });
            }
        }
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / this.particleCount);
            const theta = Math.sqrt(this.particleCount * Math.PI) * phi;
            
            const x = Math.cos(theta) * Math.sin(phi) * this.radius;
            const y = Math.sin(theta) * Math.sin(phi) * this.radius;
            const z = Math.cos(phi) * this.radius;

            this.particles.push({
                x: x,
                y: y,
                z: z,
                ox: x,
                oy: y,
                oz: z,
                vx: 0,
                vy: 0,
                vz: 0,
                baseRadius: 1.5 + Math.random() * 2,
                theta: theta,
                phi: phi,
                speed: 0.01 + Math.random() * 0.02
            });
        }

        this.plasmaParticles = [];
        for (let i = 0; i < this.plasmaCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / this.plasmaCount);
            const theta = Math.sqrt(this.plasmaCount * Math.PI) * phi;
            
            this.plasmaParticles.push({
                theta: theta,
                phi: phi,
                distance: this.radius * 1.2 + Math.random() * 50,
                originalDistance: this.radius * 1.2 + Math.random() * 50,
                speed: 0.02 + Math.random() * 0.03,
                size: 20 + Math.random() * 30,
                hueOffset: Math.random() * 60 - 30,
                opacity: 0.15 + Math.random() * 0.25
            });
        }
    }

    updateMood(intensity = 0.5, sentiment = 0.5) {
        this.lastMoodUpdate = Date.now();
        this.currentIntensity = intensity;
        this.targetHue = (this.baseHue + sentiment * 120) % 360;
        this.targetBrightness = 40 + intensity * 60;
        this.pulseSpeed = 0.02 + intensity * 0.03;
        
        const baseSpeed = this.baseRotationSpeed;
        const maxSpeed = baseSpeed * 3;
        
        this.rotationSpeedX = baseSpeed + (Math.random() - 0.5) * maxSpeed * intensity;
        this.rotationSpeedY = baseSpeed + (Math.random() - 0.5) * maxSpeed * intensity;
    }

    project(x, y, z) {
        let cosX = Math.cos(this.rotationX);
        let sinX = Math.sin(this.rotationX);
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;

        let cosY = Math.cos(this.rotationY);
        let sinY = Math.sin(this.rotationY);
        let x1 = x * cosY + z1 * sinY;
        let z2 = -x * sinY + z1 * cosY;

        const scale = this.perspective / (this.perspective + z2);
        return {
            x: this.centerX + x1 * scale,
            y: this.centerY + y1 * scale,
            scale: scale
        };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const timeDelta = (Date.now() - this.lastMoodUpdate) / 1000;
        this.hue += (this.targetHue - this.hue) * Math.min(1, timeDelta * 2);
        this.brightness += (this.targetBrightness - this.brightness) * Math.min(1, timeDelta * 2);
        
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.radius * 4
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, ${this.brightness}%, 0.4)`);
        gradient.addColorStop(0.5, `hsla(${this.hue + 30}, 100%, ${this.brightness - 10}%, 0.2)`);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw energy rings
        this.energyRings.forEach((ring, index) => {
            ring.rotation += ring.speed * this.currentIntensity;
            
            ring.particles.forEach(particle => {
                const time = Date.now() * 0.001;
                const pulseScale = 1 + Math.sin(time * this.pulseSpeed + particle.pulseOffset) * 0.1;
                const radius = particle.radius * pulseScale;
                
                const x = this.centerX + Math.cos(particle.angle + ring.rotation) * radius;
                const y = this.centerY + Math.sin(particle.angle + ring.rotation) * radius;
                
                const distanceScale = 1 - (index / this.ringCount) * 0.3;
                const size = particle.size * distanceScale * (1 + Math.sin(time + particle.angle) * 0.3);
                
                this.ctx.beginPath();
                this.ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${0.4 * distanceScale})`;
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });

        // Draw plasma effect
        this.plasmaParticles.forEach(plasma => {
            plasma.theta += plasma.speed * this.currentIntensity;
            plasma.distance = plasma.originalDistance + 
                Math.sin(Date.now() * 0.001) * 20 * this.currentIntensity;
            
            const x = this.centerX + Math.cos(plasma.theta) * Math.sin(plasma.phi) * plasma.distance;
            const y = this.centerY + Math.sin(plasma.theta) * Math.sin(plasma.phi) * plasma.distance;
            
            const plasmaGradient = this.ctx.createRadialGradient(
                x, y, 0,
                x, y, plasma.size * (1 + Math.sin(Date.now() * 0.002) * 0.3)
            );
            
            const plasmaHue = (this.hue + plasma.hueOffset) % 360;
            const plasmaOpacity = plasma.opacity * (1 + Math.sin(Date.now() * 0.001) * 0.2);
            
            plasmaGradient.addColorStop(0, `hsla(${plasmaHue}, 100%, ${this.brightness + 10}%, ${plasmaOpacity})`);
            plasmaGradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = plasmaGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, plasma.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw core particles
        this.particles.forEach(particle => {
            const force = 0.1 * this.currentIntensity;
            particle.vx += (Math.random() - 0.5) * force;
            particle.vy += (Math.random() - 0.5) * force;
            particle.vz += (Math.random() - 0.5) * force;

            const dx = particle.ox - particle.x;
            const dy = particle.oy - particle.y;
            const dz = particle.oz - particle.z;
            
            particle.vx += dx * 0.03;
            particle.vy += dy * 0.03;
            particle.vz += dz * 0.03;

            particle.vx *= 0.9;
            particle.vy *= 0.9;
            particle.vz *= 0.9;

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.z += particle.vz;

            const pulseMagnitude = 0.1 + this.currentIntensity * 0.2;
            const pulseOffset = Math.sin(Date.now() * this.pulseSpeed) * pulseMagnitude;
            const proj = this.project(
                particle.x * (1 + pulseOffset),
                particle.y * (1 + pulseOffset),
                particle.z * (1 + pulseOffset)
            );

            const size = particle.baseRadius * proj.scale * (1 + pulseOffset);
            const brightness = this.brightness * proj.scale;
            const opacity = 0.6 + 0.4 * proj.scale;

            this.ctx.beginPath();
            this.ctx.fillStyle = `hsla(${this.hue}, 100%, ${brightness}%, ${opacity})`;
            this.ctx.shadowColor = `hsla(${this.hue}, 100%, ${brightness}%, 0.5)`;
            this.ctx.shadowBlur = 10 * proj.scale;
            this.ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.rotationX += this.rotationSpeedX * this.movementIntensity;
        this.rotationY += this.rotationSpeedY * this.movementIntensity;
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

export default Orb;
