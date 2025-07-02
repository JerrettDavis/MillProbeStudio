const mockMachineSettings = {
  name: 'Test Machine',
  type: 'horizontal',
  axes: {
    X: { min: -100, max: 100, inverted: false },
    Y: { min: -50, max: 50, inverted: false },
    Z: { min: -25, max: 25, inverted: false }
  }
};

class VirtualMill {
  constructor(machineSettings, initialPosition = { X: 0, Y: 0, Z: 0 }) {
    this.machineSettings = machineSettings;
    this.currentPosition = { ...initialPosition };
    this.stockSize = [20, 20, 10];
    this.stockPosition = [0, 0, 0];
  }

  isHorizontal() {
    return this.machineSettings.type === 'horizontal';
  }

  getStockBounds() {
    const [sizeX, sizeY, sizeZ] = this.stockSize;
    let [posX, posY, posZ] = this.stockPosition;
    
    if (this.isHorizontal()) {
      posX = this.stockPosition[0] - this.currentPosition.X;
    }
    
    return {
      min: {
        X: posX - sizeX / 2,
        Y: posY - sizeY / 2,
        Z: posZ - sizeZ / 2
      },
      max: {
        X: posX + sizeX / 2,
        Y: posY + sizeY / 2,
        Z: posZ + sizeZ / 2
      }
    };
  }

  checkProbeCollision(probePosition, axis, toolRadius, direction) {
    const stockBounds = this.getStockBounds();
    
    console.log(`\n=== Testing ${axis}-axis collision ===`);
    console.log('Probe position:', probePosition);
    console.log('Tool radius:', toolRadius);
    console.log('Direction:', direction);
    console.log('Stock bounds:', stockBounds);
    
    // Use consistent collision detection for all axes and mill types
    return this.doesProbeCylinderIntersectStock({
      probePos: probePosition,
      axis,
      toolRadius,
      stockMin: stockBounds.min,
      stockMax: stockBounds.max,
      direction
    });
  }

  doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, stockMin, stockMax, direction }) {
    console.log('Checking intersection with effective probe pos:', probePos);
    
    if (axis === 'X') {
      const y = probePos.Y;
      const z = probePos.Z;
      
      const expandedYMin = stockMin.Y - toolRadius;
      const expandedYMax = stockMax.Y + toolRadius;
      const expandedZMin = stockMin.Z - toolRadius;
      const expandedZMax = stockMax.Z + toolRadius;
      
      console.log(`Y bounds check: ${y} between ${expandedYMin} and ${expandedYMax} = ${y >= expandedYMin && y <= expandedYMax}`);
      console.log(`Z bounds check: ${z} between ${expandedZMin} and ${expandedZMax} = ${z >= expandedZMin && z <= expandedZMax}`);
      
      if (y >= expandedYMin && y <= expandedYMax && z >= expandedZMin && z <= expandedZMax) {
        if (direction > 0) {
          const probeFrontEdge = probePos.X + toolRadius;
          console.log(`X+ direction: front edge at ${probeFrontEdge}, stock starts at ${stockMin.X}, collision = ${probeFrontEdge <= stockMin.X}`);
          if (probeFrontEdge <= stockMin.X) {
            return { collision: true, contactPoint: { X: stockMin.X, Y: probePos.Y, Z: probePos.Z } };
          }
        } else if (direction < 0) {
          const probeFrontEdge = probePos.X - toolRadius;
          console.log(`X- direction: front edge at ${probeFrontEdge}, stock ends at ${stockMax.X}, collision = ${probeFrontEdge >= stockMax.X}`);
          if (probeFrontEdge >= stockMax.X) {
            return { collision: true, contactPoint: { X: stockMax.X, Y: probePos.Y, Z: probePos.Z } };
          }
        }
        
        if (probePos.X >= stockMin.X && probePos.X <= stockMax.X) {
          console.log(`Probe inside stock: ${probePos.X} between ${stockMin.X} and ${stockMax.X}`);
          return { collision: true, contactPoint: { X: probePos.X, Y: probePos.Y, Z: probePos.Z } };
        }
      }
    } else if (axis === 'Y') {
      const x = probePos.X;
      const z = probePos.Z;
      
      const expandedXMin = stockMin.X - toolRadius;
      const expandedXMax = stockMax.X + toolRadius;
      const expandedZMin = stockMin.Z - toolRadius;
      const expandedZMax = stockMax.Z + toolRadius;
      
      console.log(`X bounds check: ${x} between ${expandedXMin} and ${expandedXMax} = ${x >= expandedXMin && x <= expandedXMax}`);
      console.log(`Z bounds check: ${z} between ${expandedZMin} and ${expandedZMax} = ${z >= expandedZMin && z <= expandedZMax}`);
      
      if (x >= expandedXMin && x <= expandedXMax && z >= expandedZMin && z <= expandedZMax) {
        if (direction > 0) {
          const probeFrontEdge = probePos.Y + toolRadius;
          console.log(`Y+ direction: front edge at ${probeFrontEdge}, stock starts at ${stockMin.Y}, collision = ${probeFrontEdge <= stockMin.Y}`);
          if (probeFrontEdge <= stockMin.Y) {
            return { collision: true, contactPoint: { X: probePos.X, Y: stockMin.Y, Z: probePos.Z } };
          }
        } else if (direction < 0) {
          const probeFrontEdge = probePos.Y - toolRadius;
          console.log(`Y- direction: front edge at ${probeFrontEdge}, stock ends at ${stockMax.Y}, collision = ${probeFrontEdge >= stockMax.Y}`);
          if (probeFrontEdge >= stockMax.Y) {
            return { collision: true, contactPoint: { X: probePos.X, Y: stockMax.Y, Z: probePos.Z } };
          }
        }
        
        if (probePos.Y >= stockMin.Y && probePos.Y <= stockMax.Y) {
          console.log(`Probe inside stock: ${probePos.Y} between ${stockMin.Y} and ${stockMax.Y}`);
          return { collision: true, contactPoint: { X: probePos.X, Y: probePos.Y, Z: probePos.Z } };
        }
      }
    } else if (axis === 'Z') {
      const x = probePos.X;
      const y = probePos.Y;
      
      const expandedXMin = stockMin.X - toolRadius;
      const expandedXMax = stockMax.X + toolRadius;
      const expandedYMin = stockMin.Y - toolRadius;
      const expandedYMax = stockMax.Y + toolRadius;
      
      console.log(`X bounds check: ${x} between ${expandedXMin} and ${expandedXMax} = ${x >= expandedXMin && x <= expandedXMax}`);
      console.log(`Y bounds check: ${y} between ${expandedYMin} and ${expandedYMax} = ${y >= expandedYMin && y <= expandedYMax}`);
      
      if (x >= expandedXMin && x <= expandedXMax && y >= expandedYMin && y <= expandedYMax) {
        if (direction > 0) {
          const probeFrontEdge = probePos.Z + toolRadius;
          console.log(`Z+ direction: front edge at ${probeFrontEdge}, stock starts at ${stockMin.Z}, collision = ${probeFrontEdge <= stockMin.Z}`);
          if (probeFrontEdge <= stockMin.Z) {
            return { collision: true, contactPoint: { X: probePos.X, Y: probePos.Y, Z: stockMin.Z } };
          }
        } else if (direction < 0) {
          const probeFrontEdge = probePos.Z - toolRadius;
          console.log(`Z- direction: front edge at ${probeFrontEdge}, stock ends at ${stockMax.Z}, collision = ${probeFrontEdge >= stockMax.Z}`);
          if (probeFrontEdge >= stockMax.Z) {
            return { collision: true, contactPoint: { X: probePos.X, Y: probePos.Y, Z: stockMax.Z } };
          }
        }
        
        if (probePos.Z >= stockMin.Z && probePos.Z <= stockMax.Z) {
          console.log(`Probe inside stock: ${probePos.Z} between ${stockMin.Z} and ${stockMax.Z}`);
          return { collision: true, contactPoint: { X: probePos.X, Y: probePos.Y, Z: probePos.Z } };
        }
      }
    }
    
    console.log('No collision detected');
    return { collision: false };
  }
}

// Test the failing cases
const virtualMill = new VirtualMill(mockMachineSettings);

console.log('=== Testing failing collision cases ===');

// Test 1: Y-axis collision (now passing)
console.log('\n1. Y-axis test case that should pass:');
const yResult = virtualMill.checkProbeCollision({ X: 0, Y: -12, Z: 0 }, 'Y', 1, 1);
console.log('Result:', yResult);

// Test 2: X-axis negative direction (now passing)
console.log('\n2. X-axis negative direction test case that should pass:');
const xMinusResult = virtualMill.checkProbeCollision({ X: 15, Y: 0, Z: 0 }, 'X', 2, -1);
console.log('Result:', xMinusResult);

// Test 3: Z-axis collision (now passing)
console.log('\n3. Z-axis test case that should pass:');
const zResult = virtualMill.checkProbeCollision({ X: 0, Y: 0, Z: -7 }, 'Z', 1, 1);
console.log('Result:', zResult);

// Test 4: X-axis positive direction (still failing)
console.log('\n4. X-axis positive direction test case that should pass:');
const xPlusResult = virtualMill.checkProbeCollision({ X: -15, Y: 0, Z: 0 }, 'X', 2, 1);
console.log('Result:', xPlusResult);
