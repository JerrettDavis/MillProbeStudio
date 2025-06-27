import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useVisualizationWithStore,
  useProbeSequenceEditor,
  useVisualizationControls,
  useCameraControlsWithStore
} from '../hooks';

// Mock the store hooks
const mockMachineSettings = {
  units: 'mm' as const,
  axes: {
    X: { positiveDirection: '+X', negativeDirection: '-X', polarity: 1, min: -100, max: 100 },
    Y: { positiveDirection: '+Y', negativeDirection: '-Y', polarity: 1, min: -100, max: 100 },
    Z: { positiveDirection: '+Z', negativeDirection: '-Z', polarity: -1, min: 0, max: 75 }
  },
  machineOrientation: 'horizontal' as const,
  stageDimensions: [12.7, 304.8, 63.5] as [number, number, number]
};

const mockProbeSequence = {
  operations: []
};

const mockProbeSequenceSettings = {
  initialPosition: { X: 0, Y: 0, Z: 0 },
  dwellsBeforeProbe: 2,
  spindleSpeed: 1000,
  units: 'mm' as const,
  endmillSize: {
    input: '1/4',
    unit: 'fraction' as const,
    sizeInMM: 6.35
  },
  operations: []
};

const mockVisualizationSettings = {
  stockSize: [25, 25, 10] as [number, number, number],
  stockPosition: [0, 0, 5] as [number, number, number],
  showAxisLabels: true,
  showCoordinateHover: true,
  modelFile: null as File | null,
  serializedModelFile: null,
  isLoadingModelFile: false
};

const mockCameraSettings = {
  position: { x: 0, y: 0, z: 0 },
  preset: null as any,
  pivotMode: 'tool' as const
};

const mockMachineActions = {
  setMachineSettings: vi.fn(),
  updateAxisConfig: vi.fn()
};

const mockProbeActions = {
  setProbeSequence: vi.fn(),
  setProbeSequenceSettings: vi.fn(),
  addProbeOperation: vi.fn(),
  updateProbeOperation: vi.fn(),
  removeProbeOperation: vi.fn()
};

const mockVisualizationActions = {
  setVisualizationSettings: vi.fn(),
  setModelFile: vi.fn()
};

const mockCameraActions = {
  setCameraPosition: vi.fn(),
  setCameraPreset: vi.fn(),
  setCameraPivotMode: vi.fn(),
  clearCameraPreset: vi.fn()
};

// Mock all store hooks
vi.mock('../index', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      visualizationSettings: mockVisualizationSettings
    };
    return selector(state);
  }),
  useMachineSettings: () => mockMachineSettings,
  useProbeSequence: () => mockProbeSequence,
  useProbeSequenceSettings: () => mockProbeSequenceSettings,
  useMachineSettingsActions: () => mockMachineActions,
  useProbeSequenceActions: () => mockProbeActions,
  useVisualizationActions: () => mockVisualizationActions,
  useCameraSettings: () => mockCameraSettings,
  useCameraActions: () => mockCameraActions
}));

