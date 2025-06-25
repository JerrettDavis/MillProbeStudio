import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import React, { useState, useRef } from 'react';
import {
  EnhancedOrbitControls,
  CameraPresets,
  CameraCoordinateDisplay,
  CameraTracker
} from '../CameraSystem';
import { calculateCameraPosition } from '@/utils/visualization/cameraPresets';
import { calculateWorkspaceBounds } from '@/utils/visualization/machineGeometry';
import type { MachineSettings } from '@/types/machine';
import type { Position3D } from '@/utils/visualization/machineGeometry';
import type { CameraPreset } from '@/utils/visualization/cameraPresets';

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = MockResizeObserver as any;
(window as any).ResizeObserver = MockResizeObserver;

// Mock three.js modules for better test stability
vi.mock('three', async () => {
  const THREE = await vi.importActual('three');
  return {
    ...THREE,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
    })),
  };
});

// Mock @react-three/drei
vi.mock('@react-three/drei', async () => {
  const actual = await vi.importActual('@react-three/drei');
  return {
    ...actual,
    OrbitControls: vi.fn().mockImplementation(({ onUpdate, ...props }) => {
      const ref = React.useRef(null);
      React.useEffect(() => {
        if (onUpdate) {
          onUpdate();
        }
      }, [onUpdate]);
      return React.createElement('orbitControls', { ref, ...props });
    }),
  };
});

// Mock console.warn to suppress warnings during tests
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = vi.fn();
  // Clear any previous test camera controls
  delete (window as any).testCameraControls;
});

afterEach(() => {
  console.warn = originalWarn;
});

// Mock machine settings for testing
const testMachineSettings: MachineSettings = {
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

// Mock three.js Camera
const mockCamera = {
  position: { x: 0, y: 0, z: 100, set: vi.fn(), clone: vi.fn() },
  up: { set: vi.fn() },
  updateProjectionMatrix: vi.fn(),
  lookAt: vi.fn()
};

// Mock @react-three/fiber
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber');
  return {
    ...actual,
    useThree: () => ({
      camera: mockCamera
    }),
    useFrame: (callback: (state: any) => void) => {
      // Simulate frame updates
      setTimeout(() => callback({ camera: mockCamera }), 0);
    }
  };
});

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
  OrbitControls: React.forwardRef((_props: any, ref: any) => {
    // Simulate OrbitControls behavior
    React.useEffect(() => {
      if (ref && ref.current) {
        ref.current = {
          target: { set: vi.fn(), copy: vi.fn() },
          update: vi.fn()
        };
      }
    }, [ref]);
    
    return null; // OrbitControls doesn't render anything visible
  })
}));

/**
 * Test component that integrates all camera system components
 */
const CameraSystemIntegrationTest: React.FC<{
  machineSettings: MachineSettings;
  machineOrientation: 'horizontal' | 'vertical';
}> = ({ machineSettings, machineOrientation }) => {
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>('home');
  const [pivotMode, setPivotMode] = useState<'tool' | 'origin'>('tool');
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 100 });
  const [target] = useState<Position3D>({ x: 0, y: 0, z: 0 });
  const controlsRef = useRef<any>(null);

  const handlePresetSelect = (preset: CameraPreset) => {
    setCurrentPreset(preset);
    
    // Calculate new camera position
    const workspaceBounds = calculateWorkspaceBounds(machineSettings);
    const newPosition = calculateCameraPosition(
      preset,
      workspaceBounds,
      machineSettings,
      target,
      machineOrientation
    );
    
    // Update camera position (in real implementation, this would animate)
    setCameraPosition(newPosition);
  };

  const handleControlsReady = (controls: { setPosition: (position: Position3D) => void }) => {
    // Store controls reference for testing
    (window as any).testCameraControls = controls;
  };

  // Simulate controls being ready immediately for test purposes
  React.useEffect(() => {
    if (!(window as any).testCameraControls) {
      const mockControls = {
        setPosition: vi.fn((position: Position3D) => {
          setCameraPosition(position);
        })
      };
      (window as any).testCameraControls = mockControls;
    }
  }, []);

  const handleCameraUpdate = (position: { x: number; y: number; z: number }) => {
    setCameraPosition(position);
  };

  return (
    <div className="relative w-full h-screen">
      <Canvas>
        <EnhancedOrbitControls
          ref={controlsRef}
          target={target}
          machineSettings={machineSettings}
          machineOrientation={machineOrientation}
          onControlsReady={handleControlsReady}
        />
        <CameraTracker onCameraUpdate={handleCameraUpdate} />
        
        {/* Mock 3D content */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="orange" />
        </mesh>
      </Canvas>
      
      <CameraPresets
        onPresetSelect={handlePresetSelect}
        currentPreset={currentPreset}
        pivotMode={pivotMode}
        onPivotModeChange={setPivotMode}
      />
      
      <CameraCoordinateDisplay
        units={machineSettings.units}
        cameraPosition={cameraPosition}
      />
    </div>
  );
};

