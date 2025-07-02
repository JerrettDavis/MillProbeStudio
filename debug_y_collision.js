import { VirtualMill } from './src/utils/machine/VirtualMill.js';
import { createMockMachineSettings } from './src/test/mockMachineSettings.js';

// Create virtual mill with test configuration
const virtualMill = new VirtualMill(createMockMachineSettings());

// Set stock bounds as per test: { min: { X: -10, Y: -10, Z: -5 }, max: { X: 10, Y: 10, Z: 5 } }
// This means stock dimensions are 20x20x10 and position is [0, 0, 0]
virtualMill.setStock([20, 20, 10], [0, 0, 0]);

const stockBounds = virtualMill.getStockBounds();
console.log('Stock bounds:', stockBounds);

const toolRadius = 1;

console.log('\n=== Testing Y-axis collision logic manually ===');
const originalProbePos = { X: 0, Y: -12, Z: 0 };
console.log('Original probe position:', originalProbePos);

// Check if machine is horizontal (it should be)
console.log('Is horizontal machine:', virtualMill.isHorizontal());

// Check what happens to the effective probe position for Y-axis (should not change)
const effectiveProbePos = (virtualMill.isHorizontal() && axis === 'Y') 
  ? originalProbePos  // For Y-axis, should use original position
  : (virtualMill.isHorizontal() && axis === 'X')
    ? { ...originalProbePos, X: 100 }  // Only for X-axis
    : originalProbePos;
console.log('Effective probe position:', effectiveProbePos);

// Now check Y-axis collision manually
const axis = 'Y';
const direction = 1; // +Y
const x = effectiveProbePos.X;  // Should be 100
const z = effectiveProbePos.Z;  // Should be 0

console.log('For Y-axis collision check:');
console.log('  x =', x);
console.log('  z =', z);

// Check expanded bounds in XZ plane
const expandedXMin = stockBounds.min.X - toolRadius;  // -10 - 1 = -11
const expandedXMax = stockBounds.max.X + toolRadius;  // 10 + 1 = 11
const expandedZMin = stockBounds.min.Z - toolRadius;  // -5 - 1 = -6
const expandedZMax = stockBounds.max.Z + toolRadius;  // 5 + 1 = 6

console.log('Expanded X bounds:', expandedXMin, 'to', expandedXMax);
console.log('Expanded Z bounds:', expandedZMin, 'to', expandedZMax);

const xInBounds = x >= expandedXMin && x <= expandedXMax;  // 100 >= -11 && 100 <= 11 = false!
const zInBounds = z >= expandedZMin && z <= expandedZMax;  // 0 >= -6 && 0 <= 6 = true

console.log('x in bounds?', xInBounds, '(100 >= -11 && 100 <= 11)');
console.log('z in bounds?', zInBounds, '(0 >= -6 && 0 <= 6)');

if (xInBounds && zInBounds) {
  console.log('Both in bounds, checking front edge...');
  const probeFrontEdge = effectiveProbePos.Y + toolRadius;  // -12 + 1 = -11
  console.log('Front edge at Y =', probeFrontEdge);
  console.log('Stock min Y =', stockBounds.min.Y);
  console.log('Collision condition:', probeFrontEdge, '>=', stockBounds.min.Y, '=', probeFrontEdge >= stockBounds.min.Y);
} else {
  console.log('NOT both in bounds - this is why collision is false!');
  console.log('The probe X position (100) is outside the expanded stock bounds (-11 to 11)');
}

// Now test the actual function
const yResult = virtualMill.checkProbeCollision(originalProbePos, 'Y', toolRadius, direction);
console.log('Actual Y collision result:', yResult);
