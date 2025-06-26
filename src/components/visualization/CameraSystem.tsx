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
  enabled?: boolean; // Add enabled prop to disable controls during animation
  isAnimating?: boolean; // Add this to know when we're in animation
  onControlsReady?: (controls: { setPosition: (position: Position3D) => void }) => void;
  onCameraChange?: (position: { x: number; y: number; z: number }) => void;
  onManualCameraChange?: () => void; // Called when user manually moves camera
}

/**
 * Enhanced OrbitControls component with machine-specific configuration
 */
export const EnhancedOrbitControls = React.forwardRef<OrbitControlsImpl, EnhancedOrbitControlsProps>(({
  target,
  machineSettings,
  enabled = true, // Default to enabled
  isAnimating = false, // Default to not animating
  onControlsReady,
  onCameraChange,
  onManualCameraChange
}, ref) => {
  const { camera } = useThree();
  const internalControlsRef = useRef<OrbitControlsImpl>(null);
  const controlsRef = (ref as React.MutableRefObject<OrbitControlsImpl>) || internalControlsRef;
  const enabledTimeRef = useRef(Date.now());

  // Track when controls are enabled/disabled
  React.useEffect(() => {
    if (enabled) {
      enabledTimeRef.current = Date.now();
    }
  }, [enabled]);

  const machineOrientation = machineSettings.machineOrientation;

  const maxDistance = useMemo(() => {
    const { X, Y, Z } = machineSettings.axes;
    const maxDimension = Math.max(
      Math.abs(X.max - X.min),
      Math.abs(Y.max - Y.min),
      Math.abs(Z.max - Z.min)
    );
    return maxDimension * 2.0; // Increased from 1.25 to 2.0 to accommodate preset distances
  }, [machineSettings.axes]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Set up initial camera state and update when target changes
    controls.target.set(target.x, target.y, target.z);
    const config = MACHINE_ORIENTATION_CONFIGS[machineOrientation];
    camera.up.set(...(config.upVector as [number, number, number]));
    controls.update();

    // Notify parent that controls are ready
    onControlsReady?.({
      setPosition: (position: Position3D) => {
        camera.position.set(position.x, position.y, position.z);
        camera.updateProjectionMatrix();
        // Update the target to ensure controls are synced
        controls.target.set(target.x, target.y, target.z);
        controls.update();
      }
    });
  }, [target, onControlsReady, machineOrientation, camera, controlsRef]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    let isUserInteracting = false;
    let lastCameraDistance = 0;
    let throttleTimeout: NodeJS.Timeout | null = null;

    // Initialize camera distance tracking
    const initDistance = () => {
      lastCameraDistance = Math.sqrt(
        Math.pow(camera.position.x - target.x, 2) +
        Math.pow(camera.position.y - target.y, 2) +
        Math.pow(camera.position.z - target.z, 2)
      );
    };
    initDistance();

    const handleStart = () => {
      isUserInteracting = true;
    };

    const handleEnd = () => {
      isUserInteracting = false;
    };

    const handleChange = () => {
      // Throttle change events to prevent excessive updates
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      
      throttleTimeout = setTimeout(() => {
        onCameraChange?.({
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        });

        // IMPORTANT: Only trigger manual change during actual user interactions
        // Skip all manual change detection if we're currently animating
        if (isAnimating) {
          return; // Exit early - no manual change detection during animation
        }

        // Check if zoom/distance changed (manual zoom without drag)
        const currentDistance = Math.sqrt(
          Math.pow(camera.position.x - target.x, 2) +
          Math.pow(camera.position.y - target.y, 2) +
          Math.pow(camera.position.z - target.z, 2)
        );
        
        const distanceChanged = Math.abs(currentDistance - lastCameraDistance) > 0.1;
        lastCameraDistance = currentDistance;

        // Only trigger manual change for user interactions
        if (isUserInteracting || distanceChanged) {
          onManualCameraChange?.();
        }
      }, 16); // ~60fps throttling
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);
    controls.addEventListener('change', handleChange);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
      controls.removeEventListener('change', handleChange);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [camera, controlsRef, onCameraChange, onManualCameraChange, target, isAnimating]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={[target.x, target.y, target.z]}
      enabled={enabled} // Use the enabled prop
      enablePan={enabled}
      enableZoom={enabled}
      enableRotate={enabled}
      enableDamping={false}
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
  const [isMinimized, setIsMinimized] = React.useState(false);

  return (
    <div className="absolute top-4 right-4 z-10 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg">
      {/* Header with minimize/maximize button */}
      <div className="flex items-center justify-between p-2 border-b border-gray-600">
        <div className="text-xs text-gray-300 font-semibold">Camera Views</div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
          title={isMinimized ? "Expand camera controls" : "Minimize camera controls"}
          aria-label={isMinimized ? "Expand camera controls" : "Minimize camera controls"}
        >
          <span className="text-xs">
            {isMinimized ? '⬆' : '⬇'}
          </span>
        </button>
      </div>
      
      {/* Collapsible content */}
      {!isMinimized && (
        <div className="p-2">
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
      )}
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
    <div className="absolute bottom-4 left-4 z-10 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg -z-10">
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
  isAnimating?: boolean; // Add flag to prevent updates during animations
}

/**
 * Camera tracker component (renders inside Canvas to access camera)
 */
export const CameraTracker: React.FC<CameraTrackerProps> = ({
  onCameraUpdate,
  isAnimating = false
}) => {
  const { camera } = useThree();
  const lastPositionRef = useRef({ x: 0, y: 0, z: 0 });
  const frameCountRef = useRef(0);
  
  useFrame(() => {
    // Skip updates during animations to prevent conflicts
    if (isAnimating) return;
    
    // No delay after animation - allow immediate updates for responsive manual control
    
    // Throttle updates - only update every 5 frames for better responsiveness
    frameCountRef.current++;
    if (frameCountRef.current % 5 !== 0) return;
    
    const currentPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    
    // Only update if position actually changed significantly (avoid micro-movements)
    const tolerance = 0.1;
    const hasChanged = 
      Math.abs(currentPosition.x - lastPositionRef.current.x) > tolerance ||
      Math.abs(currentPosition.y - lastPositionRef.current.y) > tolerance ||
      Math.abs(currentPosition.z - lastPositionRef.current.z) > tolerance;
    
    if (hasChanged) {
      lastPositionRef.current = currentPosition;
      onCameraUpdate(currentPosition);
    }
  });
  
  return null; // This component doesn't render anything
};
