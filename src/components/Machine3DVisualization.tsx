import React, { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';
import { Scene3D } from './visualization/Scene3D';
import { CameraPresets, CameraCoordinateDisplay } from './visualization/CameraSystem';
import { useMachineGeometry } from '@/hooks/visualization/useMachineGeometry';
import { calculateInitialCameraPosition } from '@/utils/visualization/cameraPresets';
import { useCameraControlsWithStore } from '@/store/hooks';
import type { MachineSettings, ProbeSequenceSettings } from '@/types/machine';

export interface Machine3DVisualizationProps {
  machineSettings: MachineSettings;
  probeSequence?: ProbeSequenceSettings;
  className?: string;
  height?: string;
  stockSize?: [number, number, number];
  stockPosition?: [number, number, number];
  onStockSizeChange?: (size: [number, number, number]) => void;
  onStockPositionChange?: (position: [number, number, number]) => void;
  showAxisLabels?: boolean;
  showCoordinateHover?: boolean;
  modelFile?: File | null;
}

/**
 * Main 3D visualization component - refactored to be more functional and declarative
 */
const Machine3DVisualization: React.FC<Machine3DVisualizationProps> = ({
  machineSettings,
  probeSequence,
  className = '',
  height = "600px",
  stockSize: providedStockSize,
  stockPosition: providedStockPosition,
  showAxisLabels = true,
  showCoordinateHover = true,
  modelFile
}) => {
  // Use store for camera state management
  const {
    cameraPosition,
    currentPreset,
    pivotMode,
    updateCameraPosition,
    updateCameraPreset,
    updatePivotMode,
    clearCameraPreset
  } = useCameraControlsWithStore();

  // Calculate machine geometry with memoization using props directly
  const geometry = useMachineGeometry({
    machineSettings,
    probeSequence,
    stockSize: providedStockSize || [25, 25, 10],
    stockPosition: providedStockPosition || [0, 0, 0]
  });

  // Calculate initial camera position (used only if no stored position)
  const initialCameraPosition = React.useMemo(() => {
    // Use stored camera position if available, otherwise calculate initial
    if (cameraPosition.x !== 0 || cameraPosition.y !== 0 || cameraPosition.z !== 0) {
      return [cameraPosition.x, cameraPosition.y, cameraPosition.z] as [number, number, number];
    }
    const pos = calculateInitialCameraPosition(machineSettings, machineSettings.machineOrientation);
    return [pos.x, pos.y, pos.z] as [number, number, number];
  }, [machineSettings, cameraPosition]);

  // Handlers
  const handleControlsReady = useCallback(() => {
    // Camera controls are ready
  }, []);

  const handleCameraUpdate = useCallback((position: { x: number; y: number; z: number }) => {
    updateCameraPosition(position);
  }, [updateCameraPosition]);

  const handleManualCameraChange = useCallback(() => {
    clearCameraPreset();
  }, [clearCameraPreset]);

  const handleAnimationStateChange = useCallback(() => {
    // Animation state is handled in Scene3D
  }, []);

  return (
    <ResizablePanelGroup 
      direction="vertical" 
      className={`w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      <ResizablePanel defaultSize={100} minSize={30}>
        <div className="w-full h-full relative">
          {/* Camera Controls */}
          <CameraPresets 
            onPresetSelect={updateCameraPreset}
            currentPreset={currentPreset || undefined}
            pivotMode={pivotMode}
            onPivotModeChange={updatePivotMode}
          />
          
          {/* 3D Canvas */}
          <Canvas
            camera={{ 
              position: initialCameraPosition,
              fov: 75,
              near: 0.1,
              far: 1000
            }}
            style={{ background: '#1a1a1a', width: '100%', height: '100%' }}
          >
            <Scene3D 
              machineSettings={machineSettings} 
              probeSequence={probeSequence}
              geometry={geometry}
              stockSize={providedStockSize || [25, 25, 10]}
              stockPosition={providedStockPosition || [0, 0, 0]}
              showAxisLabels={showAxisLabels}
              showCoordinateHover={showCoordinateHover}
              currentPreset={currentPreset || undefined}
              onCameraUpdate={handleCameraUpdate}
              onControlsReady={handleControlsReady}
              onManualCameraChange={handleManualCameraChange}
              onAnimationStateChange={handleAnimationStateChange}
              pivotMode={pivotMode}
              modelFile={modelFile}
            />
          </Canvas>
          
          {/* Camera Position Display */}
          <CameraCoordinateDisplay 
            units={machineSettings.units} 
            cameraPosition={cameraPosition}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Machine3DVisualization;
