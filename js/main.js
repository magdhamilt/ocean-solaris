import * as THREE from 'three';
import SolarisFog from './fog.js';
import SolarisSimulacra from './simulacra.js';
import { createSuns } from './suns.js';

//Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const fog = new SolarisFog(scene);
const simulacra = new SolarisSimulacra(scene, 5);
const suns = createSuns(scene);

//Camera - positioned on the surface        
camera.position.set(0, 5.1, 0); // Just above the surface (radius is 5)

//Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Enhanced camera controls with zoom
let cameraAngleY = 0;
let cameraAngleX = 0;
let cameraDistance = 5.2; // Start just above surface
let moveSpeed = 0.01;
let zoomSpeed = 0.1;
const minDistance = 5.1; // Just above surface
const maxDistance = 25.0; // Far enough to see whole planet

const keys = {};
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

document.addEventListener('mousemove', (event) => {
    if (event.buttons === 1) { // Left mouse button held
        cameraAngleY -= event.movementX * 0.005;
        cameraAngleX -= event.movementY * 0.005;
        cameraAngleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraAngleX));
    }
});

// Mouse wheel for zooming
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
    accentBlue: new THREE.Color(0x8EE3EF)
};

//Shader Material with Dynamic Sun Influence
const uniforms = {
    uTime: {value: 0.0},
    uOceanBase: { value: colorPalette.oceanBase},
    uHighlight1: { value: colorPalette.oceanHighlight1},
    uHighlight2: { value: colorPalette.oceanHighlight2},
    uRedSunColor: { value: colorPalette.redSun},
    uBlueSunColor: { value: colorPalette.blueSun},
    uAccentRed: { value: colorPalette.accentRed},
    uAccentBlue: { value: colorPalette.accentBlue},
    uMetalness: { value: 0.2},
    uRoughness: { value: 0.35},
    uOpacity: { value: 0.85},
    uGlowIntensity: { value: 0.8},
    uFresnelPower: { value: 2.8},
    uEnvMap: { value: envMap },
    uRedSunPos: { value: new THREE.Vector3(15, 8, 5)},
    uBlueSunPos: { value: new THREE.Vector3(-12, 6, -8)},
};

const vertexShader = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPos;
varying vec3 vWorldPos;

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
uniform float uMetalness;
uniform float uRoughness;
uniform float uOpacity;
uniform float uGlowIntensity;
uniform float uFresnelPower;
uniform samplerCube uEnvMap;
uniform vec3 uRedSunPos;
uniform vec3 uBlueSunPos;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPos;
varying vec3 vWorldPos;

