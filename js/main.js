import * as THREE from 'three';
import SolarisFog from './fog.js';
import SolarisFormations from './simulacra.js';
import { createSuns } from './suns.js';
import SolarisStarfield from './starfield.js';
import { SolarisMist } from './mist.js';
import { SolarisBioluminescence } from './bioluminescence.js';

//Plasma Fountain Class
class PlasmaFountain {
    constructor(scene, position) {
        this.scene = scene;
        this.lifetime = 3.0 + Math.random() * 2.0; // 3-5 seconds
        this.maxLifetime = this.lifetime;
        
        // Create animated plasma jet geometry
        this.geometry = new THREE.ConeGeometry(0.3, 2, 8);
        
        // Custom plasma shader with flow animation
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uLifetime: { value: 1.0 },
                uColor1: { value: new THREE.Color(0xFF6B6B) },
                uColor2: { value: new THREE.Color(0xF2CC8F) },
                uColor3: { value: new THREE.Color(0x8EE3EF) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying float vHeight;
                void main() {
                    vUv = uv;
                    vHeight = position.y;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uLifetime;
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform vec3 uColor3;
                varying vec2 vUv;
                varying float vHeight;
                
                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }
                
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    float a = hash(i);
                    float b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0));
                    float d = hash(i + vec2(1.0, 1.0));
                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }
                
                void main() {
                    // Flowing plasma effect
                    float flow = noise(vec2(vUv.x * 3.0, vUv.y * 2.0 - uTime * 2.0));
                    flow += noise(vec2(vUv.x * 6.0, vUv.y * 4.0 - uTime * 3.0)) * 0.5;
                    
                    // Height-based color gradient
                    vec3 color = mix(uColor1, uColor2, vHeight * 0.5 + 0.5);
                    color = mix(color, uColor3, flow);
                    
                    // Turbulent edges
                    float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
                    
                    // Fade based on lifetime and height
                    float opacity = uLifetime * edge * (1.0 - vHeight * 0.3);
                    opacity *= (0.5 + flow * 0.5);
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(position);
        
        // Random rotation for variety
        this.mesh.rotation.z = Math.random() * Math.PI * 2;
        
        scene.add(this.mesh);
    }
    
    update(deltaTime, time) {
        this.lifetime -= deltaTime;
        
        // Update shader time
        this.material.uniforms.uTime.value = time;
        this.material.uniforms.uLifetime.value = this.lifetime / this.maxLifetime;
        
        // Pulsing height animation
        const pulsePhase = (1.0 - this.lifetime / this.maxLifetime);
        this.mesh.scale.y = Math.sin(pulsePhase * Math.PI) * (1.5 + Math.sin(time * 3.0) * 0.5);
        
        // Slight swaying motion
        this.mesh.rotation.x = Math.sin(time * 2.0) * 0.2;
        
        // Eruption grows then shrinks
        const scalePhase = Math.sin(pulsePhase * Math.PI);
        this.mesh.scale.x = scalePhase * 0.8;
        this.mesh.scale.z = scalePhase * 0.8;
        
        return this.lifetime > 0;
    }
    
    destroy() {
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
    }
}

//Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const fog = new SolarisFog(scene);
const formations = new SolarisFormations(scene, 5);
const suns = createSuns(scene);
const starfield = new SolarisStarfield(scene, {
    starCount: 1200,
    minDistance: 30,
    maxDistance: 100,
    minBrightness: 0.5,
    maxBrightness: 1.0,
    warmStarRatio: 0.3,
    twinkleSpeed: 0.5,
    baseOpacity: 0.8
});

const oceanRadius = 5;

const mist = new SolarisMist(scene, oceanRadius);

const bioluminescence = new SolarisBioluminescence(scene, 5);

// Connect fog to suns for dynamic color mixing
fog.setSunData(suns.getSuns());

//Camera - positioned on the surface        
camera.position.set(0, 5.1, 0);

//Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Enhanced camera controls with zoom
let cameraAngleY = 0;
let cameraAngleX = 0;
let cameraDistance = 5.2;
let moveSpeed = 0.01;
let zoomSpeed = 0.1;
const minDistance = 5.1;
const maxDistance = 25.0;

const keys = {};
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

document.addEventListener('mousemove', (event) => {
    if (event.buttons === 1) {
        cameraAngleY -= event.movementX * 0.005;
        cameraAngleX -= event.movementY * 0.005;
        cameraAngleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraAngleX));
    }
});

document.addEventListener('wheel', (event) => {
    event.preventDefault();
    cameraDistance += event.deltaY * 0.01;
    cameraDistance = Math.max(minDistance, Math.min(maxDistance, cameraDistance));
});

//Environment Map for Metallic Reflection
const loader = new THREE.CubeTextureLoader();
const envMap = loader.load([
    'https://threejs.org/examples/textures/cube/Bridge2/posx.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/negx.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/posy.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/negy.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/posz.jpg',
    'https://threejs.org/examples/textures/cube/Bridge2/negz.jpg',
]);

scene.environment = envMap;

//Color Palette - Solaris Theme
const colorPalette = {
    redSun: new THREE.Color(0xE07A5F),
    blueSun: new THREE.Color(0x3D5A80),
    oceanBase: new THREE.Color(0x6A4C93),
    oceanHighlight1: new THREE.Color(0xF2CC8F),
    oceanHighlight2: new THREE.Color(0xD9B3FF),
    accentRed: new THREE.Color(0xFF6B6B),
    accentBlue: new THREE.Color(0x8EE3EF),
    deepPurple: new THREE.Color(0x1a0d26)
};

//Shader Material with Dynamic Sun Influence and Engineering Visualization
const uniforms = {
    uTime: {value: 0.0},
    uOceanBase: { value: colorPalette.oceanBase},
    uHighlight1: { value: colorPalette.oceanHighlight1},
    uHighlight2: { value: colorPalette.oceanHighlight2},
    uRedSunColor: { value: colorPalette.redSun},
    uBlueSunColor: { value: colorPalette.blueSun},
    uAccentRed: { value: colorPalette.accentRed},
    uAccentBlue: { value: colorPalette.accentBlue},
    uDeepPurple: { value: colorPalette.deepPurple},
    uMetalness: { value: 0.3},
    uRoughness: { value: 0.35},
    uOpacity: { value: 0.95},
    uGlowIntensity: { value: 0.8},
    uFresnelPower: { value: 2.8},
    uEnvMap: { value: envMap },
    uRedSunPos: { value: new THREE.Vector3(15, 8, 5)},
    uBlueSunPos: { value: new THREE.Vector3(-12, 6, -8)},
    uEngineeringIntensity: { value: 1.5 },
    uEngineeringColor: { value: new THREE.Color(0xff9eb3) },
    uDepthFalloff: { value: 0.3 },
    uSubsurfaceStrength: { value: 0.5 },
    uObservationPoint: { value: new THREE.Vector3(0, 0, 0) },
    uObservationIntensity: { value: 0.0 },
    uObservationRadius: { value: 3.0 }
};

const vertexShader = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPos;
varying vec3 vWorldPos;
varying vec2 vUv;
varying float vDepth;

float blobWave(vec3 pos, float speed, float freq, float amp){
    return sin(pos.x*freq + uTime*speed)* amp +
    cos(pos.y*freq+uTime*speed)*amp+
    sin(pos.z*freq+uTime * speed)* amp;
}

