import * as THREE from 'three';

export default class SolarisSimulacra {
    constructor(scene, oceanRadius = 5) {
        this.scene = scene;
        this.oceanRadius = oceanRadius;
        this.simulacra = [];
        this.maxSimulacra = 8;
        this.spawnTimer = 0;
        this.spawnInterval = 3.0; // seconds between spawns
        
        this.createSimulacra();
    }
    
    createSimulacra() {
        const simulacraTypes = [
            this.createHumanoidForm.bind(this),
            this.createArchitecturalForm.bind(this),
            this.createAbstractForm.bind(this),
            this.createMemoryForm.bind(this)
        ];
        
        for (let i = 0; i < this.maxSimulacra; i++) {
            const typeIndex = Math.floor(Math.random() * simulacraTypes.length);
            const simulacrum = simulacraTypes[typeIndex]();
            
            // Random position on sphere surface
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            
            simulacrum.position.x = this.oceanRadius * Math.sin(theta) * Math.cos(phi);
            simulacrum.position.y = this.oceanRadius * Math.sin(theta) * Math.sin(phi);
            simulacrum.position.z = this.oceanRadius * Math.cos(theta);
            
            // Orient to surface normal
            const normal = simulacrum.position.clone().normalize();
            simulacrum.lookAt(normal.clone().add(simulacrum.position));
            
            simulacrum.userData = {
                type: typeIndex,
                phase: Math.random() * Math.PI * 2,
                emergenceProgress: 0,
                maxHeight: 0.5 + Math.random() * 1.5,
                lifespan: 10 + Math.random() * 20,
                age: 0,
                basePosition: simulacrum.position.clone(),
                originalScale: simulacrum.scale.clone()
            };
            
            simulacrum.scale.setScalar(0.01); // Start very small
            this.simulacra.push(simulacrum);
            this.scene.add(simulacrum);
        }
    }
    
    createSimulacruMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uEmergence: { value: 0 },
                uColor: { value: new THREE.Color(0xf0b7cd) },
                uOpacity: { value: 0.6 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uEmergence;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                float noise(vec3 p) {
                    return sin(p.x * 3.0 + uTime) * cos(p.y * 2.0 + uTime) * sin(p.z * 4.0 + uTime) * 0.1;
                }
                
                void main() {
                    vPosition = position;
                    vec3 pos = position;
                    
                    // Fluid deformation
                    pos += normal * noise(position * 5.0) * uEmergence;
                    
                    // Breathing motion
                    pos += normal * sin(uTime * 2.0 + position.x + position.y + position.z) * 0.05 * uEmergence;
                    
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
                
                void main() {
                    float fresnel = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 2.0);
                    
                    vec3 color = uColor;
                    color += fresnel * uColor * 0.5;
                    
                    // Flowing patterns
                    float flow = sin(vPosition.x * 10.0 + uTime * 3.0) * cos(vPosition.y * 8.0 + uTime * 2.0);
                    color += flow * 0.1 * vec3(1.0, 0.8, 0.9);
                    
                    float alpha = uOpacity * uEmergence * (0.8 + fresnel * 0.2);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
    }
    
    createHumanoidForm() {
        const group = new THREE.Group();
        const material = this.createSimulacruMaterial();
        
        // Torso
        const torso = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8),
            material
        );
        torso.position.y = 0.6;
        group.add(torso);
        
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 6),
            material
        );
        head.position.y = 1.4;
        group.add(head);
        
        // Arms
        for (let i = 0; i < 2; i++) {
            const arm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.12, 0.8, 6),
                material
            );
            arm.position.set((i === 0 ? -0.4 : 0.4), 0.8, 0);
            arm.rotation.z = (i === 0 ? -0.3 : 0.3);
            group.add(arm);
        }
        
        return group;
    }
    
    createArchitecturalForm() {
        const group = new THREE.Group();
        const material = this.createSimulacruMaterial();
        
        // Base structure
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.2, 0.8),
            material
        );
        base.position.y = 0.1;
        group.add(base);
        
        // Columns
        for (let i = 0; i < 4; i++) {
            const column = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8),
                material
            );
            const angle = (i / 4) * Math.PI * 2;
            column.position.set(
                Math.cos(angle) * 0.3,
                0.7,
                Math.sin(angle) * 0.3
            );
            group.add(column);
        }
        
        // Roof
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 0.4, 8),
            material
        );
        roof.position.y = 1.4;
        group.add(roof);
        
        return group;
    }
    
    createAbstractForm() {
        const group = new THREE.Group();
        const material = this.createSimulacruMaterial();
        
        // Multiple flowing shapes
        for (let i = 0; i < 5; i++) {
            const shape = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 + Math.random() * 0.3, 6, 4),
                material
            );
            
            shape.position.set(
                (Math.random() - 0.5) * 0.8,
                Math.random() * 1.2,
                (Math.random() - 0.5) * 0.8
            );
            
            shape.scale.set(
                0.5 + Math.random(),
                1 + Math.random() * 2,
                0.5 + Math.random()
            );
            
            group.add(shape);
        }
        
        return group;
    }
    
    createMemoryForm() {
        const group = new THREE.Group();
        const material = this.createSimulacruMaterial();
        
        // Fragmented, incomplete shapes suggesting memories
        const fragments = [
            new THREE.SphereGeometry(0.2, 6, 4),
            new THREE.BoxGeometry(0.3, 0.3, 0.1),
            new THREE.CylinderGeometry(0.1, 0.1, 0.4, 6)
        ];
        
        for (let i = 0; i < 8; i++) {
            const fragment = new THREE.Mesh(
                fragments[Math.floor(Math.random() * fragments.length)],
                material
            );
            
            fragment.position.set(
                (Math.random() - 0.5) * 1.2,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 1.2
            );
            
            fragment.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            group.add(fragment);
        }
        
        return group;
    }
    
    update(deltaTime) {
        this.spawnTimer += deltaTime;
        
        for (let i = this.simulacra.length - 1; i >= 0; i--) {
            const simulacrum = this.simulacra[i];
            const userData = simulacrum.userData;
            
            userData.age += deltaTime;
            userData.phase += deltaTime * 0.5;
            
            // Lifecycle: emerge -> exist -> dissolve
            const lifecycle = userData.age / userData.lifespan;
            
            if (lifecycle < 0.3) {
                // Emerging
                userData.emergenceProgress = lifecycle / 0.3;
            } else if (lifecycle > 0.7) {
                // Dissolving
                userData.emergenceProgress = 1.0 - ((lifecycle - 0.7) / 0.3);
            } else {
                // Fully emerged
                userData.emergenceProgress = 1.0;
            }
            
            // Update scale and position
            const emergenceScale = Math.pow(userData.emergenceProgress, 0.5);
            simulacrum.scale.copy(userData.originalScale).multiplyScalar(emergenceScale);
            
            // Rise from surface
            const surfaceHeight = userData.maxHeight * userData.emergenceProgress;
            const normal = userData.basePosition.clone().normalize();
            simulacrum.position.copy(userData.basePosition).add(normal.multiplyScalar(surfaceHeight));
            
            // Fluid motion
            const wave = Math.sin(userData.phase) * 0.1 * userData.emergenceProgress;
            simulacrum.position.add(normal.multiplyScalar(wave));
            
            // Gentle rotation
            simulacrum.rotation.y += deltaTime * 0.2 * userData.emergenceProgress;
            
            // Update shader uniforms
            simulacrum.traverse((child) => {
                if (child.material && child.material.uniforms) {
                    child.material.uniforms.uTime.value += deltaTime;
                    child.material.uniforms.uEmergence.value = userData.emergenceProgress;
                }
            });
            
            // Remove if lifecycle complete
            if (userData.emergenceProgress <= 0.01 && userData.age > userData.lifespan * 0.7) {
                this.scene.remove(simulacrum);
                simulacrum.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.simulacra.splice(i, 1);
            }
        }
        
        // Spawn new simulacra
        if (this.spawnTimer > this.spawnInterval && this.simulacra.length < this.maxSimulacra) {
            this.spawnTimer = 0;
            this.spawnNewSimulacrum();
        }
    }
    
    spawnNewSimulacrum() {
        const types = [
            this.createHumanoidForm.bind(this),
            this.createArchitecturalForm.bind(this),
            this.createAbstractForm.bind(this),
            this.createMemoryForm.bind(this)
        ];
        
        const simulacrum = types[Math.floor(Math.random() * types.length)]();
        
        // Random position on sphere surface
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        
        simulacrum.position.x = this.oceanRadius * Math.sin(theta) * Math.cos(phi);
        simulacrum.position.y = this.oceanRadius * Math.sin(theta) * Math.sin(phi);
        simulacrum.position.z = this.oceanRadius * Math.cos(theta);
        
        const normal = simulacrum.position.clone().normalize();
        simulacrum.lookAt(normal.clone().add(simulacrum.position));
        
        simulacrum.userData = {
            phase: Math.random() * Math.PI * 2,
            emergenceProgress: 0,
            maxHeight: 0.5 + Math.random() * 1.5,
            lifespan: 10 + Math.random() * 20,
            age: 0,
            basePosition: simulacrum.position.clone(),
            originalScale: simulacrum.scale.clone()
        };
        
        simulacrum.scale.setScalar(0.01);
        this.simulacra.push(simulacrum);
        this.scene.add(simulacrum);
    }
    
    // Method to get simulacra near a position (for interaction)
    getSimulacraNear(position, radius = 2.0) {
        return this.simulacra.filter(simulacrum => {
            return simulacrum.position.distanceTo(position) < radius;
        });
    }
}
