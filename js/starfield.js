import * as THREE from 'three';

class SolarisStarfield {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            starCount: options.starCount || 1200,
            minDistance: options.minDistance || 35,  // Just beyond max camera distance
            maxDistance: options.maxDistance || 80,  // Far enough to feel infinite
            minBrightness: options.minBrightness || 0.6,
            maxBrightness: options.maxBrightness || 1.0,
            warmStarRatio: options.warmStarRatio || 0.3,
            twinkleSpeed: options.twinkleSpeed || 0.5,
            baseOpacity: options.baseOpacity || 0.9,
            minSize: options.minSize || 0.5,  // Minimum star size
            maxSize: options.maxSize || 2.5   // Maximum star size
        };
        
        this.starfield = null;
        this.create();
    }
    
    create() {
        const starsGeometry = new THREE.BufferGeometry();
        const { starCount, minDistance, maxDistance, minBrightness, maxBrightness, warmStarRatio, minSize, maxSize } = this.options;
        
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Random position on a distant sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = minDistance + Math.random() * (maxDistance - minDistance);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Star color - mostly cool, some warm (matching Solaris theme)
            const brightness = minBrightness + Math.random() * (maxBrightness - minBrightness);
            const isWarm = Math.random() < warmStarRatio;
            
            if (isWarm) {
                // Warmer stars (yellow/orange tint) - echo the red sun
                colors[i3] = brightness * (0.9 + Math.random() * 0.1);      // R
                colors[i3 + 1] = brightness * (0.6 + Math.random() * 0.2);  // G
                colors[i3 + 2] = brightness * (0.4 + Math.random() * 0.2);  // B
            } else {
                // Cool white/blue stars - echo the blue sun
                colors[i3] = brightness * (0.6 + Math.random() * 0.2);      // R
                colors[i3 + 1] = brightness * (0.7 + Math.random() * 0.2);  // G
                colors[i3 + 2] = brightness * (0.9 + Math.random() * 0.1);  // B
            }
            
            // Varied star sizes with some brighter "closer" stars
            sizes[i] = minSize + Math.random() * (maxSize - minSize);
            
            // Make a few stars extra bright and large (distant suns/galaxies)
            if (Math.random() < 0.02) {
                sizes[i] *= 2.5;
                colors[i3] *= 1.2;
                colors[i3 + 1] *= 1.2;
                colors[i3 + 2] *= 1.2;
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTwinkleSpeed: { value: this.options.twinkleSpeed },
                uBaseOpacity: { value: this.options.baseOpacity }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vDistance;
                uniform float uTime;
                uniform float uTwinkleSpeed;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vDistance = -mvPosition.z;
                    
                    // Subtle twinkling based on position
                    float twinkle = sin(uTime * uTwinkleSpeed + position.x * 0.01 + position.y * 0.01) * 0.2 + 0.8;
                    
                    // Better size scaling for visibility at all distances
                    // Using a more aggressive scale factor for closer stars
                    float scaleFactor = 150.0; // Reduced from 300.0 for closer stars
                    gl_PointSize = size * twinkle * scaleFactor / vDistance;
                    
                    // Clamp size to ensure visibility
                    gl_PointSize = max(1.0, gl_PointSize);
                    
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vDistance;
                uniform float uBaseOpacity;
                
                void main() {
                    // Circular star points with glow
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    if (dist > 0.5) discard;
                    
                    // Soft glow falloff for more ethereal look
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    alpha = pow(alpha, 1.5); // Sharper center, softer edges
                    
                    // Distance-based fading for depth
                    float distanceFade = 1.0 - smoothstep(30.0, 100.0, vDistance);
                    alpha *= uBaseOpacity * distanceFade;
                    
                    // Slight color enhancement for glow effect
                    vec3 glowColor = vColor * (1.0 + (1.0 - dist) * 0.5);
                    
                    gl_FragColor = vec4(glowColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: false,  // Stars render behind everything
            blending: THREE.AdditiveBlending
        });
        
        this.starfield = new THREE.Points(starsGeometry, starsMaterial);
        this.starfield.renderOrder = -1000;  // Ensure stars render first
        this.scene.add(this.starfield);
    }
    
    update(deltaTime) {
        if (this.starfield && this.starfield.material.uniforms) {
            this.starfield.material.uniforms.uTime.value += deltaTime;
            
            // Slowly rotate starfield for subtle movement
            this.starfield.rotation.y += deltaTime * 0.001;
        }
    }
    
    // Adjust opacity dynamically based on camera distance
    setOpacityBasedOnCameraDistance(cameraDistance) {
        if (this.starfield && this.starfield.material.uniforms) {
            // Fade stars when very close to planet surface
            const opacity = Math.min(1.0, (cameraDistance - 5.1) / 5.0) * this.options.baseOpacity;
            this.starfield.material.uniforms.uBaseOpacity.value = opacity;
        }
    }
    
    // Adjust opacity manually
    setOpacity(opacity) {
        if (this.starfield && this.starfield.material.uniforms) {
            this.starfield.material.uniforms.uBaseOpacity.value = opacity;
        }
    }
    
    // Adjust twinkle speed
    setTwinkleSpeed(speed) {
        if (this.starfield && this.starfield.material.uniforms) {
            this.starfield.material.uniforms.uTwinkleSpeed.value = speed;
        }
    }
    
    dispose() {
        if (this.starfield) {
            this.starfield.geometry.dispose();
            this.starfield.material.dispose();
            this.scene.remove(this.starfield);
        }
    }
}

export default SolarisStarfield;