void main() {
    vPos = position;
    vec3 pos = position;

    //Gooey Planetary Motion
    float w1 = blobWave(pos, 1.0, 3.0, 0.1);
    float w2 = blobWave(pos, 0.5, 5.0, 0.05);
    float w3 = blobWave(pos, 0.2, 7.0, 0.03);
    pos += normalize(pos)*(w1 + w2 + w3);

    //Subtle Drips/Pulses
    pos += normalize(pos)*sin(uTime + pos.x*2.0+pos.y*2.0+pos.z*2.0)*0.05;

    vNormal = normalize(normalMatrix*normal);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = normalize((modelViewMatrix*vec4(pos, 1.0)).xyz);
    
    // Calculate depth from center (for subsurface scattering)
    vDepth = length(vWorldPos);
    
    // Calculate UV coordinates for engineering patterns
    vUv = vec2(
        atan(pos.z, pos.x) / (2.0 * 3.14159) + 0.5,
        asin(pos.y / length(pos)) / 3.14159 + 0.5
    );

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uOceanBase;
uniform vec3 uHighlight1;
uniform vec3 uHighlight2;
uniform vec3 uRedSunColor;
uniform vec3 uBlueSunColor;
uniform vec3 uAccentRed;
uniform vec3 uAccentBlue;
uniform vec3 uDeepPurple;
uniform float uMetalness;
uniform float uRoughness;
uniform float uOpacity;
uniform float uGlowIntensity;
uniform float uFresnelPower;
uniform samplerCube uEnvMap;
uniform vec3 uRedSunPos;
uniform vec3 uBlueSunPos;
uniform float uEngineeringIntensity;
uniform vec3 uEngineeringColor;
uniform float uDepthFalloff;
uniform float uSubsurfaceStrength;
uniform vec3 uObservationPoint;
uniform float uObservationIntensity;
uniform float uObservationRadius;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPos;
varying vec3 vWorldPos;
varying vec2 vUv;
varying float vDepth;

// Noise functions for organic engineering patterns
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Calculate engineering activity for a sun
float calculateEngineeringZone(vec3 sunPos, vec3 sunColor, int sunIndex) {
    vec3 normalizedPos = normalize(vWorldPos);
    vec3 toSun = normalize(sunPos - vWorldPos);
    
    float sunAlignment = max(0.0, dot(normalizedPos, toSun));
    float zoneIntensity = pow(sunAlignment, 2.0);
    
    vec2 pulseCoord = vUv * 4.0 + uTime * 0.08 * float(sunIndex + 1);
    float pulse = fbm(pulseCoord);
    pulse = sin(pulse * 6.28 + uTime * 1.5) * 0.5 + 0.5;
    
    float distance = length(vWorldPos - sunPos);
    float wave = sin(distance * 0.4 - uTime * 2.5 + float(sunIndex) * 3.14159) * 0.5 + 0.5;
    
    float interference = sin(sunAlignment * 15.0 - uTime * 1.8) * 0.5 + 0.5;
    interference = smoothstep(0.4, 0.6, interference);
    
    float activity = zoneIntensity * pulse * wave;
    activity = smoothstep(0.25, 0.85, activity);
    
    float rings = sin(sunAlignment * 25.0 - uTime * 1.2) * 0.5 + 0.5;
    activity += rings * zoneIntensity * interference * 0.4;
    
    return activity;
}

void main() {
    vec3 norm = normalize(vNormal);
    
    // Calculate sun influences
    vec3 toRedSun = normalize(uRedSunPos - vWorldPos);
    vec3 toBlueSun = normalize(uBlueSunPos - vWorldPos);
    
    float redSunInfluence = max(0.0, dot(norm, toRedSun)) * 0.4;
    float blueSunInfluence = max(0.0, dot(norm, toBlueSun)) * 0.4;
    
    float redDist = length(uRedSunPos - vWorldPos);
    float blueDist = length(uBlueSunPos - vWorldPos);
    redSunInfluence *= 1.0 / (1.0 + redDist * 0.02);
    blueSunInfluence *= 1.0 / (1.0 + blueDist * 0.02);
    
    vec3 sunTint = uRedSunColor * redSunInfluence + uBlueSunColor * blueSunInfluence;
    
    // === ENGINEERING VISUALIZATION ===
    float redEngineering = calculateEngineeringZone(uRedSunPos, uRedSunColor, 0);
    float blueEngineering = calculateEngineeringZone(uBlueSunPos, uBlueSunColor, 1);
    
    float totalEngineering = (redEngineering + blueEngineering) * uEngineeringIntensity;
    
    vec3 redZoneColor = mix(uEngineeringColor, uRedSunColor, 0.3);
    vec3 blueZoneColor = mix(uEngineeringColor, uBlueSunColor, 0.3);
    vec3 engineeringGlow = redZoneColor * redEngineering + blueZoneColor * blueEngineering;
    
    float engineeringEdge = length(fwidth(totalEngineering)) * 60.0;
    totalEngineering += engineeringEdge * 0.6;
    totalEngineering = clamp(totalEngineering, 0.0, 1.0);
    
    float neuralPattern = fbm(vUv * 8.0 + uTime * 0.05);
    neuralPattern = smoothstep(0.45, 0.55, neuralPattern);
    totalEngineering += neuralPattern * totalEngineering * 0.3;
    // === END ENGINEERING ===
    
    // === OBSERVATION RESPONSE ===
    // Ocean "notices" when being observed and responds
    float distToObservation = length(vWorldPos - uObservationPoint);
    float observationResponse = smoothstep(uObservationRadius, 0.0, distToObservation);
    observationResponse *= uObservationIntensity;
    
    // Create rippling awareness pattern
    float awarenessRipple = sin(distToObservation * 2.0 - uTime * 3.0) * 0.5 + 0.5;
    awarenessRipple *= observationResponse;
    
    // Pulsing consciousness at observation point
    float consciousnessPulse = sin(uTime * 4.0) * 0.5 + 0.5;
    float awareness = observationResponse * (0.6 + consciousnessPulse * 0.4);
    
    // Organic spreading pattern from observation point
    float spreadPattern = fbm(vUv * 6.0 + vec2(distToObservation * 0.5 - uTime * 0.3));
    awareness += spreadPattern * observationResponse * 0.3;
    // === END OBSERVATION ===
    
    // === VISCOSITY VARIATIONS ===
    // Different areas have different viscosities - more liquid vs more gel-like
    float viscosity = mix(0.3, 0.9, 
        fbm(vWorldPos.xy * 0.1 + uTime * 0.02));
    
    // Add slower, larger-scale viscosity zones
    float largeViscosityZones = fbm(vWorldPos.xz * 0.05 + uTime * 0.01);
    viscosity = mix(viscosity, largeViscosityZones, 0.4);
    
    // Viscosity affects how the ocean responds to engineering activity
    // More viscous = more resistant = less visible engineering patterns
    float viscosityResistance = smoothstep(0.4, 0.7, viscosity);
    // === END VISCOSITY ===
    
    // === DEPTH LAYERS & SUBSURFACE SCATTERING ===
    // Calculate depth-based subsurface scattering
    float depthAttenuation = exp(-vDepth * uDepthFalloff);
    
    // Create dynamic subsurface color with subtle variations
    float subsurfaceNoise = fbm(vWorldPos.xy * 0.3 + uTime * 0.03);
    vec3 subsurfaceColor = mix(
        uDeepPurple,
        mix(uOceanBase, uDeepPurple * 1.5, 0.6),
        subsurfaceNoise * 0.3 + 0.5
    );
    
    // Add depth-aware color variation with organic movement
    float depthColorShift = sin(vDepth * 0.8 - uTime * 0.5) * 0.5 + 0.5;
    subsurfaceColor = mix(subsurfaceColor, uOceanBase * 0.4, depthColorShift * depthAttenuation * 0.3);
    
    // Simulate light penetration through the gelatinous mass
    float lightPenetration = exp(-vDepth * 0.3);
    vec3 penetratedSunlight = (sunTint * 0.5 + vec3(0.2, 0.15, 0.25)) * lightPenetration;
    subsurfaceColor += penetratedSunlight * 0.4;
    // === END DEPTH LAYERS ===
    
    // Depth-based color variation (existing)
    float depthFactor = (vPos.y + 5.0) / 10.0;
    vec3 depthColor = mix(uOceanBase, uHighlight2, depthFactor * 0.3);
    
    // Movement-based iridescence
    float iridescence = sin(vPos.x * 3.0 + vPos.y * 2.0 + vPos.z * 4.0 + uTime * 2.0) * 0.5 + 0.5;
    vec3 iridescentColor = mix(uHighlight1, uHighlight2, iridescence);
    
    vec3 baseColor = mix(depthColor, iridescentColor, 0.15);
    baseColor = mix(baseColor, baseColor * (1.0 + sunTint), 0.6);
    
    // Blend in subsurface scattering for depth perception
    baseColor = mix(subsurfaceColor, baseColor, uSubsurfaceStrength);
    
    // Blend in engineering activity - modulated by viscosity
    // More viscous areas show less engineering (they're "slower" to respond)
    float engineeringVisibility = totalEngineering * mix(0.9, 0.4, viscosity);
    baseColor = mix(baseColor, engineeringGlow, engineeringVisibility * 0.7);
    
    // Add observation response - the ocean becomes more luminous where observed
    vec3 awarenessColor = mix(uHighlight1, uHighlight2, consciousnessPulse);
    awarenessColor = mix(awarenessColor, uEngineeringColor, 0.4);
    baseColor = mix(baseColor, awarenessColor, awareness * 0.5);
    baseColor += awarenessColor * awarenessRipple * 0.3;
    
    // Fresnel effect - stronger in less viscous (more liquid) areas
    float fresnelPower = mix(uFresnelPower, uFresnelPower * 1.5, 1.0 - viscosity);
    float fresnel = pow(1.0 - dot(norm, normalize(vViewDir)), fresnelPower);
    
    // Environment reflection - varies with viscosity
    // More viscous = less reflective (more opaque/matte)
    vec3 reflected = reflect(-vViewDir, norm);
    vec3 envColor = textureCube(uEnvMap, reflected).rgb;
    vec3 tintedEnv = envColor * mix(uOceanBase, vec3(1.0), 0.5);
    
    // Metalness and roughness vary with viscosity
    float effectiveMetalness = uMetalness * mix(1.2, 0.4, viscosity);
    float effectiveRoughness = mix(0.2, 0.6, 1.0 - viscosity);
    
    // Combine base color with metallic reflection
    vec3 color = mix(baseColor, tintedEnv, effectiveMetalness * 0.8);
    
    // Pulsing glow with accent colors
    float pulse = 0.5 + 0.5 * sin(vPos.x*2.0 + vPos.y*2.0 + vPos.z*2.0 + uTime*3.0);
    vec3 glowColor = mix(uAccentRed, uAccentBlue, sin(uTime * 0.5) * 0.5 + 0.5);
    
    color += fresnel * glowColor * uGlowIntensity * pulse * 0.4;
    color += fresnel * sunTint * 0.5;
    color += engineeringGlow * totalEngineering * 0.4;
    color += engineeringEdge * engineeringGlow * 0.3;
    
    // Add observation glow - makes the observed area more vibrant
    color += awarenessColor * awareness * 0.6;
    color += awarenessRipple * awarenessColor * observationResponse * 0.4;
    
    // Add subtle subsurface glow around edges
    float subsurfaceGlow = fresnel * depthAttenuation * 0.3;
    color += subsurfaceColor * subsurfaceGlow;
    
    // Dynamic opacity based on viscosity
    // More viscous = more opaque (gel-like), less viscous = more transparent (liquid)
    float dynamicOpacity = mix(0.88, 0.98, viscosity);
    
    // Areas with high engineering activity are slightly more visible
    dynamicOpacity = mix(dynamicOpacity, min(dynamicOpacity * 1.08, 1.0), totalEngineering * 0.3);
    
    // Observed areas become slightly more defined/solid
    dynamicOpacity = mix(dynamicOpacity, min(dynamicOpacity * 1.05, 1.0), awareness * 0.4);

    gl_FragColor = vec4(color, dynamicOpacity);
}
`;

const ectoplasmMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: true,
    side: THREE.DoubleSide
});

//Sphere for planet-scale ectoplasm with LOD system
const lod = new THREE.LOD();

// High detail - when close
const geometryHigh = new THREE.SphereGeometry(5, 128, 128);
const planetHigh = new THREE.Mesh(geometryHigh, ectoplasmMaterial);
lod.addLevel(planetHigh, 0);

// Medium detail - mid distance
const geometryMedium = new THREE.SphereGeometry(5, 64, 64);
const planetMedium = new THREE.Mesh(geometryMedium, ectoplasmMaterial);
lod.addLevel(planetMedium, 10);

// Low detail - far away
const geometryLow = new THREE.SphereGeometry(5, 32, 32);
const planetLow = new THREE.Mesh(geometryLow, ectoplasmMaterial);
lod.addLevel(planetLow, 20);

scene.add(lod);

// Keep reference to LOD for raycasting (use highest detail mesh)
const planet = planetHigh;

//Intelligent Observation System
let observationIntensity = 0;
const raycast = new THREE.Raycaster();

function updateObservation() {
    // Cast ray from center of screen (where camera is looking)
    raycast.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycast.intersectObject(planet);
    
    if (intersects.length > 0) {
        const point = intersects[0].point;
        // Ocean "notices" being observed
        observationIntensity = Math.min(1.0, observationIntensity + 0.01);
        
        // Update shader uniform for localized response
        ectoplasmMaterial.uniforms.uObservationPoint.value.copy(point);
        ectoplasmMaterial.uniforms.uObservationIntensity.value = observationIntensity;
    } else {
        // Fade when not directly observed
        observationIntensity *= 0.99;
        ectoplasmMaterial.uniforms.uObservationIntensity.value = observationIntensity;
    }
}

//Plasma Eruption System
const plasmaFountains = [];
let timeSinceLastEruption = 0;
const eruptionInterval = 4.0; // Average seconds between eruptions
const eruptionVariation = 3.0; // Random variation

function createPlasmaEruption() {
    // Random position on sphere surface
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 5.1; // Just above ocean surface
    
    const position = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
    );
    
    // Orient fountain outward from planet center
    const fountain = new PlasmaFountain(scene, position);
    const outwardDir = position.clone().normalize();
    fountain.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outwardDir);
    
    plasmaFountains.push(fountain);
}

function updatePlasmaEruptions(deltaTime, time) {
    // Update existing fountains
    for (let i = plasmaFountains.length - 1; i >= 0; i--) {
        const fountain = plasmaFountains[i];
        if (!fountain.update(deltaTime, time)) {
            // Remove expired fountain
            fountain.destroy();
            plasmaFountains.splice(i, 1);
        }
    }
    
    // Spawn new eruptions occasionally
    timeSinceLastEruption += deltaTime;
    const nextEruptionTime = eruptionInterval + (Math.random() - 0.5) * eruptionVariation;
    
    if (timeSinceLastEruption >= nextEruptionTime) {
        createPlasmaEruption();
        timeSinceLastEruption = 0;
    }
}

//Animate
const clock = new THREE.Clock();

function animate () {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    ectoplasmMaterial.uniforms.uTime.value = elapsedTime;

    fog.update(deltaTime);
    formations.update(deltaTime);
    suns.update(deltaTime);
    starfield.update(deltaTime);
    mist.update(deltaTime); 
    bioluminescence.update(deltaTime);
    updateObservation();
    updatePlasmaEruptions(deltaTime, elapsedTime);
    
    // Update sun positions for engineering visualization
    const sunsData = suns.getSuns();
    if (sunsData && sunsData.length >= 2) {
        ectoplasmMaterial.uniforms.uRedSunPos.value.copy(sunsData[0].position);
        ectoplasmMaterial.uniforms.uBlueSunPos.value.copy(sunsData[1].position);
    }
    
    // Make engineering intensity pulse slowly for living effect
    ectoplasmMaterial.uniforms.uEngineeringIntensity.value = 
        1.3 + Math.sin(clock.getElapsedTime() * 0.4) * 0.3;
    
    // Enhanced movement system
    const surfaceThreshold = 8.0;
    const isSurfaceMode = cameraDistance < surfaceThreshold;
    
    if (isSurfaceMode) {
        if (keys['w'] || keys['arrowup']) {
            camera.position.x += Math.sin(cameraAngleY) * moveSpeed;
            camera.position.z += Math.cos(cameraAngleY) * moveSpeed;
        }
        if (keys['s'] || keys['arrowdown']) {
            camera.position.x -= Math.sin(cameraAngleY) * moveSpeed;
            camera.position.z -= Math.cos(cameraAngleY) * moveSpeed;
        }
        if (keys['a'] || keys['arrowleft']) {
            camera.position.x += Math.cos(cameraAngleY) * moveSpeed;
            camera.position.z -= Math.sin(cameraAngleY) * moveSpeed;
        }
        if (keys['d'] || keys['arrowright']) {
            camera.position.x -= Math.cos(cameraAngleY) * moveSpeed;
            camera.position.z += Math.sin(cameraAngleY) * moveSpeed;
        }
        
        const normalizedPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z).normalize();
        camera.position.copy(normalizedPos.multiplyScalar(cameraDistance));
    } else {
        if (keys['w'] || keys['arrowup']) cameraAngleX -= 0.02;
        if (keys['s'] || keys['arrowdown']) cameraAngleX += 0.02;
        if (keys['a'] || keys['arrowleft']) cameraAngleY -= 0.02;
        if (keys['d'] || keys['arrowright']) cameraAngleY += 0.02;
        
        cameraAngleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraAngleX));
        
        camera.position.x = Math.cos(cameraAngleX) * Math.sin(cameraAngleY) * cameraDistance;
        camera.position.y = Math.sin(cameraAngleX) * cameraDistance;
        camera.position.z = Math.cos(cameraAngleX) * Math.cos(cameraAngleY) * cameraDistance;
    }
    
    if (keys['q'] || keys[' ']) {
        cameraDistance += zoomSpeed;
        cameraDistance = Math.min(cameraDistance, maxDistance);
    }
    if (keys['e'] || keys['shift']) {
        cameraDistance -= zoomSpeed;
        cameraDistance = Math.max(cameraDistance, minDistance);
    }
    
    if (isSurfaceMode) {
        const lookDirection = new THREE.Vector3(
            Math.sin(cameraAngleY) * Math.cos(cameraAngleX),
            Math.sin(cameraAngleX),
            Math.cos(cameraAngleY) * Math.cos(cameraAngleX)
        );
        
        camera.lookAt(
            camera.position.x + lookDirection.x,
            camera.position.y + lookDirection.y,
            camera.position.z + lookDirection.z
        );
    } else {
        camera.lookAt(0, 0, 0);
    }
    
    // Update LOD based on camera distance
    lod.update(camera);
    
    planet.rotation.y += 0.001;
    renderer.render(scene, camera);
}

animate();

//Handle resize
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// CONTROLS GUIDE:
// Mouse drag: Look around
// Mouse wheel: Zoom in/out
// WASD/Arrow keys: Move (surface mode) or orbit (when zoomed out)  
// Q/Space: Zoom out
// E/Shift: Zoom in
