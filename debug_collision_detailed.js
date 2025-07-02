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
const tolerance = 0.01;

console.log('\n=== Testing Y-axis collision (Test failure case) ===');
// Y-axis probe: probe at Y=-12 moving +Y, front edge at Y=-11, should hit stock at Y=-10
const yProbePos = { X: 0, Y: -12, Z: 0 };
const yDirection = 1; // moving +Y
const yFrontEdge = yProbePos.Y + toolRadius; // -12 + 1 = -11

console.log('Probe position:', `X=${yProbePos.X}, Y=${yProbePos.Y}, Z=${yProbePos.Z}`);
console.log('Tool radius:', toolRadius);
console.log('Direction:', yDirection, '(moving +Y)');
console.log('Front edge position:', yFrontEdge, '= Y=' + yFrontEdge);
console.log('Stock starts at Y=' + stockBounds.min.Y + ', so front edge should hit');

// Check expanded bounds
const expandedXMin = stockBounds.min.X - toolRadius;
const expandedXMax = stockBounds.max.X + toolRadius;
const expandedZMin = stockBounds.min.Z - toolRadius;
const expandedZMax = stockBounds.max.Z + toolRadius;

console.log('Expanded X bounds:', expandedXMin, 'to', expandedXMax);
console.log('Expanded Z bounds:', expandedZMin, 'to', expandedZMax);
console.log('Probe X=' + yProbePos.X + ' within X bounds?', (yProbePos.X >= expandedXMin && yProbePos.X <= expandedXMax));
console.log('Probe Z=' + yProbePos.Z + ' within Z bounds?', (yProbePos.Z >= expandedZMin && yProbePos.Z <= expandedZMax));

// Check collision condition
const yCollisionCondition = yFrontEdge >= stockBounds.min.Y - tolerance;
console.log('Collision condition (front edge >= stock min Y - tolerance):', yFrontEdge, '>=', (stockBounds.min.Y - tolerance), '=', yCollisionCondition);

const yResult = virtualMill.checkProbeCollision(yProbePos, 'Y', toolRadius, yDirection);
console.log('Y collision result:', yResult);

console.log('\n=== Testing Z-axis collision (Test failure case) ===');
// Z-axis probe: probe at Z=-7 moving +Z, front edge at Z=-6, should hit stock at Z=-5
const zProbePos = { X: 0, Y: 0, Z: -7 };
const zDirection = 1; // moving +Z
const zFrontEdge = zProbePos.Z + toolRadius; // -7 + 1 = -6

console.log('Probe position:', `X=${zProbePos.X}, Y=${zProbePos.Y}, Z=${zProbePos.Z}`);
console.log('Tool radius:', toolRadius);
console.log('Direction:', zDirection, '(moving +Z)');
console.log('Front edge position:', zFrontEdge, '= Z=' + zFrontEdge);
console.log('Stock starts at Z=' + stockBounds.min.Z + ', so front edge should hit');

// Check expanded bounds for Z-axis
const expandedXMinZ = stockBounds.min.X - toolRadius;
const expandedXMaxZ = stockBounds.max.X + toolRadius;
const expandedYMinZ = stockBounds.min.Y - toolRadius;
const expandedYMaxZ = stockBounds.max.Y + toolRadius;

console.log('Expanded X bounds:', expandedXMinZ, 'to', expandedXMaxZ);
console.log('Expanded Y bounds:', expandedYMinZ, 'to', expandedYMaxZ);
console.log('Probe X=' + zProbePos.X + ' within X bounds?', (zProbePos.X >= expandedXMinZ && zProbePos.X <= expandedXMaxZ));
console.log('Probe Y=' + zProbePos.Y + ' within Y bounds?', (zProbePos.Y >= expandedYMinZ && zProbePos.Y <= expandedYMaxZ));

// Check collision condition
const zCollisionCondition = zFrontEdge >= stockBounds.min.Z - tolerance;
console.log('Collision condition (front edge >= stock min Z - tolerance):', zFrontEdge, '>=', (stockBounds.min.Z - tolerance), '=', zCollisionCondition);

const zResult = virtualMill.checkProbeCollision(zProbePos, 'Z', toolRadius, zDirection);
console.log('Z collision result:', zResult);

console.log('\n=== Testing X-axis direction test (another failure case) ===');
// X- direction (moving towards -X): probe at X=15, front edge at X=13, should hit at X=10
const xMinusProbePos = { X: 15, Y: 0, Z: 0 };
const xMinusDirection = -1; // moving -X
const xMinusFrontEdge = xMinusProbePos.X - toolRadius; // 15 - 1 = 14 (wait, this is wrong in the test comment)
// Actually, when moving in -X direction, the front edge is at X - toolRadius = 15 - 1 = 14
// But that's still > 10, so it shouldn't hit yet...
// Let me recalculate: if we're at X=15 moving -X with radius 1, the front edge is at X=14
// The stock extends from X=-10 to X=10, so the front edge at X=14 is still outside
// But the test comment says "front edge at X=13" - that would mean radius=2, not 1

console.log('Probe position:', `X=${xMinusProbePos.X}, Y=${xMinusProbePos.Y}, Z=${xMinusProbePos.Z}`);
console.log('Tool radius:', toolRadius);
console.log('Direction:', xMinusDirection, '(moving -X)');
console.log('Front edge position:', xMinusFrontEdge, '= X=' + xMinusFrontEdge);
console.log('Stock ends at X=' + stockBounds.max.X + ', so front edge should hit when <= stock max X');

// Check expanded bounds for X-axis
const expandedYMinX = stockBounds.min.Y - toolRadius;
const expandedYMaxX = stockBounds.max.Y + toolRadius;
const expandedZMinX = stockBounds.min.Z - toolRadius;
const expandedZMaxX = stockBounds.max.Z + toolRadius;

console.log('Expanded Y bounds:', expandedYMinX, 'to', expandedYMaxX);
console.log('Expanded Z bounds:', expandedZMinX, 'to', expandedZMaxX);
console.log('Probe Y=' + xMinusProbePos.Y + ' within Y bounds?', (xMinusProbePos.Y >= expandedYMinX && xMinusProbePos.Y <= expandedYMaxX));
console.log('Probe Z=' + xMinusProbePos.Z + ' within Z bounds?', (xMinusProbePos.Z >= expandedZMinX && xMinusProbePos.Z <= expandedZMaxX));

// Check collision condition for -X direction
const xMinusCollisionCondition = xMinusFrontEdge <= stockBounds.max.X;
console.log('Collision condition (front edge <= stock max X):', xMinusFrontEdge, '<=', stockBounds.max.X, '=', xMinusCollisionCondition);

const xMinusResult = virtualMill.checkProbeCollision(xMinusProbePos, 'X', toolRadius, xMinusDirection);
console.log('X minus collision result:', xMinusResult);
