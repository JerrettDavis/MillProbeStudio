import React, { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';
import { Scene3D } from './visualization/Scene3D';
import { CameraPresets, CameraCoordinateDisplay } from './visualization/CameraSystem';
import { useMachineGeometry } from '@/hooks/visualization/useMachineGeometry';
import { calculateInitialCameraPosition, type CameraPreset } from '@/utils/visualization/cameraPresets';
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
  showCoordinateHover = true
}) => {
  // Use props directly instead of centralized state management
  const [currentPreset, setCurrentPreset] = React.useState<CameraPreset>('home');
  const [cameraPosition, setCameraPosition] = React.useState({ x: 0, y: 0, z: 0 });
  const [pivotMode, setPivotMode] = React.useState<'tool' | 'origin'>('tool');

  // Calculate machine geometry with memoization using props directly
  const geometry = useMachineGeometry({
    machineSettings,
    probeSequence,
    stockSize: providedStockSize || [25, 25, 10],
    stockPosition: providedStockPosition || [0, 0, 0]
  });

  // Calculate initial camera position
  const initialCameraPosition = React.useMemo(() => {
    const pos = calculateInitialCameraPosition(machineSettings, machineSettings.machineOrientation);
    return [pos.x, pos.y, pos.z] as [number, number, number];
  }, [machineSettings]);

  // Handlers
  const handleControlsReady = useCallback(() => {
    // Camera controls are ready
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
            onPresetSelect={setCurrentPreset}
            currentPreset={currentPreset}
            pivotMode={pivotMode}
            onPivotModeChange={setPivotMode}
          />
          
          {/* 3D Canvas */}
          <Canvas
            camera={{ 
              position: initialCameraPosition,
              fov: 60,
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
              currentPreset={currentPreset}
              onCameraUpdate={setCameraPosition}
              onControlsReady={handleControlsReady}
              pivotMode={pivotMode}
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
