import * as THREE from 'three';

export default class SolarisFormations {
    constructor(scene, oceanRadius = 5) {
        this.scene = scene;
        this.oceanRadius = oceanRadius;
        this.formations = [];
        this.maxFormations = 5;
        this.spawnTimer = 0;
        this.spawnInterval = 8.0;
        
        this.createInitialFormations();
    }
    
    createInitialFormations() {
        const formationTypes = [
            { fn: this.createSymmetriad.bind(this), weight: 3 },
            { fn: this.createAsymmetriad.bind(this), weight: 2 },
            { fn: this.createMimoid.bind(this), weight: 2 },
            { fn: this.createVertebrid.bind(this), weight: 1 },
            { fn: this.createExtensor.bind(this), weight: 1 }
        ];
        
        for (let i = 0; i < this.maxFormations; i++) {
            const formation = this.selectWeightedFormation(formationTypes);
            this.addFormationToScene(formation);
        }
    }
    
    selectWeightedFormation(types) {
        const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const type of types) {
            random -= type.weight;
            if (random <= 0) return type.fn();
        }
        return types[0].fn();
    }
    
    createFormationMaterial(baseColor, animated = true) {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uEmergence: { value: 0 },
                uColor: { value: new THREE.Color(baseColor) },
                uOpacity: { value: 0.5 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uEmergence;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                varying float vDistanceFromCenter;
                
                // Soft flowing distortion
                float softWave(vec3 p, float time) {
                    float wave1 = sin(p.x * 1.5 + time * 0.5) * cos(p.z * 1.2 + time * 0.3);
                    float wave2 = sin(p.y * 2.0 - time * 0.4) * cos(p.x * 1.8 - time * 0.6);
                    float wave3 = cos(p.z * 1.5 + time * 0.7) * sin(p.y * 1.3 + time * 0.2);
                    return (wave1 + wave2 + wave3) * 0.1;
                }
                
                void main() {
                    vPosition = position;
                    vec3 pos = position;
                    
                    // Gelatinous deformation
                    float distortion = softWave(position * 0.5, uTime);
                    pos += normal * distortion * uEmergence * 0.5;
                    
                    // Gentle breathing motion
                    float pulse = sin(uTime * 0.6 + length(position) * 0.3) * 0.08;
                    pos += normal * pulse * uEmergence;
                    
                    // Calculate distance from center for soft edges
                    vDistanceFromCenter = length(position);
                    
                    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
                    vWorldPosition = worldPos.xyz;
                    
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uEmergence;
                uniform vec3 uColor;
                uniform float uOpacity;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                varying float vDistanceFromCenter;
                
                // Smooth noise for ethereal patterns
                float hash(vec3 p) {
                    p = fract(p * vec3(443.537, 537.247, 247.428));
                    p += dot(p, p.yxz + 19.19);
                    return fract((p.x + p.y) * p.z);
                }
                
                float noise3D(vec3 p) {
                    vec3 i = floor(p);
                    vec3 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    
                    return mix(
                        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
                        f.z
                    );
                }
                
                void main() {
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    
                    // Soft fresnel for ethereal glow
                    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
                    
                    vec3 color = uColor;
                    
                    // Flowing internal patterns
                    float pattern1 = noise3D(vPosition * 3.0 + vec3(uTime * 0.3));
                    float pattern2 = noise3D(vPosition * 5.0 - vec3(0, uTime * 0.2, 0));
                    float combinedPattern = (pattern1 + pattern2) * 0.5;
                    
                    // Soft iridescence
                    vec3 iridescence = vec3(
                        sin(combinedPattern * 6.28 + uTime * 0.5),
                        sin(combinedPattern * 6.28 + uTime * 0.5 + 2.09),
                        sin(combinedPattern * 6.28 + uTime * 0.5 + 4.18)
                    ) * 0.2;
                    
                    color += iridescence * uEmergence;
                    
                    // Strong glow around edges
                    color += fresnel * uColor * 1.5;
                    
                    // Pulsing internal glow
                    float innerGlow = sin(uTime * 2.0 + vDistanceFromCenter * 2.0) * 0.5 + 0.5;
                    color += uColor * innerGlow * 0.3 * uEmergence;
                    
                    // Soft depth-based variation
                    float depthFade = smoothstep(0.0, 1.0, (vPosition.y + 2.0) / 4.0);
                    color = mix(color * 0.7, color, depthFade);
                    
                    // Very soft, translucent alpha with strong fresnel
                    float alpha = uOpacity * uEmergence * (0.3 + fresnel * 0.7);
                    
                    // Add edge softness - fade out at extremes
                    float edgeSoftness = smoothstep(0.0, 0.3, combinedPattern) * 
                                        smoothstep(1.0, 0.7, combinedPattern);
                    alpha *= (0.6 + edgeSoftness * 0.4);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
    }
    
    // SYMMETRIAD: Soft, floating architectural forms
    createSymmetriad() {
        const group = new THREE.Group();
        const material = this.createFormationMaterial(0xf0c0d0);
        
        // Soft central core
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 24, 24),
            material
        );
        core.position.y = 1.5;
        core.scale.y = 1.8;
        group.add(core);
        
        // Floating orbs in symmetric pattern
        const tierCount = 3;
        for (let tier = 0; tier < tierCount; tier++) {
            const tierHeight = 0.6 + tier * 0.8;
            const tierRadius = 1.0 - tier * 0.15;
            const segments = 6 + tier * 2;
            
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const orb = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12 - tier * 0.02, 16, 16),
                    material
                );
                orb.position.set(
                    Math.cos(angle) * tierRadius,
                    tierHeight,
                    Math.sin(angle) * tierRadius
                );
                group.add(orb);
            }
        }
        
        // Soft connecting membranes
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const membrane = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                material
            );
            membrane.position.set(
                Math.cos(angle) * 0.6,
                1.5,
                Math.sin(angle) * 0.6
            );
            membrane.scale.set(0.3, 2.0, 0.3);
            membrane.rotation.z = angle;
            group.add(membrane);
        }
        
        // Ethereal crown
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 20, 16),
            material
        );
        crown.position.y = 2.8;
        crown.scale.y = 0.4;
        group.add(crown);
        
        group.userData.formationType = 'symmetriad';
        group.userData.rotationSpeed = 0.05;
        return group;
    }
    
    // ASYMMETRIAD: Flowing, irregular forms
    createAsymmetriad() {
        const group = new THREE.Group();
        const material = this.createFormationMaterial(0xd0e0f0);
        
        // Irregular central mass
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 24, 20),
            material
        );
        core.position.y = 1.2;
        core.scale.set(1.2, 1.5, 0.9);
        core.rotation.z = 0.3;
        group.add(core);
        
        // Flowing tendrils
        const branchCount = 7;
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.8;
            const height = 0.8 + Math.random() * 1.0;
            const radius = 0.5 + Math.random() * 0.4;
            
            // Create soft tendril from multiple spheres
            const segments = 4;
            for (let j = 0; j < segments; j++) {
                const t = j / segments;
                const segment = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1 * (1 - t * 0.5), 12, 12),
                    material
                );
                segment.position.set(
                    Math.cos(angle) * radius * (0.5 + t * 0.5),
                    height * t,
                    Math.sin(angle) * radius * (0.5 + t * 0.5)
                );
                group.add(segment);
            }
            
            // Terminal bulb
            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.15 + Math.random() * 0.08, 16, 16),
                material
            );
            bulb.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            group.add(bulb);
        }
        
        // Floating wisps
        for (let i = 0; i < 5; i++) {
            const wisp = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 12, 12),
                material
            );
            const angle = Math.random() * Math.PI * 2;
            wisp.position.set(
                Math.cos(angle) * (0.4 + Math.random() * 0.3),
                0.5 + i * 0.5 + Math.random() * 0.3,
                Math.sin(angle) * (0.4 + Math.random() * 0.3)
            );
            wisp.scale.set(1, 0.6 + Math.random() * 0.6, 1);
            group.add(wisp);
        }
        
        group.userData.formationType = 'asymmetriad';
        group.userData.rotationSpeed = -0.08;
        return group;
    }
    
    // MIMOID: Echoing, layered forms
    createMimoid() {
        const group = new THREE.Group();
        const material = this.createFormationMaterial(0xe0d0f0);
        
        // Create layered echoes
        for (let i = 0; i < 6; i++) {
            const echo = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 20, 16),
                material
            );
            const offset = i * 0.2;
            echo.position.set(
                Math.sin(i * 0.6) * offset,
                0.5 + i * 0.3,
                Math.cos(i * 0.6) * offset
            );
            echo.scale.set(
                1 - i * 0.12,
                0.8 - i * 0.08,
                1 - i * 0.12
            );
            echo.rotation.y = i * 0.4;
            group.add(echo);
        }
        
        // Connecting wisps
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            
            // Create tendril from small spheres
            for (let j = 0; j < 3; j++) {
                const wisp = new THREE.Mesh(
                    new THREE.SphereGeometry(0.04, 8, 8),
                    material
                );
                const dist = 0.3 + j * 0.15;
                wisp.position.set(
                    Math.cos(angle) * dist,
                    0.8 + j * 0.2,
                    Math.sin(angle) * dist
                );
                group.add(wisp);
            }
        }
        
        // Reflection spheres
        for (let i = 0; i < 4; i++) {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.12 + Math.random() * 0.08, 16, 16),
                material
            );
            const angle = (i / 4) * Math.PI * 2;
            sphere.position.set(
                Math.cos(angle) * 0.7,
                1.3 + Math.random() * 0.4,
                Math.sin(angle) * 0.7
            );
            group.add(sphere);
        }
        
        group.userData.formationType = 'mimoid';
        group.userData.rotationSpeed = 0.12;
        group.userData.oscillationPhase = Math.random() * Math.PI * 2;
        return group;
    }
    
    // VERTEBRID: Flowing spine-like structure
    createVertebrid() {
        const group = new THREE.Group();
        const material = this.createFormationMaterial(0xf0e0d0);
        
        const segments = 10;
        let currentY = 0;
        
        for (let i = 0; i < segments; i++) {
            const progress = i / segments;
            const size = 0.15 + Math.sin(progress * Math.PI) * 0.12;
            
            // Main vertebra
            const vertebra = new THREE.Mesh(
                new THREE.SphereGeometry(size, 16, 12),
                material
            );
            vertebra.position.y = currentY;
            vertebra.scale.y = 0.7;
            group.add(vertebra);
            
            // Soft lateral wisps
            if (i % 2 === 0) {
                for (let side = -1; side <= 1; side += 2) {
                    const wisp = new THREE.Mesh(
                        new THREE.SphereGeometry(size * 0.6, 12, 10),
                        material
                    );
                    wisp.position.set(side * size * 1.5, currentY, 0);
                    wisp.scale.set(0.4, 1.5, 0.4);
                    group.add(wisp);
                }
            }
            
            currentY += size * 2.0;
        }
        
        group.rotation.z = 0.3;
        
        group.userData.formationType = 'vertebrid';
        group.userData.rotationSpeed = 0.06;
        group.userData.undulationPhase = Math.random() * Math.PI * 2;
        return group;
    }
    
    // EXTENSOR: Radiating tendrils
    createExtensor() {
        const group = new THREE.Group();
        const material = this.createFormationMaterial(0xf0f0e0);
        
        // Central glowing core
        const base = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 20, 16),
            material
        );
        base.position.y = 0.3;
        group.add(base);
        
        // Radiating tendrils made of spheres
        const tendrilCount = 8;
        for (let i = 0; i < tendrilCount; i++) {
            const angle = (i / tendrilCount) * Math.PI * 2;
            const segments = 6;
            
            for (let j = 0; j < segments; j++) {
                const t = j / segments;
                const segment = new THREE.Mesh(
                    new THREE.SphereGeometry(0.08 * (1 - t * 0.6), 12, 12),
                    material
                );
                
                const dist = 0.3 + t * 0.5;
                const lift = 0.3 + t * 0.8;
                
                segment.position.set(
                    Math.cos(angle) * dist,
                    lift,
                    Math.sin(angle) * dist
                );
                
                group.add(segment);
            }
        }
        
        group.userData.formationType = 'extensor';
        group.userData.rotationSpeed = 0.1;
        group.userData.extensionPhase = Math.random() * Math.PI * 2;
        return group;
    }
    
    addFormationToScene(formation) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        
        formation.position.x = this.oceanRadius * Math.sin(theta) * Math.cos(phi);
        formation.position.y = this.oceanRadius * Math.sin(theta) * Math.sin(phi);
        formation.position.z = this.oceanRadius * Math.cos(theta);
        
        const normal = formation.position.clone().normalize();
        formation.lookAt(normal.clone().add(formation.position));
        
        formation.userData = {
            ...formation.userData,
            phase: Math.random() * Math.PI * 2,
            emergenceProgress: 0,
            maxHeight: 1.0 + Math.random() * 2.0,
            lifespan: 15 + Math.random() * 30,
            age: 0,
            basePosition: formation.position.clone(),
            originalScale: formation.scale.clone()
        };
        
        formation.scale.setScalar(0.01);
        this.formations.push(formation);
        this.scene.add(formation);
    }
    
    update(deltaTime) {
        this.spawnTimer += deltaTime;
        
        for (let i = this.formations.length - 1; i >= 0; i--) {
            const formation = this.formations[i];
            const userData = formation.userData;
            
            userData.age += deltaTime;
            userData.phase += deltaTime * 0.3;
            
            const lifecycle = userData.age / userData.lifespan;
            
            if (lifecycle < 0.4) {
                userData.emergenceProgress = Math.pow(lifecycle / 0.4, 0.7);
            } else if (lifecycle > 0.8) {
                const collapseProgress = (lifecycle - 0.8) / 0.2;
                userData.emergenceProgress = 1.0 - Math.pow(collapseProgress, 2);
            } else {
                userData.emergenceProgress = 1.0;
            }
            
            const emergenceScale = Math.pow(userData.emergenceProgress, 0.4);
            formation.scale.copy(userData.originalScale).multiplyScalar(emergenceScale);
            
            const surfaceHeight = userData.maxHeight * userData.emergenceProgress;
            const normal = userData.basePosition.clone().normalize();
            formation.position.copy(userData.basePosition).add(normal.multiplyScalar(surfaceHeight));
            
            formation.rotation.y += deltaTime * (userData.rotationSpeed || 0.05) * userData.emergenceProgress;
            
            // Type-specific soft animations
            if (userData.formationType === 'mimoid') {
                userData.oscillationPhase += deltaTime * 1.5;
                const oscillation = Math.sin(userData.oscillationPhase) * 0.1;
                formation.scale.multiplyScalar(1 + oscillation * userData.emergenceProgress);
            } else if (userData.formationType === 'vertebrid') {
                userData.undulationPhase += deltaTime * 1.0;
                formation.rotation.z = 0.3 + Math.sin(userData.undulationPhase) * 0.15 * userData.emergenceProgress;
            } else if (userData.formationType === 'extensor') {
                userData.extensionPhase += deltaTime * 1.0;
                const extension = (Math.sin(userData.extensionPhase) * 0.5 + 0.5) * 0.2;
                formation.scale.y = emergenceScale * (1 + extension * userData.emergenceProgress);
            }
            
            const breathe = Math.sin(userData.phase * 0.5) * 0.08 * userData.emergenceProgress;
            formation.position.add(normal.clone().multiplyScalar(breathe));
            
            formation.traverse((child) => {
                if (child.material && child.material.uniforms) {
                    child.material.uniforms.uTime.value += deltaTime;
                    child.material.uniforms.uEmergence.value = userData.emergenceProgress;
                }
            });
            
            if (userData.emergenceProgress <= 0.01 && userData.age > userData.lifespan * 0.8) {
                this.scene.remove(formation);
                formation.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.formations.splice(i, 1);
            }
        }
        
        if (this.spawnTimer > this.spawnInterval && this.formations.length < this.maxFormations) {
            this.spawnTimer = 0;
            this.spawnNewFormation();
        }
    }
    
    spawnNewFormation() {
        const types = [
            { fn: this.createSymmetriad.bind(this), weight: 3 },
            { fn: this.createAsymmetriad.bind(this), weight: 2 },
            { fn: this.createMimoid.bind(this), weight: 2 },
            { fn: this.createVertebrid.bind(this), weight: 1 },
            { fn: this.createExtensor.bind(this), weight: 1 }
        ];
        
        const formation = this.selectWeightedFormation(types);
        this.addFormationToScene(formation);
    }
    
    getFormationsNear(position, radius = 2.0) {
        return this.formations.filter(formation => {
            return formation.position.distanceTo(position) < radius;
        });
    }
}
