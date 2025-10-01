import * as THREE from 'three';

/**
 * Fog system for atmospheric effects with sun-responsive color mixing
 * Supports both exponential and linear fog with dynamic controls
 */

export class SolarisFog {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.isEnabled = options.enabled !== false; 

        // Solaris color palette
        this.palette = {
            redSun: new THREE.Color(0xE07A5F),
            blueSun: new THREE.Color(0x3D5A80),
            oceanBase: new THREE.Color(0x6A4C93),
            baseAtmosphere: new THREE.Color(0x1a0f1f) // Deep purple-black
        };

        // Default fog parameters
        this.config = {
            type: options.type || 'exponential',
            color: options.color || 0x1a0f1f,
            density: options.density || 0.08,
            near: options.near || 10,
            far: options.far || 100,
            animateColor: options.animateColor !== false, 
            animateDensity: options.animateDensity !== false,
            colorShiftSpeed: options.colorShiftSpeed || 0.5,
            densityPulseSpeed: options.densityPulseSpeed || 0.3,
            baseDensity: options.density || 0.08,
            sunInfluence: options.sunInfluence !== false, // Enable sun-based color mixing
            sunInfluenceStrength: options.sunInfluenceStrength || 0.4
        };

        this.time = 0;
        this.fog = null; 
        this.baseColor = new THREE.Color(this.config.color);
        this.sunData = null; // Will store sun positions and colors

        this.init();
    }

    init() {
        if (this.config.type === 'exponential') {
            this.fog = new THREE.FogExp2(this.config.color, this.config.density);
        } else {
            this.fog = new THREE.Fog(this.config.color, this.config.near, this.config.far);
        }
        if (this.isEnabled) {
            this.scene.fog = this.fog;
        }
    }

    /**
     * Set sun data for dynamic fog coloring
     * @param {Array} suns - Array of sun objects from createSuns
     */
    setSunData(suns) {
        this.sunData = suns;
    }

    /**
     * Calculate fog color based on sun positions
     * @returns {THREE.Color} Mixed fog color
     */
    calculateSunInfluencedColor() {
        if (!this.sunData || this.sunData.length === 0) {
            return this.baseColor.clone();
        }

        // Start with base atmospheric color
        let mixedColor = this.palette.baseAtmosphere.clone();
        
        // Get sun positions and calculate their influence
        const suns = this.sunData;
        const redSun = suns[0]; // First sun is red
        const blueSun = suns[1]; // Second sun is blue
        
        if (redSun && redSun.group) {
            // Red sun influence based on height above horizon
            const redHeight = Math.max(0, redSun.group.position.y);
            const redInfluence = (redHeight / 250) * this.config.sunInfluenceStrength;
            
            // Mix in red sun color
            mixedColor.lerp(this.palette.redSun, redInfluence);
        }
        
        if (blueSun && blueSun.group) {
            // Blue sun influence based on height above horizon
            const blueHeight = Math.max(0, blueSun.group.position.y);
            const blueInfluence = (blueHeight / 220) * this.config.sunInfluenceStrength;
            
            // Mix in blue sun color
            mixedColor.lerp(this.palette.blueSun, blueInfluence);
        }
        
        // Blend with ocean base color for cohesion
        mixedColor.lerp(this.palette.oceanBase, 0.15);
        
        return mixedColor;
    }

    /**
     * Update fog parameters - call this in your animation loop
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        if (!this.isEnabled || !this.fog) return;

        this.time += deltaTime;

        // Calculate base color with sun influence
        let targetColor;
        if (this.config.sunInfluence && this.sunData) {
            targetColor = this.calculateSunInfluencedColor();
        } else {
            targetColor = this.baseColor.clone();
        }

        // Animate fog color with subtle shifts
        if (this.config.animateColor) {
            const colorShift = Math.sin(this.time * this.config.colorShiftSpeed) * 0.05 + 0.95;
            const hslTarget = { h: 0, s: 0, l: 0 };
            targetColor.getHSL(hslTarget);
            
            // Subtle hue shift
            const hue = (hslTarget.h + Math.sin(this.time * 0.15) * 0.02) % 1;
            this.fog.color.setHSL(
                hue, 
                Math.max(0.2, hslTarget.s * colorShift),
                Math.max(0.05, hslTarget.l * colorShift)
            );
        } else {
            // Smoothly transition to target color
            this.fog.color.lerp(targetColor, 0.02);
        }

        // Animate fog density with subtle breathing effect
        if (this.config.animateDensity && this.config.type === 'exponential') {
            const densityPulse = Math.sin(this.time * this.config.densityPulseSpeed) * 0.015;
            this.fog.density = this.config.baseDensity + densityPulse;
        }
    }

    /**
     * Enable or disable fog
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.scene.fog = enabled ? this.fog : null;
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
        this.init();
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
        // Mysterious thick atmosphere with sun influence
        mysterious: {
            type: 'exponential',
            color: 0x2a1f3d,
            density: 0.12,
            animateColor: true,
            animateDensity: true,
            sunInfluence: true,
            sunInfluenceStrength: 0.5
        },

        // Clean alien sky with subtle haze and sun colors
        clear: {
            type: 'exponential',
            color: 0x1a0f1f,
            density: 0.04,
            animateColor: true,
            animateDensity: false,
            sunInfluence: true,
            sunInfluenceStrength: 0.3
        },

        // Dense, oppressive atmosphere
        heavy: {
            type: 'exponential',
            color: 0x0f0520,
            density: 0.2,
            animateColor: true,
            animateDensity: true,
            densityPulseSpeed: 0.1,
            sunInfluence: true,
            sunInfluenceStrength: 0.4
        },

        // Dreamy, ethereal atmosphere with strong sun colors
        ethereal: {
            type: 'linear',
            color: 0x6A4C93,
            near: 5,
            far: 50,
            animateColor: true,
            colorShiftSpeed: 0.3,
            sunInfluence: true,
            sunInfluenceStrength: 0.6
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
            this.setEnabled(true);
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
