// src/store/index.ts
// Centralized state management with persistence

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  MachineSettings, 
  ProbeOperation, 
  ProbeSequenceSettings,
  AxisConfig 
} from '@/types/machine';

// Default machine settings
const defaultMachineSettings: MachineSettings = {
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
};

const defaultProbeSequenceSettings: ProbeSequenceSettings = {
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
};

// Store state interface
interface AppState {
  // Machine settings
  machineSettings: MachineSettings;
  
  // Probe sequence data
  probeSequence: ProbeOperation[];
  probeSequenceSettings: ProbeSequenceSettings;
  
  // UI state
  generatedGCode: string;
  importCounter: number;
  
  // Visualization state
  visualizationSettings: {
    stockSize: [number, number, number];
    stockPosition: [number, number, number];
    showAxisLabels: boolean;
    showCoordinateHover: boolean;
  };
  
  // Camera state (persisted)
  cameraSettings: {
    position: { x: number; y: number; z: number };
    preset: 'home' | 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'iso1' | 'iso2' | null;
    pivotMode: 'tool' | 'origin';
    isManuallyMoved: boolean; // Track if user has manually moved camera
  };
}

// Store actions interface
interface AppActions {
  // Machine settings actions
  setMachineSettings: (settings: MachineSettings | ((prev: MachineSettings) => MachineSettings)) => void;
  updateAxisConfig: (axis: 'X' | 'Y' | 'Z', field: keyof AxisConfig, value: AxisConfig[keyof AxisConfig]) => void;
  
  // Probe sequence actions
  setProbeSequence: (sequence: ProbeOperation[] | ((prev: ProbeOperation[]) => ProbeOperation[])) => void;
  setProbeSequenceSettings: (settings: ProbeSequenceSettings | ((prev: ProbeSequenceSettings) => ProbeSequenceSettings)) => void;
  addProbeOperation: (operation?: Partial<ProbeOperation>) => void;
  updateProbeOperation: (id: string, field: keyof ProbeOperation, value: ProbeOperation[keyof ProbeOperation]) => void;
  removeProbeOperation: (id: string) => void;
  
  // G-code actions
  setGeneratedGCode: (gcode: string) => void;
  
  // Import/utility actions
  incrementImportCounter: () => void;
  handleGCodeImport: (parseResult: {
    probeSequence: ProbeOperation[];
    initialPosition?: { X: number; Y: number; Z: number };
    dwellsBeforeProbe?: number;
    spindleSpeed?: number;
    units?: 'mm' | 'inch';
  }) => void;
  
  // Visualization actions
  setVisualizationSettings: (settings: Partial<AppState['visualizationSettings']>) => void;
  
  // Camera actions
  setCameraPosition: (position: { x: number; y: number; z: number }) => void;
  setCameraPreset: (preset: AppState['cameraSettings']['preset']) => void;
  setCameraPivotMode: (mode: 'tool' | 'origin') => void;
  clearCameraPreset: () => void; // Clear preset when user manually moves camera
  
  // Reset actions
  resetToDefaults: () => void;
  resetMachineSettings: () => void;
  resetProbeSettings: () => void;
}

