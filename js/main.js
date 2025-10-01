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

// Mouse wheel for zooming (optional)
document.addEventListener('wheel', (event) => {
    event.preventDefault();
    cameraDistance += event.deltaY * 0.01;
    cameraDistance = Math.max(minDistance, Math.min(maxDistance, cameraDistance));
});

//Lights
// const dirLight = new THREE.DirectionalLight(0xffffff, 1);
// dirLight.position.set(20, 20, 20);
// scene.add(dirLight);
// scene.add(new THREE.AmbientLight(0x404040));

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

//Shader Material
const uniforms = {
    uTime: {value: 0.0},
    uColor: { value: new THREE.Color(0xf0b7cd)}, // Powder pink
    uMetalness: { value: 0.15},
    uRoughness: { value: 0.4},
    uOpacity: { value: 0.8},
    uGlowIntensity: { value: 1.0},
    uFresnelPower: { value: 2.5},
    uEnvMap: { value: envMap },
};

const vertexShader = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPos;

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
    vViewDir = normalize((modelViewMatrix*vec4(pos, 1.0)).xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uMetalness;
uniform float uRoughness;
uniform float uOpacity;
uniform float uGlowIntensity;
uniform float uFresnelPower;
uniform samplerCube uEnvMap;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPos;

void main() {
    float fresnel = pow(1.0 - dot(vNormal, normalize(vViewDir)), uFresnelPower);
    vec3 reflected = reflect(-vViewDir, normalize(vNormal));
    vec3 envColor = textureCube(uEnvMap, reflected).rgb;

    // Make the base color more dominant
    vec3 color = mix(uColor, envColor * uColor, uMetalness);

    float pulse = 0.5 + 0.5 * sin(vPos.x*2.0 + vPos.y*2.0 + vPos.z*2.0 + uTime*3.0);
    
    // Add pink-tinted glow
    color += fresnel * uColor * uGlowIntensity * pulse;

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