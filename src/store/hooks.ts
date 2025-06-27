// src/store/hooks.ts
// Custom hooks for specific use cases to make component migration easier

import { useCallback, useMemo } from 'react';
import { 
  useAppStore,
  useMachineSettings,
  useProbeSequence,
  useProbeSequenceSettings,
  useMachineSettingsActions,
  useProbeSequenceActions,
  useVisualizationActions,
  useCameraSettings,
  useCameraActions
} from './index';

// Hook for components that need machine settings with visualization state
export const useVisualizationWithStore = () => {
  const machineSettings = useMachineSettings();
  const probeSequence = useProbeSequence();
  const probeSequenceSettings = useProbeSequenceSettings();
  const visualizationSettings = useAppStore((state) => state.visualizationSettings);
  
  const machineActions = useMachineSettingsActions();
  const visualizationActions = useVisualizationActions();

  return useMemo(() => ({
    machineSettings,
    probeSequence,
    probeSequenceSettings,
    visualizationSettings,
    setMachineSettings: machineActions.setMachineSettings,
    updateAxisConfig: machineActions.updateAxisConfig,
    setVisualizationSettings: visualizationActions.setVisualizationSettings
  }), [
    machineSettings,
    probeSequence,
    probeSequenceSettings,
    visualizationSettings,
    machineActions.setMachineSettings,
    machineActions.updateAxisConfig,
    visualizationActions.setVisualizationSettings
  ]);
};

// Hook for components that need probe sequence editing capabilities
export const useProbeSequenceEditor = () => {
  const probeSequence = useProbeSequence();
  const probeSequenceSettings = useProbeSequenceSettings();
  const actions = useProbeSequenceActions();

  // Enhanced operations for easier component migration
  const addProbe = useCallback(
    (template?: Partial<import("@/types/machine").ProbeOperation>) => {
      actions.addProbeOperation(template);
    },
    [actions]
  );

  const updateProbe = useCallback(
    (
      id: string,
      field: keyof import("@/types/machine").ProbeOperation,
      value: import("@/types/machine").ProbeOperation[keyof import("@/types/machine").ProbeOperation]
    ) => {
      actions.updateProbeOperation(id, field, value);
    },
    [actions]
  );

  const removeProbe = useCallback(
    (id: string) => {
      actions.removeProbeOperation(id);
    },
    [actions]
  );

  return useMemo(
    () => ({
      probeSequence,
      probeSequenceSettings,
      setProbeSequence: actions.setProbeSequence,
      setProbeSequenceSettings: actions.setProbeSequenceSettings,
      addProbe,
      updateProbe,
      removeProbe,
    }),
    [
      probeSequence,
      probeSequenceSettings,
      actions.setProbeSequence,
      actions.setProbeSequenceSettings,
      addProbe,
      updateProbe,
      removeProbe,
    ]
  );
};

// Hook for stock and probe position controls
export const useVisualizationControls = () => {
  const visualizationSettings = useAppStore((state) => state.visualizationSettings);
  const probeSequenceSettings = useProbeSequenceSettings();
  const visualizationActions = useVisualizationActions();
  const probeActions = useProbeSequenceActions();

  const updateStockSize = useCallback(
    (size: [number, number, number]) => {
      visualizationActions.setVisualizationSettings({ stockSize: size });
    },
    [visualizationActions]
  );

  const updateStockPosition = useCallback(
    (position: [number, number, number]) => {
      console.log('[Store] Updating stock position to:', position);
      visualizationActions.setVisualizationSettings({ stockPosition: position });
    },
    [visualizationActions]
  );

  const updateStockRotation = useCallback(
    (rotation: [number, number, number]) => {
      visualizationActions.setVisualizationSettings({ stockRotation: rotation });
    },
    [visualizationActions]
  );

  const updateProbePosition = useCallback(
    (position: { X: number; Y: number; Z: number }) => {
      probeActions.setProbeSequenceSettings((prev) => ({
        ...prev,
        initialPosition: position,
      }));
    },
    [probeActions]
  );

  const updateModelFile = useCallback(
    async (file: File | null) => {
      await visualizationActions.setModelFile(file);
    },
    [visualizationActions]
  );

  return useMemo(
    () => ({
      stockSize: visualizationSettings.stockSize,
      stockPosition: visualizationSettings.stockPosition,
      stockRotation: visualizationSettings.stockRotation,
      probePosition: probeSequenceSettings.initialPosition,
      modelFile: visualizationSettings.modelFile,
      isLoadingModelFile: visualizationSettings.isLoadingModelFile,
      updateStockSize,
      updateStockPosition,
      updateStockRotation,
      updateProbePosition,
      updateModelFile,
    }),
    [
      visualizationSettings.stockSize,
      visualizationSettings.stockPosition,
      visualizationSettings.stockRotation,
      probeSequenceSettings.initialPosition,
      visualizationSettings.modelFile,
      visualizationSettings.isLoadingModelFile,
      updateStockSize,
      updateStockPosition,
      updateStockRotation,
      updateProbePosition,
      updateModelFile,
    ]
  );
};

// Hook for camera controls with store integration
export const useCameraControlsWithStore = () => {
  const cameraSettings = useCameraSettings();
  const cameraActions = useCameraActions();
  const machineSettings = useMachineSettings();

  const updateCameraPosition = useCallback(
    (position: { x: number; y: number; z: number }) => {
      cameraActions.setCameraPosition(position);
    },
    [cameraActions]
  );

  const updateCameraPreset = useCallback(
    (preset: 'home' | 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'iso1' | 'iso2' | null) => {
      cameraActions.setCameraPreset(preset);
    },
    [cameraActions]
  );

  const updatePivotMode = useCallback(
    (mode: 'tool' | 'origin') => {
      cameraActions.setCameraPivotMode(mode);
    },
    [cameraActions]
  );

  const clearPreset = useCallback(
    () => {
      cameraActions.clearCameraPreset();
    },
    [cameraActions]
  );

  return useMemo(
    () => ({
      cameraPosition: cameraSettings.position,
      currentPreset: cameraSettings.preset,
      pivotMode: cameraSettings.pivotMode,
      machineSettings,
      updateCameraPosition,
      updateCameraPreset,
      updatePivotMode,
      clearCameraPreset: clearPreset,
    }),
    [
      cameraSettings.position,
      cameraSettings.preset,
      cameraSettings.pivotMode,
      machineSettings,
      updateCameraPosition,
      updateCameraPreset,
      updatePivotMode,
      clearPreset,
    ]
  );
};
