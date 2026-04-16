import { describe, it, expect } from 'vitest';
import { doesProbeCylinderIntersectStock } from '../useProbeSimulation';

// Helper to build stock box
const makeStock = (center: [number, number, number], size: [number, number, number]) => {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size;
  return {
    stockMin: { X: cx - sx / 2, Y: cy - sy / 2, Z: cz - sz / 2 },
    stockMax: { X: cx + sx / 2, Y: cy + sy / 2, Z: cz + sz / 2 }
  };
};

describe('doesProbeCylinderIntersectStock', () => {
  it('detects collision when probe tip is inside the box (X axis)', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    const probePos = { X: 0, Y: 0, Z: 0 };
    const axis = 'X';
    const toolRadius = 1;
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: 1 }).collision).toBe(true);
  });

  it('detects collision when probe edge touches the box (X axis)', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    // Probe tip is outside box in Y, but edge just touches
    const probePos = { X: 0, Y: 6, Z: 0 }; // Y=6, box max Y=5, toolRadius=1
    const axis = 'X';
    const toolRadius = 1;
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: 1 }).collision).toBe(true);
  });

  it('returns false when probe is far from box (X axis)', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    const probePos = { X: 0, Y: 20, Z: 0 };
    const axis = 'X';
    const toolRadius = 1;
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: 1 }).collision).toBe(false);
  });

  it('detects collision for Y and Z axes as well', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    // Y axis
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 0, Y: 0, Z: 0 }, axis: 'Y', toolRadius: 1, ...stock, direction: 1 }).collision).toBe(true);
    // Z axis
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 0, Y: 0, Z: 0 }, axis: 'Z', toolRadius: 1, ...stock, direction: 1 }).collision).toBe(true);
  });

  it('detects edge collision for Y and Z axes', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    // Y axis, edge
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 6, Y: 0, Z: 0 }, axis: 'Y', toolRadius: 1, ...stock, direction: 1 }).collision).toBe(true);
    // Z axis, edge
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 0, Y: 6, Z: 0 }, axis: 'Z', toolRadius: 1, ...stock, direction: 1 }).collision).toBe(true);
  });

  it('returns false for edge just outside tolerance', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    // X axis, just outside
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 0, Y: 6.51, Z: 0 }, axis: 'X', toolRadius: 1, ...stock, direction: 1 }).collision).toBe(false);
  });

  it('detects Y- collision based on perpendicular plane intersection', () => {
    // Stock centered at Y=0, size 10, so stockMax.Y = 5
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    const axis = 'Y';
    const toolRadius = 1;
    // Probe moving Y-, collision detected when probe cylinder intersects stock in XZ plane
    // Probe centered at X=0, Z=0 (within stock bounds) should always collide regardless of Y position
    let probePos = { X: 0, Y: 6.02, Z: 0 };
    let result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: -1 });
    expect(result.collision).toBe(true);
    expect(result.contactPoint).toEqual({ X: 0, Y: 5, Z: 0 });
    // Probe outside stock bounds in XZ plane should not collide (probe center + radius outside bounds)
    probePos = { X: 7, Y: 6.02, Z: 0 }; // X=7 + radius=1 = 8, outside stock bounds [-5, 5]
    result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: -1 });
    expect(result.collision).toBe(false);
    // Probe edge touching stock bounds in XZ plane should collide
    probePos = { X: 4, Y: 6.02, Z: 0 }; // X edge at 5 touches stock boundary
    result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: -1 });
    expect(result.collision).toBe(true);
    expect(result.contactPoint).toEqual({ X: 4, Y: 5, Z: 0 });
  });
});
