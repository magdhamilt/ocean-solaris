import * as THREE from 'three';

class SolarisStarfield {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            // Star populations
            backgroundStars: options.backgroundStars || 800,
            midrangeStars: options.midrangeStars || 600,
            foregroundStars: options.foregroundStars || 200,
            clusterStars: options.clusterStars || 400,
            
            // Distance ranges
            bgMinDist: options.bgMinDist || 60,
            bgMaxDist: options.bgMaxDist || 100,
            midMinDist: options.midMinDist || 40,
            midMaxDist: options.midMaxDist || 60,
            fgMinDist: options.fgMinDist || 35,
            fgMaxDist: options.fgMaxDist || 45,
            
            // Clustering
            clusterCount: options.clusterCount || 5,
            clusterRadius: options.clusterRadius || 8,
            clusterCenterDist: options.clusterCenterDist || 50,
            
            // Galactic plane
            galacticPlaneRatio: options.galacticPlaneRatio || 0.4,
            galacticPlaneThickness: options.galacticPlaneThickness || 0.15,
            
            // Nebulae
            nebulaCount: options.nebulaCount || 3,
            nebulaParticles: options.nebulaParticles || 150,
            nebulaRadius: options.nebulaRadius || 12,
            
            // Visual
            twinkleSpeed: options.twinkleSpeed || 0.5,
            baseOpacity: options.baseOpacity || 0.9,
            minSize: options.minSize || 0.4,
            maxSize: options.maxSize || 3.0
        };
        
        this.starfields = [];
        this.nebulae = [];
        this.create();
    }
    
    // Generate star color based on stellar classification
    getStarColor(type) {
        const colors = {
            O: { r: [0.6, 0.75], g: [0.7, 0.85], b: [0.95, 1.0] },      // Blue
            B: { r: [0.7, 0.85], g: [0.8, 0.95], b: [0.95, 1.0] },      // Blue-white
            A: { r: [0.9, 1.0], g: [0.9, 1.0], b: [0.95, 1.0] },        // White
            F: { r: [0.95, 1.0], g: [0.95, 1.0], b: [0.85, 0.95] },     // Yellow-white
            G: { r: [1.0, 1.0], g: [0.9, 0.98], b: [0.7, 0.85] },       // Yellow (like our sun)
            K: { r: [1.0, 1.0], g: [0.7, 0.85], b: [0.5, 0.65] },       // Orange
            M: { r: [1.0, 1.0], g: [0.5, 0.65], b: [0.4, 0.5] }         // Red
        };
        
        const range = colors[type];
        return {
            r: range.r[0] + Math.random() * (range.r[1] - range.r[0]),
            g: range.g[0] + Math.random() * (range.g[1] - range.g[0]),
            b: range.b[0] + Math.random() * (range.b[1] - range.b[0])
        };
    }
    
    // Select stellar type with realistic distribution
    selectStellarType() {
        const rand = Math.random();
        // Realistic stellar population (most stars are red dwarfs)
        if (rand < 0.76) return 'M';       // 76% red dwarfs
        if (rand < 0.88) return 'K';       // 12% orange
        if (rand < 0.96) return 'G';       // 8% yellow
        if (rand < 0.98) return 'F';       // 2% yellow-white
        if (rand < 0.99) return 'A';       // 1% white
        if (rand < 0.995) return 'B';      // 0.5% blue-white
        return 'O';                         // 0.5% blue giants
    }
    
    // Generate position in galactic plane
    generateGalacticPlanePosition(minDist, maxDist) {
        const theta = Math.random() * Math.PI * 2;
        const radius = minDist + Math.random() * (maxDist - minDist);
        
        // Concentrate in a plane with some thickness
        const planeY = (Math.random() - 0.5) * this.options.galacticPlaneThickness * radius;
        
        return {
            x: radius * Math.cos(theta),
            y: planeY,
            z: radius * Math.sin(theta)
        };
    }
    
    // Generate random spherical position
    generateSphericalPosition(minDist, maxDist) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = minDist + Math.random() * (maxDist - minDist);
        
        return {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi)
        };
    }
    
    // Generate clustered position
    generateClusteredPosition(clusterCenter, clusterRadius) {
        // Random position within cluster sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = Math.pow(Math.random(), 0.5) * clusterRadius; // Concentrate toward center
        
        return {
            x: clusterCenter.x + radius * Math.sin(phi) * Math.cos(theta),
            y: clusterCenter.y + radius * Math.sin(phi) * Math.sin(theta),
            z: clusterCenter.z + radius * Math.cos(phi)
        };
    }
    
    // Create a layer of stars
    createStarLayer(count, minDist, maxDist, useGalacticPlane = false, clusters = null) {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Determine position
            let pos;
            if (clusters && Math.random() < 0.3) {
                // 30% chance to be in a cluster
                const cluster = clusters[Math.floor(Math.random() * clusters.length)];
                pos = this.generateClusteredPosition(cluster, this.options.clusterRadius);
            } else if (useGalacticPlane && Math.random() < this.options.galacticPlaneRatio) {
                pos = this.generateGalacticPlanePosition(minDist, maxDist);
            } else {
                pos = this.generateSphericalPosition(minDist, maxDist);
            }
            
            positions[i3] = pos.x;
            positions[i3 + 1] = pos.y;
            positions[i3 + 2] = pos.z;
            
            // Stellar type and color
            const stellarType = this.selectStellarType();
            const color = this.getStarColor(stellarType);
            
            // Power law brightness distribution (many dim, few bright)
            const brightness = Math.pow(Math.random(), 2.0);
            
            colors[i3] = color.r * (0.3 + brightness * 0.7);
            colors[i3 + 1] = color.g * (0.3 + brightness * 0.7);
            colors[i3 + 2] = color.b * (0.3 + brightness * 0.7);
            
            // Size based on brightness and stellar type
            let baseSize = this.options.minSize + brightness * (this.options.maxSize - this.options.minSize);
            
            // Blue giants are larger, red dwarfs smaller
            if (stellarType === 'O' || stellarType === 'B') {
                baseSize *= 1.5;
            } else if (stellarType === 'M') {
                baseSize *= 0.7;
            }
            
            sizes[i] = baseSize;
            
            // Occasional super bright stars (distant galaxies/supergiants)
            if (Math.random() < 0.015) {
                sizes[i] *= 3.0;
                colors[i3] *= 1.3;
                colors[i3 + 1] *= 1.3;
                colors[i3 + 2] *= 1.3;
            }
        }
        
        return { positions, colors, sizes };
    }
    
    // Create nebula clouds
    createNebula(center, radius, color) {
        const count = this.options.nebulaParticles;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Clustered gaussian distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = Math.pow(Math.random(), 0.4) * radius;
            
            positions[i3] = center.x + r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = center.z + r * Math.cos(phi);
            
            // Nebula color with variation
            const brightness = 0.3 + Math.random() * 0.5;
            colors[i3] = color.r * brightness;
            colors[i3 + 1] = color.g * brightness;
            colors[i3 + 2] = color.b * brightness;
            
            // Larger, softer particles
            sizes[i] = 3.0 + Math.random() * 8.0;
        }
        
        return { positions, colors, sizes };
    }
    
    create() {
        // Generate cluster centers
        const clusters = [];
        for (let i = 0; i < this.options.clusterCount; i++) {
            clusters.push(this.generateSphericalPosition(
                this.options.clusterCenterDist - 10,
                this.options.clusterCenterDist + 10
            ));
        }
        
        // Create star layers
        const layers = [
            {
                name: 'background',
                data: this.createStarLayer(
                    this.options.backgroundStars,
                    this.options.bgMinDist,
                    this.options.bgMaxDist,
                    true,
                    null
                ),
                opacity: 0.6
            },
            {
                name: 'midrange',
                data: this.createStarLayer(
                    this.options.midrangeStars,
                    this.options.midMinDist,
                    this.options.midMaxDist,
                    true,
                    clusters
                ),
                opacity: 0.85
            },
            {
                name: 'foreground',
                data: this.createStarLayer(
                    this.options.foregroundStars,
                    this.options.fgMinDist,
                    this.options.fgMaxDist,
                    false,
                    clusters
                ),
                opacity: 1.0
            }
        ];
        
        // Create star layer meshes
        layers.forEach((layer, index) => {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(layer.data.positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(layer.data.colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(layer.data.sizes, 1));
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uTwinkleSpeed: { value: this.options.twinkleSpeed },
                    uBaseOpacity: { value: this.options.baseOpacity * layer.opacity },
                    uLayerOffset: { value: index * 0.5 } // Phase offset for twinkle variation
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    varying vec3 vColor;
                    varying float vDistance;
                    varying float vSize;
                    uniform float uTime;
                    uniform float uTwinkleSpeed;
                    uniform float uLayerOffset;
                    
                    void main() {
                        vColor = color;
                        vSize = size;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        vDistance = -mvPosition.z;
                        
                        // Varied twinkling based on position and layer
                        float twinkleFreq = 0.5 + sin(position.x * 0.1) * 0.3;
                        float twinkle = sin(uTime * uTwinkleSpeed * twinkleFreq + uLayerOffset + 
                                          position.x * 0.02 + position.y * 0.02 + position.z * 0.02) * 0.25 + 0.75;
                        
                        // Distance-based scaling
                        float scaleFactor = 200.0;
                        gl_PointSize = size * twinkle * scaleFactor / vDistance;
                        gl_PointSize = max(0.5, min(gl_PointSize, 15.0));
                        
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    varying float vDistance;
                    varying float vSize;
                    uniform float uBaseOpacity;
                    
                    void main() {
                        vec2 center = gl_PointCoord - vec2(0.5);
                        float dist = length(center);
                        if (dist > 0.5) discard;
                        
                        // Soft glow with slight variation based on size
                        float glowPower = mix(1.5, 2.5, vSize / 3.0);
                        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                        alpha = pow(alpha, glowPower);
                        
                        // Distance fade
                        float distanceFade = 1.0 - smoothstep(30.0, 120.0, vDistance);
                        alpha *= uBaseOpacity * distanceFade;
                        
                        // Enhanced glow for brighter stars
                        vec3 glowColor = vColor * (1.0 + (1.0 - dist) * 0.8);
                        
                        gl_FragColor = vec4(glowColor, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                depthTest: false,
                blending: THREE.AdditiveBlending
            });
            
            const starfield = new THREE.Points(geometry, material);
            starfield.renderOrder = -1000 + index;
            this.scene.add(starfield);
            this.starfields.push(starfield);
        });
        
        // Create nebulae
        const nebulaColors = [
            { r: 0.8, g: 0.3, b: 0.4 },  // Red (echoing Solaris red sun)
            { r: 0.3, g: 0.5, b: 0.9 },  // Blue (echoing blue sun)
            { r: 0.6, g: 0.3, b: 0.8 }   // Purple
        ];
        
        for (let i = 0; i < this.options.nebulaCount; i++) {
            const center = this.generateSphericalPosition(45, 70);
            const color = nebulaColors[i % nebulaColors.length];
            const nebulaData = this.createNebula(center, this.options.nebulaRadius, color);
            
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(nebulaData.positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(nebulaData.colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(nebulaData.sizes, 1));
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uOpacity: { value: 0.15 }
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    varying vec3 vColor;
                    varying float vDistance;
                    uniform float uTime;
                    
                    void main() {
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        vDistance = -mvPosition.z;
                        
                        // Slow pulsing
                        float pulse = sin(uTime * 0.2 + position.x * 0.05) * 0.3 + 0.7;
                        
                        float scaleFactor = 250.0;
                        gl_PointSize = size * pulse * scaleFactor / vDistance;
                        gl_PointSize = max(1.0, min(gl_PointSize, 40.0));
                        
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    varying float vDistance;
                    uniform float uOpacity;
                    
                    void main() {
                        vec2 center = gl_PointCoord - vec2(0.5);
                        float dist = length(center);
                        if (dist > 0.5) discard;
                        
                        // Very soft, diffuse glow
                        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                        alpha = pow(alpha, 0.8);
                        alpha *= uOpacity;
                        
                        gl_FragColor = vec4(vColor, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                depthTest: false,
                blending: THREE.AdditiveBlending
            });
            
            const nebula = new THREE.Points(geometry, material);
            nebula.renderOrder = -1100;
            this.scene.add(nebula);
            this.nebulae.push(nebula);
        }
    }
    
    update(deltaTime) {
        // Update star layers
        this.starfields.forEach((starfield, index) => {
            if (starfield.material.uniforms) {
                starfield.material.uniforms.uTime.value += deltaTime;
                // Different rotation speeds for parallax
                starfield.rotation.y += deltaTime * 0.0005 * (1 + index * 0.5);
            }
        });
        
        // Update nebulae
        this.nebulae.forEach((nebula, index) => {
            if (nebula.material.uniforms) {
                nebula.material.uniforms.uTime.value += deltaTime;
                // Slow drift
                nebula.rotation.y += deltaTime * 0.0002;
                nebula.rotation.x += deltaTime * 0.0001;
            }
        });
    }
    
    // Adjust opacity based on camera distance
    setOpacityBasedOnCameraDistance(cameraDistance) {
        const opacity = Math.min(1.0, (cameraDistance - 5.1) / 5.0);
        this.starfields.forEach(starfield => {
            if (starfield.material.uniforms) {
                const baseOpacity = starfield.material.uniforms.uBaseOpacity.value;
                starfield.material.uniforms.uBaseOpacity.value = baseOpacity * opacity;
            }
        });
    }
    
    // Set opacity manually
    setOpacity(opacity) {
        this.starfields.forEach((starfield, index) => {
            if (starfield.material.uniforms) {
                const layerOpacity = [0.6, 0.85, 1.0][index] || 1.0;
                starfield.material.uniforms.uBaseOpacity.value = this.options.baseOpacity * layerOpacity * opacity;
            }
        });
        
        this.nebulae.forEach(nebula => {
            if (nebula.material.uniforms) {
                nebula.material.uniforms.uOpacity.value = 0.15 * opacity;
            }
        });
    }
    
    // Set twinkle speed
    setTwinkleSpeed(speed) {
        this.starfields.forEach(starfield => {
            if (starfield.material.uniforms) {
                starfield.material.uniforms.uTwinkleSpeed.value = speed;
            }
        });
    }
    
    dispose() {
        [...this.starfields, ...this.nebulae].forEach(obj => {
            obj.geometry.dispose();
            obj.material.dispose();
            this.scene.remove(obj);
        });
        this.starfields = [];
        this.nebulae = [];
    }
}

export default SolarisStarfield;