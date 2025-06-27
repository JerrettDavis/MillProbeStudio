import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCameraControls } from '../useCameraControls';
import type { MachineSettings } from '@/types/machine';
import type { WorkspaceBounds, Position3D } from '@/utils/visualization/machineGeometry';

// Mock @react-three/fiber
const mockCamera = {
  position: { x: 0, y: 0, z: 0 },
  lookAt: vi.fn(),
  updateProjectionMatrix: vi.fn()
};

const mockThree = {
  camera: mockCamera,
  scene: {},
  gl: {},
  raycaster: {},
  mouse: {},
  clock: {},
  controls: null
};

vi.mock('@react-three/fiber', () => ({
  useThree: () => mockThree
}));

// Mock the cameraPresets utilities
vi.mock('@/utils/visualization/cameraPresets', () => ({
  calculateCameraPosition: vi.fn(() => ({ x: 10, y: 10, z: 10 })),
  animateCameraToPosition: vi.fn((_camera, _position, _target, _controls, _duration, callback) => {
    // Simulate async animation
    setTimeout(() => {
      callback?.();
    }, 50);
  })
}));

const mockMachineSettings: MachineSettings = {
  units: 'mm',
  axes: {
    X: { positiveDirection: '+X', negativeDirection: '-X', polarity: 1, min: -100, max: 100 },
    Y: { positiveDirection: '+Y', negativeDirection: '-Y', polarity: 1, min: -100, max: 100 },
    Z: { positiveDirection: '+Z', negativeDirection: '-Z', polarity: -1, min: 0, max: 75 }
  },
  machineOrientation: 'horizontal',
  stageDimensions: [12.7, 304.8, 63.5]
};

const mockWorkspaceBounds: WorkspaceBounds = {
  width: 100,
  depth: 100,
  height: 25,
  centerX: 0,
  centerY: 0,
  centerZ: 12.5,
  minX: -50,
  maxX: 50,
  minY: -50,
  maxY: 50,
  minZ: 0,
  maxZ: 25
};

const mockTarget: Position3D = { x: 0, y: 0, z: 0 };

describe('useCameraControls', () => {
  const mockOnPresetChange = vi.fn();

  const defaultProps = {
    target: mockTarget,
    workspaceBounds: mockWorkspaceBounds,
    machineSettings: mockMachineSettings,
    machineOrientation: 'horizontal' as const,
    onPresetChange: mockOnPresetChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCameraControls(defaultProps));

    expect(result.current.currentPreset).toBe('home');
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.controlsRef).toBeDefined();
    expect(typeof result.current.setPreset).toBe('function');
  });

  it('should initialize with home preset for vertical orientation', () => {
    const { result } = renderHook(() =>
      useCameraControls({
        ...defaultProps,
        machineOrientation: 'vertical'
      })
    );

    expect(result.current.currentPreset).toBe('home');
  });

  it('should handle preset change', async () => {
    const { result } = renderHook(() => useCameraControls(defaultProps));

    // Mock controlsRef to have a current value
    const mockControls = {
      object: mockCamera,
      target: { x: 0, y: 0, z: 0 },
      update: vi.fn(),
      enabled: true
    };
    result.current.controlsRef.current = mockControls as any;

    act(() => {
      result.current.setPreset('front');
    });

    expect(result.current.isAnimating).toBe(true);

    // Wait for animation to complete with longer timeout
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.currentPreset).toBe('front');
    expect(mockOnPresetChange).toHaveBeenCalledWith('front');
  });

  it('should prevent preset change while animating', () => {
    const { result } = renderHook(() => useCameraControls(defaultProps));

    const mockControls = {
      object: mockCamera,
      target: { x: 0, y: 0, z: 0 },
      update: vi.fn(),
      enabled: true
    };
    result.current.controlsRef.current = mockControls as any;

    // Start first animation
    act(() => {
      result.current.setPreset('front');
    });

    expect(result.current.isAnimating).toBe(true);

    // Try to start second animation while first is running
    act(() => {
      result.current.setPreset('back');
    });

    // Should still be the original preset since second call was ignored
    expect(result.current.currentPreset).toBe('home');
  });

  it('should not set preset when controls ref is null', () => {
    const { result } = renderHook(() => useCameraControls(defaultProps));

    // Ensure controlsRef is null
    result.current.controlsRef.current = null;

    act(() => {
      result.current.setPreset('top');
    });

    expect(result.current.currentPreset).toBe('home');
    expect(result.current.isAnimating).toBe(false);
    expect(mockOnPresetChange).not.toHaveBeenCalled();
  });

  it('should handle different camera presets', async () => {
    const { result } = renderHook(() => useCameraControls(defaultProps));

    const mockControls = {
      object: mockCamera,
      target: { x: 0, y: 0, z: 0 },
      update: vi.fn(),
      enabled: true
    };
    result.current.controlsRef.current = mockControls as any;

    const presets = ['home', 'front', 'back', 'left', 'right', 'top', 'bottom'] as const;

    for (const preset of presets) {
      act(() => {
        result.current.setPreset(preset);
      });

      expect(result.current.isAnimating).toBe(true);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.currentPreset).toBe(preset);
      expect(mockOnPresetChange).toHaveBeenCalledWith(preset);
    }
  });

  it('should work without onPresetChange callback', async () => {
    const { result } = renderHook(() =>
      useCameraControls({
        ...defaultProps,
        onPresetChange: undefined
      })
    );

    const mockControls = {
      object: mockCamera,
      target: { x: 0, y: 0, z: 0 },
      update: vi.fn(),
      enabled: true
    };
    result.current.controlsRef.current = mockControls as any;

    expect(() => {
      act(() => {
        result.current.setPreset('front');
      });
    }).not.toThrow();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.currentPreset).toBe('front');
  });

  it('should handle target position changes', () => {
    const { result, rerender } = renderHook(
      (props) => useCameraControls(props),
      { initialProps: defaultProps }
    );

    expect(result.current.currentPreset).toBe('home');

    // Change target position
    const newTarget = { x: 10, y: 10, z: 5 };
    rerender({
      ...defaultProps,
      target: newTarget
    });

    expect(result.current.currentPreset).toBe('home');
  });

  it('should handle workspace bounds changes', () => {
    const { result, rerender } = renderHook(
      (props) => useCameraControls(props),
      { initialProps: defaultProps }
    );

    const newWorkspaceBounds: WorkspaceBounds = {
      width: 200,
      depth: 200,
      height: 50,
      centerX: 0,
      centerY: 0,
      centerZ: 25,
      minX: -100,
      maxX: 100,
      minY: -100,
      maxY: 100,
      minZ: 0,
      maxZ: 50
    };

    rerender({
      ...defaultProps,
      workspaceBounds: newWorkspaceBounds
    });

    expect(result.current.currentPreset).toBe('home');
  });

  it('should handle machine settings changes', () => {
    const { result, rerender } = renderHook(
      (props) => useCameraControls(props),
      { initialProps: defaultProps }
    );

    const newMachineSettings: MachineSettings = {
      ...mockMachineSettings,
      units: 'inch'
    };

    rerender({
      ...defaultProps,
      machineSettings: newMachineSettings
    });

    expect(result.current.currentPreset).toBe('home');
  });
});
