import * as THREE from 'three';
import SolarisFog from './fog.js';

//Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const fog = new SolarisFog(scene);


   //Camera - positioned on the surface
        
        camera.position.set(0, 5.1, 0); // Just above the surface (radius is 5)

        //Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        //Simple surface exploration controls
        let cameraAngleY = 0;
        let cameraAngleX = 0;
        let moveSpeed = 0.01;

        const keys = {};
        document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
        
        document.addEventListener('mousemove', (event) => {
            if (event.buttons === 1) { // Left mouse button held
                cameraAngleY -= event.movementX * 0.005;
                cameraAngleX -= event.movementY * 0.005;
                cameraAngleX = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, cameraAngleX));
            }
        });

        //Lights
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(20, 20, 20);
        scene.add(dirLight);
        scene.add(new THREE.AmbientLight(0x404040));

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
            ectoplasmMaterial.uniforms.uTime.value = clock.getElapsedTime();

             fog.update(clock.getDelta());
            
            // Surface exploration movement
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

            // Keep camera on planet surface
            const distanceFromCenter = Math.sqrt(camera.position.x**2 + camera.position.z**2 + camera.position.y**2);
            const surfaceHeight = 5.2; // Slightly above surface
            const normalizedPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z).normalize();
            camera.position.copy(normalizedPos.multiplyScalar(surfaceHeight));
            
            // Camera look direction
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
