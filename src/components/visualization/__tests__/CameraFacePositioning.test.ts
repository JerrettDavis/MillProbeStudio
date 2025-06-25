import { describe, it, expect } from 'vitest';
import {
  calculateCameraPosition,
  calculateInitialCameraPosition
} from '@/utils/visualization/cameraPresets';
import { MACHINE_ORIENTATION_CONFIGS } from '@/config/visualization/visualizationConfig';
import type { MachineSettings } from '@/types/machine';
import type { WorkspaceBounds, Position3D } from '@/utils/visualization/machineGeometry';

// Mock machine settings representing a typical milling machine
const horizontalMachineSettings: MachineSettings = {
  units: 'mm',
  axes: {
    X: {
      positiveDirection: '+X',
      negativeDirection: '-X',
      polarity: 1,
      min: -100,
      max: 100
    },
    Y: {
      positiveDirection: '+Y',
      negativeDirection: '-Y',
      polarity: 1,
      min: -150,
      max: 150
    },
    Z: {
      positiveDirection: '+Z',
      negativeDirection: '-Z',
      polarity: 1,
      min: -50,
      max: 50
    }
  }
};

const mockWorkspaceBounds: WorkspaceBounds = {
  width: 200,  // X: 100 - (-100)
  depth: 300,  // Y: 150 - (-150)
  height: 100, // Z: 50 - (-50)
  centerX: 0,  // (100 + (-100)) / 2
  centerY: 0,  // (150 + (-150)) / 2
  centerZ: 0,  // (50 + (-50)) / 2
  minX: -100,
  maxX: 100,
  minY: -150,
  maxY: 150,
  minZ: -50,
  maxZ: 50
};

const mockTarget: Position3D = { x: 0, y: 0, z: 0 };

