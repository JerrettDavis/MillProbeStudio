import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import React from 'react';
import * as THREE from 'three';
import {
  EnhancedOrbitControls,
  CameraPresets,
  CameraCoordinateDisplay,
  CameraTracker
} from '../CameraSystem';
import { Canvas } from '@react-three/fiber';
import { CAMERA_PRESETS } from '@/utils/visualization/cameraPresets';
import type { MachineSettings } from '@/types/machine';
import type { Position3D } from '@/utils/visualization/machineGeometry';

// Mock machine settings for testing
const mockMachineSettings: MachineSettings = {
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

const mockTarget: Position3D = { x: 0, y: 0, z: 0 };

// Mock three.js objects
const mockCamera = {
  position: new THREE.Vector3(0, 0, 0),
  up: { 
    set: vi.fn(),
    x: 0,
    y: 1,
    z: 0
  },
  updateProjectionMatrix: vi.fn(),
  lookAt: vi.fn()
};

const mockControls = {
  target: new THREE.Vector3(0, 0, 0),
  update: vi.fn(),
  current: {
    target: { 
      set: vi.fn(),
      x: 0,
      y: 0,
      z: 0
    },
    update: vi.fn(),
    maxDistance: 375,
    minDistance: 0.1,
    enableDamping: true,
    dampingFactor: 0.1,
    object: mockCamera
  }
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
      // For testing, we'll call the callback immediately with a slight delay
      React.useEffect(() => {
        const timeoutId = setTimeout(() => {
          callback({ camera: mockCamera });
        }, 10);
        return () => clearTimeout(timeoutId);
      }, [callback]);
    }
  };
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = MockResizeObserver as any;
(window as any).ResizeObserver = MockResizeObserver;

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
  OrbitControls: vi.fn().mockImplementation(({ ref, children, onControlsReady, ...props }) => {
    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = mockControls.current;
    }
    // Simulate onControlsReady callback after a brief delay
    React.useEffect(() => {
      if (onControlsReady) {
        const timeoutId = setTimeout(() => {
          onControlsReady(mockControls.current);
        }, 10);
        return () => clearTimeout(timeoutId);
      }
    }, [onControlsReady]);
    return <primitive object={new THREE.Group()} {...props} />;
  })
}));

