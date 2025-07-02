// Debug collision detection
import { VirtualMill } from './src/utils/machine/VirtualMill.ts';
import { createMockMachineSettings } from './src/test/mockMachineSettings.ts';

const virtualMill = new VirtualMill(createMockMachineSettings());
virtualMill.setStock([20, 20, 10], [0, 0, 0]);

const stockBounds = virtualMill.getStockBounds();
const toolRadius = 1;

console.log('Stock bounds:', stockBounds);
console.log('Tool radius:', toolRadius);

// Test X-axis collision that should work
console.log('\nX-axis test:');
const probeX = { X: -12, Y: 0, Z: 0 };
const frontEdgeX = probeX.X + toolRadius;
console.log('  Probe at X:', probeX.X);
console.log('  Front edge at X:', frontEdgeX);
console.log('  Stock starts at X:', stockBounds.min.X);
console.log('  Front edge >= stock min X?', frontEdgeX >= stockBounds.min.X);
const xResult = virtualMill.checkProbeCollision(probeX, 'X', toolRadius, 1);
console.log('  X collision result:', xResult);

// Test Y-axis collision
console.log('\nY-axis test:');
const probeY = { X: 0, Y: -12, Z: 0 };
const frontEdgeY = probeY.Y + toolRadius;
console.log('  Probe at Y:', probeY.Y);
console.log('  Front edge at Y:', frontEdgeY);
console.log('  Stock starts at Y:', stockBounds.min.Y);
console.log('  Front edge >= stock min Y?', frontEdgeY >= stockBounds.min.Y);
const yResult = virtualMill.checkProbeCollision(probeY, 'Y', toolRadius, 1);
console.log('  Y collision result:', yResult);
