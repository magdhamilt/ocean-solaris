import * as THREE from 'three';

export function createSuns(scene) {
    const suns = [];
    const sunLights = [];
    const glowSprites = [];
    let time = 0;

    //Create glow texture for corona effect
    function createGlowTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);

        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.6)`);
        gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.2)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        return new THREE.CanvasTexture(canvas);
    }

    // Create shader material
    function createSunShaderMaterial(color) {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0},
                uColor: { value: new THREE.Color(color)},
                uIntensity: { value: 1.5}
            },
            vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
                `,

        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uIntensity;
            varying vec2 vUv;
            varying vec3 vNormal;
            
            // Noise function for solar activity
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float noise (vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random (i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            void main() {
                // Create solar surface variation
                vec2 uv = vUv * 8.0;
                float n = noise(uv + uTime * 0.1);
                n += noise(uv * 2.0 + uTime * 0.15) * 0.5;
                n += noise(uv * 4.0 + uTime * 0.2) * 0.25;
                
                // Edge darkening for sphere effect
                float fresnel = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 2.0);
                
                // Combine effects
                vec3 color = uColor * (0.8 + n * 0.4);
                color *= (1.0 - fresnel * 0.3);
                color *= uIntensity;
                
                gl_FragColor = vec4(color, 1.0);
            }
         `
        });
    }

    // Create individual sun
    function createSun(config) {
        const group = new THREE.Group();

        // Core sun sphere
        const sunGeometry = new THREE.SphereGeometry(config.size, 32, 32);
        const sunMaterial = createSunShaderMaterial(config.color);
        const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        group.add(sunMesh);

        // Atmospheric glow (inner)
        const glowGeometry = new THREE.SphereGeometry(config.size * 1.3, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: config.glowColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glowMesh);

        // Outer glow sprite for corona effect
        const spriteMaterial = new THREE.SpriteMaterial({
            map: createGlowTexture(config.glowColor),
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(config.glowSize, config.glowSize, 1);
        group.add(sprite);
        glowSprites.push(sprite);

        // Position the sun
        group.position.copy(config.position);
        scene.add(group);

        // Add directional light
        const light = new THREE.DirectionalLight(config.lightColor, config.lightIntensity);
        light.position.copy(config.position);
        light.castShadow = false;
        scene.add(light);
        sunLights.push(light);

        // Add point light for local illumination
        const pointLight = new THREE.PointLight(config.color, config.lightIntensity * 0.5, 300);
        pointLight.position.copy(config.position);
        scene.add(pointLight);

        return {
            group,
            sunMesh,
            glowMesh,
            sprite,
            light,
            pointLight,
            orbitConfig: config.orbit
        };
    }

    // Initialize both suns
    function init() {
        // Red sun (larger, primary) - traverses sky from east to west
        const redSun = createSun({
            color: 0xff4400,
            position: new THREE.Vector3(150, 80, -200),
            size: 20,
            glowSize: 45,
            glowColor: 0xff6622,
            lightIntensity: 1.2,
            lightColor: 0xffaa88,
            orbit: {
                radius: 250,           // Large orbital radius for dramatic movement
                speed: 0.08,           // Speed of orbit (radians per second)
                tilt: Math.PI / 6,     // Tilt of orbital plane (30 degrees)
                phaseOffset: 0         // Starting position in orbit
            }
        });

        // Blue sun (smaller, secondary) - different orbital path
        const blueSun = createSun({
            color: 0x4488ff,
            position: new THREE.Vector3(-120, 60, -180),
            size: 12,
            glowSize: 30,
            glowColor: 0x6699ff,
            lightIntensity: 0.8,
            lightColor: 0x88ccff,
            orbit: {
                radius: 220,                    // Slightly smaller orbit
                speed: 0.12,                    // Faster orbit (shorter "day")
                tilt: -Math.PI / 8,             // Different tilt (-22.5 degrees)
                phaseOffset: Math.PI / 2        // Start 90 degrees ahead
            }
        });

        suns.push(redSun, blueSun);
    }

    // Animation update function with realistic sky arc motion
    function update(deltaTime) {
        time += deltaTime;

        suns.forEach((sun, index) => {
            const orbit = sun.orbitConfig;
            
            // Calculate angle in orbit
            const angle = time * orbit.speed + orbit.phaseOffset;
            
            // Create circular orbit in XZ plane
            const baseX = Math.cos(angle) * orbit.radius;
            const baseY = Math.sin(angle) * orbit.radius;
            
            // Apply orbital tilt to create varied sky paths
            // This rotates the orbit around the X axis
            const tiltedY = baseY * Math.cos(orbit.tilt);
            const tiltedZ = -baseY * Math.sin(orbit.tilt);
            
            // Set sun position (planet is at origin)
            sun.group.position.set(baseX, tiltedY, tiltedZ);
            
            // Rotate sun on its axis
            sun.sunMesh.rotation.y += deltaTime * 0.1;
            sun.sunMesh.material.uniforms.uTime.value = time;
            
            // Dynamic intensity based on height above horizon
            // Suns dim when below horizon (y < 0)
            const heightFactor = Math.max(0, sun.group.position.y) / orbit.radius;
            const intensityMultiplier = 0.3 + heightFactor * 0.7; // Min 30%, max 100%
            
            // Pulsing glow effect
            const pulse = Math.sin(time * 2 + index) * 0.1 + 0.9;
            sun.glowMesh.material.opacity = 0.3 * pulse * intensityMultiplier;
            sun.sprite.material.opacity = 0.5 * pulse * intensityMultiplier;
            
            // Update lights with dynamic intensity
            sun.light.intensity = sun.orbitConfig.speed > 0.1 ? 0.8 : 1.2;
            sun.light.intensity *= intensityMultiplier;
            sun.light.position.copy(sun.group.position);
            
            sun.pointLight.intensity = (sun.orbitConfig.speed > 0.1 ? 0.4 : 0.6) * intensityMultiplier;
            sun.pointLight.position.copy(sun.group.position);
        });
    }

    // Cleanup function 
    function dispose () {
        suns.forEach(sun => {
            scene.remove(sun.group);
            scene.remove(sun.light);
            scene.remove(sun.pointLight);

            sun.sunMesh.geometry.dispose();
            sun.sunMesh.material.dispose();
            sun.glowMesh.geometry.dispose();
            sun.glowMesh.material.map.dispose();
            sun.sprite.material.dispose();
        });
    }

    // Initialize suns
    init();

    // Return public API
    return {
        update,
        dispose,
        getSuns: () => suns 
    };
}
