import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisualizationState } from '../useVisualizationState';
import type { MachineSettings, ProbeSequenceSettings } from '@/types/machine';

// Mock calculateDefaultStockPosition
vi.mock('@/utils/visualization/machineGeometry', () => ({
  calculateDefaultStockPosition: vi.fn(() => [0, 0, 5])
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

const mockProbeSequenceSettings: ProbeSequenceSettings = {
  initialPosition: { X: 5, Y: 10, Z: 15 },
  dwellsBeforeProbe: 2,
  spindleSpeed: 1000,
  units: 'mm',
  endmillSize: {
    input: '1/4',
    unit: 'fraction',
    sizeInMM: 6.35
  },
  operations: []
};

describe('useVisualizationState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [state, actions] = result.current;

    expect(state.stockSize).toEqual([25, 25, 10]);
    expect(state.stockPosition).toEqual([0, 0, 5]); // From mocked calculateDefaultStockPosition
    expect(state.machineOrientation).toBe('horizontal');
    expect(state.stageDimensions).toEqual([12.7, 304.8, 63.5]);
    expect(state.probePosition).toEqual({ X: 0, Y: 0, Z: 0 });
    expect(state.currentPreset).toBe('home');
    expect(state.cameraPosition).toEqual({ x: 0, y: 0, z: 0 });
    expect(state.pivotMode).toBe('tool');

    expect(typeof actions.setStockSize).toBe('function');
    expect(typeof actions.setStockPosition).toBe('function');
    expect(typeof actions.setMachineOrientation).toBe('function');
    expect(typeof actions.setStageDimensions).toBe('function');
    expect(typeof actions.setProbePosition).toBe('function');
    expect(typeof actions.setCurrentPreset).toBe('function');
    expect(typeof actions.setCameraPosition).toBe('function');
    expect(typeof actions.setPivotMode).toBe('function');
    expect(typeof actions.resetDefaults).toBe('function');
  });

  it('should initialize with custom initial values', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings,
        initialStockSize: [50, 40, 20],
        initialStockPosition: [10, 5, 8],
        initialMachineOrientation: 'vertical',
        initialStageDimensions: [20, 400, 80]
      })
    );

    const [state] = result.current;

    expect(state.stockSize).toEqual([50, 40, 20]);
    expect(state.stockPosition).toEqual([10, 5, 8]);
    expect(state.machineOrientation).toBe('vertical');
    expect(state.stageDimensions).toEqual([20, 400, 80]);
  });

  it('should initialize with probe sequence settings', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings,
        probeSequenceSettings: mockProbeSequenceSettings
      })
    );

    const [state] = result.current;

    expect(state.probePosition).toEqual({ X: 5, Y: 10, Z: 15 });
  });

  it('should update stock size', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.setStockSize([30, 35, 15]);
    });

    const [newState] = result.current;
    expect(newState.stockSize).toEqual([30, 35, 15]);
  });

  it('should update stock position', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.setStockPosition([5, 10, 2]);
    });

    const [newState] = result.current;
    expect(newState.stockPosition).toEqual([5, 10, 2]);
  });

  it('should update machine orientation', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.setMachineOrientation('vertical');
    });

    const [newState] = result.current;
    expect(newState.machineOrientation).toBe('vertical');
  });

  it('should update stage dimensions', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.setStageDimensions([20, 400, 80]);
    });

    const [newState] = result.current;
    expect(newState.stageDimensions).toEqual([20, 400, 80]);
  });

  it('should update probe position', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.setProbePosition({ X: 15, Y: 20, Z: 25 });
    });

    const [newState] = result.current;
    expect(newState.probePosition).toEqual({ X: 15, Y: 20, Z: 25 });
  });

  it('should update current preset', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.setCurrentPreset('front');
    });

    const [newState] = result.current;
    expect(newState.currentPreset).toBe('front');
  });

  it('should update camera position', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.setCameraPosition({ x: 10, y: 20, z: 30 });
    });

    const [newState] = result.current;
    expect(newState.cameraPosition).toEqual({ x: 10, y: 20, z: 30 });
  });

  it('should update pivot mode', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    act(() => {
      actions.setPivotMode('origin');
    });

    const [newState] = result.current;
    expect(newState.pivotMode).toBe('origin');
  });

  it('should reset to defaults', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings,
        probeSequenceSettings: mockProbeSequenceSettings,
        initialStockSize: [50, 40, 20],
        initialStockPosition: [10, 5, 8],
        initialMachineOrientation: 'vertical',
        initialStageDimensions: [20, 400, 80]
      })
    );

    const [, actions] = result.current;

    // Change some values
    act(() => {
      actions.setStockSize([100, 100, 100]);
      actions.setCurrentPreset('front');
      actions.setPivotMode('origin');
      actions.setProbePosition({ X: 999, Y: 999, Z: 999 });
    });

    // Reset to defaults
    act(() => {
      actions.resetDefaults();
    });

    const [newState] = result.current;
    expect(newState.stockSize).toEqual([50, 40, 20]);
    expect(newState.stockPosition).toEqual([10, 5, 8]);
    expect(newState.machineOrientation).toBe('vertical');
    expect(newState.stageDimensions).toEqual([20, 400, 80]);
    expect(newState.probePosition).toEqual({ X: 5, Y: 10, Z: 15 });
    expect(newState.currentPreset).toBe('home');
    expect(newState.pivotMode).toBe('tool');
  });

  it('should reset to defaults without probe sequence settings', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings,
        initialStockSize: [50, 40, 20]
      })
    );

    const [, actions] = result.current;

    // Change probe position
    act(() => {
      actions.setProbePosition({ X: 999, Y: 999, Z: 999 });
    });

    // Reset to defaults
    act(() => {
      actions.resetDefaults();
    });

    const [newState] = result.current;
    expect(newState.probePosition).toEqual({ X: 0, Y: 0, Z: 0 });
  });

  it('should recalculate default stock position when dependencies change', () => {
    const { result, rerender } = renderHook(
      (props) => useVisualizationState(props),
      {
        initialProps: {
          machineSettings: mockMachineSettings,
          initialStockSize: [25, 25, 10] as [number, number, number],
          initialMachineOrientation: 'horizontal' as const
        }
      }
    );

    const [initialState] = result.current;
    expect(initialState.stockPosition).toEqual([0, 0, 5]);

    // Change props that should trigger recalculation
    rerender({
      machineSettings: {
        ...mockMachineSettings,
        units: 'inch'
      },
      initialStockSize: [30, 30, 12] as [number, number, number],
      initialMachineOrientation: 'horizontal'
    });

    const [newState] = result.current;
    // Should still use the mocked return value
    expect(newState.stockPosition).toEqual([0, 0, 5]);
  });

  it('should handle all camera presets', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    const presets = ['home', 'front', 'back', 'left', 'right', 'top', 'bottom'] as const;

    presets.forEach(preset => {
      act(() => {
        actions.setCurrentPreset(preset);
      });

      const [state] = result.current;
      expect(state.currentPreset).toBe(preset);
    });
  });

  it('should handle pivot mode changes', () => {
    const { result } = renderHook(() =>
      useVisualizationState({
        machineSettings: mockMachineSettings
      })
    );

    const [, actions] = result.current;

    // Test both pivot modes
    act(() => {
      actions.setPivotMode('origin');
    });

    let [state] = result.current;
    expect(state.pivotMode).toBe('origin');

    act(() => {
      actions.setPivotMode('tool');
    });

    [state] = result.current;
    expect(state.pivotMode).toBe('tool');
  });
});
