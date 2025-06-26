import type { MachineSettings } from '@/types/machine';

/**
 * Default mock machine settings for testing
 */
export const createMockMachineSettings = (overrides: Partial<MachineSettings> = {}): MachineSettings => ({
  units: 'mm',
  axes: {
    X: {
      positiveDirection: 'Down',
      negativeDirection: 'Up',
      polarity: 1,
      min: -100,
      max: 100
    },
    Y: {
      positiveDirection: 'Right',
      negativeDirection: 'Left',
      polarity: 1,
      min: -150,
      max: 150
    },
    Z: {
      positiveDirection: 'In',
      negativeDirection: 'Out',
      polarity: -1,
      min: -50,
      max: 50
    }
  },
  machineOrientation: 'horizontal',
  stageDimensions: [12.7, 304.8, 63.5],
  ...overrides
});

/**
 * Mock machine settings with inch units
 */
export const createMockMachineSettingsInches = (): MachineSettings => 
  createMockMachineSettings({ units: 'inch' });

/**
 * Mock machine settings with vertical orientation
 */
export const createMockMachineSettingsVertical = (): MachineSettings => 
  createMockMachineSettings({ machineOrientation: 'vertical' });

/**
 * Mock machine settings with realistic mill dimensions for actual mill use
 */
export const createRealisticMachineSettings = (overrides: Partial<MachineSettings> = {}): MachineSettings => ({
  units: 'mm',
  axes: {
    X: {
      positiveDirection: 'Down',
      negativeDirection: 'Up',
      polarity: 1,
      min: -86,
      max: -0.5
    },
    Y: {
      positiveDirection: 'Right',
      negativeDirection: 'Left',
      polarity: 1,
      min: -0.5,
      max: -241.50
    },
    Z: {
      positiveDirection: 'In',
      negativeDirection: 'Out',
      polarity: -1,
      min: -0.5,
      max: -78.50
    }
  },
  machineOrientation: 'horizontal',
  stageDimensions: [12.7, 304.8, 63.5],
  ...overrides
});
