import { describe, it, expect } from 'vitest';
import { doesProbeCylinderIntersectStock } from '../useProbeSimulation';

/**
 * Comprehensive collision detection tests for probe cylinder/sphere vs stock face.
 * 
 * This test suite validates that collision detection works for ANY point of the stock
 * overlapping with the probe, simulating physical machine movement logic.
 * 
 * Test scenarios cover:
 * - Probe tip collision with stock faces
 * - Probe edge/side collision with stock faces
 * - Corner and edge cases for all axes (X, Y, Z)
 * - Directional movement collision detection
 * - Precise contact point calculation
 * - Both positive and negative direction movement
 */

// Helper to create stock with center and size
const createStock = (center: [number, number, number], size: [number, number, number]) => {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size;
  return {
    stockMin: { X: cx - sx / 2, Y: cy - sy / 2, Z: cz - sz / 2 },
    stockMax: { X: cx + sx / 2, Y: cy + sy / 2, Z: cz + sz / 2 }
  };
};

describe('Comprehensive Probe-Stock Collision Detection', () => {
  
  describe('X-Axis Probe Movement', () => {
    const stock = createStock([0, 0, 0], [10, 10, 10]); // Stock from -5 to +5 in all axes
    const axis = 'X';
    const toolRadius = 2;

    describe('X+ Direction Movement', () => {
      const direction = 1;

      it('should detect collision when probe tip touches front face (stockMin.X)', () => {
        // Probe tip at stockMin.X - probe should be at stockMin.X - toolRadius for X+ movement
        const probePos = { X: -7, Y: 0, Z: 0 }; // tip at -5, front edge at -5
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
        expect(result.contactPoint).toEqual({ X: -5, Y: 0, Z: 0 });
      });

      it('should detect collision when probe edge touches stock face while centered', () => {
        // Probe center at Y=3, radius=2, so edge at Y=5 which touches stockMax.Y=5
        const probePos = { X: -8, Y: 3, Z: 0 }; // X far enough away, Y edge at stockMax
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
      });

      it('should detect collision when probe edge touches stock corner', () => {
        // Probe at corner where edge touches both Y and Z faces
        const probePos = { X: -8, Y: 3, Z: 3 }; // edges at Y=5, Z=5
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
      });

      it('should NOT detect collision when probe is just outside stock', () => {
        // Probe edge just outside stock boundary - no overlap
        const probePos = { X: -8, Y: 7.1, Z: 7.1 }; // edges at Y=9.1, Z=9.1 (outside stock bounds of ±5)
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(false);
      });

      it('should detect collision when probe is already inside stock volume', () => {
        // Probe center already within stock bounds
        const probePos = { X: 0, Y: 0, Z: 0 };
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
        expect(result.contactPoint).toEqual({ X: 0, Y: 0, Z: 0 });
      });
    });

    describe('X- Direction Movement', () => {
      const direction = -1;

      it('should detect collision when probe tip touches back face (stockMax.X)', () => {
        // Probe moving X-, tip should touch stockMax.X
        const probePos = { X: 7, Y: 0, Z: 0 }; // front edge at 5
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
        expect(result.contactPoint).toEqual({ X: 5, Y: 0, Z: 0 });
      });

      it('should detect collision when probe side edge touches stock while moving inward', () => {
        const probePos = { X: 8, Y: 3, Z: 0 }; // Y edge at stockMax.Y
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
      });
    });
  });

  describe('Y-Axis Probe Movement', () => {
    const stock = createStock([0, 0, 0], [10, 10, 10]);
    const axis = 'Y';
    const toolRadius = 1.5;

    describe('Y+ Direction Movement', () => {
      const direction = 1;

      it('should detect collision when probe tip touches front face (stockMin.Y)', () => {
        const probePos = { X: 0, Y: -7, Z: 0 }; // tip at -5
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
        expect(result.contactPoint).toEqual({ X: 0, Y: -5, Z: 0 });
      });

      it('should detect collision when probe edge touches stock side face', () => {
        // Probe edge should touch stockMax.X or stockMax.Z
        const probePos = { X: 3.5, Y: -8, Z: 0 }; // X edge at 5
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
      });

      it('should detect collision at exact tangent point', () => {
        // Probe edge exactly at stock boundary
        const probePos = { X: 3.5, Y: -8, Z: 3.5 }; // edges at X=5, Z=5
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
      });
    });

    describe('Y- Direction Movement', () => {
      const direction = -1;

      it('should detect collision when probe tip touches back face (stockMax.Y)', () => {
        const probePos = { X: 0, Y: 6.5, Z: 0 }; // front edge at 5
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
        expect(result.contactPoint).toEqual({ X: 0, Y: 5, Z: 0 });
      });
    });
  });

  describe('Z-Axis Probe Movement', () => {
    const stock = createStock([0, 0, 0], [8, 8, 8]);
    const axis = 'Z';
    const toolRadius = 1;

    describe('Z+ Direction Movement', () => {
      const direction = 1;

      it('should detect collision when probe tip touches front face (stockMin.Z)', () => {
        const probePos = { X: 0, Y: 0, Z: -5 }; // tip at -4
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
        expect(result.contactPoint).toEqual({ X: 0, Y: 0, Z: -4 });
      });

      it('should detect collision when probe edge touches stock corner in XY plane', () => {
        const probePos = { X: 3, Y: 3, Z: -6 }; // edges at X=4, Y=4
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
      });
    });

    describe('Z- Direction Movement', () => {
      const direction = -1;

      it('should detect collision when probe tip touches back face (stockMax.Z)', () => {
        const probePos = { X: 0, Y: 0, Z: 5 }; // front edge at 4
        const result = doesProbeCylinderIntersectStock({ probePos, axis, toolRadius, ...stock, direction });
        expect(result.collision).toBe(true);
        expect(result.contactPoint).toEqual({ X: 0, Y: 0, Z: 4 });
      });
    });
  });

  describe('Edge Cases and Precision Tests', () => {
    const stock = createStock([0, 0, 0], [10, 10, 10]);
    const toolRadius = 0.5;

    it('should handle very small tool radius collisions', () => {
      const smallRadius = 0.01;
      const probePos = { X: 0, Y: 0, Z: -4.99 };
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'Z', 
        toolRadius: smallRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(true);
    });

    it('should handle large tool radius that encompasses entire stock', () => {
      const largeRadius = 20;
      const probePos = { X: -30, Y: 0, Z: 0 };
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'X', 
        toolRadius: largeRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(true);
    });

    it('should correctly handle probe touching stock at multiple points simultaneously', () => {
      // Probe large enough to touch multiple faces
      const largeRadius = 3;
      const probePos = { X: -8, Y: 2, Z: 2 }; // edges at Y=5, Z=5
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'X', 
        toolRadius: largeRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(true);
    });

    it('should return false for probe completely outside stock influence', () => {
      const probePos = { X: -20, Y: 20, Z: 20 };
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'X', 
        toolRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(false);
    });
  });

  describe('Contact Point Accuracy', () => {
    const stock = createStock([5, 5, 5], [4, 4, 4]); // Stock from 3 to 7 in all axes
    const toolRadius = 1;

    it('should return accurate contact point for X-axis collision', () => {
      const probePos = { X: 2, Y: 5, Z: 5 }; // tip at stockMin.X=3
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'X', 
        toolRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(true);
      expect(result.contactPoint).toEqual({ X: 3, Y: 5, Z: 5 });
    });

    it('should return accurate contact point for Y-axis collision', () => {
      const probePos = { X: 5, Y: 8, Z: 5 }; // front edge at stockMax.Y=7
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'Y', 
        toolRadius, 
        ...stock, 
        direction: -1 
      });
      expect(result.collision).toBe(true);
      expect(result.contactPoint).toEqual({ X: 5, Y: 7, Z: 5 });
    });

    it('should return accurate contact point for Z-axis collision', () => {
      const probePos = { X: 5, Y: 5, Z: 2 }; // tip at stockMin.Z=3
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'Z', 
        toolRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(true);
      expect(result.contactPoint).toEqual({ X: 5, Y: 5, Z: 3 });
    });
  });

  describe('Real-World Probing Scenarios', () => {
    // Typical stock setup: 50mm x 50mm x 25mm stock
    const stock = createStock([0, 0, 0], [50, 50, 25]);
    const toolRadius = 3; // 6mm diameter probe

    it('should detect collision when probing X+ face from outside', () => {
      // Starting from safe position, moving toward +X face
      const probePos = { X: -30, Y: 0, Z: 0 };
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'X', 
        toolRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(true);
      expect(result.contactPoint).toEqual({ X: -25, Y: 0, Z: 0 });
    });

    it('should detect collision when probing Y+ face with offset probe', () => {
      // Probing from Y- side with probe offset in X
      const probePos = { X: 10, Y: -30, Z: 0 };
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'Y', 
        toolRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(true);
      expect(result.contactPoint).toEqual({ X: 10, Y: -25, Z: 0 });
    });

    it('should detect collision when probing Z+ face (top surface)', () => {
      // Probing down onto top surface
      const probePos = { X: 0, Y: 0, Z: -15 };
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'Z', 
        toolRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(true);
      expect(result.contactPoint).toEqual({ X: 0, Y: 0, Z: -12.5 });
    });

    it('should NOT detect collision when probe approaches but has not yet made contact', () => {
      // Probe approaching but YZ cross-section doesn't overlap stock
      const probePos = { X: -30, Y: 30, Z: 15 }; // outside stock YZ bounds
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'X', 
        toolRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(false);
    });

    it('should detect collision when probe edge grazes stock corner', () => {
      // Probe positioned so edge just touches corner
      const probePos = { X: -30, Y: 22, Z: 9.5 }; // Y edge at 25, Z edge at 12.5
      const result = doesProbeCylinderIntersectStock({ 
        probePos, 
        axis: 'X', 
        toolRadius, 
        ...stock, 
        direction: 1 
      });
      expect(result.collision).toBe(true);
    });
  });
});
