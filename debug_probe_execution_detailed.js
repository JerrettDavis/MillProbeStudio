// Debug probe execution step by step
const stockBounds = {
  min: { X: -10, Y: -10, Z: -5 },
  max: { X: 10, Y: 10, Z: 5 }
};

function checkCollision(probePos, axis, toolRadius, direction) {
  const stockMin = stockBounds.min;
  const stockMax = stockBounds.max;
  
  if (axis === 'X') {
    const y = probePos.Y;
    const z = probePos.Z;
    
    // Expand stock bounds by tool radius in YZ plane
    const expandedYMin = stockMin.Y - toolRadius;
    const expandedYMax = stockMax.Y + toolRadius;
    const expandedZMin = stockMin.Z - toolRadius;
    const expandedZMax = stockMax.Z + toolRadius;
    
    // Check if probe center is within expanded YZ bounds
    if (y >= expandedYMin && y <= expandedYMax && z >= expandedZMin && z <= expandedZMax) {
      if (direction > 0) {
        // Moving in X+ direction: collision if probe front edge can reach stock
        const probeFrontEdge = probePos.X + toolRadius;
        if (probeFrontEdge >= stockMin.X || probePos.X <= stockMin.X) {
          return { 
            collision: true, 
            contactPoint: { X: stockMin.X, Y: probePos.Y, Z: probePos.Z }
          };
        }
      }
    }
  }
  
  return { collision: false, contactPoint: null };
}

// Simulate the probe execution test scenario
console.log('=== Simulating probe execution test scenario ===');
console.log('Stock bounds:', stockBounds);
console.log('Probe starts at X=-20, Y=0, Z=0');
console.log('Tool radius: 3');
console.log('Direction: +1 (moving +X)');
console.log('Distance: 15');

const startPos = { X: -20, Y: 0, Z: 0 };
const distance = 15;
const numSteps = 100;
const stepSize = distance / numSteps;
const toolRadius = 3;

console.log('Step size:', stepSize);

// Check collision at starting position
console.log('\n--- Testing collision at starting position ---');
const startResult = checkCollision(startPos, 'X', toolRadius, 1);
console.log('Collision at start:', startResult);

// Simulate step-by-step movement
for (let i = 1; i <= numSteps; i++) {
  const testPosition = { ...startPos };
  testPosition.X += 1 * stepSize * i; // direction = 1
  
  const collisionResult = checkCollision(testPosition, 'X', toolRadius, 1);
  
  if (collisionResult.collision) {
    console.log(`\n--- COLLISION DETECTED at step ${i} ---`);
    console.log(`Test position: X=${testPosition.X.toFixed(3)}`);
    console.log(`Front edge: X=${(testPosition.X + toolRadius).toFixed(3)}`);
    console.log(`Contact point:`, collisionResult.contactPoint);
    
    // Check if this makes sense
    const frontEdge = testPosition.X + toolRadius;
    console.log(`Front edge ${frontEdge.toFixed(3)} >= stock boundary ${stockBounds.min.X}? ${frontEdge >= stockBounds.min.X}`);
    console.log(`Probe center ${testPosition.X.toFixed(3)} <= stock boundary ${stockBounds.min.X}? ${testPosition.X <= stockBounds.min.X}`);
    break;
  }
  
  // Show progress every 10 steps
  if (i % 10 === 0) {
    console.log(`Step ${i}: X=${testPosition.X.toFixed(3)}, front edge=${(testPosition.X + toolRadius).toFixed(3)}`);
  }
}

console.log('\n--- Final check: where should probe center be when tip touches X=-10? ---');
console.log('If probe tip is at X=-10, probe center should be at X=', (-10 - toolRadius));
