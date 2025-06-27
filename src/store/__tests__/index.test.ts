import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ProbeOperation } from '@/types/machine';
import {
  useAppStore,
  useMachineSettings,
  useProbeSequence,
  useProbeSequenceSettings,
  useGeneratedGCode,
  useVisualizationSettings,
  useCameraSettings,
  useMachineSettingsActions,
  useProbeSequenceActions,
  useGCodeActions,
  useImportActions,
  useVisualizationActions,
  useCameraActions,
  useResetActions
} from '../index';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('App Store', () => {
  beforeEach(() => {
    // Clear localStorage and reset store state before each test
    mockLocalStorage.clear();
    useAppStore.setState({
      machineSettings: {
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
        stageDimensions: [12.7, 304.8, 63.5]
      },
      probeSequence: [],
      probeSequenceSettings: {
        initialPosition: { X: -78, Y: -100, Z: -41 },
        dwellsBeforeProbe: 15,
        spindleSpeed: 5000,
        units: 'mm',
        endmillSize: {
          input: '1/8',
          unit: 'fraction',
          sizeInMM: 3.175
        },
        operations: []
      },
      generatedGCode: '',
      importCounter: 0,
      visualizationSettings: {
        stockSize: [25, 25, 10],
        stockPosition: [0, 0, 0],
        showAxisLabels: true,
        showCoordinateHover: true,
        modelFile: null,
        serializedModelFile: null,
        isLoadingModelFile: false
      },
      cameraSettings: {
        position: { x: -200, y: 200, z: -100 },
        preset: null,
        pivotMode: 'tool',
        isManuallyMoved: false
      }
    });
  });

  describe('Selector hooks', () => {
    it('should return machine settings', () => {
      const { result } = renderHook(() => useMachineSettings());
      expect(result.current.units).toBe('mm');
      expect(result.current.machineOrientation).toBe('horizontal');
    });

    it('should return probe sequence', () => {
      const { result } = renderHook(() => useProbeSequence());
      expect(result.current).toEqual([]);
    });

    it('should return probe sequence settings', () => {
      const { result } = renderHook(() => useProbeSequenceSettings());
      expect(result.current.dwellsBeforeProbe).toBe(15);
      expect(result.current.spindleSpeed).toBe(5000);
    });

    it('should return generated G-code', () => {
      const { result } = renderHook(() => useGeneratedGCode());
      expect(result.current).toBe('');
    });

    it('should return visualization settings', () => {
      const { result } = renderHook(() => useVisualizationSettings());
      expect(result.current.stockSize).toEqual([25, 25, 10]);
      expect(result.current.showAxisLabels).toBe(true);
    });

    it('should return camera settings', () => {
      const { result } = renderHook(() => useCameraSettings());
      expect(result.current.position).toEqual({ x: -200, y: 200, z: -100 });
      expect(result.current.preset).toBe(null);
    });
  });

  describe('Machine settings actions', () => {
    it('should set machine settings with object', () => {
      const { result } = renderHook(() => useMachineSettingsActions());
      
      const newSettings = {
        units: 'inch' as const,
        axes: {
          X: { positiveDirection: 'Up' as const, negativeDirection: 'Down' as const, polarity: -1 as const, min: -10, max: 10 },
          Y: { positiveDirection: 'Left' as const, negativeDirection: 'Right' as const, polarity: -1 as const, min: -10, max: 10 },
          Z: { positiveDirection: 'Out' as const, negativeDirection: 'In' as const, polarity: 1 as const, min: -10, max: 10 }
        },
        machineOrientation: 'vertical' as const,
        stageDimensions: [50, 50, 25] as [number, number, number]
      };

      act(() => {
        result.current.setMachineSettings(newSettings);
      });

      const machineSettings = useAppStore.getState().machineSettings;
      expect(machineSettings.units).toBe('inch');
      expect(machineSettings.machineOrientation).toBe('vertical');
      
      // Should sync units to probe sequence settings
      const probeSettings = useAppStore.getState().probeSequenceSettings;
      expect(probeSettings.units).toBe('inch');
    });

    it('should set machine settings with function', () => {
      const { result } = renderHook(() => useMachineSettingsActions());
      
      act(() => {
        result.current.setMachineSettings(prev => ({
          ...prev,
          units: 'inch'
        }));
      });

      const machineSettings = useAppStore.getState().machineSettings;
      expect(machineSettings.units).toBe('inch');
    });

    it('should update axis config', () => {
      const { result } = renderHook(() => useMachineSettingsActions());
      
      act(() => {
        result.current.updateAxisConfig('X', 'polarity', -1);
      });

      const machineSettings = useAppStore.getState().machineSettings;
      expect(machineSettings.axes.X.polarity).toBe(-1);
    });

    it('should reset machine settings', () => {
      const { result } = renderHook(() => useMachineSettingsActions());
      
      // First change settings
      act(() => {
        result.current.setMachineSettings(prev => ({
          ...prev,
          units: 'inch'
        }));
      });

      // Then reset
      act(() => {
        result.current.resetMachineSettings();
      });

      const machineSettings = useAppStore.getState().machineSettings;
      expect(machineSettings.units).toBe('mm');
    });
  });

  describe('Probe sequence actions', () => {
    it('should set probe sequence with array', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      const newSequence: ProbeOperation[] = [{
        id: 'test-1',
        axis: 'X',
        direction: -1,
        distance: 10,
        feedRate: 5,
        backoffDistance: 0.5,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      }];

      act(() => {
        result.current.setProbeSequence(newSequence);
      });

      const probeSequence = useAppStore.getState().probeSequence;
      expect(probeSequence).toHaveLength(1);
      expect(probeSequence[0].axis).toBe('X');
    });

    it('should set probe sequence with function', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      const operation: ProbeOperation = {
        id: 'test-1',
        axis: 'Y',
        direction: 1,
        distance: 20,
        feedRate: 10,
        backoffDistance: 1,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      };

      act(() => {
        result.current.setProbeSequence(prev => [...prev, operation]);
      });

      const probeSequence = useAppStore.getState().probeSequence;
      expect(probeSequence).toHaveLength(1);
      expect(probeSequence[0].axis).toBe('Y');
    });

    it('should set probe sequence settings with object', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      const newSettings = {
        initialPosition: { X: -50, Y: -50, Z: -25 },
        dwellsBeforeProbe: 10,
        spindleSpeed: 8000,
        units: 'inch' as const,
        endmillSize: {
          input: '1/4',
          unit: 'fraction' as const,
          sizeInMM: 6.35
        },
        operations: []
      };

      act(() => {
        result.current.setProbeSequenceSettings(newSettings);
      });

      const settings = useAppStore.getState().probeSequenceSettings;
      expect(settings.dwellsBeforeProbe).toBe(10);
      expect(settings.spindleSpeed).toBe(8000);
    });

    it('should set probe sequence settings with function', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      act(() => {
        result.current.setProbeSequenceSettings(prev => ({
          ...prev,
          dwellsBeforeProbe: 20
        }));
      });

      const settings = useAppStore.getState().probeSequenceSettings;
      expect(settings.dwellsBeforeProbe).toBe(20);
    });

    it('should add probe operation with defaults', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      act(() => {
        result.current.addProbeOperation();
      });

      const probeSequence = useAppStore.getState().probeSequence;
      expect(probeSequence).toHaveLength(1);
      expect(probeSequence[0].axis).toBe('Y');
      expect(probeSequence[0].direction).toBe(-1);
      expect(probeSequence[0].distance).toBe(25);
      expect(probeSequence[0].id).toContain('probe-');
    });

    it('should add probe operation with template', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      const template = {
        axis: 'Z' as const,
        distance: 15,
        feedRate: 8
      };

      act(() => {
        result.current.addProbeOperation(template);
      });

      const probeSequence = useAppStore.getState().probeSequence;
      expect(probeSequence).toHaveLength(1);
      expect(probeSequence[0].axis).toBe('Z');
      expect(probeSequence[0].distance).toBe(15);
      expect(probeSequence[0].feedRate).toBe(8);
    });

    it('should update probe operation', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      // First add an operation
      act(() => {
        result.current.addProbeOperation();
      });

      const operationId = useAppStore.getState().probeSequence[0].id;

      // Then update it
      act(() => {
        result.current.updateProbeOperation(operationId, 'distance', 50);
      });

      const probeSequence = useAppStore.getState().probeSequence;
      expect(probeSequence[0].distance).toBe(50);
    });

    it('should not update non-existent probe operation', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      // Add an operation first
      act(() => {
        result.current.addProbeOperation();
      });

      const originalSequence = [...useAppStore.getState().probeSequence];

      // Try to update non-existent operation
      act(() => {
        result.current.updateProbeOperation('non-existent-id', 'distance', 100);
      });

      const probeSequence = useAppStore.getState().probeSequence;
      expect(probeSequence).toEqual(originalSequence);
    });

    it('should remove probe operation', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      // Add two operations with explicit templates to ensure unique IDs
      act(() => {
        result.current.addProbeOperation({ id: 'test-probe-1' });
      });
      
      act(() => {
        result.current.addProbeOperation({ id: 'test-probe-2' });
      });

      expect(useAppStore.getState().probeSequence).toHaveLength(2);

      // Remove the first one
      act(() => {
        result.current.removeProbeOperation('test-probe-1');
      });

      const probeSequence = useAppStore.getState().probeSequence;
      expect(probeSequence).toHaveLength(1);
      expect(probeSequence[0].id).toBe('test-probe-2');
    });

    it('should reset probe settings', () => {
      const { result } = renderHook(() => useProbeSequenceActions());
      
      // Add operations and change settings
      act(() => {
        result.current.addProbeOperation();
        result.current.setProbeSequenceSettings(prev => ({
          ...prev,
          dwellsBeforeProbe: 100
        }));
      });

      // Reset
      act(() => {
        result.current.resetProbeSettings();
      });

      const state = useAppStore.getState();
      expect(state.probeSequence).toHaveLength(0);
      expect(state.probeSequenceSettings.dwellsBeforeProbe).toBe(15);
      expect(state.generatedGCode).toBe('');
    });
  });

  describe('G-code actions', () => {
    it('should set generated G-code', () => {
      const { result } = renderHook(() => useGCodeActions());
      
      const gcode = 'G0 X0 Y0 Z0\nG1 F100';

      act(() => {
        result.current.setGeneratedGCode(gcode);
      });

      const generatedGCode = useAppStore.getState().generatedGCode;
      expect(generatedGCode).toBe(gcode);
    });
  });

  describe('Import actions', () => {
    it('should handle G-code import with all fields', () => {
      const { result } = renderHook(() => useImportActions());
      
      const parseResult = {
        probeSequence: [{
          id: 'imported-1',
          axis: 'X' as const,
          direction: -1 as const,
          distance: 30,
          feedRate: 15,
          backoffDistance: 2,
          wcsOffset: 0,
          preMoves: [],
          postMoves: []
        }],
        initialPosition: { X: -100, Y: -200, Z: -50 },
        dwellsBeforeProbe: 25,
        spindleSpeed: 6000,
        units: 'inch' as const
      };

      act(() => {
        result.current.handleGCodeImport(parseResult);
      });

      const state = useAppStore.getState();
      expect(state.probeSequence).toHaveLength(1);
      expect(state.probeSequence[0].axis).toBe('X');
      expect(state.probeSequenceSettings.initialPosition).toEqual({ X: -100, Y: -200, Z: -50 });
      expect(state.probeSequenceSettings.dwellsBeforeProbe).toBe(25);
      expect(state.probeSequenceSettings.spindleSpeed).toBe(6000);
      expect(state.machineSettings.units).toBe('inch');
      expect(state.probeSequenceSettings.units).toBe('inch');
      expect(state.importCounter).toBe(1);
    });

    it('should handle G-code import with minimal fields', () => {
      const { result } = renderHook(() => useImportActions());
      
      const parseResult = {
        probeSequence: [{
          id: 'imported-1',
          axis: 'Y' as const,
          direction: 1 as const,
          distance: 20,
          feedRate: 10,
          backoffDistance: 1,
          wcsOffset: 0,
          preMoves: [],
          postMoves: []
        }]
      };

      const originalSettings = { ...useAppStore.getState().probeSequenceSettings };
      const originalMachineSettings = { ...useAppStore.getState().machineSettings };

      act(() => {
        result.current.handleGCodeImport(parseResult);
      });

      const state = useAppStore.getState();
      expect(state.probeSequence).toHaveLength(1);
      // Settings should remain unchanged when not provided
      expect(state.probeSequenceSettings.initialPosition).toEqual(originalSettings.initialPosition);
      expect(state.probeSequenceSettings.dwellsBeforeProbe).toBe(originalSettings.dwellsBeforeProbe);
      expect(state.probeSequenceSettings.spindleSpeed).toBe(originalSettings.spindleSpeed);
      expect(state.machineSettings.units).toBe(originalMachineSettings.units);
      expect(state.importCounter).toBe(1);
    });

    it('should increment import counter', () => {
      const { result } = renderHook(() => useImportActions());
      
      expect(useAppStore.getState().importCounter).toBe(0);

      act(() => {
        result.current.incrementImportCounter();
      });

      expect(useAppStore.getState().importCounter).toBe(1);

      act(() => {
        result.current.incrementImportCounter();
      });

      expect(useAppStore.getState().importCounter).toBe(2);
    });
  });

  describe('Visualization actions', () => {
    it('should set visualization settings', () => {
      const { result } = renderHook(() => useVisualizationActions());
      
      const newSettings = {
        stockSize: [50, 50, 20] as [number, number, number],
        showAxisLabels: false
      };

      act(() => {
        result.current.setVisualizationSettings(newSettings);
      });

      const visualizationSettings = useAppStore.getState().visualizationSettings;
      expect(visualizationSettings.stockSize).toEqual([50, 50, 20]);
      expect(visualizationSettings.showAxisLabels).toBe(false);
      // Should preserve other settings
      expect(visualizationSettings.showCoordinateHover).toBe(true);
    });
  });

  describe('Camera actions', () => {
    it('should set camera position', () => {
      const { result } = renderHook(() => useCameraActions());
      
      const newPosition = { x: 100, y: 150, z: -50 };

      act(() => {
        result.current.setCameraPosition(newPosition);
      });

      const cameraSettings = useAppStore.getState().cameraSettings;
      expect(cameraSettings.position).toEqual(newPosition);
    });

    it('should set camera preset', () => {
      const { result } = renderHook(() => useCameraActions());
      
      act(() => {
        result.current.setCameraPreset('front');
      });

      const cameraSettings = useAppStore.getState().cameraSettings;
      expect(cameraSettings.preset).toBe('front');
      expect(cameraSettings.isManuallyMoved).toBe(false);
    });

    it('should set camera pivot mode', () => {
      const { result } = renderHook(() => useCameraActions());
      
      act(() => {
        result.current.setCameraPivotMode('origin');
      });

      const cameraSettings = useAppStore.getState().cameraSettings;
      expect(cameraSettings.pivotMode).toBe('origin');
    });

    it('should clear camera preset', () => {
      const { result } = renderHook(() => useCameraActions());
      
      // First set a preset
      act(() => {
        result.current.setCameraPreset('top');
      });

      expect(useAppStore.getState().cameraSettings.preset).toBe('top');

      // Then clear it
      act(() => {
        result.current.clearCameraPreset();
      });

      const cameraSettings = useAppStore.getState().cameraSettings;
      expect(cameraSettings.preset).toBe(null);
      expect(cameraSettings.isManuallyMoved).toBe(true);
    });
  });

  describe('Reset actions', () => {
    it('should reset to defaults', () => {
      const { result } = renderHook(() => useResetActions());
      const { result: probeActions } = renderHook(() => useProbeSequenceActions());
      const { result: machineActions } = renderHook(() => useMachineSettingsActions());
      const { result: cameraActions } = renderHook(() => useCameraActions());
      
      // Modify all settings first
      act(() => {
        probeActions.current.addProbeOperation();
        machineActions.current.setMachineSettings(prev => ({ ...prev, units: 'inch' }));
        cameraActions.current.setCameraPreset('front');
      });

      // Verify changes
      let state = useAppStore.getState();
      expect(state.probeSequence).toHaveLength(1);
      expect(state.machineSettings.units).toBe('inch');
      expect(state.cameraSettings.preset).toBe('front');

      // Reset to defaults
      act(() => {
        result.current.resetToDefaults();
      });

      state = useAppStore.getState();
      expect(state.probeSequence).toHaveLength(0);
      expect(state.machineSettings.units).toBe('mm');
      expect(state.generatedGCode).toBe('');
      expect(state.importCounter).toBe(0);
      expect(state.visualizationSettings.stockSize).toEqual([25, 25, 10]);
      expect(state.cameraSettings.preset).toBe(null);
      expect(state.cameraSettings.isManuallyMoved).toBe(false);
    });

    it('should reset machine settings only', () => {
      const { result } = renderHook(() => useResetActions());
      const { result: probeActions } = renderHook(() => useProbeSequenceActions());
      const { result: machineActions } = renderHook(() => useMachineSettingsActions());
      
      // Modify settings
      act(() => {
        probeActions.current.addProbeOperation();
        machineActions.current.setMachineSettings(prev => ({ ...prev, units: 'inch' }));
      });

      // Reset machine settings only
      act(() => {
        result.current.resetMachineSettings();
      });

      const state = useAppStore.getState();
      expect(state.machineSettings.units).toBe('mm');
      expect(state.probeSequenceSettings.units).toBe('mm'); // Should sync
      // Probe sequence should remain
      expect(state.probeSequence).toHaveLength(1);
    });

    it('should reset probe settings only', () => {
      const { result } = renderHook(() => useResetActions());
      const { result: probeActions } = renderHook(() => useProbeSequenceActions());
      const { result: machineActions } = renderHook(() => useMachineSettingsActions());
      const { result: gcodeActions } = renderHook(() => useGCodeActions());
      
      // Modify settings
      act(() => {
        probeActions.current.addProbeOperation();
        machineActions.current.setMachineSettings(prev => ({ ...prev, units: 'inch' }));
        gcodeActions.current.setGeneratedGCode('G0 X0 Y0');
      });

      // Reset probe settings only
      act(() => {
        result.current.resetProbeSettings();
      });

      const state = useAppStore.getState();
      expect(state.probeSequence).toHaveLength(0);
      expect(state.generatedGCode).toBe('');
      expect(state.probeSequenceSettings.dwellsBeforeProbe).toBe(15); // Default
      // Machine settings should remain
      expect(state.machineSettings.units).toBe('inch');
    });
  });

  describe('Store integration', () => {
    it('should work with direct store access', () => {
      const store = useAppStore.getState();
      
      expect(store.machineSettings.units).toBe('mm');
      expect(store.probeSequence).toEqual([]);
      
      act(() => {
        store.setMachineSettings(prev => ({ ...prev, units: 'inch' }));
        store.addProbeOperation({ axis: 'Z' });
      });

      const updatedStore = useAppStore.getState();
      expect(updatedStore.machineSettings.units).toBe('inch');
      expect(updatedStore.probeSequence).toHaveLength(1);
      expect(updatedStore.probeSequence[0].axis).toBe('Z');
    });
  });
});
