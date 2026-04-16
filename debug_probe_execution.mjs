// Debug probe execution issue
import { VirtualMill } from './src/utils/machine/VirtualMill.ts';
import { createMockMachineSettings } from './src/test/mockMachineSettings.ts';

const machineSettings = createMockMachineSettings();
const virtualMill = new VirtualMill(machineSettings, { X: 0, Y: 0, Z: 0 });

console.log('=== Debug Probe Execution ===');

// Set up exactly like the test
virtualMill.setStock([20, 20, 10], [0, 0, 0]);
console.log('Stock configuration: [20, 20, 10] at [0, 0, 0]');

const stockBounds = virtualMill.getPhysicalStockBounds();
console.log('Stock bounds:', stockBounds);

// Move to starting position
virtualMill.executeGCodeSync({
  type: 'rapid',
  X: -20,
  Y: 0,
  Z: 0
});

console.log('Starting position:', virtualMill.getCurrentPosition());

// Let me manually test the predictProbeContact method
console.log('\n=== Manual predictProbeContact test ===');
const startPos = { X: -20, Y: 0, Z: 0 };
const axis = 'X';
const direction = 1;
const distance = 15;

console.log(`Testing probe from (${startPos.X}, ${startPos.Y}, ${startPos.Z})`);
console.log(`Axis: ${axis}, Direction: ${direction}, Distance: ${distance}`);
console.log(`Target end position: X=${startPos.X + direction * distance}`);

// Test prediction manually
const prediction = virtualMill.predictProbeContact(startPos, axis, direction, distance);
console.log('Prediction result:', prediction);

if (prediction.hasContact && prediction.contactPoint) {
  console.log(`Expected contact at: X=${prediction.contactPoint.X}`);
} else {
  console.log('No contact predicted');
}

// Test intersection calculation step by step
console.log('\n=== Step by step intersection ===');
const ray = {
  origin: startPos,
  direction: { X: 1, Y: 0, Z: 0 }
};
console.log('Ray:', ray);

const expandedBounds = {
  min: { X: stockBounds.min.X - 3, Y: stockBounds.min.Y - 3, Z: stockBounds.min.Z - 3 },
  max: { X: stockBounds.max.X + 3, Y: stockBounds.max.Y + 3, Z: stockBounds.max.Z + 3 }
};
console.log('Manually calculated expanded bounds:', expandedBounds);

// Calculate intersection manually with proper max distance check
const maxDistance = distance; // 15
console.log(`Max distance: ${maxDistance}`);

// X axis calculation
const t1X = (expandedBounds.min.X - ray.origin.X) / ray.direction.X;
const t2X = (expandedBounds.max.X - ray.origin.X) / ray.direction.X;
console.log(`X intersection: t1=${t1X}, t2=${t2X}`);

const tMinX = Math.min(t1X, t2X);
const tMaxX = Math.max(t1X, t2X);
console.log(`X bounds: tMin=${tMinX}, tMax=${tMaxX}`);

// Initialize ray-box intersection bounds
let tMin = 0;
let tMax = maxDistance;
console.log(`Initial bounds: tMin=${tMin}, tMax=${tMax}`);

// Apply X axis constraints
tMin = Math.max(tMin, tMinX);
tMax = Math.min(tMax, tMaxX);
console.log(`After X axis: tMin=${tMin}, tMax=${tMax}`);

// Check if still valid
if (tMin > tMax) {
  console.log('❌ Intersection FAILED after X axis check');
} else {
  console.log('✅ Intersection valid after X axis check');
  
  // Y and Z axes (ray direction is 0, so just check if origin is within bounds)
  const withinY = ray.origin.Y >= expandedBounds.min.Y && ray.origin.Y <= expandedBounds.max.Y;
  const withinZ = ray.origin.Z >= expandedBounds.min.Z && ray.origin.Z <= expandedBounds.max.Z;
  
  console.log(`Y bounds check: origin.Y=${ray.origin.Y}, bounds=[${expandedBounds.min.Y}, ${expandedBounds.max.Y}], within=${withinY}`);
  console.log(`Z bounds check: origin.Z=${ray.origin.Z}, bounds=[${expandedBounds.min.Z}, ${expandedBounds.max.Z}], within=${withinZ}`);
  
  if (withinY && withinZ) {
    console.log('✅ Ray intersects box!');
    
    const intersectionPoint = {
      X: ray.origin.X + ray.direction.X * tMin,
      Y: ray.origin.Y + ray.direction.Y * tMin,
      Z: ray.origin.Z + ray.direction.Z * tMin
    };
    console.log('Raw intersection point:', intersectionPoint);
    
    // Then the contact point adjustment
    const contactPoint = { ...intersectionPoint };
    contactPoint.X = stockBounds.min.X; // direction > 0, so we hit min.X
    console.log('Adjusted contact point:', contactPoint);
  } else {
    console.log('❌ Ray does not pass through Y/Z bounds of the box');
  }
}

// Now execute the actual probe command
console.log('\n=== Executing probe command ===');
virtualMill.executeGCodeSync({
  type: 'probe',
  axis: 'X',
  direction: 1,
  distance: 15,
  feedRate: 100
});

const finalPosition = virtualMill.getCurrentPosition();
console.log('Final position after probe:', finalPosition);
console.log(`Expected X=-10, got X=${finalPosition.X}, difference=${finalPosition.X - (-10)}`);
