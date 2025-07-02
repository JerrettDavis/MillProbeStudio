const { VirtualMill } = require('./dist/src/utils/machine/VirtualMill.js');
const { mockMachineSettings } = require('./dist/src/test/mockMachineSettings.js');

// Create mill instance
const virtualMill = new VirtualMill(mockMachineSettings);

// Set up the same test scenario
virtualMill.setStock([20, 20, 10], [0, 0, 0]);
console.log('Stock bounds:', virtualMill.getStockBounds());
console.log('Physical stock bounds:', virtualMill.getPhysicalStockBounds());

virtualMill.executeGCode({
  type: 'rapid',
  X: -20,
  Y: 0,
  Z: 0
});

console.log('Initial position:', virtualMill.getCurrentPosition());

// Execute the probe command
console.log('\nExecuting probe command...');
virtualMill.executeGCode({
  type: 'probe',
  axis: 'X',
  direction: 1,
  distance: 15,
  feedRate: 100
});

console.log('Final position:', virtualMill.getCurrentPosition());
console.log('Expected X position: -10');
