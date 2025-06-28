import { describe, it, expect } from 'vitest';
import { doesProbeCylinderIntersectStock } from '../useProbeSimulation';

describe('doesProbeCylinderIntersectStock - Y- direction', () => {
  it('detects collision at the correct Y when moving Y- towards stockMax.Y', () => {
    const toolRadius = 5;
    const stockMin = { X: -10, Y: -10, Z: -10 };
    const stockMax = { X: 10, Y: 0, Z: 10 };
    const axis = 'Y';
    const direction = -1;
    // Probe center is just outside the stock, should not collide
    let probePos = { X: 0, Y: 6, Z: 0 };
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, stockMin, stockMax, direction }).collision).toBe(false);
    // Probe center is at Y = 5, front face at Y = 0, should collide
    probePos = { X: 0, Y: 5, Z: 0 };
    const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, stockMin, stockMax, direction });
    expect(result.collision).toBe(true);
    expect(result.contactPoint).toEqual({ X: 0, Y: 0, Z: 0 });
    // Probe center is inside the stock, should still collide
    probePos = { X: 0, Y: 0, Z: 0 };
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, stockMin, stockMax, direction }).collision).toBe(true);
  });
});