describe('Camera Face Positioning and Orientation Tests', () => {
  describe('Horizontal Machine Orientation - Face Positioning', () => {
    const machineOrientation = 'horizontal';
    const distance = Math.max(mockWorkspaceBounds.width, mockWorkspaceBounds.depth, mockWorkspaceBounds.height) * 1.5; // 300 * 1.5 = 450

    it('should position HOME view correctly for horizontal orientation', () => {
      const position = calculateCameraPosition(
        'home',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // Home should be positioned diagonally above and away from the machine
      expect(position.x).toBeCloseTo(0 - distance * 0.7); // centerX - distance * 0.7
      expect(position.y).toBeCloseTo(150 + distance * 0.8); // Y.max + distance * 0.8
      expect(position.z).toBeCloseTo(0 - distance * 0.3); // centerZ - distance * 0.3
    });

    it('should position FRONT view correctly for horizontal orientation', () => {
      const position = calculateCameraPosition(
        'front',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // Front should look from negative X direction
      expect(position.x).toBeCloseTo(-100 - distance); // X.min - distance
      expect(position.y).toBeCloseTo(0); // centerY
      expect(position.z).toBeCloseTo(0); // centerZ
    });

    it('should position BACK view correctly for horizontal orientation', () => {
      const position = calculateCameraPosition(
        'back',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // Back should look from positive X direction
      expect(position.x).toBeCloseTo(100 + distance); // X.max + distance
      expect(position.y).toBeCloseTo(0); // centerY
      expect(position.z).toBeCloseTo(0); // centerZ
    });

    it('should position RIGHT view correctly for horizontal orientation', () => {
      const position = calculateCameraPosition(
        'right',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // Right should look from positive Y direction
      expect(position.x).toBeCloseTo(0); // centerX
      expect(position.y).toBeCloseTo(150 + distance); // Y.max + distance
      expect(position.z).toBeCloseTo(0); // centerZ
    });

    it('should position LEFT view correctly for horizontal orientation', () => {
      const position = calculateCameraPosition(
        'left',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // Left should look from negative Y direction
      expect(position.x).toBeCloseTo(0); // centerX
      expect(position.y).toBeCloseTo(-150 - distance); // Y.min - distance
      expect(position.z).toBeCloseTo(0); // centerZ
    });

    it('should position TOP view correctly for horizontal orientation', () => {
      const position = calculateCameraPosition(
        'top',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // Top should look from negative Z direction (above)
      expect(position.x).toBeCloseTo(0); // centerX
      expect(position.y).toBeCloseTo(0); // centerY
      expect(position.z).toBeCloseTo(-50 - distance); // Z.min - distance
    });

    it('should position BOTTOM view correctly for horizontal orientation', () => {
      const position = calculateCameraPosition(
        'bottom',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // Bottom should look from positive Z direction (below)
      expect(position.x).toBeCloseTo(0); // centerX
      expect(position.y).toBeCloseTo(0); // centerY
      expect(position.z).toBeCloseTo(50 + distance); // Z.max + distance
    });

    it('should position ISO1 view correctly for horizontal orientation', () => {
      const position = calculateCameraPosition(
        'iso1',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // ISO1 should be diagonal from positive X, positive Y, negative Z
      expect(position.x).toBeCloseTo(100 + distance * 0.7); // X.max + distance * 0.7
      expect(position.y).toBeCloseTo(150 + distance * 0.7); // Y.max + distance * 0.7
      expect(position.z).toBeCloseTo(-50 - distance * 0.7); // Z.min - distance * 0.7
    });

    it('should position ISO2 view correctly for horizontal orientation', () => {
      const position = calculateCameraPosition(
        'iso2',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // ISO2 should be diagonal from negative X, positive Y, positive Z
      expect(position.x).toBeCloseTo(-100 - distance * 0.7); // X.min - distance * 0.7
      expect(position.y).toBeCloseTo(150 + distance * 0.7); // Y.max + distance * 0.7
      expect(position.z).toBeCloseTo(50 + distance * 0.7); // Z.max + distance * 0.7
    });
  });

  describe('Vertical Machine Orientation - Face Positioning', () => {
    const machineOrientation = 'vertical';
    const distance = Math.max(mockWorkspaceBounds.width, mockWorkspaceBounds.depth, mockWorkspaceBounds.height) * 1.5; // 450

    it('should position FRONT view correctly for vertical orientation', () => {
      const position = calculateCameraPosition(
        'front',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // For vertical orientation, front view looks from negative Y direction
      expect(position.x).toBeCloseTo(0); // centerX
      expect(position.y).toBeCloseTo(-150 - distance); // Y.min - distance
      expect(position.z).toBeCloseTo(0); // centerZ
    });

    it('should position BACK view correctly for vertical orientation', () => {
      const position = calculateCameraPosition(
        'back',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // For vertical orientation, back view looks from positive Y direction
      expect(position.x).toBeCloseTo(0); // centerX
      expect(position.y).toBeCloseTo(150 + distance); // Y.max + distance
      expect(position.z).toBeCloseTo(0); // centerZ
    });

    it('should position RIGHT view correctly for vertical orientation', () => {
      const position = calculateCameraPosition(
        'right',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // For vertical orientation, right view looks from positive X direction
      expect(position.x).toBeCloseTo(100 + distance); // X.max + distance
      expect(position.y).toBeCloseTo(0); // centerY
      expect(position.z).toBeCloseTo(0); // centerZ
    });

    it('should position LEFT view correctly for vertical orientation', () => {
      const position = calculateCameraPosition(
        'left',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // For vertical orientation, left view looks from negative X direction
      expect(position.x).toBeCloseTo(-100 - distance); // X.min - distance
      expect(position.y).toBeCloseTo(0); // centerY
      expect(position.z).toBeCloseTo(0); // centerZ
    });

    it('should position TOP view correctly for vertical orientation', () => {
      const position = calculateCameraPosition(
        'top',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // For vertical orientation, top view looks from positive Z direction
      expect(position.x).toBeCloseTo(0); // centerX
      expect(position.y).toBeCloseTo(0); // centerY
      expect(position.z).toBeCloseTo(50 + distance); // Z.max + distance
    });

    it('should position BOTTOM view correctly for vertical orientation', () => {
      const position = calculateCameraPosition(
        'bottom',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        machineOrientation
      );

      // For vertical orientation, bottom view looks from negative Z direction
      expect(position.x).toBeCloseTo(0); // centerX
      expect(position.y).toBeCloseTo(0); // centerY
      expect(position.z).toBeCloseTo(-50 - distance); // Z.min - distance
    });
  });

  describe('Camera Orientation Validation', () => {
    it('should have correct up vector for horizontal orientation', () => {
      const config = MACHINE_ORIENTATION_CONFIGS.horizontal;
      expect(config.upVector).toEqual([0, 0, -1]);
    });

    it('should have correct up vector for vertical orientation', () => {
      const config = MACHINE_ORIENTATION_CONFIGS.vertical;
      expect(config.upVector).toEqual([0, 0, 1]);
    });

    it('should calculate appropriate initial camera position for horizontal orientation', () => {
      const position = calculateInitialCameraPosition(horizontalMachineSettings, 'horizontal');
      
      // Initial position should be a good overview angle
      const maxDimension = 300; // Y axis range
      const distance = maxDimension * 1.5;
      
      expect(position.x).toBeCloseTo(0 - distance * 0.7);
      expect(position.y).toBeCloseTo(150 + distance * 0.8);
      expect(position.z).toBeCloseTo(0 - distance * 0.3);
    });

    it('should calculate appropriate initial camera position for vertical orientation', () => {
      const position = calculateInitialCameraPosition(horizontalMachineSettings, 'vertical');
      
      // Initial position should be a good overview angle for vertical orientation
      const maxDimension = 300; // Y axis range
      const distance = maxDimension * 1.5;
      
      expect(position.x).toBeCloseTo(0 + distance * 0.7);
      expect(position.y).toBeCloseTo(0 - distance * 0.7);
      expect(position.z).toBeCloseTo(0 + distance * 0.7);
    });
  });

  describe('Camera Distance Calculations', () => {
    it('should calculate appropriate viewing distance based on workspace size', () => {
      const distance = Math.max(mockWorkspaceBounds.width, mockWorkspaceBounds.depth, mockWorkspaceBounds.height) * 1.5;
      expect(distance).toBe(450); // 300 * 1.5
    });

    it('should maintain consistent distance for all orthogonal views', () => {
      const views = ['front', 'back', 'left', 'right', 'top', 'bottom'] as const;
      
      views.forEach(view => {
        const position = calculateCameraPosition(
          view,
          mockWorkspaceBounds,
          horizontalMachineSettings,
          mockTarget,
          'horizontal'
        );
        
        // For orthogonal views, the position should be valid and at a reasonable distance
        // from the workspace bounds
        expect(position.x).toBeTypeOf('number');
        expect(position.y).toBeTypeOf('number');
        expect(position.z).toBeTypeOf('number');
        
        // Calculate distance from target for verification
        const actualDistance = Math.sqrt(
          Math.pow(position.x - mockTarget.x, 2) +
          Math.pow(position.y - mockTarget.y, 2) +
          Math.pow(position.z - mockTarget.z, 2)
        );
        
        // Distance should be reasonable (greater than workspace size)
        expect(actualDistance).toBeGreaterThan(300);
        expect(actualDistance).toBeLessThan(1000);
      });
    });

    it('should maintain appropriate distance for isometric views', () => {
      const isoViews = ['iso1', 'iso2'] as const;
      
      isoViews.forEach(view => {
        const position = calculateCameraPosition(
          view,
          mockWorkspaceBounds,
          horizontalMachineSettings,
          mockTarget,
          'horizontal'
        );
        
        // Calculate distance from target
        const actualDistance = Math.sqrt(
          Math.pow(position.x - mockTarget.x, 2) +
          Math.pow(position.y - mockTarget.y, 2) +
          Math.pow(position.z - mockTarget.z, 2)
        );
        
        // Isometric views should be at a reasonable distance
        expect(actualDistance).toBeGreaterThan(400);
        expect(actualDistance).toBeLessThan(1000);
      });
    });
  });

  describe('Camera Face Direction Validation', () => {
    it('should have each face pointing toward the workspace center', () => {
      const orthogonalViews = ['front', 'back', 'left', 'right', 'top', 'bottom'] as const;
      
      orthogonalViews.forEach(view => {
        const position = calculateCameraPosition(
          view,
          mockWorkspaceBounds,
          horizontalMachineSettings,
          mockTarget,
          'horizontal'
        );
        
        // Calculate direction vector from camera to target
        const direction = {
          x: mockTarget.x - position.x,
          y: mockTarget.y - position.y,
          z: mockTarget.z - position.z
        };
        
        // Normalize direction
        const length = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
        const normalizedDirection = {
          x: direction.x / length,
          y: direction.y / length,
          z: direction.z / length
        };
        
        // Verify the direction makes sense for each view
        switch (view) {
          case 'front':
            expect(normalizedDirection.x).toBeCloseTo(1, 1); // Looking in +X direction
            expect(Math.abs(normalizedDirection.y)).toBeLessThan(0.1);
            expect(Math.abs(normalizedDirection.z)).toBeLessThan(0.1);
            break;
          case 'back':
            expect(normalizedDirection.x).toBeCloseTo(-1, 1); // Looking in -X direction
            expect(Math.abs(normalizedDirection.y)).toBeLessThan(0.1);
            expect(Math.abs(normalizedDirection.z)).toBeLessThan(0.1);
            break;
          case 'right':
            expect(normalizedDirection.y).toBeCloseTo(-1, 1); // Looking in -Y direction
            expect(Math.abs(normalizedDirection.x)).toBeLessThan(0.1);
            expect(Math.abs(normalizedDirection.z)).toBeLessThan(0.1);
            break;
          case 'left':
            expect(normalizedDirection.y).toBeCloseTo(1, 1); // Looking in +Y direction
            expect(Math.abs(normalizedDirection.x)).toBeLessThan(0.1);
            expect(Math.abs(normalizedDirection.z)).toBeLessThan(0.1);
            break;
          case 'top':
            expect(normalizedDirection.z).toBeCloseTo(1, 1); // Looking in +Z direction
            expect(Math.abs(normalizedDirection.x)).toBeLessThan(0.1);
            expect(Math.abs(normalizedDirection.y)).toBeLessThan(0.1);
            break;
          case 'bottom':
            expect(normalizedDirection.z).toBeCloseTo(-1, 1); // Looking in -Z direction
            expect(Math.abs(normalizedDirection.x)).toBeLessThan(0.1);
            expect(Math.abs(normalizedDirection.y)).toBeLessThan(0.1);
            break;
        }
      });
    });

    it('should have isometric views looking diagonally toward workspace', () => {
      const isoViews = ['iso1', 'iso2'] as const;
      
      isoViews.forEach(view => {
        const position = calculateCameraPosition(
          view,
          mockWorkspaceBounds,
          horizontalMachineSettings,
          mockTarget,
          'horizontal'
        );
        
        // Calculate direction vector from camera to target
        const direction = {
          x: mockTarget.x - position.x,
          y: mockTarget.y - position.y,
          z: mockTarget.z - position.z
        };
        
        // Normalize direction
        const length = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
        const normalizedDirection = {
          x: direction.x / length,
          y: direction.y / length,
          z: direction.z / length
        };
        
        // Isometric views should have significant components in multiple axes
        const componentCount = [
          Math.abs(normalizedDirection.x) > 0.3,
          Math.abs(normalizedDirection.y) > 0.3,
          Math.abs(normalizedDirection.z) > 0.3
        ].filter(Boolean).length;
        
        expect(componentCount).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle unknown preset by falling back to home', () => {
      const position = calculateCameraPosition(
        'unknown' as any,
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        'horizontal'
      );
      
      const homePosition = calculateCameraPosition(
        'home',
        mockWorkspaceBounds,
        horizontalMachineSettings,
        mockTarget,
        'horizontal'
      );
      
      expect(position).toEqual(homePosition);
    });

    it('should handle extreme workspace dimensions', () => {
      const extremeBounds: WorkspaceBounds = {
        ...mockWorkspaceBounds,
        width: 10000,
        depth: 5,
        height: 5
      };
      
      const position = calculateCameraPosition(
        'front',
        extremeBounds,
        horizontalMachineSettings,
        mockTarget,
        'horizontal'
      );
      
      // Should scale distance appropriately with the largest dimension
      expect(Math.abs(position.x)).toBeGreaterThan(15000); // 10000 * 1.5
    });

    it('should handle zero or negative workspace dimensions gracefully', () => {
      const zeroBounds: WorkspaceBounds = {
        ...mockWorkspaceBounds,
        width: 0,
        depth: 0,
        height: 0
      };
      
      expect(() => {
        calculateCameraPosition(
          'front',
          zeroBounds,
          horizontalMachineSettings,
          mockTarget,
          'horizontal'
        );
      }).not.toThrow();
    });
  });
});
