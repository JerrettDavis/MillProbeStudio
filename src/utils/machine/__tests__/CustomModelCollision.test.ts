// src/utils/machine/__tests__/CustomModelCollision.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { CustomModelCollision, type CustomModelInfo } from '../CustomModelCollision';

describe('CustomModelCollision', () => {
  let cubeGeometry: THREE.BufferGeometry;
  let customModelInfo: CustomModelInfo;

  beforeEach(() => {
    // Create a simple cube geometry for testing
    cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    cubeGeometry.computeBoundingBox();
    
    customModelInfo = {
      geometry: cubeGeometry,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      boundingBox: cubeGeometry.boundingBox!
    };
  });

  afterEach(() => {
    cubeGeometry.dispose();
  });

  describe('checkProbeCollision', () => {
    it('should detect collision when probe ray intersects model', () => {
      const startPos = { X: -5, Y: 0, Z: 0 };
      const result = CustomModelCollision.checkProbeCollision(
        startPos,
        'X',
        1, // direction
        10, // distance
        customModelInfo,
        0 // tool radius
      );

      expect(result.collision).toBe(true);
      expect(result.contactPoint).toBeDefined();
      expect(result.contactPoint!.X).toBeCloseTo(-1, 1); // Should hit at X=-1 (edge of cube)
    });

    it('should not detect collision when probe ray misses model', () => {
      const startPos = { X: -5, Y: 5, Z: 0 }; // Above the cube
      const result = CustomModelCollision.checkProbeCollision(
        startPos,
        'X',
        1, // direction
        10, // distance
        customModelInfo,
        0 // tool radius
      );

      expect(result.collision).toBe(false);
      expect(result.contactPoint).toBeUndefined();
    });

    it('should account for tool radius in collision detection', () => {
      const startPos = { X: -5, Y: 1.5, Z: 0 }; // Just outside the cube but within tool radius
      const result = CustomModelCollision.checkProbeCollision(
        startPos,
        'X',
        1, // direction
        10, // distance
        customModelInfo,
        1.0 // tool radius should cause collision
      );

      expect(result.collision).toBe(true);
      expect(result.contactPoint).toBeDefined();
    });

    it('should handle rotated models correctly', () => {
      // Rotate the model 45 degrees around Z axis
      const rotatedModelInfo: CustomModelInfo = {
        ...customModelInfo,
        rotation: [0, 0, Math.PI / 4]
      };

      const startPos = { X: -5, Y: 0, Z: 0 };
      const result = CustomModelCollision.checkProbeCollision(
        startPos,
        'X',
        1, // direction
        10, // distance
        rotatedModelInfo,
        0 // tool radius
      );

      expect(result.collision).toBe(true);
      expect(result.contactPoint).toBeDefined();
      // The contact point should be different due to rotation
    });

    it('should handle scaled models correctly', () => {
      const scaledModelInfo: CustomModelInfo = {
        ...customModelInfo,
        scale: [2, 2, 2] // Double the size
      };

      const startPos = { X: -5, Y: 0, Z: 0 };
      const result = CustomModelCollision.checkProbeCollision(
        startPos,
        'X',
        1, // direction
        10, // distance
        scaledModelInfo,
        0 // tool radius
      );

      expect(result.collision).toBe(true);
      expect(result.contactPoint).toBeDefined();
      // Contact point should be further out due to scaling
      expect(result.contactPoint!.X).toBeLessThan(-1); 
    });

    it('should handle translated models correctly', () => {
      const translatedModelInfo: CustomModelInfo = {
        ...customModelInfo,
        position: [5, 0, 0] // Move the cube to X=5
      };

      const startPos = { X: 0, Y: 0, Z: 0 };
      const result = CustomModelCollision.checkProbeCollision(
        startPos,
        'X',
        1, // direction
        10, // distance
        translatedModelInfo,
        0 // tool radius
      );

      expect(result.collision).toBe(true);
      expect(result.contactPoint).toBeDefined();
      expect(result.contactPoint!.X).toBeCloseTo(4, 1); // Should hit at X=4 (left edge of translated cube)
    });
  });

  describe('getModelBoundingBox', () => {
    it('should return correct bounding box for default model', () => {
      const bbox = CustomModelCollision.getModelBoundingBox(customModelInfo);
      
      expect(bbox.min.X).toBeCloseTo(-1, 1);
      expect(bbox.max.X).toBeCloseTo(1, 1);
      expect(bbox.min.Y).toBeCloseTo(-1, 1);
      expect(bbox.max.Y).toBeCloseTo(1, 1);
      expect(bbox.min.Z).toBeCloseTo(-1, 1);
      expect(bbox.max.Z).toBeCloseTo(1, 1);
    });

    it('should return correct bounding box for transformed model', () => {
      const transformedModelInfo: CustomModelInfo = {
        ...customModelInfo,
        position: [10, 0, 0],
        scale: [2, 1, 1]
      };

      const bbox = CustomModelCollision.getModelBoundingBox(transformedModelInfo);
      
      expect(bbox.min.X).toBeCloseTo(8, 1); // 10 - 2
      expect(bbox.max.X).toBeCloseTo(12, 1); // 10 + 2
      expect(bbox.min.Y).toBeCloseTo(-1, 1);
      expect(bbox.max.Y).toBeCloseTo(1, 1);
    });
  });

  describe('isPointInside', () => {
    it('should return true for point inside model', () => {
      const point = { X: 0, Y: 0, Z: 0 }; // Center of cube
      const result = CustomModelCollision.isPointInside(point, customModelInfo);
      
      expect(result).toBe(true);
    });

    it('should return false for point outside model', () => {
      const point = { X: 5, Y: 0, Z: 0 }; // Outside cube
      const result = CustomModelCollision.isPointInside(point, customModelInfo);
      
      expect(result).toBe(false);
    });

    it('should handle edge cases correctly', () => {
      const point = { X: 1, Y: 0, Z: 0 }; // On the edge of cube
      const result = CustomModelCollision.isPointInside(point, customModelInfo);
      
      // Depending on the implementation, this might be true or false
      // The test verifies the method doesn't crash on edge cases
      expect(typeof result).toBe('boolean');
    });
  });
});
