import { VirtualMill } from './src/utils/machine/VirtualMill.js';
import { createMockMachineSettings } from './src/test/mockMachineSettings.js';

// Create virtual mill with test configuration
const virtualMill = new VirtualMill(createMockMachineSettings());
virtualMill.setStock([20, 20, 10], [0, 0, 0]);

const stockBounds = virtualMill.getStockBounds();
console.log('Stock bounds:', stockBounds);

const toolRadius = 1;

console.log('\n=== Testing Y-axis collision logic manually ===');
const originalProbePos = { X: 0, Y: -12, Z: 0 };
console.log('Original probe position:', originalProbePos);
console.log('Is horizontal machine:', virtualMill.isHorizontal());

// Now the effective position should only change for X-axis collisions
const axis = 'Y';
const effectiveProbePos = originalProbePos; // Should be unchanged for Y-axis
console.log('Effective probe position for Y-axis:', effectiveProbePos);

const x = effectiveProbePos.X;  // Should be 0
const z = effectiveProbePos.Z;  // Should be 0

console.log('For Y-axis collision check:');
console.log('  x =', x);
console.log('  z =', z);

// Check expanded bounds in XZ plane
const expandedXMin = stockBounds.min.X - toolRadius;  // -11
const expandedXMax = stockBounds.max.X + toolRadius;  // 11
const expandedZMin = stockBounds.min.Z - toolRadius;  // -6
const expandedZMax = stockBounds.max.Z + toolRadius;  // 6

console.log('Expanded X bounds:', expandedXMin, 'to', expandedXMax);
console.log('Expanded Z bounds:', expandedZMin, 'to', expandedZMax);

const xInBounds = x >= expandedXMin && x <= expandedXMax;  // 0 >= -11 && 0 <= 11 = true
const zInBounds = z >= expandedZMin && z <= expandedZMax;  // 0 >= -6 && 0 <= 6 = true

console.log('x in bounds?', xInBounds, '(0 >= -11 && 0 <= 11)');
console.log('z in bounds?', zInBounds, '(0 >= -6 && 0 <= 6)');

if (xInBounds && zInBounds) {
  console.log('Both in bounds, checking front edge...');
  const probeFrontEdge = effectiveProbePos.Y + toolRadius;  // -12 + 1 = -11
  console.log('Front edge at Y =', probeFrontEdge);
  console.log('Stock min Y =', stockBounds.min.Y);
  console.log('Collision condition:', probeFrontEdge, '>=', stockBounds.min.Y, '=', probeFrontEdge >= stockBounds.min.Y);
} else {
  console.log('NOT both in bounds - collision will be false');
}

// Test the actual function
const yResult = virtualMill.checkProbeCollision(originalProbePos, 'Y', toolRadius, 1);
console.log('Actual Y collision result:', yResult);
