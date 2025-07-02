import { VirtualMill } from './src/utils/machine/VirtualMill.js';
import { createMockMachineSettings } from './src/test/mockMachineSettings.js';

// Create mill instance with exact test setup
const virtualMill = new VirtualMill(createMockMachineSettings());

// Set up exact test scenario
virtualMill.setStock([20, 20, 10], [0, 0, 0]);
console.log('Stock bounds:', virtualMill.getStockBounds());
console.log('Physical stock bounds:', virtualMill.getPhysicalStockBounds());

// Position probe at test start position
virtualMill.executeGCodeSync({
  type: 'rapid',
  X: -20,
  Y: 0,
  Z: 0
});

console.log('Initial position:', virtualMill.getCurrentPosition());

// Test collision prediction directly
const prediction = virtualMill.predictProbeContact(
  { X: -20, Y: 0, Z: 0 },
  'X',
  1, // direction
  15 // distance
);

console.log('Collision prediction:', prediction);

// Execute the actual probe command
virtualMill.executeGCodeSync({
  type: 'probe',
  axis: 'X',
  direction: 1,
  distance: 15,
  feedRate: 100
});

console.log('Final position:', virtualMill.getCurrentPosition());
console.log('Expected X position: -10');

// Let's also test the ray-box intersection directly with some debug
console.log('\n--- Debug Ray-Box Intersection ---');
const stockBounds = virtualMill.getPhysicalStockBounds();
const toolRadius = virtualMill.getToolRadius();
console.log('Tool radius:', toolRadius);

// Test the expanded bounds
const expandedBounds = {
  min: {
    X: stockBounds.min.X - toolRadius,
    Y: stockBounds.min.Y - toolRadius,
    Z: stockBounds.min.Z - toolRadius
  },
  max: {
    X: stockBounds.max.X + toolRadius,
    Y: stockBounds.max.Y + toolRadius,
    Z: stockBounds.max.Z + toolRadius
  }
};

console.log('Original stock bounds:', stockBounds);
console.log('Expanded bounds:', expandedBounds);
