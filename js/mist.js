import * as THREE from 'three';

/**
 * Mist and atmospheric effects for the Solaris ocean
 * Creates alien, ever-shifting vapor formations that rise from the living ocean
 */
export class SolarisMist {
  constructor(scene, oceanRadius = 50) {
    this.scene = scene;
    this.oceanRadius = oceanRadius;
    this.mistLayers = [];
    this.vaporClouds = [];
    this.time = 0;
    
    this.init();
  }
  
  init() {
    // Create multiple layers of low-lying mist that clings to the ocean surface
    this.createSurfaceMist();
    
    // Create occasional vapor clouds that rise and dissipate
    this.createVaporClouds();
    
    // Create wispy tendrils of mist
    this.createMistTendrils();
  }
  
  createSurfaceMist() {
    // Low, thick mist that hugs the ocean surface
    const mistGeometry = new THREE.PlaneGeometry(
      this.oceanRadius * 3, 
      this.oceanRadius * 3, 
      32, 
      32
    );
    
    // Create custom shader for animated, alien mist
    const mistMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.12 },
        color: { value: new THREE.Color(0x8899aa) }, // Cool, alien blue-grey
        mistSpeed: { value: 0.1 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vElevation;
        uniform float time;
        
        // Noise function for organic movement
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Create slow, undulating movement
          float elevation = snoise(uv * 3.0 + time * 0.1) * 0.5;
          elevation += snoise(uv * 7.0 - time * 0.15) * 0.2;
          elevation += snoise(uv * 12.0 + time * 0.08) * 0.1;
          
          pos.z += elevation;
          vElevation = elevation;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float opacity;
        uniform vec3 color;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          // Create swirling patterns in the mist
          float dist = length(vUv - 0.5);
          float alpha = opacity * (1.0 - dist * 1.2) * (0.5 + vElevation);
          alpha = clamp(alpha, 0.0, 0.4);
          
          // Add subtle color variation
          vec3 finalColor = color + vElevation * 0.1;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    // Create only 2 layers instead of 3
    for (let i = 0; i < 2; i++) {
      const mist = new THREE.Mesh(mistGeometry, mistMaterial.clone());
      mist.rotation.x = -Math.PI / 2;
      mist.position.y = 0.5 + i * 1.2;
      mist.userData.rotationSpeed = 0.01 + Math.random() * 0.005;
      mist.userData.baseY = mist.position.y;
      this.mistLayers.push(mist);
      this.scene.add(mist);
    }
  }
  
  createVaporClouds() {
    // Volumetric clouds that occasionally rise from the ocean
    const cloudCount = 4; // Reduced from 8
    
    for (let i = 0; i < cloudCount; i++) {
      const cloudGeometry = new THREE.SphereGeometry(2 + Math.random() * 1.5, 12, 12); // Smaller and lower poly
      
      const cloudMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          opacity: { value: 0.08 }, // Much more subtle
          phase: { value: Math.random() * Math.PI * 2 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float time;
          uniform float phase;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            
            vec3 pos = position;
            // Irregular pulsing and distortion
            float distortion = sin(pos.x * 2.0 + time + phase) * 0.2;
            distortion += cos(pos.y * 3.0 - time * 0.7 + phase) * 0.15;
            pos += normal * distortion;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float opacity;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            // Fresnel effect for more realistic clouds
            vec3 viewDirection = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);
            
            float alpha = opacity * fresnel;
            vec3 color = vec3(0.7, 0.75, 0.85); // Pale, alien vapor
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false
      });
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      
      // Random starting position around the ocean
      const angle = (i / cloudCount) * Math.PI * 2;
      const distance = this.oceanRadius * 0.6 + Math.random() * this.oceanRadius * 0.3;
      cloud.position.x = Math.cos(angle) * distance;
      cloud.position.z = Math.sin(angle) * distance;
      cloud.position.y = -2 + Math.random() * 3;
      
