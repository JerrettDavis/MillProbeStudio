import * as THREE from 'three';
import type { MachineSettings } from '@/types/machine';
import type { WorkspaceBounds, Position3D } from './machineGeometry';

export type CameraPreset = 'home' | 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'iso1' | 'iso2';

export interface CameraPresetConfig {
  key: CameraPreset;
  label: string;
  icon: string;
}

export interface CameraPosition {
  position: Position3D;
  target: Position3D;
}

/**
 * Available camera presets with their UI configuration
 */
export const CAMERA_PRESETS: CameraPresetConfig[] = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'front', label: 'Front', icon: '⬇️' },
  { key: 'back', label: 'Back', icon: '⬆️' },
  { key: 'right', label: 'Right', icon: '➡️' },
  { key: 'left', label: 'Left', icon: '⬅️' },
  { key: 'top', label: 'Top', icon: '⬆️' },
  { key: 'bottom', label: 'Bottom', icon: '⬇️' },
  { key: 'iso1', label: 'ISO 1', icon: '📐' },
  { key: 'iso2', label: 'ISO 2', icon: '📏' }
];

/**
 * Calculate camera position for a given preset
 */
export const calculateCameraPosition = (
  preset: CameraPreset,
  workspaceBounds: WorkspaceBounds,
  machineSettings: MachineSettings,
  target: Position3D,
  machineOrientation: 'vertical' | 'horizontal' = 'horizontal'
): Position3D => {
  const { X, Y, Z } = machineSettings.axes;
  const maxDimension = Math.max(workspaceBounds.width, workspaceBounds.depth, workspaceBounds.height);
  const distance = maxDimension * 1.5;

  switch (preset) {
    case 'home':
      if (machineOrientation === 'horizontal') {
        return {
          x: workspaceBounds.centerX - distance * 0.7,
          y: Y.max + distance * 0.8,
          z: workspaceBounds.centerZ - distance * 0.3
        };
      } else {
        return {
          x: workspaceBounds.centerX + distance * 0.7,
          y: workspaceBounds.centerY - distance * 0.7,
          z: workspaceBounds.centerZ + distance * 0.7
        };
      }

    case 'front':
      if (machineOrientation === 'horizontal') {
        return {
          x: X.min - distance,
          y: workspaceBounds.centerY,
          z: workspaceBounds.centerZ
        };
      } else {
        return {
          x: workspaceBounds.centerX,
          y: Y.min - distance,
          z: workspaceBounds.centerZ
        };
      }

    case 'back':
      if (machineOrientation === 'horizontal') {
        return {
          x: X.max + distance,
          y: workspaceBounds.centerY,
          z: workspaceBounds.centerZ
        };
      } else {
        return {
          x: workspaceBounds.centerX,
          y: Y.max + distance,
          z: workspaceBounds.centerZ
        };
      }

    case 'right':
      if (machineOrientation === 'horizontal') {
        return {
          x: workspaceBounds.centerX,
          y: Y.max + distance,
          z: workspaceBounds.centerZ
        };
      } else {
        return {
          x: X.max + distance,
          y: workspaceBounds.centerY,
          z: workspaceBounds.centerZ
        };
      }

    case 'left':
      if (machineOrientation === 'horizontal') {
        return {
          x: workspaceBounds.centerX,
          y: Y.min - distance,
          z: workspaceBounds.centerZ
        };
      } else {
        return {
          x: X.min - distance,
          y: workspaceBounds.centerY,
          z: workspaceBounds.centerZ
        };
      }

    case 'top':
      if (machineOrientation === 'horizontal') {
        return {
          x: workspaceBounds.centerX,
          y: workspaceBounds.centerY,
          z: Z.min - distance
        };
      } else {
        return {
          x: workspaceBounds.centerX,
          y: workspaceBounds.centerY,
          z: Z.max + distance
        };
      }

    case 'bottom':
      if (machineOrientation === 'horizontal') {
        return {
          x: workspaceBounds.centerX,
          y: workspaceBounds.centerY,
          z: Z.max + distance
        };
      } else {
        return {
          x: workspaceBounds.centerX,
          y: workspaceBounds.centerY,
          z: Z.min - distance
        };
      }

    case 'iso1':
      if (machineOrientation === 'horizontal') {
        return {
          x: X.max + distance * 0.7,
          y: Y.max + distance * 0.7,
          z: Z.min - distance * 0.7
        };
      } else {
        return {
          x: X.max + distance * 0.7,
          y: Y.min - distance * 0.7,
          z: Z.max + distance * 0.7
        };
      }

    case 'iso2':
      if (machineOrientation === 'horizontal') {
        return {
          x: X.min - distance * 0.7,
          y: Y.max + distance * 0.7,
          z: Z.max + distance * 0.7
        };
      } else {
        return {
          x: X.min - distance * 0.7,
          y: Y.max + distance * 0.7,
          z: Z.max + distance * 0.7
        };
      }

    default:
      return calculateCameraPosition('home', workspaceBounds, machineSettings, target, machineOrientation);
  }
};

/**
 * Calculate initial camera position based on machine settings
 */
export const calculateInitialCameraPosition = (
  machineSettings: MachineSettings,
  machineOrientation: 'vertical' | 'horizontal' = 'horizontal'
): Position3D => {
  const { X, Y, Z } = machineSettings.axes;
  const maxDimension = Math.max(
    Math.abs(X.max - X.min),
    Math.abs(Y.max - Y.min),
    Math.abs(Z.max - Z.min)
  );
  const distance = maxDimension * 1.5;

  if (machineOrientation === 'horizontal') {
    const centerX = (X.max + X.min) / 2;
    const centerZ = (Z.max + Z.min) / 2;
    return {
      x: centerX - distance * 0.7,
      y: Y.max + distance * 0.8,
      z: centerZ - distance * 0.3
    };
  } else {
    const centerX = (X.max + X.min) / 2;
    const centerY = (Y.max + Y.min) / 2;
    const centerZ = (Z.max + Z.min) / 2;
    return {
      x: centerX + distance * 0.7,
      y: centerY - distance * 0.7,
      z: centerZ + distance * 0.7
    };
  }
};

/**
 * Animate camera to new position with easing
 */
export const animateCameraToPosition = (
  camera: THREE.Camera,
  targetPosition: Position3D,
  targetLookAt: Position3D,
  controls: any,
  duration: number = 1000,
  onComplete?: () => void
): void => {
  const startPosition = camera.position.clone();
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    const newPosition = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y,
      targetPosition.z
    );
    
    camera.position.lerpVectors(startPosition, newPosition, easedProgress);
    camera.lookAt(new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z));
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      const targetVec = new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z);
      controls.target.copy(targetVec);
      controls.update();
      onComplete?.();
    }
  };

  animate();
};
