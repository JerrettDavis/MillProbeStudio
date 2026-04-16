# VirtualMill Integration as Simulation Controller

## Overview

This document describes how VirtualMill has been integrated as the controlling mechanism for simulation visualization in the Mill Probe Studio. The integration provides sophisticated simulation capabilities while maintaining backward compatibility with the existing visualization system.

## Problem Statement

The original probe simulation system (`useProbeSimulation`) implemented its own:
- Simple linear interpolation between start/end positions
- Basic box collision detection
- Custom coordinate transformation logic
- Separate animation timing system

This resulted in duplicated functionality and less accurate simulation compared to what VirtualMill already provided.

## Solution: VirtualMill Integration

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Visualization Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Scene3D.tsx  │  SimulationControls.tsx  │  Machine3D...   │
├─────────────────────────────────────────────────────────────┤
│              VirtualMillSimulationBridge                   │
├─────────────────────────────────────────────────────────────┤
│             useVirtualMillSimulation Hook                  │
├─────────────────────────────────────────────────────────────┤
│                    VirtualMill                             │
│  • Real-time animation     • Collision detection           │
│  • Coordinate transforms   • Machine orientation           │
│  • G-code execution        • WCS management                │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. `useVirtualMillSimulation` Hook
- **Location**: `src/hooks/visualization/useVirtualMillSimulation.ts`
- **Purpose**: Bridges VirtualMill with the existing simulation state management
- **Features**:
  - Converts probe operations to G-code commands
  - Uses VirtualMill's real-time animation (`executeGCode()`)
  - Leverages VirtualMill's collision detection
  - Provides real-time position updates via `getInterpolatedPosition()`
  - Maintains compatibility with existing store state

#### 2. `VirtualMillSimulationBridge` Component
- **Location**: `src/components/visualization/VirtualMillSimulationBridge.tsx`
- **Purpose**: Integration component that manages VirtualMill simulation lifecycle
- **Features**:
  - Initializes and manages VirtualMill instance
  - Syncs VirtualMill state with global store
  - Provides debugging and monitoring capabilities

#### 3. `VirtualMillScene3D` Component
- **Location**: `src/components/visualization/VirtualMillScene3D.tsx`
- **Purpose**: Drop-in replacement for Scene3D with VirtualMill integration
- **Usage**: Can replace existing Scene3D components to enable VirtualMill simulation

## Integration Benefits

### 1. **Improved Accuracy**
- **Real-time Animation**: Uses VirtualMill's sophisticated `animateMovement()` with proper feedrate calculations
- **Collision Detection**: Leverages VirtualMill's mathematical ray-box intersection instead of simple box checks
- **Coordinate Systems**: Proper handling of machine vs WCS coordinates and transformations

### 2. **Machine Orientation Support**
- **Horizontal Mills**: Proper stage movement simulation where stage moves instead of spindle in X
- **Vertical Mills**: Correct spindle movement in all axes
- **Physical vs Logical Bounds**: Accurate stock positioning based on machine orientation

### 3. **Advanced Features**
- **WCS Management**: Proper work coordinate system offset handling
- **Tool Radius**: Accurate collision detection accounting for tool diameter
- **Movement Types**: Support for rapid, linear, and probe moves with correct timing
- **Real-time Interpolation**: Smooth position updates during movement

### 4. **Extensibility**
- **G-code Compatibility**: Can execute any G-code command supported by VirtualMill
- **Future Features**: Ready for STL/OBJ collision detection, multiple tools, etc.
- **Debugging**: Rich debugging information and state inspection

## Usage Examples

### Basic Integration

Replace existing Scene3D usage:

```tsx
// Before
import { Scene3D } from '@/components/visualization/Scene3D';

<Scene3D
  machineSettings={machineSettings}
  probeSequence={probeSequence}
  // ... other props
/>

// After - with VirtualMill simulation
import { VirtualMillScene3D } from '@/components/visualization/VirtualMillScene3D';

<VirtualMillScene3D
  machineSettings={machineSettings}
  probeSequence={probeSequence}
  // ... other props (same interface)
/>
```

### Advanced Usage with Direct VirtualMill Access

```tsx
import { useVirtualMillSimulation } from '@/hooks/visualization/useVirtualMillSimulation';

function CustomSimulationComponent({ probeSequence }) {
  const virtualMillSim = useVirtualMillSimulation(probeSequence);
  
  // Access VirtualMill directly for advanced operations
  const mill = virtualMillSim.virtualMill;
  
  // Check if machine is currently moving
  const isMoving = virtualMillSim.isMoving();
  
  // Get current movement details
  const currentMovement = virtualMillSim.getCurrentMovement();
  
  // Access simulation steps
  const { steps, totalSteps, currentStep } = virtualMillSim;
  
  return (
    <div>
      <p>Simulation Steps: {totalSteps}</p>
      <p>Currently Moving: {isMoving ? 'Yes' : 'No'}</p>
      {currentStep && (
        <p>Current Step: {currentStep.type} - {currentStep.id}</p>
      )}
    </div>
  );
}
```