      cloud.userData.riseSpeed = 0.01 + Math.random() * 0.02;
      cloud.userData.maxHeight = 8 + Math.random() * 6;
      cloud.userData.driftSpeed = 0.005 + Math.random() * 0.01;
      cloud.userData.angle = angle;
      
      this.vaporClouds.push(cloud);
      this.scene.add(cloud);
    }
  }
  
  createMistTendrils() {
    // Thin, wispy tendrils that rise sporadically
    const tendrilCount = 12;
    
    for (let i = 0; i < tendrilCount; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.5, 2, 0.3),
        new THREE.Vector3(-0.3, 4, 0.5),
        new THREE.Vector3(0.2, 6, -0.2)
      ]);
      
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
      const tendrilMaterial = new THREE.MeshBasicMaterial({
        color: 0x99aabb,
        transparent: true,
        opacity: 0.1,
        depthWrite: false
      });
      
      const tendril = new THREE.Mesh(tubeGeometry, tendrilMaterial);
      
      // Random position
      const angle = Math.random() * Math.PI * 2;
      const distance = this.oceanRadius * (0.5 + Math.random() * 0.4);
      tendril.position.x = Math.cos(angle) * distance;
      tendril.position.z = Math.sin(angle) * distance;
      tendril.position.y = 0;
      
      tendril.userData.phase = Math.random() * Math.PI * 2;
      tendril.userData.visible = Math.random() > 0.5;
      tendril.visible = tendril.userData.visible;
      
      this.vaporClouds.push(tendril);
      this.scene.add(tendril);
    }
  }
  
  update(deltaTime) {
    this.time += deltaTime;
    
    // Update mist layers
    this.mistLayers.forEach(mist => {
      mist.material.uniforms.time.value = this.time;
      mist.rotation.z += mist.userData.rotationSpeed * deltaTime;
      
      // Subtle vertical breathing motion
      mist.position.y = mist.userData.baseY + Math.sin(this.time * 0.3) * 0.2;
    });
    
    // Update vapor clouds
    this.vaporClouds.forEach(cloud => {
      if (cloud.material.uniforms) {
        cloud.material.uniforms.time.value = this.time;
        
        // Rise and dissipate
        cloud.position.y += cloud.userData.riseSpeed;
        
        // Horizontal drift
        cloud.userData.angle += cloud.userData.driftSpeed * deltaTime;
        const distance = Math.sqrt(cloud.position.x ** 2 + cloud.position.z ** 2);
        cloud.position.x = Math.cos(cloud.userData.angle) * distance;
        cloud.position.z = Math.sin(cloud.userData.angle) * distance;
        
        // Reset if too high
        if (cloud.position.y > cloud.userData.maxHeight) {
          cloud.position.y = -2 + Math.random() * 2;
        }
        
        // Fade based on height
        const heightFactor = cloud.position.y / cloud.userData.maxHeight;
        cloud.material.uniforms.opacity.value = 0.15 * (1.0 - heightFactor);
      }
    });
  }
  
  // Allow external control of mist intensity
  setIntensity(intensity) {
    this.mistLayers.forEach(mist => {
      mist.material.uniforms.opacity.value = 0.3 * intensity;
    });
  }
  
  // Toggle visibility
  setVisible(visible) {
    this.mistLayers.forEach(mist => mist.visible = visible);
    this.vaporClouds.forEach(cloud => cloud.visible = visible);
  }
  
  dispose() {
    this.mistLayers.forEach(mist => {
      mist.geometry.dispose();
      mist.material.dispose();
      this.scene.remove(mist);
    });
    
    this.vaporClouds.forEach(cloud => {
      cloud.geometry.dispose();
      cloud.material.dispose();
      this.scene.remove(cloud);
    });
  }
}

// Usage:
// import { SolarisMist } from './mist.js';
// const mist = new SolarisMist(scene, oceanRadius);
// // In your animation loop:
// mist.update(deltaTime);