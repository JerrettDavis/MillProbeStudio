// src/utils/machine/__tests__/VirtualMill.errorHandling.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualMill } from '../VirtualMill';
import type { MachineSettings } from '@/types/machine';

describe('VirtualMill Error Handling', () => {
  let virtualMill: VirtualMill;
  let mockMachineSettings: MachineSettings;

  beforeEach(() => {
    mockMachineSettings = {
      machineOrientation: 'vertical',
      axes: {
        X: { positiveDirection: '+X', negativeDirection: '-X', polarity: 1, min: -50, max: 50 },
        Y: { positiveDirection: '+Y', negativeDirection: '-Y', polarity: 1, min: -50, max: 50 },
        Z: { positiveDirection: '+Z', negativeDirection: '-Z', polarity: 1, min: -50, max: 50 }
      },
      stageDimensions: [100, 100, 25],
      units: 'mm'
    };

    virtualMill = new VirtualMill(mockMachineSettings, { X: 0, Y: 0, Z: 0 });
  });

  describe('position clamping', () => {
    it('should clamp X position to maximum limit', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 100 // Outside X max limit of 50
      });
      
      const position = virtualMill.getCurrentPosition();
      expect(position.X).toBe(50); // Should be clamped to max
      expect(position.Y).toBe(0);
      expect(position.Z).toBe(0);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('exceeds machine limits')
      );
      
      consoleSpy.mockRestore();
    });

    it('should clamp Y position to minimum limit', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      virtualMill.executeGCodeSync({
        type: 'linear',
        Y: -100 // Outside Y min limit of -50
      });
      
      const position = virtualMill.getCurrentPosition();
      expect(position.X).toBe(0);
      expect(position.Y).toBe(-50); // Should be clamped to min
      expect(position.Z).toBe(0);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should clamp Z position to maximum limit', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      virtualMill.executeGCodeSync({
        type: 'rapid',
        Z: 75 // Outside Z max limit of 50
      });
      
      const position = virtualMill.getCurrentPosition();
      expect(position.X).toBe(0);
      expect(position.Y).toBe(0);
      expect(position.Z).toBe(50); // Should be clamped to max
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should clamp multiple axes simultaneously', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 100,  // Outside max
        Y: -100, // Outside min
        Z: 75    // Outside max
      });
      
      const position = virtualMill.getCurrentPosition();
      expect(position.X).toBe(50);  // Clamped to max
      expect(position.Y).toBe(-50); // Clamped to min
      expect(position.Z).toBe(50);  // Clamped to max
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('real-time movement clamping', () => {
    it('should clamp positions in real-time movement without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // This should not throw an error
      expect(() => {
        virtualMill.executeGCodeSync({
          type: 'rapid',
          X: 200, // Way outside limits
          Y: -200,
          Z: 200
        });
      }).not.toThrow();
      
      // Check that console warning was issued
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('exceeds machine limits')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('probe operations with out-of-bounds targets', () => {
    it('should handle probe operations that would exceed limits', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Move close to the limit first
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 45,
        Y: 0,
        Z: 0
      });
      
      // Probe that would exceed limits
      expect(() => {
        virtualMill.executeGCodeSync({
          type: 'probe',
          axis: 'X',
          direction: 1,
          distance: 20, // Would go to X=65, beyond limit of 50
          feedRate: 100
        });
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('recovery and state consistency', () => {
    it('should maintain consistent state after clamping', () => {
      // Move to valid position
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 10,
        Y: 10,
        Z: 10
      });
      
      const positionBefore = virtualMill.getCurrentPosition();
      expect(positionBefore.X).toBe(10);
      
      // Attempt out-of-bounds movement
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 100 // Outside limits
      });
      
      const positionAfter = virtualMill.getCurrentPosition();
      expect(positionAfter.X).toBe(50); // Clamped
      expect(positionAfter.Y).toBe(10); // Unchanged
      expect(positionAfter.Z).toBe(10); // Unchanged
      
      // Subsequent valid movements should work normally
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 30
      });
      
      const finalPosition = virtualMill.getCurrentPosition();
      expect(finalPosition.X).toBe(30); // Should move normally
    });

    it('should reset to safe position correctly', () => {
      // Move to an out-of-bounds position (which gets clamped)
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 100,
        Y: 100,
        Z: 100
      });
      
      // Reset to safe position
      virtualMill.reset({ X: 0, Y: 0, Z: 0 });
      
      const position = virtualMill.getCurrentPosition();
      expect(position.X).toBe(0);
      expect(position.Y).toBe(0);
      expect(position.Z).toBe(0);
      
      // Verify that normal operations work after reset
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 25
      });
      
      expect(virtualMill.getCurrentPosition().X).toBe(25);
    });
  });
});
