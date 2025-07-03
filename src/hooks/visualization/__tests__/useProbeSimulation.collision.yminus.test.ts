import { describe, it, expect } from 'vitest';
import { doesProbeCylinderIntersectStock } from '../useProbeSimulation';

describe('doesProbeCylinderIntersectStock - Y- direction', () => {
  it('detects collision based on XZ plane intersection when moving Y-', () => {
    const toolRadius = 5;
    const stockMin = { X: -10, Y: -10, Z: -10 };
    const stockMax = { X: 10, Y: 0, Z: 10 };
    const axis = 'Y';
    const direction = -1;
    // Probe center at X=0, Z=0 (within stock XZ bounds) should collide regardless of Y position
    let probePos = { X: 0, Y: 6, Z: 0 };
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, stockMin, stockMax, direction }).collision).toBe(true);
    // Probe center outside stock XZ bounds should not collide (center + radius outside bounds)
    probePos = { X: 20, Y: 6, Z: 0 }; // X=20 - radius=5 = 15, still outside [-10, 10]
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, stockMin, stockMax, direction }).collision).toBe(false);
    // Probe edge touching stock XZ boundary should collide
    probePos = { X: 5, Y: 6, Z: 0 }; // X edge at 10 touches stock boundary
    const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, stockMin, stockMax, direction });
    expect(result.collision).toBe(true);
    expect(result.contactPoint).toEqual({ X: 5, Y: 0, Z: 0 });
    // Probe center inside the stock should still collide
    probePos = { X: 0, Y: 0, Z: 0 };
    expect(doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, stockMin, stockMax, direction }).collision).toBe(true);
  });
});
