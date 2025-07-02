# Virtual Mill Custom Model Collision Enhancement

## Overview

This enhancement adds comprehensive support for custom STL/OBJ model collision detection to the VirtualMill simulation engine. Previously, VirtualMill only supported collision detection with rectangular stock geometry. Now it can perform accurate collision detection with complex 3D models while maintaining all existing functionality.

## Key Features

### 1. Custom Model Collision Detection
- **Ray-Mesh Intersection**: Uses Three.js raycaster for accurate collision detection with arbitrary geometry
- **Tool Radius Compensation**: Accounts for tool radius by checking multiple rays around the tool perimeter
- **Transformation Support**: Handles position, rotation, and scale transformations correctly
- **Performance Optimized**: Efficient collision algorithms suitable for real-time simulation

### 2. Enhanced VirtualMill API
- `setCustomModel(modelInfo)`: Configure custom model for collision detection
- `getCustomModel()`: Get current custom model information
- `hasCustomModel()`: Check if custom model is active
- `getContactPoints()`: Retrieve all recorded contact points
- `addContactPoint(point)`: Record new contact points
- `clearContactPoints()`: Clear all contact points

### 3. Visual Collision Indicators
- **Contact Point Visualization**: Shows glowing spheres at collision points
- **Different Colors**: Custom models use orange indicators, box stock uses blue
- **Cross Markers**: Additional visual aids for better visibility
- **Real-time Updates**: Contact points appear immediately when collisions occur

### 4. Seamless Integration
- **Drop-in Replacement**: VirtualMillScene3D component works as direct replacement for Scene3D
- **Backward Compatible**: All existing VirtualMill functionality preserved
- **Automatic Detection**: System automatically switches between box and custom model collision

## Architecture

### CustomModelCollision Class
```typescript
// Core collision detection utility
class CustomModelCollision {
  static checkProbeCollision(startPos, axis, direction, distance, modelInfo, toolRadius): CollisionResult
  static getModelBoundingBox(modelInfo): BoundingBox
  static isPointInside(point, modelInfo): boolean
}
```

### CustomModelInfo Interface
```typescript
interface CustomModelInfo {
  geometry: THREE.BufferGeometry;    // The loaded 3D model geometry
  position: [number, number, number]; // World position
  rotation: [number, number, number]; // Rotation in radians
  scale: [number, number, number];    // Scale factors
  boundingBox: THREE.Box3;           // Computed bounding box
}
```

### Enhanced VirtualMill Methods
```typescript
class VirtualMill {
  // Custom model configuration
  setCustomModel(modelInfo: CustomModelInfo | null): void
  getCustomModel(): CustomModelInfo | null
  hasCustomModel(): boolean
  
  // Contact point management
  getContactPoints(): Position3D[]
  addContactPoint(point: Position3D): void
  clearContactPoints(): void
}
```

## Integration Components

### useCustomModelInfo Hook
Converts uploaded model files into CustomModelInfo objects:
- Loads STL/OBJ files using Three.js loaders
- Applies scaling and positioning transformations
- Provides loading states and error handling
- Integrates with existing visualization settings

### VirtualMillSimulationBridge
Enhanced bridge component that:
- Configures custom models in VirtualMill
- Tracks contact points
- Provides context for collision indicators
- Maintains backward compatibility

### CollisionIndicator Component
Visual component that renders:
- Contact point spheres with glow effects
- Cross markers for better visibility
- Different colors for different collision types
- Configurable size and appearance

## Usage Examples

### Basic Setup
```typescript
// VirtualMill automatically uses custom model when available
const virtualMill = new VirtualMill(machineSettings, initialPosition);

// Configure custom model
virtualMill.setCustomModel(customModelInfo);

// Collision detection now uses custom geometry
const collision = virtualMill.checkProbeCollision(probePos, 'X', 1, distance);
```

### In Components
```tsx
// Drop-in replacement for Scene3D
<VirtualMillScene3D
  machineSettings={settings}
  stockSize={stockSize}
  stockPosition={stockPosition}
  modelFile={uploadedSTLFile}  // Automatically handled
  // ... other props
/>
```

### Contact Point Tracking
```typescript
// During simulation
const contactPoints = virtualMill.getContactPoints();
console.log(`Found ${contactPoints.length} collision points`);

// Clear before new simulation
virtualMill.clearContactPoints();
```

## Technical Details

### Collision Algorithm
1. **Model Loading**: STL/OBJ files loaded and processed
2. **Transformation**: Apply position, rotation, scale to geometry
3. **Ray Creation**: Generate ray from probe position and direction
4. **Tool Compensation**: Create multiple rays for tool radius
5. **Intersection Test**: Use Three.js raycaster for mesh intersection
6. **Contact Recording**: Store contact points for visualization

### Performance Considerations
- Geometry is processed once when model loads
- Raycasting is optimized for real-time use
- Contact points are batched for efficient rendering
- Memory management includes proper disposal

### Coordinate Systems
- **Model Space**: Original STL/OBJ coordinates
- **World Space**: Transformed coordinates for collision
- **Machine Space**: VirtualMill coordinate system
- **Visualization Space**: Three.js scene coordinates

## Testing

### Comprehensive Test Suite
- Ray-mesh intersection accuracy
- Tool radius compensation
- Transformation handling (position, rotation, scale)
- Edge cases and error conditions
- Performance benchmarks

### Test Coverage
- ✅ Basic collision detection
- ✅ Tool radius effects
- ✅ Model transformations
- ✅ Contact point recording
- ✅ Backward compatibility

## Migration Guide

### From Standard VirtualMill
1. **No Code Changes Required**: Existing VirtualMill code works unchanged
2. **Enhanced Features**: Automatically gets custom model support
3. **Contact Points**: New API available for collision tracking

### From Scene3D to VirtualMillScene3D
```tsx
// Before
<Scene3D {...props} />

// After (drop-in replacement)
<VirtualMillScene3D {...props} />
```

## Benefits

### For Users
- **Accurate Simulation**: See exact collision points on your workpiece
- **Visual Feedback**: Clear indicators when probe contacts the model
- **Better Planning**: Identify issues before running actual operations
- **Custom Models**: Use your actual workpiece geometry

### For Developers
- **Clean API**: Simple, intuitive interface
- **Extensible**: Easy to add new collision features
- **Tested**: Comprehensive test coverage
- **Documented**: Clear architecture and examples

## Future Enhancements

### Planned Features
- **Cutting Simulation**: Remove material on contact
- **Tool Path Validation**: Check for gouges and missed areas
- **Multi-Tool Support**: Different tools and geometries
- **Advanced Materials**: Different material properties

### Performance Optimizations
- **Spatial Indexing**: Faster collision queries for complex models
- **LOD Support**: Level-of-detail for large models
- **GPU Acceleration**: WebGL-based collision detection
- **Caching**: Intelligent geometry caching

## Troubleshooting

### Common Issues
- **Model Not Loading**: Check file format (STL/OBJ only)
- **No Collisions**: Verify model positioning and scale
- **Performance**: Reduce model complexity for real-time use
- **Memory**: Large models may require optimization

### Debug Tools
- Console logging for collision events
- Visual bounding box display
- Contact point inspection
- Performance monitoring

## Conclusion

This enhancement transforms VirtualMill from a simple box-collision system into a sophisticated 3D model collision engine while maintaining complete backward compatibility. Users can now upload their actual workpiece geometry and see exactly where the probe will make contact, making the simulation much more accurate and useful for real-world machining operations.
