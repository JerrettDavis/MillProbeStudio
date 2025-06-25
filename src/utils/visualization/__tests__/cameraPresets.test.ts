import { describe, it, expect } from 'vitest';
import {
  CAMERA_PRESETS,
  calculateCameraPosition,
  calculateInitialCameraPosition,
  animateCameraToPosition
} from '../cameraPresets';
import type { WorkspaceBounds } from '../machineGeometry';
import type { MachineSettings } from '@/types/machine';

describe('Camera Presets Utilities', () => {
  const mockBounds: WorkspaceBounds = {
    width: 100,
    depth: 200,
    height: 80,
    centerX: -50,
    centerY: -120,
    centerZ: -40,
    minX: -100,
    maxX: 0,
    minY: -20,
    maxY: -220,
    minZ: 0,
    maxZ: -80
  };

  const mockMachineSettings: MachineSettings = {
    units: 'mm',
    axes: {
      X: {
        positiveDirection: 'Down',
        negativeDirection: 'Up',
        polarity: 1,
        min: -100,
        max: 0
      },
      Y: {
        positiveDirection: 'Right',
        negativeDirection: 'Left',
        polarity: 1,
        min: -20,
        max: -220
      },
      Z: {
        positiveDirection: 'In',
        negativeDirection: 'Out',
        polarity: -1,
        min: 0,
        max: -80
      }
    }
  };

  const mockTarget = { x: -50, y: -120, z: -40 };

  describe('CAMERA_PRESETS', () => {
    it('should be an array of preset configurations', () => {
      expect(Array.isArray(CAMERA_PRESETS)).toBe(true);
      expect(CAMERA_PRESETS.length).toBeGreaterThan(0);
    });

    it('should have all required preset properties', () => {
      CAMERA_PRESETS.forEach(preset => {
        expect(preset).toHaveProperty('key');
        expect(preset).toHaveProperty('label');
        expect(preset).toHaveProperty('icon');
        expect(typeof preset.key).toBe('string');
        expect(typeof preset.label).toBe('string');
        expect(typeof preset.icon).toBe('string');
      });
    });

    it('should include standard presets', () => {
      const presetKeys = CAMERA_PRESETS.map(p => p.key);
      expect(presetKeys).toContain('home');
      expect(presetKeys).toContain('front');
      expect(presetKeys).toContain('top');
      expect(presetKeys).toContain('iso1');
    });
  });

  describe('calculateCameraPosition', () => {
    it('should calculate correct home position for horizontal orientation', () => {
      const position = calculateCameraPosition('home', mockBounds, mockMachineSettings, mockTarget, 'horizontal');
      
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('z');
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');
      expect(typeof position.z).toBe('number');
    });

    it('should calculate correct front view position', () => {
      const position = calculateCameraPosition('front', mockBounds, mockMachineSettings, mockTarget, 'horizontal');
      
      expect(position.y).toBe(mockBounds.centerY);
      // For horizontal orientation, front view uses X.min - distance
      // maxDimension = max(100, 200, 80) = 200, distance = 200 * 1.5 = 300
      // X.min = -100, distance = 300, so X.min - distance = -400
      expect(position.x).toBe(-400);
    });

    it('should calculate correct top view position', () => {
      const position = calculateCameraPosition('top', mockBounds, mockMachineSettings, mockTarget, 'horizontal');
      
      expect(position.x).toBe(mockBounds.centerX);
      expect(position.y).toBe(mockBounds.centerY);
      // For horizontal orientation, top view uses Z.min - distance
      // maxDimension = max(100, 200, 80) = 200, distance = 200 * 1.5 = 300
      // Z.min = 0, distance = 300, so Z.min - distance = -300
      expect(position.z).toBe(-300);
    });
  });

  describe('calculateInitialCameraPosition', () => {
    it('should calculate initial position for horizontal orientation', () => {
      const position = calculateInitialCameraPosition(mockMachineSettings, 'horizontal');
      
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('z');
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');
      expect(typeof position.z).toBe('number');
    });
  });

  describe('animateCameraToPosition', () => {
    it('should be a function', () => {
      expect(typeof animateCameraToPosition).toBe('function');
    });
  });
});