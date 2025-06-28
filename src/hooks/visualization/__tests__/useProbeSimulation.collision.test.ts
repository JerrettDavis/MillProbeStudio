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
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: 1 })).toBe(true);
  });

  it('detects collision when probe edge touches the box (X axis)', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    // Probe tip is outside box in Y, but edge just touches
    const probePos = { X: 0, Y: 6, Z: 0 }; // Y=6, box max Y=5, toolRadius=1
    const axis = 'X';
    const toolRadius = 1;
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: 1 })).toBe(true);
  });

  it('returns false when probe is far from box (X axis)', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    const probePos = { X: 0, Y: 20, Z: 0 };
    const axis = 'X';
    const toolRadius = 1;
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: 1 })).toBe(false);
  });

  it('detects collision for Y and Z axes as well', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    // Y axis
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 0, Y: 0, Z: 0 }, axis: 'Y', toolRadius: 1, ...stock, direction: 1 })).toBe(true);
    // Z axis
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 0, Y: 0, Z: 0 }, axis: 'Z', toolRadius: 1, ...stock, direction: 1 })).toBe(true);
  });

  it('detects edge collision for Y and Z axes', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    // Y axis, edge
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 6, Y: 0, Z: 0 }, axis: 'Y', toolRadius: 1, ...stock, direction: 1 })).toBe(true);
    // Z axis, edge
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 0, Y: 6, Z: 0 }, axis: 'Z', toolRadius: 1, ...stock, direction: 1 })).toBe(true);
  });

  it('returns false for edge just outside tolerance', () => {
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    // X axis, just outside
    expect(doesProbeCylinderIntersectStock({ probePos: { X: 0, Y: 6.51, Z: 0 }, axis: 'X', toolRadius: 1, ...stock, direction: 1 })).toBe(false);
  });

  it('detects Y- collision at the correct face (probe center + radius flush with stockMax.Y)', () => {
    // Stock centered at Y=0, size 10, so stockMax.Y = 5
    const stock = makeStock([0, 0, 0], [10, 10, 10]);
    const axis = 'Y';
    const toolRadius = 1;
    // Probe moving Y-, should collide when probePos.Y - toolRadius is within 0.01 of stockMax.Y
    // Try just before collision
    let probePos = { X: 0, Y: 6.02, Z: 0 }; // front face at 5.02
    let result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: -1 });
    expect(result.collision).toBe(false);
    // Try just at collision
    probePos = { X: 0, Y: 6.01, Z: 0 }; // front face at 5.01
    result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: -1 });
    expect(result.collision).toBe(false);
    probePos = { X: 0, Y: 6.0, Z: 0 }; // front face at 5.0
    result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: -1 });
    expect(result.collision).toBe(true);
    expect(result.contactPoint).toEqual({ X: 0, Y: 5, Z: 0 });
    // Try just after collision
    probePos = { X: 0, Y: 5.99, Z: 0 }; // front face at 4.99
    result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction: -1 });
    expect(result.collision).toBe(true);
  });
});
