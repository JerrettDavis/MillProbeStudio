import { describe, it, expect } from 'vitest';
import type { MachineSettings } from '@/types/machine';
import {
  createMockMachineSettings,
  createMockMachineSettingsInches,
  createMockMachineSettingsVertical,
  createRealisticMachineSettings
} from '../mockMachineSettings';

describe('Mock Machine Settings', () => {
  describe('createMockMachineSettings', () => {
    it('should create default mock machine settings', () => {
      const settings = createMockMachineSettings();
      
      expect(settings.units).toBe('mm');
      expect(settings.machineOrientation).toBe('horizontal');
      expect(settings.stageDimensions).toEqual([12.7, 304.8, 63.5]);
      
      // Check axes defaults
      expect(settings.axes.X.positiveDirection).toBe('Down');
      expect(settings.axes.X.negativeDirection).toBe('Up');
      expect(settings.axes.X.polarity).toBe(1);
      expect(settings.axes.X.min).toBe(-100);
      expect(settings.axes.X.max).toBe(100);
      
      expect(settings.axes.Y.positiveDirection).toBe('Right');
      expect(settings.axes.Y.negativeDirection).toBe('Left');
      expect(settings.axes.Y.polarity).toBe(1);
      expect(settings.axes.Y.min).toBe(-150);
      expect(settings.axes.Y.max).toBe(150);
      
      expect(settings.axes.Z.positiveDirection).toBe('In');
      expect(settings.axes.Z.negativeDirection).toBe('Out');
      expect(settings.axes.Z.polarity).toBe(-1);
      expect(settings.axes.Z.min).toBe(-50);
      expect(settings.axes.Z.max).toBe(50);
    });

    it('should accept overrides for all properties', () => {
      const overrides: Partial<MachineSettings> = {
        units: 'inch',
        machineOrientation: 'vertical',
        stageDimensions: [25, 50, 100],
        axes: {
          X: {
            positiveDirection: 'Up',
            negativeDirection: 'Down', 
            polarity: -1,
            min: -200,
            max: 200
          },
          Y: {
            positiveDirection: 'Left',
            negativeDirection: 'Right',
            polarity: -1,
            min: -300,
            max: 300
          },
          Z: {
            positiveDirection: 'Out',
            negativeDirection: 'In',
            polarity: 1,
            min: -75,
            max: 75
          }
        }
      };

      const settings = createMockMachineSettings(overrides);
      
      expect(settings.units).toBe('inch');
      expect(settings.machineOrientation).toBe('vertical');
      expect(settings.stageDimensions).toEqual([25, 50, 100]);
      expect(settings.axes.X.positiveDirection).toBe('Up');
      expect(settings.axes.X.polarity).toBe(-1);
      expect(settings.axes.Y.min).toBe(-300);
      expect(settings.axes.Z.positiveDirection).toBe('Out');
    });

    it('should accept partial overrides', () => {
      const overrides = {
        units: 'inch' as const,
        stageDimensions: [10, 20, 30] as [number, number, number]
      };

      const settings = createMockMachineSettings(overrides);
      
      expect(settings.units).toBe('inch');
      expect(settings.stageDimensions).toEqual([10, 20, 30]);
      // Other properties should remain default
      expect(settings.machineOrientation).toBe('horizontal');
      expect(settings.axes.X.polarity).toBe(1);
    });

    it('should accept partial axis overrides', () => {
      const settings = createMockMachineSettings({
        units: 'inch',
        stageDimensions: [10, 20, 30]
      });
      
      expect(settings.units).toBe('inch');
      expect(settings.stageDimensions).toEqual([10, 20, 30]);
      // Other properties should remain default  
      expect(settings.machineOrientation).toBe('horizontal');
      expect(settings.axes.X.polarity).toBe(1);
      expect(settings.axes.Y.positiveDirection).toBe('Right');
      expect(settings.axes.Z.polarity).toBe(-1);
    });

    it('should handle empty overrides', () => {
      const settings = createMockMachineSettings({});
      
      // Should be identical to calling with no parameters
      const defaultSettings = createMockMachineSettings();
      expect(settings).toEqual(defaultSettings);
    });
  });

  describe('createMockMachineSettingsInches', () => {
    it('should create machine settings with inch units', () => {
      const settings = createMockMachineSettingsInches();
      
      expect(settings.units).toBe('inch');
      // Other properties should be defaults
      expect(settings.machineOrientation).toBe('horizontal');
      expect(settings.axes.X.polarity).toBe(1);
      expect(settings.stageDimensions).toEqual([12.7, 304.8, 63.5]);
    });

    it('should return same result as manual override', () => {
      const inchSettings = createMockMachineSettingsInches();
      const manualSettings = createMockMachineSettings({ units: 'inch' });
      
      expect(inchSettings).toEqual(manualSettings);
    });
  });

  describe('createMockMachineSettingsVertical', () => {
    it('should create machine settings with vertical orientation', () => {
      const settings = createMockMachineSettingsVertical();
      
      expect(settings.machineOrientation).toBe('vertical');
      // Other properties should be defaults
      expect(settings.units).toBe('mm');
      expect(settings.axes.Y.polarity).toBe(1);
      expect(settings.stageDimensions).toEqual([12.7, 304.8, 63.5]);
    });

    it('should return same result as manual override', () => {
      const verticalSettings = createMockMachineSettingsVertical();
      const manualSettings = createMockMachineSettings({ machineOrientation: 'vertical' });
      
      expect(verticalSettings).toEqual(manualSettings);
    });
  });

  describe('createRealisticMachineSettings', () => {
    it('should create realistic machine settings with proper mill dimensions', () => {
      const settings = createRealisticMachineSettings();
      
      expect(settings.units).toBe('mm');
      expect(settings.machineOrientation).toBe('horizontal');
      expect(settings.stageDimensions).toEqual([12.7, 304.8, 63.5]);
      
      // Check realistic axis limits
      expect(settings.axes.X.min).toBe(-86);
      expect(settings.axes.X.max).toBe(-0.5);
      expect(settings.axes.Y.min).toBe(-0.5);
      expect(settings.axes.Y.max).toBe(-241.50);
      expect(settings.axes.Z.min).toBe(-0.5);
      expect(settings.axes.Z.max).toBe(-78.50);
      
      // Check axis directions
      expect(settings.axes.X.positiveDirection).toBe('Down');
      expect(settings.axes.Y.positiveDirection).toBe('Right');
      expect(settings.axes.Z.positiveDirection).toBe('In');
      
      // Check polarities
      expect(settings.axes.X.polarity).toBe(1);
      expect(settings.axes.Y.polarity).toBe(1);
      expect(settings.axes.Z.polarity).toBe(-1);
    });

    it('should accept overrides', () => {
      const overrides = {
        units: 'inch' as const,
        stageDimensions: [25, 50, 100] as [number, number, number]
      };

      const settings = createRealisticMachineSettings(overrides);
      
      expect(settings.units).toBe('inch');
      expect(settings.stageDimensions).toEqual([25, 50, 100]);
      
      // Realistic settings should remain
      expect(settings.axes.X.min).toBe(-86);
      expect(settings.axes.Y.min).toBe(-0.5);
      expect(settings.axes.Y.max).toBe(-241.50);
      expect(settings.axes.Z.polarity).toBe(-1);
    });

    it('should handle empty overrides', () => {
      const settings = createRealisticMachineSettings({});
      const defaultSettings = createRealisticMachineSettings();
      
      expect(settings).toEqual(defaultSettings);
    });

    it('should be different from mock settings', () => {
      const realisticSettings = createRealisticMachineSettings();
      const mockSettings = createMockMachineSettings();
      
      expect(realisticSettings).not.toEqual(mockSettings);
      
      // Check specific differences
      expect(realisticSettings.axes.X.min).not.toBe(mockSettings.axes.X.min);
      expect(realisticSettings.axes.Y.max).not.toBe(mockSettings.axes.Y.max);
      expect(realisticSettings.axes.Z.max).not.toBe(mockSettings.axes.Z.max);
    });
  });

  describe('Type safety', () => {
    it('should maintain proper TypeScript types', () => {
      const settings = createMockMachineSettings();
      
      // TypeScript should enforce these types
      expect(typeof settings.units).toBe('string');
      expect(typeof settings.machineOrientation).toBe('string');
      expect(Array.isArray(settings.stageDimensions)).toBe(true);
      expect(settings.stageDimensions).toHaveLength(3);
      
      expect(typeof settings.axes.X.polarity).toBe('number');
      expect(typeof settings.axes.Y.min).toBe('number');
      expect(typeof settings.axes.Z.max).toBe('number');
    });

    it('should handle complex overrides correctly', () => {
      const complexOverrides: Partial<MachineSettings> = {
        units: 'inch',
        machineOrientation: 'vertical',
        stageDimensions: [1, 2, 3],
        axes: {
          X: {
            positiveDirection: 'Up',
            negativeDirection: 'Down',
            polarity: -1,
            min: -10,
            max: 10
          },
          Y: {
            positiveDirection: 'Left',
            negativeDirection: 'Right',
            polarity: 1,
            min: -20,
            max: 20
          },
          Z: {
            positiveDirection: 'Out',
            negativeDirection: 'In',
            polarity: 1,
            min: -5,
            max: 5
          }
        }
      };

      const settings = createMockMachineSettings(complexOverrides);
      
      expect(settings).toMatchObject(complexOverrides);
    });
  });

  describe('Factory functions consistency', () => {
    it('should maintain consistent defaults across factory functions', () => {
      const mockSettings = createMockMachineSettings();
      const inchSettings = createMockMachineSettingsInches();
      const verticalSettings = createMockMachineSettingsVertical();
      
      // Stage dimensions should be consistent
      expect(mockSettings.stageDimensions).toEqual(inchSettings.stageDimensions);
      expect(mockSettings.stageDimensions).toEqual(verticalSettings.stageDimensions);
      
      // Axis configurations should be consistent where not overridden
      expect(mockSettings.axes.X.positiveDirection).toBe(inchSettings.axes.X.positiveDirection);
      expect(mockSettings.axes.Y.polarity).toBe(verticalSettings.axes.Y.polarity);
    });

    it('should allow chaining overrides conceptually', () => {
      // Test that multiple calls with different overrides work as expected
      const baseSettings = createMockMachineSettings();
      const inchSettings = createMockMachineSettings({ units: 'inch' });
      const verticalInchSettings = createMockMachineSettings({ 
        units: 'inch', 
        machineOrientation: 'vertical' 
      });
      
      expect(baseSettings.units).toBe('mm');
      expect(inchSettings.units).toBe('inch');
      expect(verticalInchSettings.units).toBe('inch');
      expect(verticalInchSettings.machineOrientation).toBe('vertical');
    });
  });
});
