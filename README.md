# Ocean Solaris

A simulation of a gelatinous, shape-shifting ocean inspired by Stanislaw Lem’s Solaris, created using Three.js.

This project aims to bring to life the mysterious, ever-changing alien entity from the classic sci-fi novel, featuring dynamic morphing, ethereal movements, and hypnotic visual patterns. 

## Table of Contents
- [Features] (#Features)
- [Camera Controls] (#Camera Controls)
- [Technical Details] (#Technical Details)

## Features

- **Dynamic Ocean Simulation**: Continuously morphing gelatinous surface with realistic undulation.
- **Shape-shifting Simulacra**: Spontaneous generation of abstract structures and patterns.
- **Interactive Camera Controls**: Exploration of the ocean from multiple perspectives.
- **Atmospheric Rendering**: Ethereal lighting and fog effects to capture Solaris's alien atmosphere.
- **Responsive Design**: Adapts to different screen sizes and devices.
- **Optimized Performance**: Smooth 60fps animation with efficient WebGL rendering. 

## Camera Controls

**Movement:**
- **WASD/Arrow Keys**: Move around
  - **When close**: Walk on surface
  - **When far**: Orbit around planet

**Look Around:**
- **Mouse drag**: Look around
- **I**: Look up
- **K**: Look down
- **J**: Look left
- **L**: Look right

**Zoom:**
- **Mouse wheel**: Zoom in/out
- **Q or Space**: Zoom out
- **E or Shift**: Zoom in

## Live Demo

[Ocean Solaris Demo](https://magdhamilt.github.io/ocean-solaris/)

## Technical Details

### Architecture

The simulation uses a custom WebGL shader system for realistic ocean rendering:

- **Vertex Shader**: Handles wave displacement and morphing animations. 
- **Fragment Shader**: Creates the gelatinous, semi-translucent appearance.
- **Perlin Noise**: Generates organic movement patterns.
- **Simplex Noise**: Creates spontaneous formation structures. 
