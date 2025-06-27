import { useState, useCallback, useMemo } from 'react';
import type { MachineSettings, ProbeSequenceSettings } from '@/types/machine';
import { calculateDefaultStockPosition } from '@/utils/visualization/machineGeometry';
import type { CameraPreset } from '@/utils/visualization/cameraPresets';

export interface VisualizationState {
  stockSize: [number, number, number];
  stockPosition: [number, number, number];
  machineOrientation: 'vertical' | 'horizontal';
  stageDimensions: [number, number, number];
  probePosition: { X: number; Y: number; Z: number };
  currentPreset: CameraPreset;
  cameraPosition: { x: number; y: number; z: number };
  pivotMode: 'tool' | 'origin';
  modelFile: File | null;
}

export interface VisualizationActions {
  setStockSize: (size: [number, number, number]) => void;
  setStockPosition: (position: [number, number, number]) => void;
  setMachineOrientation: (orientation: 'vertical' | 'horizontal') => void;
  setStageDimensions: (dimensions: [number, number, number]) => void;
  setProbePosition: (position: { X: number; Y: number; Z: number }) => void;
  setCurrentPreset: (preset: CameraPreset) => void;
  setCameraPosition: (position: { x: number; y: number; z: number }) => void;
  setPivotMode: (mode: 'tool' | 'origin') => void;
  setModelFile: (file: File | null) => void;
  resetDefaults: () => void;
}

export interface UseVisualizationStateProps {
  machineSettings: MachineSettings;
  probeSequenceSettings?: ProbeSequenceSettings;
  initialStockSize?: [number, number, number];
  initialStockPosition?: [number, number, number];
  initialMachineOrientation?: 'vertical' | 'horizontal';
  initialStageDimensions?: [number, number, number];
}

/**
 * Centralized state management hook for visualization components
 */
export const useVisualizationState = ({
  machineSettings,
  probeSequenceSettings,
  initialStockSize = [25, 25, 10],
  initialStockPosition,
  initialMachineOrientation = 'horizontal',
  initialStageDimensions = [12.7, 304.8, 63.5]
}: UseVisualizationStateProps): [VisualizationState, VisualizationActions] => {
  
  // Calculate initial stock position if not provided
  const defaultStockPosition = useMemo(() => {
    if (initialStockPosition) {
      return initialStockPosition;
    }
    return calculateDefaultStockPosition(
      machineSettings,
      initialStockSize,
      initialMachineOrientation
    );
  }, [machineSettings, initialStockSize, initialMachineOrientation, initialStockPosition]);

  // State
  const [stockSize, setStockSize] = useState<[number, number, number]>(initialStockSize);
  const [stockPosition, setStockPosition] = useState<[number, number, number]>(defaultStockPosition);
  const [machineOrientation, setMachineOrientation] = useState<'vertical' | 'horizontal'>(initialMachineOrientation);
  const [stageDimensions, setStageDimensions] = useState<[number, number, number]>(initialStageDimensions);
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>('home');
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const [pivotMode, setPivotMode] = useState<'tool' | 'origin'>('tool');
  const [modelFile, setModelFile] = useState<File | null>(null);
  
  const [probePosition, setProbePosition] = useState<{ X: number; Y: number; Z: number }>(() => {
    return probeSequenceSettings?.initialPosition || { X: 0, Y: 0, Z: 0 };
  });

  // Actions
  const resetDefaults = useCallback(() => {
    setStockSize(initialStockSize);
    setStockPosition(defaultStockPosition);
    setMachineOrientation(initialMachineOrientation);
    setStageDimensions(initialStageDimensions);
    setProbePosition(probeSequenceSettings?.initialPosition || { X: 0, Y: 0, Z: 0 });
    setCurrentPreset('home');
    setPivotMode('tool');
    setModelFile(null);
  }, [
    initialStockSize,
    defaultStockPosition,
    initialMachineOrientation,
    initialStageDimensions,
    probeSequenceSettings?.initialPosition
  ]);

  const state: VisualizationState = {
    stockSize,
    stockPosition,
    machineOrientation,
    stageDimensions,
    probePosition,
    currentPreset,
    cameraPosition,
    pivotMode,
    modelFile
  };

  const actions: VisualizationActions = {
    setStockSize,
    setStockPosition,
    setMachineOrientation,
    setStageDimensions,
    setProbePosition,
    setCurrentPreset,
    setCameraPosition,
    setPivotMode,
    setModelFile,
    resetDefaults
  };

  return [state, actions];
};
