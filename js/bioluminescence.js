import * as THREE from 'three';

/**
 * Bioluminescent depth effects for the Solaris ocean
 * Glowing patterns that drift inside the translucent mass,
 * suggesting internal complexity and alien thought processes
 */
export class SolarisBioluminescence {
  constructor(scene, oceanRadius = 5) {
    this.scene = scene;
    this.oceanRadius = oceanRadius;
    this.lightOrbs = [];
    this.electricDischarges = [];
    this.time = 0;
    
    this.init();
  }
  
  init() {
    // Create drifting light orbs inside the ocean
    this.createLightOrbs();
    
    // Create occasional electric-like discharges
    this.createElectricDischarges();
  }
  
  createLightOrbs() {
    // Light sources that drift through the gelatinous mass
    const orbCount = 15;
    
    for (let i = 0; i < orbCount; i++) {
      // Create glowing sphere geometry
      const size = 0.1 + Math.random() * 0.15;
      const orbGeometry = new THREE.SphereGeometry(size, 16, 16);
      
      // Shader material for pulsing glow
      const orbMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color() },
          pulseSpeed: { value: 0.5 + Math.random() * 1.5 },
          pulsePhase: { value: Math.random() * Math.PI * 2 },
          glowIntensity: { value: 0.4 + Math.random() * 0.4 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color;
          uniform float pulseSpeed;
          uniform float pulsePhase;
          uniform float glowIntensity;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            // Pulsing intensity
            float pulse = sin(time * pulseSpeed + pulsePhase) * 0.5 + 0.5;
            pulse = 0.3 + pulse * 0.7;
            
            // Glow from center
            float dist = length(vPosition);
            float glow = 1.0 - smoothstep(0.0, 1.0, dist);
            
            // Fresnel edge glow
            vec3 viewDirection = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.0);
            
            vec3 finalColor = color * (glow + fresnel * 0.5) * glowIntensity * pulse;
            float alpha = (glow * 0.6 + fresnel * 0.4) * pulse;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide
      });
      
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      
      // Random position inside the ocean sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * (this.oceanRadius - 0.5); // Stay inside
      
      orb.position.x = r * Math.sin(phi) * Math.cos(theta);
      orb.position.y = r * Math.sin(phi) * Math.sin(theta);
      orb.position.z = r * Math.cos(phi);
      
      // Random color - cool deep ocean tones with occasional warm spots
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        // Deep blue-violet
        orbMaterial.uniforms.color.value.setHex(0x6B4C9A);
      } else if (colorChoice < 0.7) {
        // Cyan-teal
        orbMaterial.uniforms.color.value.setHex(0x4A9B9B);
      } else if (colorChoice < 0.85) {
        // Pale luminous blue
        orbMaterial.uniforms.color.value.setHex(0x8EC5FC);
      } else {
        // Rare warm amber (alien metabolism?)
        orbMaterial.uniforms.color.value.setHex(0xFFB366);
      }
      
      // Drift properties
      orb.userData.driftSpeed = 0.02 + Math.random() * 0.03;
      orb.userData.driftAngle = Math.random() * Math.PI * 2;
      orb.userData.verticalDrift = (Math.random() - 0.5) * 0.01;
      orb.userData.orbitSpeed = (Math.random() - 0.5) * 0.1;
      
      this.lightOrbs.push(orb);
      this.scene.add(orb);
    }
  }
  
  createElectricDischarges() {
    // Electric-like connections between internal structures
    const dischargeCount = 8;
    
    for (let i = 0; i < dischargeCount; i++) {
      // Create line geometry for discharge
      const points = [];
      const segments = 12;
      
      // Start and end points inside the ocean
      const startTheta = Math.random() * Math.PI * 2;
      const startPhi = Math.acos(2 * Math.random() - 1);
      const startR = Math.random() * (this.oceanRadius - 1);
      
      const endTheta = Math.random() * Math.PI * 2;
      const endPhi = Math.acos(2 * Math.random() - 1);
      const endR = Math.random() * (this.oceanRadius - 1);
      
      const start = new THREE.Vector3(
        startR * Math.sin(startPhi) * Math.cos(startTheta),
        startR * Math.sin(startPhi) * Math.sin(startTheta),
        startR * Math.cos(startPhi)
      );
      
      const end = new THREE.Vector3(
        endR * Math.sin(endPhi) * Math.cos(endTheta),
        endR * Math.sin(endPhi) * Math.sin(endTheta),
        endR * Math.cos(endPhi)
      );
      
      // Create jagged lightning-like path
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const point = start.clone().lerp(end, t);
        
        // Add random jitter (less in middle, more at ends for organic look)
        const jitterAmount = Math.sin(t * Math.PI) * 0.3;
        point.x += (Math.random() - 0.5) * jitterAmount;
        point.y += (Math.random() - 0.5) * jitterAmount;
        point.z += (Math.random() - 0.5) * jitterAmount;
        
        points.push(point);
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // Glowing line material
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0x88CCFF) },
          opacity: { value: 0 },
          pulseSpeed: { value: 2.0 + Math.random() * 2.0 },
          pulsePhase: { value: Math.random() * Math.PI * 2 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color;
          uniform float opacity;
          uniform float pulseSpeed;
          uniform float pulsePhase;
          varying vec2 vUv;
          
          void main() {
            // Traveling pulse along the discharge
            float pulse = sin(vUv.x * 10.0 - time * pulseSpeed + pulsePhase) * 0.5 + 0.5;
            pulse = pow(pulse, 3.0);
            
            float alpha = opacity * pulse;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const discharge = new THREE.Line(geometry, material);
      
      // Discharge behavior
      discharge.userData.active = false;
      discharge.userData.activeTime = 0;
      discharge.userData.maxActiveTime = 0.8 + Math.random() * 1.2;
      discharge.userData.cooldown = 0;
      discharge.userData.cooldownTime = 3.0 + Math.random() * 5.0;
      discharge.visible = false;
      
      this.electricDischarges.push(discharge);
      this.scene.add(discharge);
    }
  }
  
  update(deltaTime) {
    this.time += deltaTime;
    
    // Update light orbs
    this.lightOrbs.forEach(orb => {
      orb.material.uniforms.time.value = this.time;
      
      // Slow drift through the viscous medium
      orb.userData.driftAngle += orb.userData.orbitSpeed * deltaTime;
      
      const driftX = Math.cos(orb.userData.driftAngle) * orb.userData.driftSpeed * deltaTime;
      const driftZ = Math.sin(orb.userData.driftAngle) * orb.userData.driftSpeed * deltaTime;
      const driftY = orb.userData.verticalDrift * deltaTime;
      
      orb.position.x += driftX;
      orb.position.y += driftY;
      orb.position.z += driftZ;
      
      // Keep orbs inside the ocean sphere
      const distFromCenter = orb.position.length();
      if (distFromCenter > this.oceanRadius - 0.5) {
        // Reflect back inward
        const normal = orb.position.clone().normalize();
        orb.position.sub(normal.multiplyScalar(0.1));
        orb.userData.driftAngle += Math.PI; // Reverse direction
      }
      
      // Occasional depth changes
      if (Math.random() < 0.002) {
        orb.userData.verticalDrift = (Math.random() - 0.5) * 0.01;
      }
    });
    
    // Update electric discharges
    this.electricDischarges.forEach(discharge => {
      discharge.material.uniforms.time.value = this.time;
      
      if (discharge.userData.active) {
        // Discharge is firing
        discharge.userData.activeTime += deltaTime;
        
        // Fade in quickly, fade out slowly
        const fadeIn = Math.min(discharge.userData.activeTime * 5.0, 1.0);
        const remainingTime = discharge.userData.maxActiveTime - discharge.userData.activeTime;
        const fadeOut = Math.min(remainingTime * 2.0, 1.0);
        
        discharge.material.uniforms.opacity.value = Math.min(fadeIn, fadeOut) * 0.5;
        discharge.visible = true;
        
        if (discharge.userData.activeTime >= discharge.userData.maxActiveTime) {
          // Discharge complete, enter cooldown
          discharge.userData.active = false;
          discharge.userData.activeTime = 0;
          discharge.userData.cooldown = discharge.userData.cooldownTime;
          discharge.visible = false;
        }
      } else {
        // Cooldown period
        discharge.userData.cooldown -= deltaTime;
        
        if (discharge.userData.cooldown <= 0) {
          // Random chance to fire
          if (Math.random() < 0.01) {
            discharge.userData.active = true;
            discharge.userData.activeTime = 0;
          } else {
            discharge.userData.cooldown = 1.0; // Check again soon
          }
        }
      }
    });
  }
  
  // Control intensity of bioluminescence
  setIntensity(intensity) {
    this.lightOrbs.forEach(orb => {
      const baseIntensity = 0.4 + Math.random() * 0.4;
      orb.material.uniforms.glowIntensity.value = baseIntensity * intensity;
    });
  }
  
  // Toggle visibility
  setVisible(visible) {
    this.lightOrbs.forEach(orb => orb.visible = visible);
    this.electricDischarges.forEach(discharge => {
      if (!visible) discharge.visible = false;
    });
  }
  
  dispose() {
    this.lightOrbs.forEach(orb => {
      orb.geometry.dispose();
      orb.material.dispose();
      this.scene.remove(orb);
    });
    
    this.electricDischarges.forEach(discharge => {
      discharge.geometry.dispose();
      discharge.material.dispose();
      this.scene.remove(discharge);
    });
  }
}
