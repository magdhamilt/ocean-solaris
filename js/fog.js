import * as THREE from 'three';
import { color, deltaTime, modelPosition, string } from 'three/tsl';

/**
 * Fog system for atmospheric effects
 * Supports both exponential and linear fog with dynamic controls
 */

export class SolarisFog {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.isEnabled = options.enabled !== false; 

        // Default fog parameters
        this.config = {
            type: options.type || 'exponential', // 'exponential' or 'linear'
            color: options.color || 0x1a0f1f,    // deep purple pink
            density: options.density || 0.08,    // for exponential fog (fixed missing comma)
            near: options.near || 10,            // for linear fog
            far: options.far || 100,             // for linear fog
            animateColor: options.animateColor !== false, 
            animateDensity: options.animateDensity !== false, // fixed typo: aniamteDensity
            colorShiftSpeed: options.colorShiftSpeed || 0.5,
            densityPulseSpeed: options.densityPulseSpeed || 0.3,
            baseDensity: options.density || 0.08
        };

        this.time = 0;
        this.fog = null; 
        this.baseColor = new THREE.Color(this.config.color);

        this.init();
    }

    init() { // fixed syntax: removed semicolon after init()
        if (this.config.type === 'exponential') { // fixed: == to ===
            this.fog = new THREE.FogExp2(this.config.color, this.config.density);
        } else {
            this.fog = new THREE.Fog(this.config.color, this.config.near, this.config.far);
        }
        if (this.isEnabled) {
            this.scene.fog = this.fog;
        }
    }

    /**
     * Update fog parameters - call this in your animation loop
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        if (!this.isEnabled || !this.fog) return; // fixed: this.Enabled to this.isEnabled

        this.time += deltaTime;

        // Animate fog color
        if (this.config.animateColor) {
            const colorShift = Math.sin(this.time * this.config.colorShiftSpeed) * 0.1 + 0.9;
            const hue = (this.baseColor.getHSL({}).h + Math.sin(this.time * 0.2) * 0.05) % 1;
            this.fog.color.setHSL(hue, 0.3, 0.1 * colorShift);
        }

        // Animate fog density
        if (this.config.animateDensity && this.config.type === 'exponential') {
            const densityPulse = Math.sin(this.time * this.config.densityPulseSpeed) * 0.02;
            this.fog.density = this.config.baseDensity + densityPulse;
        }
    }

    /**
     * Enable or disable fog
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.scene.fog = enabled ? this.fog : null; // fixed spacing
    }

    /**
     * Set fog color
     * @param {number|string} color - Color as hex or string
     */
    setColor(color) {
        this.config.color = color;
        this.baseColor.set(color);
        if (this.fog) {
            this.fog.color.set(color);
        }
    }

    /**
     * Set fog density (for exponential fog)
     * @param {number} density
     */
    setDensity(density) {
        this.config.density = density;
        this.config.baseDensity = density;
        if (this.fog && this.config.type === 'exponential') {
            this.fog.density = density;
        }
    }

    /**
     * Set fog near/far distances (for linear fog)
     * @param {number} near
     * @param {number} far
     */
    setRange(near, far) {
        this.config.near = near;
        this.config.far = far;
        if (this.fog && this.config.type === 'linear') {
            this.fog.near = near;
            this.fog.far = far;
        }
    }

    /**
     * Switch between fog types
     * @param {string} type - 'exponential' or 'linear'
     */
    setType(type) {
        this.config.type = type;
        this.init(); // fixed: added parentheses for function call
    }
    
    /**
     * Get current fog parameters for UI controls
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Preset configurations for different atmospheric moods
     */
    static presets = {
        // Mysterious thick atmosphere
        mysterious: {
            type: 'exponential',
            color: 0x2a1f3d,
            density: 0.12,
            animateColor: true,
            animateDensity: true
        },

        // Clean alien sky with subtle haze
        clear: {
            type: 'exponential',
            color: 0x1a0f1f,
            density: 0.04,
            animateColor: false, // fixed typo: aniamteColor
            animateDensity: false
        },

        // Dense, oppressive atmosphere
        heavy: {
            type: 'exponential',
            color: 0x0f0520,
            density: 0.2,
            animateColor: true,
            animateDensity: true,
            densityPulseSpeed: 0.1
        },

        // Dreamy, ethereal atmosphere
        ethereal: {
            type: 'linear',
            color: 0xf0b7cd,
            near: 5,
            far: 50,
            animateColor: true, // fixed typo: aniamteColor
            colorShiftSpeed: 0.3
        },

        // No fog - clear view
        none: {
            enabled: false
        }
    };

    /**
     * Apply a preset configuration 
     * @param {string} presetName - Name of the preset
     */
    applyPreset(presetName) {
        if (!SolarisFog.presets[presetName]) {
            console.warn(`Fog preset "${presetName}" not found`);
            return;
        }

        const preset = SolarisFog.presets[presetName];
        Object.assign(this.config, preset);

        if (preset.enabled === false) {
            this.setEnabled(false); 
        } else {
            this.setEnabled(true); // fixed: was setEnabled(false), should be true
            this.init();
        }
    }
}

// Convenience function for quick fog setup
export function createSolarisFog(scene, preset = 'mysterious') {
    const options = SolarisFog.presets[preset] || {};
    return new SolarisFog(scene, options);
}

export default SolarisFog;
