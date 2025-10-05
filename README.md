# Ocean Solaris

A simulation of a gelatinous, shape-shifting ocean inspired by Stanisław Lem's Solaris, created using Three.js.

![Screenshot of Ocean Solaris](https://github.com/magdhamilt/ocean-solaris/blob/master/screenshots/solaris1.jpg)

Demo available [here](https://magdhamilt.github.io/ocean-solaris/).

## Table of Contents
- [Description](#description)
- [Features](#features)
- [Camera Controls](#camera-controls)
- [Technical Details](#technical-details)
- [Screenshots](#screenshots)
- [Links](#links)

## Description

In Stanisław Lem's novel, the Ocean of Solaris is a sentient, planet-sized entity that has existed for millions of years. Despite decades of research, scientists cannot communicate with or understand this vast alien intelligence. The Ocean spontaneously generates elaborate formations—Symmetriads, Mimoids, Asymmetriads—that have been exhaustively catalogued yet remain incomprehensible. It also materializes "visitors" drawn from researchers' deepest memories, forcing confrontation with humanity's inability to grasp truly alien consciousness.

This project brings that mysterious entity to life through dynamic morphing, ethereal movements, and hypnotic visual patterns that capture the Ocean's unknowable nature.

## Features

- **Living Ocean**: Continuously morphing gelatinous surface that responds to observation
- **Gravitational Stabilization**: Dual-sun system where the ocean actively counteracts orbital chaos
- **Emergent Formations**: Five types of spontaneous structures (Symmetriads, Asymmetriads, Mimoids, Vertebrids, Extensors)
- **Plasma Eruptions**: Periodic energy fountains across the surface
- **Atmospheric Effects**: Dynamic fog, mist, bioluminescence, and realistic starfield
- **Intelligent Response**: Ocean "notices" and reacts when observed
- **Dual Camera Modes**: Surface walking and orbital flight

## Camera Controls

### Movement
- **WASD/Arrow Keys**: Move around
  - **When close** (< 8 units): Walk on surface
  - **When far** (> 8 units): Orbit around planet

### View
- **Mouse drag**: Look around

### Zoom
- **Mouse wheel**: Zoom in/out
- **Q or Space**: Zoom out
- **E or Shift**: Zoom in

## Technical Details

### Architecture

The simulation uses a custom WebGL shader system built with Three.js to create a living, gelatinous ocean that responds to observation and gravitational forces.

### Core Ocean Rendering

**Custom Shader Material**: The ocean uses vertex and fragment shaders to achieve its unique gelatinous appearance and behavior.

**Vertex Shader**: Implements multi-layered wave displacement using custom blobWave functions that combine sinusoidal motion at different frequencies (3.0, 5.0, 7.0 Hz) and speeds to create organic, planetary-scale undulation. Subtle pulse effects add breathing-like motion to the surface.

**Fragment Shader**: Creates the translucent, semi-gelatinous appearance through:

- **Subsurface Scattering**: Depth-based light penetration simulation with exponential attenuation
- **Dynamic Viscosity**: Fractal Brownian Motion (FBM) generates varying viscosity zones that affect transparency, reflectivity, and response to engineering activity
- **Fresnel Effects**: Edge-based glow that varies with viscosity (more liquid = stronger fresnel)
- **Environmental Reflections**: Cube map reflections modulated by metalness and roughness parameters

### Procedural Noise Systems

- **Hash-based Noise**: Custom 2D noise functions in fragment shaders for organic patterns and engineering visualizations
- **Fractal Brownian Motion (FBM)**: Multi-octave noise (4 iterations) creates complex, natural-looking variations in viscosity, subsurface color, and neural patterns
- **Simplex Noise**: Used in atmospheric effects (mist, starfield) for smooth, continuous movement

### Intelligent Systems

**Observation Response System**:
- Raycasting detects where the camera looks at the ocean surface
- Shader uniforms create localized "awareness" that spreads from observation points
- Rippling patterns and increased luminosity simulate the ocean "noticing" being observed
- Smooth fade-in/fade-out creates organic response behavior

**Gravitational Engineering Visualization**:
- Calculates sun alignment and distance to create dynamic "engineering zones"
- FBM-based pulse patterns with wave interference simulate the ocean's work stabilizing orbital mechanics
- The ocean counteracts 95% of gravitational chaos, leaving 5% visible as surface shimmer
- Dual-sun system creates overlapping engineering patterns with distinct color signatures

### Performance Optimizations

- **LOD System**: Three levels of detail (128, 64, 32 segments) automatically switch based on camera distance
- **Instanced Geometries**: Plasma fountains and formations use efficient geometry reuse
- **Selective Rendering**: Depth writing and blending modes optimized per-layer
- **Shader Complexity Management**: Critical calculations cached in varyings to minimize fragment shader load

### Atmospheric & Environmental Effects

**Multi-layered Atmosphere**:
- **Fog System** (fog.js): Dynamic exponential fog with sun-responsive color mixing
- **Mist Layers** (mist.js): Shader-based surface mist with Simplex noise distortion
- **Starfield** (starfield.js): Three depth layers with realistic stellar classification (O, B, A, F, G, K, M types)
- **Bioluminescence** (bioluminescence.js): Internal light orbs with pulsing shaders and electric discharge effects

**Emergent Formations** (simulacra.js):
- Five distinct formation types (Symmetriad, Asymmetriad, Mimoid, Vertebrid, Extensor)
- Lifecycle system with emergence, maturation, and dissolution phases
- Shader-based translucency with flowing internal patterns using 3D noise functions
- Weighted spawn system for varied appearance frequency

### Plasma Eruption System

Real-time procedural plasma fountains with:
- Cone geometry with custom flow shaders
- Hash-based noise for turbulent effects
- Time-based lifecycle management (3-5 second duration)
- Additive blending for energy-like appearance
- Dynamic color gradients (red → yellow → cyan)

### Technical Stack

- **Three.js r128**: Core rendering engine
- **WebGL Shaders**: GLSL vertex and fragment shaders for all major effects
- **Custom Noise Functions**: Hash-based, Simplex, and FBM implementations
- **Raycasting**: For intelligent observation detection
- **Dynamic Uniforms**: Real-time shader parameter updates for animation

### Controls & Camera System

Dual-mode camera system:
- **Surface Mode** (< 8.0 units): WASD movement along sphere surface with look direction
- **Orbit Mode** (> 8.0 units): Traditional orbital camera controls
- Mouse drag for rotation, wheel for zoom
- Smooth transitions between modes

## Screenshots

<p align="center">
  <img src="https://github.com/magdhamilt/ocean-solaris/blob/master/screenshots/solaris3.jpg" width="250" />
  <img src="https://github.com/magdhamilt/ocean-solaris/blob/master/screenshots/solaris2.jpg" width="250" />
  <img src="https://github.com/magdhamilt/ocean-solaris/blob/master/screenshots/solaris4.jpg" width="250" />
</p>

## Links

- [Demo link](https://magdhamilt.github.io/ocean-solaris/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Solaris (novel) - Wikipedia](https://en.wikipedia.org/wiki/Solaris_(novel))