## Migration Guide

### Phase 1: Parallel Implementation (Current)
- VirtualMill simulation runs alongside existing simulation
- Both systems are available for comparison and testing
- No breaking changes to existing code

### Phase 2: Gradual Migration (Recommended)
1. **Update Machine3DVisualization**:
   ```tsx
   // In Machine3DVisualization.tsx
   import { VirtualMillScene3D } from '@/components/visualization/VirtualMillScene3D';
   
   // Replace Scene3D with VirtualMillScene3D
   <Canvas>
     <VirtualMillScene3D
       machineSettings={machineSettings}
       probeSequence={probeSequence}
       // ... existing props
     />
   </Canvas>
   ```

2. **Update SimulationControls** (Optional):
   - Can continue using existing controls
   - Or enhance to use VirtualMill's additional capabilities

3. **Testing and Validation**:
   - Compare simulation accuracy between old and new systems
   - Verify collision detection improvements
   - Test machine orientation handling

### Phase 3: Full Migration (Future)
- Replace `useProbeSimulation` with `useVirtualMillSimulation`
- Remove duplicate collision detection logic
- Simplify coordinate transformation code

## Technical Details

### Collision Detection Comparison

**Before (useProbeSimulation):**
```typescript
// Simple box overlap check
function doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, stockMin, stockMax, direction }) {
  // Basic cylinder-box intersection
  if (axis === 'X') {
    const frontEdgeX = probePos.X + toolRadius;
    if (frontEdgeX >= stockMin.X) {
      return { collision: true, contactPoint: { X: stockMin.X, Y: probePos.Y, Z: probePos.Z } };
    }
  }
  // ... similar for Y, Z
}
```

**After (VirtualMill):**
```typescript
// Mathematical ray-box intersection with expanded bounds
const contactPrediction = virtualMill.predictProbeContactFunctional(
  startPosition,
  command.axis,
  command.direction,
  command.distance
);

// Uses:
// - Ray-box intersection mathematics
// - Tool radius expansion of bounds
// - Exact contact point calculation
// - Distance-based collision timing
```

### Coordinate System Handling

**Before:**
```typescript
// Manual coordinate calculations
const stagePosition = calculateStagePosition(machineSettings, probeSequence);
const stockWorld = calculateStockWorldPosition(stagePosition, stockSize, stockPosition, stageDimensions);
```

**After:**
```typescript
// VirtualMill handles all coordinate transformations
const physicalPosition = virtualMill.getPhysicalProbePosition();
const physicalStockBounds = virtualMill.getPhysicalStockBounds();
const transformedCoords = virtualMill.transformCoordinates(position, 'machine', 'wcs');
```

## Testing and Validation

### Current Test Coverage
- VirtualMill core functionality: 36 tests passing
- Coordinate transformations: ✅
- Collision detection: ✅
- G-code execution: ✅
- Machine orientation: ✅

### Integration Testing
To test the VirtualMill integration:

1. **Run existing simulation tests**:
   ```bash
   npm test -- useProbeSimulation
   ```

2. **Test VirtualMill integration**:
   ```bash
   npm test -- useVirtualMillSimulation
   ```

3. **Visual testing**:
   - Load a probe sequence
   - Switch between old and new simulation
   - Compare movement accuracy and collision detection

## Future Enhancements

With VirtualMill as the simulation controller, the following features become readily available:

### 1. **Advanced Collision Detection**
- STL/OBJ model support (already architected in VirtualMill)
- Multiple tool types and sizes
- Complex geometry collision detection

### 2. **Enhanced Machine Simulation**
- Multiple coordinate systems (G54, G55, etc.)
- Tool changers and multiple tools
- Spindle speed and feedrate effects
- Acceleration and deceleration curves

### 3. **Real Machine Integration**
- Live sync with actual CNC controllers
- Position feedback and error detection
- Safety limit monitoring

### 4. **Performance Optimization**
- Hardware-accelerated collision detection
- Parallel simulation processing
- Optimized memory usage for large models

## Conclusion

The VirtualMill integration provides a sophisticated, accurate, and extensible foundation for probe simulation while maintaining backward compatibility. The modular architecture allows for gradual migration and testing, ensuring a smooth transition from the current simple simulation to a full-featured CNC simulation system.

The integration leverages VirtualMill's functional, declarative architecture to provide:
- More accurate simulation
- Better coordinate system handling
- Sophisticated collision detection
- Extensibility for future features
- Maintainable, well-tested code

This establishes VirtualMill as the definitive simulation controller for the Mill Probe Studio visualization system.
