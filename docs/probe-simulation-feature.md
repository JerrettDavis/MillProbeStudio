# Probe Simulation Feature Implementation

## Overview
This document describes the implementation of the probe simulation feature for the Mill Probe Studio visualizer. The feature allows users to visualize and simulate probing moves in the 3D visualizer, with the probe (spindle) animating its movements according to the G-code/machine coordinates and performing collision detection with the stock.

## Features Implemented

### 1. Simulation State Management
- **Location**: `src/store/index.ts`
- **New State**: Added `simulationState` to the global store with the following properties:
  - `isActive`: Whether simulation mode is active
  - `isPlaying`: Whether simulation is currently playing
  - `currentStepIndex`: Current step in the simulation sequence
  - `currentPosition`: Current animated tool position (X, Y, Z)
  - `contactPoints`: Array of detected contact points with position, timestamp, and metadata
  - `speed`: Simulation speed multiplier (0.1x to 3.0x)
  - `totalSteps`: Total number of simulation steps

### 2. Simulation Actions
- **Location**: `src/store/index.ts`
- **Actions Added**:
  - `startSimulation()`: Initialize and activate simulation mode
  - `stopSimulation()`: Stop and deactivate simulation
  - `playSimulation()`: Start/resume animation
  - `pauseSimulation()`: Pause animation
  - `resetSimulation()`: Reset to initial position and clear contact points
  - `setSimulationStep(index)`: Jump to specific step
  - `setSimulationPosition(position)`: Update current position
  - `setSimulationSpeed(speed)`: Adjust animation speed
  - `addContactPoint(point)`: Record contact/collision detection
  - `clearContactPoints()`: Clear all contact points

### 3. Simulation Engine
- **Location**: `src/hooks/visualization/useProbeSimulation.ts`
- **Features**:
  - Converts probe sequence into detailed simulation steps including:
    - Pre-moves (rapid positioning, dwells)
    - Probe moves (with collision detection)
    - Backoff moves
    - Post-moves
  - Animation loop using `requestAnimationFrame` for smooth movement
  - Real-time collision detection during probe moves
  - Position interpolation between start and end points
  - Respects simulation speed settings
  - Automatically stops probe moves when contact is detected

### 4. 3D Visualization Integration
- **Location**: `src/components/visualization/Scene3D.tsx`
- **Changes**:
  - Tool position now uses simulation position when simulation is active
  - Added visual indicators for contact points (red spheres)
  - Camera pivot follows simulated tool position during simulation
  - Seamless transition between normal and simulation modes

### 5. Simulation Controls UI
- **Location**: `src/components/visualization/SimulationControls.tsx`
- **Features**:
  - Play/Pause/Stop buttons for simulation control
  - Step forward/backward buttons for precise control
  - Progress slider to jump to any step in the sequence
  - Speed control slider (0.1x to 3.0x)
  - Current position display (X, Y, Z coordinates)
  - Contact points list with detailed information
  - Current step information (type, axis, operation)
  - Test sequence generator for demonstration

### 6. Collision Detection
- **Algorithm**: Simple box collision detection between probe and stock
- **Features**:
  - Real-time checking during probe moves
  - Configurable tolerance for detection sensitivity
  - Early termination of probe moves when contact is detected
  - Contact point recording with position, timestamp, and metadata
  - Visual feedback through red spheres in 3D scene

## User Workflow

1. **Setup**: Create or import a probe sequence
2. **Initialize**: Click the simulation controls to activate simulation mode
3. **Play**: Use play button to start the animated simulation
4. **Control**: 
   - Pause/resume animation
   - Adjust speed as needed
   - Step through moves manually
   - Jump to specific steps using the progress slider
5. **Monitor**: 
   - Watch tool movement in 3D visualization
   - Track contact points as they're detected
   - Monitor current position and step information
6. **Reset**: Reset simulation to replay or stop to return to normal mode

## Technical Details

### Animation System
- Uses `requestAnimationFrame` for 60fps smooth animation
- Position interpolation for natural movement
- Speed control affects animation timing
- Respects browser performance and throttling

### Collision Detection
- Simple but effective box collision for stock geometry
- Tolerance-based detection to prevent edge cases
- Real-time checking during probe moves only
- Extensible design for more complex geometry in the future

### State Synchronization
- Global state management ensures UI consistency
- Simulation state persists across component renders
- Clean separation between simulation and normal operation modes

### Performance Considerations
- Animation runs only when active and playing
- Efficient position calculations using linear interpolation
- Minimal render triggers through careful state management
- Automatic cleanup of animation loops

## Future Enhancements

1. **Advanced Collision Detection**: Support for complex 3D model geometry
2. **Probe Force Simulation**: Simulate probe deflection and force feedback
3. **Multiple Tool Support**: Different tool types with varying collision properties
4. **Export Capabilities**: Export simulation results and contact points
5. **Playback Recording**: Record and replay simulation sessions
6. **Performance Analytics**: Measure probe sequence efficiency and timing

## Testing

A test sequence generator is included that creates a simple 3-probe sequence:
- Y-axis probe (negative direction, 15mm distance)
- X-axis probe (negative direction, 12mm distance) 
- Z-axis probe (negative direction, 8mm distance)

This allows immediate testing of the simulation feature without requiring a complete probe sequence setup.