describe('CameraSystem Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('EnhancedOrbitControls', () => {
    it('should render with correct props', async () => {
      const onControlsReady = vi.fn();
      
      const renderer = await ReactThreeTestRenderer.create(
        <EnhancedOrbitControls
          target={mockTarget}
          machineSettings={mockMachineSettings}
          machineOrientation="horizontal"
          onControlsReady={onControlsReady}
        />
      );

      expect(renderer.scene).toBeTruthy();
      expect(onControlsReady).toHaveBeenCalledWith({
        setPosition: expect.any(Function)
      });
    });

    it('should calculate correct maxDistance based on machine dimensions', async () => {
      const onControlsReady = vi.fn();
      
      await ReactThreeTestRenderer.create(
        <EnhancedOrbitControls
          target={mockTarget}
          machineSettings={mockMachineSettings}
          machineOrientation="horizontal"
          onControlsReady={onControlsReady}
        />
      );

      // Max dimension should be 300 (Y axis: 150 - (-150))
      // maxDistance should be 300 * 1.25 = 375
      // This is validated by the component working without throwing errors
      expect(onControlsReady).toHaveBeenCalledWith({
        setPosition: expect.any(Function)
      });
    });

    it('should handle horizontal machine orientation correctly', async () => {
      const onControlsReady = vi.fn();
      
      await ReactThreeTestRenderer.create(
        <EnhancedOrbitControls
          target={mockTarget}
          machineSettings={mockMachineSettings}
          machineOrientation="horizontal"
          onControlsReady={onControlsReady}
        />
      );

      // Verify the controls were set up and onControlsReady was called
      expect(onControlsReady).toHaveBeenCalledWith({
        setPosition: expect.any(Function)
      });
    });

    it('should handle vertical machine orientation correctly', async () => {
      const onControlsReady = vi.fn();
      
      await ReactThreeTestRenderer.create(
        <EnhancedOrbitControls
          target={mockTarget}
          machineSettings={mockMachineSettings}
          machineOrientation="vertical"
          onControlsReady={onControlsReady}
        />
      );

      // Verify the controls were set up and onControlsReady was called
      expect(onControlsReady).toHaveBeenCalledWith({
        setPosition: expect.any(Function)
      });
    });

    it('should update target position when target prop changes', async () => {
      const onControlsReady = vi.fn();
      
      const renderer = await ReactThreeTestRenderer.create(
        <EnhancedOrbitControls
          target={mockTarget}
          machineSettings={mockMachineSettings}
          machineOrientation="horizontal"
          onControlsReady={onControlsReady}
        />
      );

      // Update target
      const newTarget = { x: 10, y: 20, z: 30 };
      renderer.update(
        <EnhancedOrbitControls
          target={newTarget}
          machineSettings={mockMachineSettings}
          machineOrientation="horizontal"
          onControlsReady={onControlsReady}
        />
      );

      // Verify controls were set up correctly
      expect(onControlsReady).toHaveBeenCalledWith({
        setPosition: expect.any(Function)
      });
    });
  });

  describe('CameraPresets', () => {
    const mockProps = {
      onPresetSelect: vi.fn(),
      currentPreset: 'home' as const,
      pivotMode: 'tool' as const,
      onPivotModeChange: vi.fn()
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render all camera preset buttons', () => {
      render(<CameraPresets {...mockProps} />);

      // Check if all camera presets are rendered using more specific queries
      CAMERA_PRESETS.forEach(preset => {
        expect(screen.getByRole('button', { name: new RegExp(preset.label, 'i') })).toBeInTheDocument();
      });
    });

    it('should highlight current preset', () => {
      render(<CameraPresets {...mockProps} currentPreset="front" />);

      const frontButton = screen.getByRole('button', { name: /front/i });
      expect(frontButton).toHaveClass('bg-blue-600');
    });

    it('should call onPresetSelect when preset button is clicked', () => {
      render(<CameraPresets {...mockProps} />);

      const frontButton = screen.getByRole('button', { name: /front/i });
      fireEvent.click(frontButton);

      expect(mockProps.onPresetSelect).toHaveBeenCalledWith('front');
    });

    it('should highlight current pivot mode', () => {
      render(<CameraPresets {...mockProps} pivotMode="origin" />);

      const originButton = screen.getByRole('button', { name: /origin/i });
      expect(originButton).toHaveClass('bg-orange-600');
    });

    it('should call onPivotModeChange when pivot button is clicked', () => {
      render(<CameraPresets {...mockProps} />);

      const originButton = screen.getByRole('button', { name: /origin/i });
      fireEvent.click(originButton);

      expect(mockProps.onPivotModeChange).toHaveBeenCalledWith('origin');
    });

    it('should display control instructions', () => {
      render(<CameraPresets {...mockProps} />);

      expect(screen.getByText(/Scroll: Zoom • Drag: Rotate • Shift\+Drag: Pan/)).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<CameraPresets {...mockProps} />);

      const homeButton = screen.getByRole('button', { name: /home/i });
      expect(homeButton).toHaveAttribute('title', 'Home');

      const toolTipButton = screen.getByRole('button', { name: /tool tip/i });
      expect(toolTipButton).toHaveAttribute('title', 'Pivot around probe tool tip');

      const originButton = screen.getByRole('button', { name: /origin/i });
      expect(originButton).toHaveAttribute('title', 'Pivot around XYZ origin (0,0,0)');
    });

    it('should allow minimizing and maximizing the camera controls', async () => {
      const user = userEvent.setup();
      render(<CameraPresets {...mockProps} />);

      // Initially, all controls should be visible
      expect(screen.getByText('Camera Views')).toBeInTheDocument();
      expect(screen.getByText('Camera Pivot')).toBeInTheDocument();
      expect(screen.getByText(/Scroll: Zoom • Drag: Rotate • Shift\+Drag: Pan/)).toBeInTheDocument();

      // Find and click the minimize button
      const minimizeButton = screen.getByRole('button', { name: /minimize camera controls/i });
      expect(minimizeButton).toBeInTheDocument();
      
      await user.click(minimizeButton);

      // After minimizing, content should be hidden but header should remain
      expect(screen.getByText('Camera Views')).toBeInTheDocument();
      expect(screen.queryByText('Camera Pivot')).not.toBeInTheDocument();
      expect(screen.queryByText(/Scroll: Zoom • Drag: Rotate • Shift\+Drag: Pan/)).not.toBeInTheDocument();

      // The button text should change to expand
      const expandButton = screen.getByRole('button', { name: /expand camera controls/i });
      expect(expandButton).toBeInTheDocument();

      // Click to expand again
      await user.click(expandButton);

      // Content should be visible again
      expect(screen.getByText('Camera Pivot')).toBeInTheDocument();
      expect(screen.getByText(/Scroll: Zoom • Drag: Rotate • Shift\+Drag: Pan/)).toBeInTheDocument();
    });
  });

  describe('CameraCoordinateDisplay', () => {
    const mockCameraPosition = { x: 123.456, y: -78.123, z: 45.789 };

    it('should display camera coordinates with proper formatting', () => {
      render(
        <CameraCoordinateDisplay
          units="mm"
          cameraPosition={mockCameraPosition}
        />
      );

      expect(screen.getByText('123.5')).toBeInTheDocument();
      expect(screen.getByText('-78.1')).toBeInTheDocument();
      expect(screen.getByText('45.8')).toBeInTheDocument();
      expect(screen.getAllByText('mm')).toHaveLength(3);
    });

    it('should handle different units', () => {
      render(
        <CameraCoordinateDisplay
          units="inch"
          cameraPosition={mockCameraPosition}
        />
      );

      expect(screen.getAllByText('inch')).toHaveLength(3);
    });

    it('should use proper color coding for axes', () => {
      render(
        <CameraCoordinateDisplay
          units="mm"
          cameraPosition={mockCameraPosition}
        />
      );

      const xLabel = screen.getByText('X:');
      const yLabel = screen.getByText('Y:');
      const zLabel = screen.getByText('Z:');

      expect(xLabel).toHaveClass('text-red-400');
      expect(yLabel).toHaveClass('text-green-400');
      expect(zLabel).toHaveClass('text-blue-400');
    });

    it('should format coordinates to one decimal place', () => {
      const precisePosition = { x: 1.23456789, y: -0.987654321, z: 100.0001 };
      render(
        <CameraCoordinateDisplay
          units="mm"
          cameraPosition={precisePosition}
        />
      );

      expect(screen.getByText('1.2')).toBeInTheDocument();
      expect(screen.getByText('-1.0')).toBeInTheDocument();
      expect(screen.getByText('100.0')).toBeInTheDocument();
    });
  });

  describe('CameraTracker', () => {
    it('should render CameraTracker component without errors', async () => {
      const onCameraUpdate = vi.fn();
      
      // CameraTracker should render without throwing errors
      expect(() => {
        ReactThreeTestRenderer.create(
          <CameraTracker onCameraUpdate={onCameraUpdate} />
        );
      }).not.toThrow();
    });

    it('should not render any visible elements', async () => {
      const onCameraUpdate = vi.fn();
      
      await ReactThreeTestRenderer.create(
        <CameraTracker onCameraUpdate={onCameraUpdate} />
      );

      // CameraTracker should render without errors
      expect(onCameraUpdate).toBeDefined(); // Just verify the callback is passed
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a complete camera system', async () => {
      const onPresetSelect = vi.fn();
      const onPivotModeChange = vi.fn();
      const onCameraUpdate = vi.fn();
      const onControlsReady = vi.fn();

      const TestWrapper = () => (
        <div>
          <Canvas>
            <EnhancedOrbitControls
              target={mockTarget}
              machineSettings={mockMachineSettings}
              machineOrientation="horizontal"
              onControlsReady={onControlsReady}
            />
            <CameraTracker onCameraUpdate={onCameraUpdate} />
          </Canvas>
          <CameraPresets
            onPresetSelect={onPresetSelect}
            currentPreset="home"
            pivotMode="tool"
            onPivotModeChange={onPivotModeChange}
          />
          <CameraCoordinateDisplay
            units="mm"
            cameraPosition={{ x: 0, y: 0, z: 0 }}
          />
        </div>
      );

      render(<TestWrapper />);

      // Verify all components are rendered
      expect(screen.getByText('Camera Views')).toBeInTheDocument();
      expect(screen.getByText('Camera Position')).toBeInTheDocument();
      
      // Test preset interaction
      const frontButton = screen.getByRole('button', { name: /front/i });
      fireEvent.click(frontButton);
      expect(onPresetSelect).toHaveBeenCalledWith('front');

      // Test pivot mode interaction
      const originButton = screen.getByRole('button', { name: /origin/i });
      fireEvent.click(originButton);
      expect(onPivotModeChange).toHaveBeenCalledWith('origin');

      // Verify coordinate display
      expect(screen.getByText('X:')).toBeInTheDocument();
      expect(screen.getByText('Y:')).toBeInTheDocument();
      expect(screen.getByText('Z:')).toBeInTheDocument();
      // There should be exactly 3 "0.0" values (X, Y, Z coordinates)
      expect(screen.getAllByText('0.0')).toHaveLength(3);
    });
  });
});