// Create the store with persistence
export const useAppStore = create<AppState & AppActions>()(
  persist(
    immer((set) => ({
      // Initial state
      machineSettings: defaultMachineSettings,
      probeSequence: [],
      probeSequenceSettings: defaultProbeSequenceSettings,
      generatedGCode: '',
      importCounter: 0,
      visualizationSettings: {
        stockSize: [25, 25, 10],
        stockPosition: [0, 0, 0],
        showAxisLabels: true,
        showCoordinateHover: true
      },
      
      // Camera settings - initialize with reasonable defaults
      cameraSettings: {
        position: { x: -200, y: 200, z: -100 }, // Default isometric-like view
        preset: null, // No preset selected initially
        pivotMode: 'tool',
        isManuallyMoved: false
      },
      
      // Machine settings actions
      setMachineSettings: (settings) => set((state) => {
        if (typeof settings === 'function') {
          state.machineSettings = settings(state.machineSettings);
        } else {
          state.machineSettings = settings;
        }
        
        // Sync units to probe sequence settings
        state.probeSequenceSettings.units = state.machineSettings.units;
      }),
      
      updateAxisConfig: (axis, field, value) => set((state) => {
        state.machineSettings.axes[axis] = {
          ...state.machineSettings.axes[axis],
          [field]: value,
        };
      }),
      
      // Probe sequence actions
      setProbeSequence: (sequence) => set((state) => {
        if (typeof sequence === 'function') {
          state.probeSequence = sequence(state.probeSequence);
        } else {
          state.probeSequence = sequence;
        }
      }),
      
      setProbeSequenceSettings: (settings) => set((state) => {
        if (typeof settings === 'function') {
          state.probeSequenceSettings = settings(state.probeSequenceSettings);
        } else {
          state.probeSequenceSettings = settings;
        }
      }),
      
      addProbeOperation: (template = {}) => set((state) => {
        const defaultProbe: ProbeOperation = {
          id: `probe-${Date.now()}`,
          axis: 'Y',
          direction: -1,
          distance: 25,
          feedRate: 10,
          backoffDistance: 1,
          wcsOffset: 0,
          preMoves: [],
          postMoves: [],
          ...template
        };
        state.probeSequence.push(defaultProbe);
      }),
      
      updateProbeOperation: (id, field, value) => set((state) => {
        const probeIndex = state.probeSequence.findIndex((p: ProbeOperation) => p.id === id);
        if (probeIndex !== -1) {
          state.probeSequence[probeIndex] = {
            ...state.probeSequence[probeIndex],
            [field]: value,
          };
        }
      }),
      
      removeProbeOperation: (id) => set((state) => {
        state.probeSequence = state.probeSequence.filter((p: ProbeOperation) => p.id !== id);
      }),
      
      // G-code actions
      setGeneratedGCode: (gcode) => set((state) => {
        state.generatedGCode = gcode;
      }),
      
      // Import/utility actions
      incrementImportCounter: () => set((state) => {
        state.importCounter += 1;
      }),
      
      handleGCodeImport: (parseResult) => set((state) => {
        // Update probe sequence
        state.probeSequence = parseResult.probeSequence;
        
        // Update settings conditionally
        if (parseResult.initialPosition) {
          state.probeSequenceSettings.initialPosition = parseResult.initialPosition;
        }
        if (parseResult.dwellsBeforeProbe !== undefined) {
          state.probeSequenceSettings.dwellsBeforeProbe = parseResult.dwellsBeforeProbe;
        }
        if (parseResult.spindleSpeed !== undefined) {
          state.probeSequenceSettings.spindleSpeed = parseResult.spindleSpeed;
        }
        
        // Update machine settings if units provided
        if (parseResult.units) {
          state.machineSettings.units = parseResult.units;
          state.probeSequenceSettings.units = parseResult.units;
        }
        
        // Increment import counter
        state.importCounter += 1;
      }),
      
      // Visualization actions
      setVisualizationSettings: (settings) => set((state) => {
        Object.assign(state.visualizationSettings, settings);
      }),
      
      // Camera actions
      setCameraPosition: (position) => set((state) => {
        state.cameraSettings.position = position;
      }),
      
      setCameraPreset: (preset) => set((state) => {
        state.cameraSettings.preset = preset;
        state.cameraSettings.isManuallyMoved = false; // Reset when preset is explicitly selected
      }),
      
      setCameraPivotMode: (mode) => set((state) => {
        state.cameraSettings.pivotMode = mode;
      }),
      
      clearCameraPreset: () => set((state) => {
        // Mark as manually moved and clear preset
        state.cameraSettings.preset = null;
        state.cameraSettings.isManuallyMoved = true;
      }),
      
      // Reset actions
      resetToDefaults: () => set((state) => {
        state.machineSettings = defaultMachineSettings;
        state.probeSequence = [];
        state.probeSequenceSettings = defaultProbeSequenceSettings;
        state.generatedGCode = '';
        state.importCounter = 0;
        state.visualizationSettings = {
          stockSize: [25, 25, 10],
          stockPosition: [0, 0, 0],
          showAxisLabels: true,
          showCoordinateHover: true
        };
        state.cameraSettings = {
          position: { x: -200, y: 200, z: -100 },
          preset: null, // No preset selected after reset
          pivotMode: 'tool',
          isManuallyMoved: false
        };
      }),
      
      resetMachineSettings: () => set((state) => {
        state.machineSettings = defaultMachineSettings;
        state.probeSequenceSettings.units = defaultMachineSettings.units;
      }),
      
      resetProbeSettings: () => set((state) => {
        state.probeSequence = [];
        state.probeSequenceSettings = defaultProbeSequenceSettings;
        state.generatedGCode = '';
      })
    })),
    {
      name: 'mill-probe-studio-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Only persist certain parts of the state
      partialize: (state) => ({
        machineSettings: state.machineSettings,
        probeSequence: state.probeSequence,
        probeSequenceSettings: state.probeSequenceSettings,
        visualizationSettings: state.visualizationSettings,
        cameraSettings: state.cameraSettings
        // Don't persist: generatedGCode, importCounter (these are session-specific)
      }),
    }
  )
);

