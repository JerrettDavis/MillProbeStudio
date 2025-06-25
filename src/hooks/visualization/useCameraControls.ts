import { useState, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraPreset } from '@/utils/visualization/cameraPresets';
import { 
  calculateCameraPosition, 
  animateCameraToPosition 
} from '@/utils/visualization/cameraPresets';
import type { MachineSettings } from '@/types/machine';
import type { WorkspaceBounds, Position3D } from '@/utils/visualization/machineGeometry';

export interface UseCameraControlsProps {
  target: Position3D;
  workspaceBounds: WorkspaceBounds;
  machineSettings: MachineSettings;
  machineOrientation: 'vertical' | 'horizontal';
  onPresetChange?: (preset: CameraPreset) => void;
}

export interface CameraControls {
  currentPreset: CameraPreset;
  setPreset: (preset: CameraPreset) => void;
  isAnimating: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

/**
 * Hook for managing camera controls and presets
 */
export const useCameraControls = ({
  target,
  workspaceBounds,
  machineSettings,
  machineOrientation,
  onPresetChange
}: UseCameraControlsProps): CameraControls => {
  const { camera } = useThree();
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>('home');
  const [isAnimating, setIsAnimating] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const setPreset = useCallback((preset: CameraPreset) => {
    if (!controlsRef.current || isAnimating) return;
    
    setIsAnimating(true);
    
    const targetPosition = calculateCameraPosition(
      preset,
      workspaceBounds,
      machineSettings,
      target,
      machineOrientation
    );

    animateCameraToPosition(
      camera,
      targetPosition,
      target,
      controlsRef.current,
      1000,
      () => {
        setIsAnimating(false);
        setCurrentPreset(preset);
        onPresetChange?.(preset);
      }
    );
  }, [
    camera, 
    target, 
    workspaceBounds, 
    machineSettings, 
    machineOrientation, 
    isAnimating, 
    onPresetChange
  ]);

  return {
    currentPreset,
    setPreset,
    isAnimating,
    controlsRef
  };
};
