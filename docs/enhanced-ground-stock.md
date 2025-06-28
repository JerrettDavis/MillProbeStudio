# Enhanced Ground Stock Functionality

## Overview
The "Ground Stock" button has been enhanced to properly handle rotated stock by calculating the actual bottom face of the stock after rotation and adjusting the position to ground it to the stage surface.

## Problem Solved
Previously, when a stock was rotated (e.g., Y=90°, Z=90°), clicking "Ground Stock" would simply set the X position to 0, which didn't account for the new orientation of the stock. This often resulted in the stock floating above or intersecting with the stage incorrectly.

## New Algorithm

### For Horizontal Mills
The enhanced algorithm:

1. **Calculate Stock Corners**: Computes the 8 corners of the stock box in its local coordinate system
2. **Apply Rotation**: Transforms each corner using the current rotation values (X, Y, Z rotations)
3. **Find Lowest Point**: Determines which corner is closest to the stage (minimum X coordinate)
4. **Calculate Offset**: Computes the adjustment needed to ground that point to the stage surface
5. **Apply Correction**: Updates the stock position to properly ground the rotated stock

### Rotation Order
The algorithm applies rotations in the standard order:
1. **X-axis rotation** (pitch)
2. **Y-axis rotation** (yaw) 
3. **Z-axis rotation** (roll)

This matches the typical rotation convention used in 3D graphics and CAD systems.

## Technical Implementation

```typescript
const groundStock = () => {
  if (machineOrientation === 'horizontal') {
    // Calculate the 8 corners of the stock
    const halfSizes = [stockSize[0] / 2, stockSize[1] / 2, stockSize[2] / 2];
    const corners = [
      [-halfSizes[0], -halfSizes[1], -halfSizes[2]], // min corner
      [+halfSizes[0], -halfSizes[1], -halfSizes[2]],
      // ... 6 more corners
    ];
    
    // Apply rotation transformation to each corner
    const rotatedCorners = corners.map(corner => {
      // Apply X, Y, Z rotations sequentially
      // ... rotation matrix calculations
    });
    
    // Find minimum X coordinate (closest to stage)
    const minX = Math.min(...rotatedCorners.map(corner => corner[0]));
    
    // Calculate offset to ground the stock
    const offsetX = -minX;
    
    // Apply the offset
    onStockPositionChange([stockPosition[0] + offsetX, stockPosition[1], stockPosition[2]]);
  }
};
```

## Usage Examples

### Example 1: 90° Y Rotation
- Stock rotated 90° around Y-axis (tipped forward/backward)
- Original bottom face is now a side face
- Ground Stock finds the new lowest point and adjusts X position accordingly

### Example 2: Complex Rotation (Y=90°, Z=90°)
- Stock rotated 90° around Y-axis, then 90° around Z-axis
- Multiple faces have rotated, creating a complex orientation
- Algorithm calculates all 8 corner positions and finds the true lowest point
- Adjusts position to ground the stock properly regardless of complexity

### Example 3: Asymmetric Stock
- Non-cubic stock (e.g., 50mm x 30mm x 10mm) with rotation
- Different faces have different distances from center
- Algorithm correctly identifies which corner is lowest after rotation

## Benefits

1. **Accurate Grounding**: Stock always sits properly on the stage regardless of rotation
2. **No Manual Adjustment**: Eliminates need to manually calculate position after rotation
3. **Works with Any Rotation**: Handles any combination of X, Y, Z rotations
4. **Preserves Y/Z Position**: Only adjusts the X position for grounding, maintains other positioning
5. **Asymmetric Stock Support**: Works correctly with non-cubic stock shapes

## Backward Compatibility

- **Vertical Mills**: Unchanged behavior (grounds to Z-axis)
- **Non-Rotated Stock**: Produces same result as before when rotation is [0, 0, 0]
- **Existing Workflows**: No changes needed to existing positioning workflows

The enhancement is seamlessly integrated and doesn't affect any other functionality while providing significantly improved behavior for rotated stock scenarios.