// Selector hooks for better performance (memoized)
export const useMachineSettings = () => useAppStore((state) => state.machineSettings);
export const useProbeSequence = () => useAppStore((state) => state.probeSequence);
export const useProbeSequenceSettings = () => useAppStore((state) => state.probeSequenceSettings);
export const useGeneratedGCode = () => useAppStore((state) => state.generatedGCode);
export const useVisualizationSettings = () => useAppStore((state) => state.visualizationSettings);
export const useCameraSettings = () => useAppStore((state) => state.cameraSettings);

// Action hooks with stable references
export const useMachineSettingsActions = () => {
  const setMachineSettings = useAppStore((state) => state.setMachineSettings);
  const updateAxisConfig = useAppStore((state) => state.updateAxisConfig);
  const resetMachineSettings = useAppStore((state) => state.resetMachineSettings);
  
  return { setMachineSettings, updateAxisConfig, resetMachineSettings };
};

export const useProbeSequenceActions = () => {
  const setProbeSequence = useAppStore((state) => state.setProbeSequence);
  const setProbeSequenceSettings = useAppStore((state) => state.setProbeSequenceSettings);
  const addProbeOperation = useAppStore((state) => state.addProbeOperation);
  const updateProbeOperation = useAppStore((state) => state.updateProbeOperation);
  const removeProbeOperation = useAppStore((state) => state.removeProbeOperation);
  const resetProbeSettings = useAppStore((state) => state.resetProbeSettings);
  
  return {
    setProbeSequence,
    setProbeSequenceSettings,
    addProbeOperation,
    updateProbeOperation,
    removeProbeOperation,
    resetProbeSettings
  };
};

export const useGCodeActions = () => {
  const setGeneratedGCode = useAppStore((state) => state.setGeneratedGCode);
  return { setGeneratedGCode };
};

export const useImportActions = () => {
  const handleGCodeImport = useAppStore((state) => state.handleGCodeImport);
  const incrementImportCounter = useAppStore((state) => state.incrementImportCounter);
  return { handleGCodeImport, incrementImportCounter };
};

export const useVisualizationActions = () => {
  const setVisualizationSettings = useAppStore((state) => state.setVisualizationSettings);
  return { setVisualizationSettings };
};

export const useCameraActions = () => {
  const setCameraPosition = useAppStore((state) => state.setCameraPosition);
  const setCameraPreset = useAppStore((state) => state.setCameraPreset);
  const setCameraPivotMode = useAppStore((state) => state.setCameraPivotMode);
  const clearCameraPreset = useAppStore((state) => state.clearCameraPreset);
  return { setCameraPosition, setCameraPreset, setCameraPivotMode, clearCameraPreset };
};

export const useResetActions = () => {
  const resetToDefaults = useAppStore((state) => state.resetToDefaults);
  const resetMachineSettings = useAppStore((state) => state.resetMachineSettings);
  const resetProbeSettings = useAppStore((state) => state.resetProbeSettings);
  return { resetToDefaults, resetMachineSettings, resetProbeSettings };
};

// Export additional hooks
export * from './hooks';