void main() {
    vec3 norm = normalize(vNormal);
    
    // Calculate sun influences based on distance and angle
    vec3 toRedSun = normalize(uRedSunPos - vWorldPos);
    vec3 toBlueSun = normalize(uBlueSunPos - vWorldPos);
    
    float redSunInfluence = max(0.0, dot(norm, toRedSun)) * 0.4;
    float blueSunInfluence = max(0.0, dot(norm, toBlueSun)) * 0.4;
    
    // Distance-based falloff for more realistic lighting
    float redDist = length(uRedSunPos - vWorldPos);
    float blueDist = length(uBlueSunPos - vWorldPos);
    redSunInfluence *= 1.0 / (1.0 + redDist * 0.02);
    blueSunInfluence *= 1.0 / (1.0 + blueDist * 0.02);
    
    // Dynamic color mixing based on sun positions
    vec3 sunTint = uRedSunColor * redSunInfluence + uBlueSunColor * blueSunInfluence;
    
    // Depth-based color variation (gelatinous effect)
    float depthFactor = (vPos.y + 5.0) / 10.0; // Normalize based on sphere radius
    vec3 depthColor = mix(uOceanBase, uHighlight2, depthFactor * 0.3);
    
    // Movement-based iridescence
    float iridescence = sin(vPos.x * 3.0 + vPos.y * 2.0 + vPos.z * 4.0 + uTime * 2.0) * 0.5 + 0.5;
    vec3 iridescentColor = mix(uHighlight1, uHighlight2, iridescence);
    
    // Base ocean color with depth and iridescence
    vec3 baseColor = mix(depthColor, iridescentColor, 0.15);
    
    // Add sun tinting
    baseColor = mix(baseColor, baseColor * (1.0 + sunTint), 0.6);
    
    // Fresnel effect for gelatinous look
    float fresnel = pow(1.0 - dot(norm, normalize(vViewDir)), uFresnelPower);
    
    // Environment reflection with color tinting
    vec3 reflected = reflect(-vViewDir, norm);
    vec3 envColor = textureCube(uEnvMap, reflected).rgb;
    vec3 tintedEnv = envColor * mix(uOceanBase, vec3(1.0), 0.5);
    
    // Combine base color with metallic reflection
    vec3 color = mix(baseColor, tintedEnv, uMetalness * 0.8);
    
    // Pulsing glow with accent colors
    float pulse = 0.5 + 0.5 * sin(vPos.x*2.0 + vPos.y*2.0 + vPos.z*2.0 + uTime*3.0);
    vec3 glowColor = mix(uAccentRed, uAccentBlue, sin(uTime * 0.5) * 0.5 + 0.5);
    
    // Add subtle glow with fresnel
    color += fresnel * glowColor * uGlowIntensity * pulse * 0.4;
    
    // Add sun-colored highlights at edges
    color += fresnel * sunTint * 0.5;

    gl_FragColor = vec4(color, uOpacity);
}
`;

const ectoplasmMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
});

//Sphere for planet-scale ectoplasm
const geometry = new THREE.SphereGeometry(5, 64, 64);
const planet = new THREE.Mesh(geometry, ectoplasmMaterial);
scene.add(planet);

//Animate
const clock = new THREE.Clock();

function animate () {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    ectoplasmMaterial.uniforms.uTime.value = clock.getElapsedTime();

    fog.update(clock.getDelta());
    simulacra.update(deltaTime);
    suns.update(deltaTime);
    
    // Enhanced movement system - surface movement when close, orbital when far
    const surfaceThreshold = 8.0; // Distance threshold for switching movement modes
    const isSurfaceMode = cameraDistance < surfaceThreshold;
    
    if (isSurfaceMode) {
        // Surface exploration movement (original behavior)
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
        
        // Keep camera on planet surface with current distance
        const normalizedPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z).normalize();
        camera.position.copy(normalizedPos.multiplyScalar(cameraDistance));
    } else {
        // Orbital movement when zoomed out
        if (keys['w'] || keys['arrowup']) cameraAngleX -= 0.02;
        if (keys['s'] || keys['arrowdown']) cameraAngleX += 0.02;
        if (keys['a'] || keys['arrowleft']) cameraAngleY -= 0.02;
        if (keys['d'] || keys['arrowright']) cameraAngleY += 0.02;
        
        cameraAngleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraAngleX));
        
        // Position camera in orbit around planet
        camera.position.x = Math.cos(cameraAngleX) * Math.sin(cameraAngleY) * cameraDistance;
        camera.position.y = Math.sin(cameraAngleX) * cameraDistance;
        camera.position.z = Math.cos(cameraAngleX) * Math.cos(cameraAngleY) * cameraDistance;
    }
    
    // Zoom controls with keyboard
    if (keys['q'] || keys[' ']) { // Q or Space to zoom out
        cameraDistance += zoomSpeed;
        cameraDistance = Math.min(cameraDistance, maxDistance);
    }
    if (keys['e'] || keys['shift']) { // E or Shift to zoom in
        cameraDistance -= zoomSpeed;
        cameraDistance = Math.max(cameraDistance, minDistance);
    }
    
    // Camera look direction - different behavior for surface vs orbital mode
    if (isSurfaceMode) {
        // Surface mode: look along the surface
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
        // Orbital mode: always look at planet center
        camera.lookAt(0, 0, 0);
    }
    
    planet.rotation.y += 0.001; //slow planet spin
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