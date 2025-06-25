import React, { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { MACHINE_ORIENTATION_CONFIGS } from '@/config/visualization/visualizationConfig';
import type { MachineSettings } from '@/types/machine';
import type { Position3D } from '@/utils/visualization/machineGeometry';
import type { CameraPreset } from '@/utils/visualization/cameraPresets';
import { CAMERA_PRESETS } from '@/utils/visualization/cameraPresets';

export interface EnhancedOrbitControlsProps {
  target: Position3D;
  machineSettings: MachineSettings;
  machineOrientation: 'vertical' | 'horizontal';
  onControlsReady?: (controls: { setPosition: (position: Position3D) => void }) => void;
}

/**
 * Enhanced OrbitControls component with machine-specific configuration
 */
export const EnhancedOrbitControls = React.forwardRef<OrbitControlsImpl, EnhancedOrbitControlsProps>(({
  target,
  machineSettings,
  machineOrientation,
  onControlsReady
}, ref) => {
  const { camera } = useThree();
  const internalControlsRef = useRef<OrbitControlsImpl>(null);
  
  // Use the passed ref or internal ref
  const controlsRef = (ref as React.MutableRefObject<OrbitControlsImpl>) || internalControlsRef;
  
  // Calculate dynamic max distance based on machine workspace
  const maxDistance = useMemo(() => {
    const { X, Y, Z } = machineSettings.axes;
    const maxDimension = Math.max(
      Math.abs(X.max - X.min),
      Math.abs(Y.max - Y.min),
      Math.abs(Z.max - Z.min)
    );
    return maxDimension * 1.25;
  }, [machineSettings.axes]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(target.x, target.y, target.z);
      
      // Set camera up vector based on machine orientation
      const config = MACHINE_ORIENTATION_CONFIGS[machineOrientation];
      camera.up.set(...config.upVector);
      
      controlsRef.current.update();
    }
    
    // Notify parent that controls are ready
    if (onControlsReady) {
      onControlsReady({
        setPosition: (position: Position3D) => {
          if (controlsRef.current) {
            camera.position.set(position.x, position.y, position.z);
            camera.updateProjectionMatrix();
            controlsRef.current.update();
          }
        }
      });
    }
  }, [target, onControlsReady, machineOrientation, camera, controlsRef]);
  
  return (
    <OrbitControls 
      ref={controlsRef}
      target={[target.x, target.y, target.z]}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.05}
      maxPolarAngle={Math.PI}
      minDistance={5}
      maxDistance={maxDistance}
      zoomSpeed={0.8}
      rotateSpeed={0.5}
      panSpeed={0.8}
    />
  );
});

export interface CameraPresetsProps {
  onPresetSelect: (preset: CameraPreset) => void;
  currentPreset?: CameraPreset;
  pivotMode: 'tool' | 'origin';
  onPivotModeChange: (mode: 'tool' | 'origin') => void;
}

/**
 * Camera preset buttons component
 */
export const CameraPresets: React.FC<CameraPresetsProps> = ({
  onPresetSelect,
  currentPreset,
  pivotMode,
  onPivotModeChange
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
      <div className="text-xs text-gray-300 mb-2 font-semibold">Camera Views</div>
      <div className="grid grid-cols-3 gap-1">
        {CAMERA_PRESETS.map((preset) => (
          <button
            key={preset.key}
            onClick={() => onPresetSelect(preset.key)}
            className={`px-2 py-1 text-xs rounded transition-all duration-200 flex flex-col items-center gap-1 min-w-[60px] ${
              currentPreset === preset.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
            title={preset.label}
          >
            <span className="text-sm">{preset.icon}</span>
            <span className="text-[10px] font-mono">{preset.label}</span>
          </button>
        ))}
      </div>
      
      {/* Pivot Point Controls */}
      <div className="mt-3 pt-3 border-t border-gray-600">
        <div className="text-xs text-gray-300 mb-2 font-semibold">Camera Pivot</div>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => onPivotModeChange('tool')}
            className={`px-2 py-1 text-xs rounded transition-all duration-200 flex flex-col items-center gap-0.5 ${
              pivotMode === 'tool'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
            title="Pivot around probe tool tip"
          >
            <span className="text-sm">🔧</span>
            <span className="text-[10px] font-mono">Tool Tip</span>
          </button>
          <button
            onClick={() => onPivotModeChange('origin')}
            className={`px-2 py-1 text-xs rounded transition-all duration-200 flex flex-col items-center gap-0.5 ${
              pivotMode === 'origin'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
            title="Pivot around XYZ origin (0,0,0)"
          >
            <span className="text-sm">⊕</span>
            <span className="text-[10px] font-mono">Origin</span>
          </button>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-[10px] text-gray-400 text-center">
          Scroll: Zoom • Drag: Rotate • Shift+Drag: Pan
        </div>
      </div>
    </div>
  );
};

export interface CameraCoordinateDisplayProps {
  units: string;
  cameraPosition: { x: number; y: number; z: number };
}

/**
 * Camera coordinate display component (renders outside Canvas)
 */
export const CameraCoordinateDisplay: React.FC<CameraCoordinateDisplayProps> = ({
  units,
  cameraPosition
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      <div className="text-xs text-gray-300 mb-2 font-semibold">Camera Position</div>
      <div className="space-y-1 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-medium">X:</span>
          <span className="text-white min-w-[60px] text-right">{cameraPosition.x.toFixed(1)}</span>
          <span className="text-gray-400">{units}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-medium">Y:</span>
          <span className="text-white min-w-[60px] text-right">{cameraPosition.y.toFixed(1)}</span>
          <span className="text-gray-400">{units}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-medium">Z:</span>
          <span className="text-white min-w-[60px] text-right">{cameraPosition.z.toFixed(1)}</span>
          <span className="text-gray-400">{units}</span>
        </div>
      </div>
    </div>
  );
};

export interface CameraTrackerProps {
  onCameraUpdate: (position: { x: number; y: number; z: number }) => void;
}

/**
 * Camera tracker component (renders inside Canvas to access camera)
 */
export const CameraTracker: React.FC<CameraTrackerProps> = ({
  onCameraUpdate
}) => {
  const { camera } = useThree();
  
  useFrame(() => {
    // Update camera position every frame
    onCameraUpdate({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });
  });
  
  return null; // This component doesn't render anything
};
