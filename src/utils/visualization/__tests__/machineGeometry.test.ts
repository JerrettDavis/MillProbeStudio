import { describe, it, expect } from 'vitest';
import {
  calculateWorkspaceBounds,
  calculateToolPosition,
  calculateStagePosition,
  calculateStockWorldPosition,
  calculateStockRelativePosition,
  calculateDefaultStockPosition,
  calculateCameraDistance,
  calculateMachineGeometry
} from '../machineGeometry';
import { createMockMachineSettings } from '@/test/mockMachineSettings';
import type { ProbeSequenceSettings } from '@/types/machine';

const mockMachineSettings = createMockMachineSettings({
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
      max: -241.5
    },
    Z: {
      positiveDirection: 'In',
      negativeDirection: 'Out',
      polarity: -1,
      min: -0.5,
      max: -78.5
    }
  }
});

const mockProbeSequence: ProbeSequenceSettings = {
  initialPosition: { X: -43, Y: -121, Z: -39.5 },
  dwellsBeforeProbe: 15,
  spindleSpeed: 5000,
  units: 'mm',
  endmillSize: {
    input: '1/8',
    unit: 'fraction',
    sizeInMM: 3.175
  },
  operations: []
};

describe('Machine Geometry Utilities', () => {
  describe('calculateWorkspaceBounds', () => {
    it('should calculate correct workspace bounds from machine settings', () => {
      const bounds = calculateWorkspaceBounds(mockMachineSettings);
      
      expect(bounds.width).toBeCloseTo(85.5); // |-86 - (-0.5)|
      expect(bounds.depth).toBeCloseTo(241); // |-0.5 - (-241.5)|
      expect(bounds.height).toBeCloseTo(78); // |-0.5 - (-78.5)|
      expect(bounds.centerX).toBeCloseTo(-43.25); // (-86 + -0.5) / 2
      expect(bounds.centerY).toBeCloseTo(-121); // (-0.5 + -241.5) / 2
      expect(bounds.centerZ).toBeCloseTo(-39.5); // (-0.5 + -78.5) / 2
      expect(bounds.minX).toBe(-86);
      expect(bounds.maxX).toBe(-0.5);
      expect(bounds.minY).toBe(-0.5);
      expect(bounds.maxY).toBe(-241.5);
      expect(bounds.minZ).toBe(-0.5);
      expect(bounds.maxZ).toBe(-78.5);
    });

    it('should handle zero dimensions', () => {
      const settingsWithZero = {
        ...mockMachineSettings,
        axes: {
          ...mockMachineSettings.axes,
          X: { ...mockMachineSettings.axes.X, min: 0, max: 0 }
        }
      };
      
      const bounds = calculateWorkspaceBounds(settingsWithZero);
      expect(bounds.width).toBe(0);
      expect(bounds.centerX).toBe(0);
    });
  });

  describe('calculateToolPosition', () => {
    it('should calculate correct tool position for horizontal orientation', () => {
      const position = calculateToolPosition(mockMachineSettings, mockProbeSequence, 'horizontal');
      
      // For horizontal, X should be spindle fixed position (X.max), Y and Z from probe position
      expect(position.x).toBe(mockMachineSettings.axes.X.max);
      expect(position.y).toBe(mockProbeSequence.initialPosition.Y);
      expect(position.z).toBe(mockProbeSequence.initialPosition.Z);
    });

    it('should calculate correct tool position for vertical orientation', () => {
      const position = calculateToolPosition(mockMachineSettings, mockProbeSequence, 'vertical');
      
      // For vertical, tool follows probe position exactly
      expect(position.x).toBe(mockProbeSequence.initialPosition.X);
      expect(position.y).toBe(mockProbeSequence.initialPosition.Y);
      expect(position.z).toBe(mockProbeSequence.initialPosition.Z);
    });

    it('should handle missing probe sequence', () => {
      const position = calculateToolPosition(mockMachineSettings, undefined, 'horizontal');
      
      expect(position.x).toBe(mockMachineSettings.axes.X.max);
      expect(position.y).toBe(0);
      expect(position.z).toBe(0);
    });
  });

  describe('calculateStagePosition', () => {
    it('should calculate correct stage position', () => {
      const position = calculateStagePosition(mockMachineSettings, mockProbeSequence);
      
      // Stage X should be inverted from probe X
      const expectedX = mockMachineSettings.axes.X.max - (mockProbeSequence.initialPosition.X - mockMachineSettings.axes.X.min);
      expect(position.x).toBeCloseTo(expectedX);
      
      // Stage Y should be centered
      const expectedY = (mockMachineSettings.axes.Y.max + mockMachineSettings.axes.Y.min) / 2;
      expect(position.y).toBeCloseTo(expectedY);
      
      // Stage Z should be centered
      const expectedZ = (mockMachineSettings.axes.Z.max + mockMachineSettings.axes.Z.min) / 2;
      expect(position.z).toBeCloseTo(expectedZ);
    });

    it('should handle missing probe sequence', () => {
      const position = calculateStagePosition(mockMachineSettings, undefined);
      
      // Should use X.min as default probe position
      const expectedX = mockMachineSettings.axes.X.max - (mockMachineSettings.axes.X.min - mockMachineSettings.axes.X.min);
      expect(position.x).toBeCloseTo(expectedX);
    });
  });

  describe('calculateStockWorldPosition', () => {
    it('should calculate correct stock world position', () => {
      const stagePosition = { x: 10, y: 20, z: 30 };
      const stockSize: [number, number, number] = [5, 10, 15];
      const stockPosition: [number, number, number] = [1, 2, 3];
      const stageDimensions: [number, number, number] = [12.7, 304.8, 63.5];
      
      const worldPosition = calculateStockWorldPosition(stagePosition, stockSize, stockPosition, stageDimensions);
      
      // Stock should be attached to X+ face of stage
      const expectedX = stagePosition.x + stageDimensions[0] / 2 + stockSize[0] / 2 + stockPosition[0];
      expect(worldPosition.x).toBeCloseTo(expectedX);
      
      // Y position relative to stage
      expect(worldPosition.y).toBeCloseTo(stagePosition.y + stockPosition[1]);
      
      // Z position on top of stage
      const expectedZ = stagePosition.z + stageDimensions[2] / 2 + stockSize[2] / 2 + stockPosition[2];
      expect(worldPosition.z).toBeCloseTo(expectedZ);
    });
  });

  describe('calculateStockRelativePosition', () => {
    it('should calculate correct relative position from world position', () => {
      const worldPosition = { x: 50, y: 60, z: 70 };
      const stagePosition = { x: 10, y: 20, z: 30 };
      const stockSize: [number, number, number] = [5, 10, 15];
      const stageDimensions: [number, number, number] = [12.7, 304.8, 63.5];
      
      const relativePosition = calculateStockRelativePosition(worldPosition, stagePosition, stockSize, stageDimensions);
      
      // Should reverse the world position calculation
      const stageXPlusFace = stagePosition.x + stageDimensions[0] / 2;
      const expectedX = worldPosition.x - (stageXPlusFace + stockSize[0] / 2);
      expect(relativePosition[0]).toBeCloseTo(expectedX);
      
      expect(relativePosition[1]).toBeCloseTo(worldPosition.y - stagePosition.y);
      
      const stageTop = stagePosition.z + stageDimensions[2] / 2;
      const expectedZ = worldPosition.z - (stageTop + stockSize[2] / 2);
      expect(relativePosition[2]).toBeCloseTo(expectedZ);
    });
  });

  describe('calculateDefaultStockPosition', () => {
    it('should calculate correct default position for horizontal orientation', () => {
      const stockSize: [number, number, number] = [25, 25, 10];
      const position = calculateDefaultStockPosition(mockMachineSettings, stockSize, 'horizontal');
      
      // For horizontal, should be relative to stage (centered)
      expect(position).toEqual([0, 0, 0]);
    });

    it('should calculate correct default position for vertical orientation', () => {
      const stockSize: [number, number, number] = [25, 25, 10];
      const position = calculateDefaultStockPosition(mockMachineSettings, stockSize, 'vertical');
      
      // For vertical, should be absolute world coordinates
      const expectedX = mockMachineSettings.axes.X.min + (Math.abs(mockMachineSettings.axes.X.max - mockMachineSettings.axes.X.min) * 0.3);
      const expectedY = (mockMachineSettings.axes.Y.max + mockMachineSettings.axes.Y.min) / 2;
      const expectedZ = mockMachineSettings.axes.Z.min + stockSize[2] / 2;
      
      expect(position[0]).toBeCloseTo(expectedX);
      expect(position[1]).toBeCloseTo(expectedY);
      expect(position[2]).toBeCloseTo(expectedZ);
    });
  });

  describe('calculateCameraDistance', () => {
    it('should calculate appropriate camera distance', () => {
      const bounds = calculateWorkspaceBounds(mockMachineSettings);
      const distance = calculateCameraDistance(bounds);
      
      const maxDimension = Math.max(bounds.width, bounds.depth, bounds.height);
      expect(distance).toBeCloseTo(maxDimension * 1.5);
    });
  });

  describe('calculateMachineGeometry', () => {
    it('should calculate complete machine geometry for horizontal orientation', () => {
      const geometry = calculateMachineGeometry(
        mockMachineSettings,
        mockProbeSequence,
        [25, 25, 10],
        [0, 0, 0],
        'horizontal',
        [12.7, 304.8, 63.5]
      );
      
      expect(geometry.workspaceBounds).toBeDefined();
      expect(geometry.toolPosition).toBeDefined();
      expect(geometry.stagePosition).toBeDefined();
      expect(geometry.stockWorldPosition).toBeDefined();
      expect(geometry.cameraDistance).toBeGreaterThan(0);
      
      // Verify tool position for horizontal
      expect(geometry.toolPosition.x).toBe(mockMachineSettings.axes.X.max);
    });

    it('should calculate complete machine geometry for vertical orientation', () => {
      const geometry = calculateMachineGeometry(
        mockMachineSettings,
        mockProbeSequence,
        [25, 25, 10],
        [0, 0, 0],
        'vertical',
        [12.7, 304.8, 63.5]
      );
      
      // For vertical, stock position should be absolute
      expect(geometry.stockWorldPosition.x).toBe(0);
      expect(geometry.stockWorldPosition.y).toBe(0);
      expect(geometry.stockWorldPosition.z).toBe(0);
    });

    it('should handle missing probe sequence', () => {
      const geometry = calculateMachineGeometry(
        mockMachineSettings,
        undefined,
        [25, 25, 10],
        [0, 0, 0],
        'horizontal',
        [12.7, 304.8, 63.5]
      );
      
      expect(geometry.toolPosition.y).toBe(0);
      expect(geometry.toolPosition.z).toBe(0);
    });
  });
});
