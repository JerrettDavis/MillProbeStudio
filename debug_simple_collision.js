// Simple debug script for probe execution
// First, let's manually test collision detection

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
    
    console.log(`Probe position: X=${probePos.X}, Y=${probePos.Y}, Z=${probePos.Z}`);
    console.log(`Tool radius: ${toolRadius}`);
    console.log(`Direction: ${direction} (moving ${direction > 0 ? '+X' : '-X'})`);
    console.log(`Expanded Y bounds: ${expandedYMin} to ${expandedYMax}`);
    console.log(`Expanded Z bounds: ${expandedZMin} to ${expandedZMax}`);
    console.log(`Probe Y=${y} within Y bounds? ${y >= expandedYMin && y <= expandedYMax}`);
    console.log(`Probe Z=${z} within Z bounds? ${z >= expandedZMin && z <= expandedZMax}`);
    
    // Check if probe center is within expanded YZ bounds
    if (y >= expandedYMin && y <= expandedYMax && z >= expandedZMin && z <= expandedZMax) {
      if (direction > 0) {
        // Moving in X+ direction: check if probe front edge will reach stock
        const probeFrontEdge = probePos.X + toolRadius;
        console.log(`Front edge position: ${probeFrontEdge} = X=${probePos.X}+${toolRadius}`);
        console.log(`Stock starts at X=${stockMin.X}, checking if front edge >= stock boundary`);
        if (probeFrontEdge >= stockMin.X) {
          return { 
            collision: true, 
            contactPoint: { X: stockMin.X - toolRadius, Y: probePos.Y, Z: probePos.Z }
          };
        }
      }
    }
  }
  
  return { collision: false, contactPoint: null };
}

// Test the collision at the starting position
console.log('=== Collision test at starting position ===');
const result = checkCollision({ X: -20, Y: 0, Z: 0 }, 'X', 3, 1);
console.log('Collision result:', result);

console.log('\n=== Now simulating step-by-step movement ===');
// Simulate the step-by-step movement
const startPos = { X: -20, Y: 0, Z: 0 };
const distance = 15;
const numSteps = 100;
const stepSize = distance / numSteps;

for (let i = 1; i <= 100; i++) { // Check all steps
  const testPosition = { ...startPos };
  testPosition.X += 1 * stepSize * i; // direction = 1
  
  const collisionResult = checkCollision(testPosition, 'X', 3, 1);
  
  if (collisionResult.collision) {
    console.log(`\nStep ${i}: Testing position X=${testPosition.X.toFixed(3)}`);
    console.log(`COLLISION DETECTED at step ${i}!`);
    console.log(`Contact point:`, collisionResult.contactPoint);
    break;
  } else if (i % 10 === 0) {
    console.log(`Step ${i}: No collision at X=${testPosition.X.toFixed(3)}`);
  }
}