describe('Store Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useVisualizationWithStore', () => {
    it('should return visualization data and actions', () => {
      const { result } = renderHook(() => useVisualizationWithStore());

      expect(result.current.machineSettings).toBe(mockMachineSettings);
      expect(result.current.probeSequence).toBe(mockProbeSequence);
      expect(result.current.probeSequenceSettings).toBe(mockProbeSequenceSettings);
      expect(result.current.visualizationSettings).toBe(mockVisualizationSettings);
      expect(typeof result.current.setMachineSettings).toBe('function');
      expect(typeof result.current.updateAxisConfig).toBe('function');
      expect(typeof result.current.setVisualizationSettings).toBe('function');
    });

    it('should call setMachineSettings action', () => {
      const { result } = renderHook(() => useVisualizationWithStore());

      const newSettings = {
        ...mockMachineSettings,
        units: 'inch' as const,
        axes: {
          ...mockMachineSettings.axes,
          X: { ...mockMachineSettings.axes.X, polarity: 1 as const },
          Y: { ...mockMachineSettings.axes.Y, polarity: 1 as const },
          Z: { ...mockMachineSettings.axes.Z, polarity: -1 as const }
        }
      };
      act(() => {
        result.current.setMachineSettings(newSettings);
      });

      expect(mockMachineActions.setMachineSettings).toHaveBeenCalledWith(newSettings);
    });

    it('should call updateAxisConfig action', () => {
      const { result } = renderHook(() => useVisualizationWithStore());

      act(() => {
        result.current.updateAxisConfig('X', 'polarity', 1);
      });

      expect(mockMachineActions.updateAxisConfig).toHaveBeenCalledWith('X', 'polarity', 1);
    });

    it('should call setVisualizationSettings action', () => {
      const { result } = renderHook(() => useVisualizationWithStore());

      const newSettings = { stockSize: [30, 30, 15] as [number, number, number] };
      act(() => {
        result.current.setVisualizationSettings(newSettings);
      });

      expect(mockVisualizationActions.setVisualizationSettings).toHaveBeenCalledWith(newSettings);
    });
  });

  describe('useProbeSequenceEditor', () => {
    it('should return probe sequence data and actions', () => {
      const { result } = renderHook(() => useProbeSequenceEditor());

      expect(result.current.probeSequence).toBe(mockProbeSequence);
      expect(result.current.probeSequenceSettings).toBe(mockProbeSequenceSettings);
      expect(typeof result.current.setProbeSequence).toBe('function');
      expect(typeof result.current.setProbeSequenceSettings).toBe('function');
      expect(typeof result.current.addProbe).toBe('function');
      expect(typeof result.current.updateProbe).toBe('function');
      expect(typeof result.current.removeProbe).toBe('function');
    });

    it('should call addProbeOperation with template', () => {
      const { result } = renderHook(() => useProbeSequenceEditor());

      const template = { axis: 'X' as const, direction: 1 as const };
      act(() => {
        result.current.addProbe(template);
      });

      expect(mockProbeActions.addProbeOperation).toHaveBeenCalledWith(template);
    });

    it('should call addProbeOperation without template', () => {
      const { result } = renderHook(() => useProbeSequenceEditor());

      act(() => {
        result.current.addProbe();
      });

      expect(mockProbeActions.addProbeOperation).toHaveBeenCalledWith(undefined);
    });

    it('should call updateProbeOperation', () => {
      const { result } = renderHook(() => useProbeSequenceEditor());

      act(() => {
        result.current.updateProbe('probe-1', 'distance', 15);
      });

      expect(mockProbeActions.updateProbeOperation).toHaveBeenCalledWith('probe-1', 'distance', 15);
    });

    it('should call removeProbeOperation', () => {
      const { result } = renderHook(() => useProbeSequenceEditor());

      act(() => {
        result.current.removeProbe('probe-1');
      });

      expect(mockProbeActions.removeProbeOperation).toHaveBeenCalledWith('probe-1');
    });

    it('should call setProbeSequence', () => {
      const { result } = renderHook(() => useProbeSequenceEditor());

      const newSequence = { operations: [{ id: 'test' }] } as any;
      act(() => {
        result.current.setProbeSequence(newSequence);
      });

      expect(mockProbeActions.setProbeSequence).toHaveBeenCalledWith(newSequence);
    });

    it('should call setProbeSequenceSettings', () => {
      const { result } = renderHook(() => useProbeSequenceEditor());

      const newSettings = { ...mockProbeSequenceSettings, spindleSpeed: 2000 };
      act(() => {
        result.current.setProbeSequenceSettings(newSettings);
      });

      expect(mockProbeActions.setProbeSequenceSettings).toHaveBeenCalledWith(newSettings);
    });
  });

  describe('useVisualizationControls', () => {
    it('should return visualization control data and actions', () => {
      const { result } = renderHook(() => useVisualizationControls());

      expect(result.current.stockSize).toEqual([25, 25, 10]);
      expect(result.current.stockPosition).toEqual([0, 0, 5]);
      expect(result.current.probePosition).toEqual({ X: 0, Y: 0, Z: 0 });
      expect(typeof result.current.updateStockSize).toBe('function');
      expect(typeof result.current.updateStockPosition).toBe('function');
      expect(typeof result.current.updateProbePosition).toBe('function');
    });

    it('should call updateStockSize', () => {
      const { result } = renderHook(() => useVisualizationControls());

      const newSize: [number, number, number] = [30, 35, 15];
      act(() => {
        result.current.updateStockSize(newSize);
      });

      expect(mockVisualizationActions.setVisualizationSettings).toHaveBeenCalledWith({ stockSize: newSize });
    });

    it('should call updateStockPosition', () => {
      const { result } = renderHook(() => useVisualizationControls());

      const newPosition: [number, number, number] = [5, 10, 2];
      act(() => {
        result.current.updateStockPosition(newPosition);
      });

      expect(mockVisualizationActions.setVisualizationSettings).toHaveBeenCalledWith({ stockPosition: newPosition });
    });

    it('should call updateProbePosition', () => {
      const { result } = renderHook(() => useVisualizationControls());

      const newPosition = { X: 15, Y: 20, Z: 25 };
      act(() => {
        result.current.updateProbePosition(newPosition);
      });

      expect(mockProbeActions.setProbeSequenceSettings).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('useCameraControlsWithStore', () => {
    it('should return camera control data and actions', () => {
      const { result } = renderHook(() => useCameraControlsWithStore());

      expect(result.current.cameraPosition).toEqual({ x: 0, y: 0, z: 0 });
      expect(result.current.currentPreset).toBe(null);
      expect(result.current.pivotMode).toBe('tool');
      expect(result.current.machineSettings).toBe(mockMachineSettings);
      expect(typeof result.current.updateCameraPosition).toBe('function');
      expect(typeof result.current.updateCameraPreset).toBe('function');
      expect(typeof result.current.updatePivotMode).toBe('function');
      expect(typeof result.current.clearCameraPreset).toBe('function');
    });

    it('should call updateCameraPosition', () => {
      const { result } = renderHook(() => useCameraControlsWithStore());

      const newPosition = { x: 10, y: 20, z: 30 };
      act(() => {
        result.current.updateCameraPosition(newPosition);
      });

      expect(mockCameraActions.setCameraPosition).toHaveBeenCalledWith(newPosition);
    });

    it('should call updateCameraPreset with home', () => {
      const { result } = renderHook(() => useCameraControlsWithStore());

      act(() => {
        result.current.updateCameraPreset('home');
      });

      expect(mockCameraActions.setCameraPreset).toHaveBeenCalledWith('home');
    });

    it('should call updateCameraPreset with front', () => {
      const { result } = renderHook(() => useCameraControlsWithStore());

      act(() => {
        result.current.updateCameraPreset('front');
      });

      expect(mockCameraActions.setCameraPreset).toHaveBeenCalledWith('front');
    });

    it('should call updateCameraPreset with all preset values', () => {
      const { result } = renderHook(() => useCameraControlsWithStore());

      const presets = ['home', 'front', 'back', 'right', 'left', 'top', 'bottom', 'iso1', 'iso2', null] as const;
      
      presets.forEach(preset => {
        act(() => {
          result.current.updateCameraPreset(preset);
        });

        expect(mockCameraActions.setCameraPreset).toHaveBeenCalledWith(preset);
      });
    });

    it('should call updatePivotMode with tool', () => {
      const { result } = renderHook(() => useCameraControlsWithStore());

      act(() => {
        result.current.updatePivotMode('tool');
      });

      expect(mockCameraActions.setCameraPivotMode).toHaveBeenCalledWith('tool');
    });

    it('should call updatePivotMode with origin', () => {
      const { result } = renderHook(() => useCameraControlsWithStore());

      act(() => {
        result.current.updatePivotMode('origin');
      });

      expect(mockCameraActions.setCameraPivotMode).toHaveBeenCalledWith('origin');
    });

    it('should call clearCameraPreset', () => {
      const { result } = renderHook(() => useCameraControlsWithStore());

      act(() => {
        result.current.clearCameraPreset();
      });

      expect(mockCameraActions.clearCameraPreset).toHaveBeenCalled();
    });
  });

  describe('memoization', () => {
    it('should memoize useVisualizationWithStore results', () => {
      const { result, rerender } = renderHook(() => useVisualizationWithStore());

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it('should memoize useProbeSequenceEditor results', () => {
      const { result, rerender } = renderHook(() => useProbeSequenceEditor());

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it('should memoize useVisualizationControls results', () => {
      const { result, rerender } = renderHook(() => useVisualizationControls());

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it('should memoize useCameraControlsWithStore results', () => {
      const { result, rerender } = renderHook(() => useCameraControlsWithStore());

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });
});
