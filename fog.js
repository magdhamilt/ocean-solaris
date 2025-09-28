import * as THREE from 'three';

export class SolarisFog {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.isEnabled = options.enabled !== false; 

        this.config = {
            type: options.type || 'exponential', //'exponential' or 'linear'
            color: options.color || 0x1a0f1f,    //deep purple pink
            density: options.density || 0.08     //for exponential fog
            near: options.near       || 10,      // for linear fog
            far: options.far || 100,             // for linear fog
            animateColor: options.animateColor !== false, 
            animatedensidade: options.aniamteDensity !== false,
            colorShiftSpeed: options.colorShiftSpeed || 0.5,
            densityPulseSpeed: options.densityPulseSpeed || 0.3,
            baseDensity: options.density || 0.08
        };

        this.time = 0;
        this.fog = null; 
        this.baseColor = new THREE.Color(this.config.color);

        this.init();
    }

    init();{
        if (this.config.type == 'exponential'){
            this.fog = new THREE.FogExp2(this.config.color, this.config.density);
        } else {
            this.fog = new THREE.Fog(this.config.color, this.config.near, this.config.far);
        }
        if (this.isEnabled) {
            this.scene.fog = this.fog;
        }
    }

    
}