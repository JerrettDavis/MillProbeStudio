# Virtual Mill Architecture

## Overview
The VirtualMill is a real-time simulation of a CNC milling machine that accurately models machine behavior, feedrates, and collision detection. It's designed to allow users to validate their probe sequences against actual 3D models before running them on real hardware.

## Core Design Principles

### 1. Real-Time Simulation
- All movements occur at configured feedrates in real time
- Time-based interpolation for smooth animation
- Support for pause/resume/speed adjustment
- Accurate timing calculations based on distance and feedrate

### 2. Predictive Collision Detection
- Mathematical calculation of exact intersection points
- No iterative step-by-step simulation
- Given start point A and stock geometry, predict contact point B
- Works for all axes (X, Y, Z) and movement types

### 3. Machine Orientation Awareness
- **Horizontal Mills**: Probe fixed in X-axis, stage moves in X
- **Vertical Mills**: Probe moves in all axes, stage fixed
- Proper coordinate transformations between machine and world space

### 4. Extensible Geometry System
- Current: Bounding box collision detection
- Future: STL/OBJ mesh-based collision detection
- Abstract geometry interface for different collision types

## Architecture Components

### VirtualMill (Core Machine State)
```typescript
class VirtualMill {
  // Machine configuration and current state
  // Coordinate system management
  // G-code command parsing and validation
  // Machine limits and safety checks
}
```

### MovementController (Real-Time Movement)
```typescript
class MovementController {
  // Time-based movement calculations
  // Feedrate and acceleration handling
  // Movement interpolation for animation
  // Movement queue management
}
```

### CollisionPredictor (Mathematical Collision Detection)
```typescript
class CollisionPredictor {
  // Ray-box intersection for bounding boxes
  // Future: Ray-mesh intersection for STL/OBJ
  // Cylinder-geometry intersection for probe collision
  // Exact contact point calculation
}
```

### GeometrySystem (Stock and Model Management)
```typescript
interface Geometry {
  intersectRay(origin, direction): IntersectionResult
  getBounds(): BoundingBox
  getType(): 'box' | 'mesh' | 'compound'
}

class BoxGeometry implements Geometry
class MeshGeometry implements Geometry // Future: STL/OBJ support
```

## Movement Types

### 1. Rapid Movement (G0)
- Maximum machine feedrate
- Point-to-point movement
- No collision checking during movement
- Used for positioning moves

### 2. Linear Movement (G1)
- Specified feedrate
- Linear interpolation between points
- Collision checking for safety

### 3. Probe Movement (G38.x)
- Specified feedrate
- Collision detection enabled
- Stops at first contact point
- Returns contact coordinates

## Collision Detection Algorithm

### For Bounding Box Geometry
```typescript
function predictProbeContact(
  startPos: Position3D,
  direction: Vector3D,
  toolRadius: number,
  stockBounds: BoundingBox
): ContactResult {
  // 1. Create ray from probe center along movement direction
  // 2. Expand stock bounds by tool radius
  // 3. Calculate ray-box intersection
  // 4. Return exact contact point and distance
}
```

### Key Mathematical Concepts
- **Ray-Box Intersection**: Standard computer graphics algorithm
- **Cylinder-Box Intersection**: Treat probe as moving cylinder
- **Coordinate Transformations**: Machine ↔ World ↔ Stock coordinates

## Real-Time Animation

### Movement State Machine
```
IDLE → MOVING → CONTACT_DETECTED → IDLE
     ↘ STOPPED → IDLE
```

### Interpolation Functions
```typescript
interface MovementState {
  startPos: Position3D
  endPos: Position3D
  startTime: number
  duration: number
  feedrate: number
  type: 'rapid' | 'linear' | 'probe'
}

function interpolatePosition(state: MovementState, currentTime: number): Position3D
```

## Machine Orientation Handling

### Horizontal Mills
- **Probe Position**: Fixed at spindle location (X = machine.axes.X.max)
- **Stage Position**: Moves opposite to machine X coordinate
- **Collision Detection**: Use transformed coordinates
- **Stock Position**: Affected by stage movement

### Vertical Mills
- **Probe Position**: Follows machine coordinates directly
- **Stage Position**: Fixed in world space
- **Collision Detection**: Direct coordinate mapping
- **Stock Position**: Fixed relative to stage

## Future Enhancements

### STL/OBJ Model Support
```typescript
class MeshGeometry implements Geometry {
  private vertices: Float32Array
  private faces: Uint32Array
  private bvh: BoundingVolumeHierarchy
  
  intersectRay(origin: Vector3D, direction: Vector3D): IntersectionResult {
    // Use BVH for fast ray-mesh intersection
    // Return closest intersection point
  }
}
```

### Advanced Features
- **Multi-tool support**: Different probe sizes and types
- **Material properties**: Different stock materials
- **Machining simulation**: Actual material removal
- **Toolpath optimization**: Collision avoidance
- **Real machine integration**: Live sync with actual CNC

## Usage Examples

### Basic Probe Sequence
```typescript
const mill = new VirtualMill(machineSettings)
mill.setStock(new BoxGeometry([50, 50, 25], [0, 0, 0]))

// Position probe above stock
await mill.executeGCode({ type: 'rapid', X: 0, Y: 0, Z: 10 })

// Probe down to find stock surface
const contact = await mill.executeGCode({ 
  type: 'probe', 
  axis: 'Z', 
  direction: -1, 
  distance: 15, 
  feedRate: 100 
})

console.log('Stock surface found at:', contact.position)
console.log('Movement took:', contact.duration, 'seconds')
```

### Real-Time Animation
```typescript
const movement = mill.startMovement({ type: 'probe', ... })

// Animation loop
function animate() {
  const currentPos = movement.getCurrentPosition()
  const progress = movement.getProgress()
  
  if (movement.isComplete()) {
    console.log('Movement finished at:', movement.getFinalPosition())
  } else {
    updateVisualization(currentPos, progress)
    requestAnimationFrame(animate)
  }
}
```

This architecture provides a solid foundation for accurate CNC simulation while remaining extensible for future features like STL/OBJ model support.