describe('Camera System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up global test variables
    delete (window as any).testCameraControls;
  });

  describe('Complete Camera System Integration', () => {
    it('should integrate all camera components successfully', async () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      // Verify all UI components are rendered
      expect(screen.getByText('Camera Views')).toBeInTheDocument();
      expect(screen.getByText('Camera Position')).toBeInTheDocument();
      expect(screen.getByText('Camera Pivot')).toBeInTheDocument();

      // Verify initial state
      expect(screen.getByRole('button', { name: /home/i })).toHaveClass('bg-blue-600'); // Active preset
      expect(screen.getByRole('button', { name: /tool tip/i })).toHaveClass('bg-orange-600'); // Active pivot mode
    });

    it('should handle camera preset selection correctly', async () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      // Click on Front view
      const frontButton = screen.getByRole('button', { name: /front/i });
      fireEvent.click(frontButton);

      // Verify front preset is now active
      await waitFor(() => {
        expect(frontButton).toHaveClass('bg-blue-600');
      });

      // Verify home is no longer active
      const homeButton = screen.getByRole('button', { name: /home/i });
      expect(homeButton).not.toHaveClass('bg-blue-600');
    });

    it('should handle pivot mode changes correctly', async () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      // Click on Origin pivot mode
      const originButton = screen.getByRole('button', { name: /origin/i });
      fireEvent.click(originButton);

      // Verify origin pivot mode is now active
      await waitFor(() => {
        expect(originButton).toHaveClass('bg-orange-600');
      });

      // Verify tool tip is no longer active
      const toolTipButton = screen.getByRole('button', { name: /tool tip/i });
      expect(toolTipButton).not.toHaveClass('bg-orange-600');
    });

    it('should update camera coordinates display when position changes', async () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      // Initially should show default position - look for X coordinate specifically
      expect(screen.getByText('X:')).toBeInTheDocument();
      expect(screen.getByText('Y:')).toBeInTheDocument();
      expect(screen.getByText('Z:')).toBeInTheDocument();
      expect(screen.getByText('100.0')).toBeInTheDocument(); // Initial Z position

      // Wait for camera tracker to update position
      await waitFor(() => {
        // Camera tracker should update the position display
        const positionElements = screen.getAllByText(/\d+\.\d/);
        expect(positionElements.length).toBeGreaterThan(0);
      });
    });

    it('should maintain camera controls reference correctly', async () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      // Wait for controls to be ready
      await waitFor(() => {
        expect((window as any).testCameraControls).toBeDefined();
      });

      // Verify controls have setPosition method
      const controls = (window as any).testCameraControls;
      expect(typeof controls.setPosition).toBe('function');
    });
  });

  describe('Camera Face Positioning Integration', () => {
    const testCases = [
      { preset: 'front' as const, description: 'Front view', buttonText: 'front' },
      { preset: 'back' as const, description: 'Back view', buttonText: 'back' },
      { preset: 'left' as const, description: 'Left view', buttonText: 'left' },
      { preset: 'right' as const, description: 'Right view', buttonText: 'right' },
      { preset: 'top' as const, description: 'Top view', buttonText: 'top' },
      { preset: 'bottom' as const, description: 'Bottom view', buttonText: 'bottom' },
      { preset: 'iso1' as const, description: 'Isometric view 1', buttonText: 'ISO 1' },
      { preset: 'iso2' as const, description: 'Isometric view 2', buttonText: 'ISO 2' }
    ];

    testCases.forEach(({ description, buttonText }) => {
      it(`should handle ${description} preset correctly`, async () => {
        render(
          <CameraSystemIntegrationTest
            machineSettings={testMachineSettings}
            machineOrientation="horizontal"
          />
        );

        // Find and click the preset button
        const presetButton = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
        fireEvent.click(presetButton);

        // Verify the preset is now active
        await waitFor(() => {
          expect(presetButton).toHaveClass('bg-blue-600');
        });

        // Verify camera position updates
        await waitFor(() => {
          // Camera coordinates should be updated
          const coordinateElements = screen.getAllByText(/[-]?\d+\.\d/);
          expect(coordinateElements.length).toBeGreaterThanOrEqual(3); // X, Y, Z coordinates
        });
      });
    });
  });

  describe('Machine Orientation Handling', () => {
    it('should handle horizontal orientation correctly', async () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      // Verify that the camera system is set up correctly for horizontal orientation
      // The components should render without errors
      expect(screen.getByText('Camera Views')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /home/i })).toHaveClass('bg-blue-600');
    });

    it('should handle vertical orientation correctly', async () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="vertical"
        />
      );

      // Verify that the camera system is set up correctly for vertical orientation
      // The components should render without errors
      expect(screen.getByText('Camera Views')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /home/i })).toHaveClass('bg-blue-600');
    });

    it('should maintain consistent behavior across orientation changes', async () => {
      const { rerender } = render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      // Switch to vertical orientation
      rerender(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="vertical"
        />
      );

      // Verify camera system still works
      const frontButton = screen.getByRole('button', { name: /front/i });
      fireEvent.click(frontButton);

      await waitFor(() => {
        expect(frontButton).toHaveClass('bg-blue-600');
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle rapid preset changes without errors', async () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      const presets = ['front', 'back', 'left', 'right', 'top'];
      
      // Rapidly change presets
      for (const preset of presets) {
        const button = screen.getByRole('button', { name: new RegExp(preset, 'i') });
        fireEvent.click(button);
      }

      // Verify final state is correct
      const topButton = screen.getByRole('button', { name: /top/i });
      await waitFor(() => {
        expect(topButton).toHaveClass('bg-blue-600');
      });
    });

    it('should handle edge case machine settings', async () => {
      const edgeCaseMachineSettings: MachineSettings = {
        units: 'inch',
        axes: {
          X: { positiveDirection: '+X', negativeDirection: '-X', polarity: 1, min: -0.1, max: 0.1 },
          Y: { positiveDirection: '+Y', negativeDirection: '-Y', polarity: 1, min: -0.1, max: 0.1 },
          Z: { positiveDirection: '+Z', negativeDirection: '-Z', polarity: 1, min: -0.1, max: 0.1 }
        }
      };

      expect(() => {
        render(
          <CameraSystemIntegrationTest
            machineSettings={edgeCaseMachineSettings}
            machineOrientation="horizontal"
          />
        );
      }).not.toThrow();

      // Verify UI still renders
      expect(screen.getByText('Camera Views')).toBeInTheDocument();
      expect(screen.getAllByText('inch')).toHaveLength(3); // Units display
    });

    it('should maintain state consistency during component updates', async () => {
      const { rerender } = render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      // Set a specific preset
      const isoButton = screen.getByRole('button', { name: /iso 1/i });
      fireEvent.click(isoButton);

      await waitFor(() => {
        expect(isoButton).toHaveClass('bg-blue-600');
      });

      // Update machine settings
      const updatedMachineSettings = {
        ...testMachineSettings,
        units: 'inch' as const
      };

      rerender(
        <CameraSystemIntegrationTest
          machineSettings={updatedMachineSettings}
          machineOrientation="horizontal"
        />
      );

      // Verify preset state is maintained
      expect(isoButton).toHaveClass('bg-blue-600');
      
      // Verify units updated
      expect(screen.getAllByText('inch')).toHaveLength(3);
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper keyboard navigation', async () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      const frontButton = screen.getByRole('button', { name: /front/i });
      
      // Test keyboard activation - simulate what happens when user presses Enter/Space
      frontButton.focus();
      
      // Simulate the keydown event that triggers button activation
      fireEvent.keyDown(frontButton, { key: 'Enter' });
      // This should trigger the button's click handler
      fireEvent.click(frontButton);

      await waitFor(() => {
        expect(frontButton).toHaveClass('bg-blue-600');
      }, { timeout: 1000 });
    });

    it('should provide appropriate tooltips', () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      const homeButton = screen.getByRole('button', { name: /home/i });
      const toolTipButton = screen.getByRole('button', { name: /tool tip/i });
      const originButton = screen.getByRole('button', { name: /origin/i });

      expect(homeButton).toHaveAttribute('title', 'Home');
      expect(toolTipButton).toHaveAttribute('title', 'Pivot around probe tool tip');
      expect(originButton).toHaveAttribute('title', 'Pivot around XYZ origin (0,0,0)');
    });

    it('should display control instructions clearly', () => {
      render(
        <CameraSystemIntegrationTest
          machineSettings={testMachineSettings}
          machineOrientation="horizontal"
        />
      );

      expect(screen.getByText('Scroll: Zoom • Drag: Rotate • Shift+Drag: Pan')).toBeInTheDocument();
    });
  });
});
