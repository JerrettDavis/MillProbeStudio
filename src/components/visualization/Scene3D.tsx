import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { MACHINE_ORIENTATION_CONFIGS } from '@/config/visualization/visualizationConfig';
import { 
  InteractiveStock, 
  ToolVisualization, 
  MachineTable, 
  HorizontalStage 
} from './MachineObjects';
import { 
  CoordinateAxes, 
  EnhancedAxisLabels, 
  CoordinateHover, 
  WorkspaceBoundsVisualization 
} from './CoordinateSystem';
import { ProbePathVisualization } from './ProbePathVisualization';
import { SceneLighting, SceneGrid, SceneFloor } from './SceneEnvironment';
import { EnhancedOrbitControls, CameraTracker } from './CameraSystem';
import { 
  calculateStockWorldPosition,
  type MachineGeometry 
} from '@/utils/visualization/machineGeometry';
import { 
  calculateCameraPosition,
  type CameraPreset
} from '@/utils/visualization/cameraPresets';
import { DEFAULT_VISUALIZATION_CONFIG } from '@/config/visualization/visualizationConfig';
import type { MachineSettings, ProbeSequenceSettings } from '@/types/machine';
import type { Position3D } from '@/utils/visualization/machineGeometry';

export interface Scene3DProps {
  machineSettings: MachineSettings;
  probeSequence?: ProbeSequenceSettings;
  geometry: MachineGeometry;
  stockSize: [number, number, number];
  stockPosition: [number, number, number];
  showAxisLabels?: boolean;
  showCoordinateHover?: boolean;
  currentPreset?: CameraPreset;
  onCameraUpdate?: (position: { x: number; y: number; z: number }) => void;
  onControlsReady?: () => void;
  pivotMode: 'tool' | 'origin';
}

/**
 * Main 3D scene component - declarative and configuration-driven
 */
export const Scene3D: React.FC<Scene3DProps> = ({
  machineSettings,
  probeSequence,
  geometry,
  stockSize,
  stockPosition,
  showAxisLabels = true,
  showCoordinateHover = true,
  currentPreset,
  onCameraUpdate,
  onControlsReady,
  pivotMode
}) => {
  const { camera } = useThree();
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);
  
  // Extract machine orientation and stage dimensions from machine settings
  const machineOrientation = machineSettings.machineOrientation;
  const stageDimensions = machineSettings.stageDimensions;
  
  // Get machine orientation configuration
  const orientationConfig = MACHINE_ORIENTATION_CONFIGS[machineOrientation];
  
  // Calculate camera target based on pivot mode
  const cameraTarget: Position3D = useMemo(() => {
    switch (pivotMode) {
      case 'origin':
        return { x: 0, y: 0, z: 0 };
      case 'tool':
      default:
        return geometry.toolPosition;
    }
  }, [geometry.toolPosition, pivotMode]);

  // Tool properties
  const toolDiameter = probeSequence?.endmillSize.sizeInMM || 6;

  // Calculate stock world position for display
  const stockWorldPosition = useMemo(() => {
    if (machineOrientation === 'horizontal') {
      const worldPos = calculateStockWorldPosition(
        geometry.stagePosition,
        stockSize,
        stockPosition,
        stageDimensions
      );
      return [worldPos.x, worldPos.y, worldPos.z] as [number, number, number];
    } else {
      return stockPosition;
    }
  }, [machineOrientation, geometry.stagePosition, stockSize, stockPosition, stageDimensions]);

  // Store reference to controls methods
  const controlsMethodsRef = useRef<{ setPosition: (position: Position3D) => void } | null>(null);

  // Handle camera preset changes
  useEffect(() => {
    if (currentPreset && onCameraUpdate) {
      const targetPosition = cameraTarget;
      const newCameraPosition = calculateCameraPosition(
        currentPreset,
        geometry.workspaceBounds,
        machineSettings,
        targetPosition,
        machineOrientation
      );
      
      // Animate camera to new position
      const duration = 1000; // 1 second animation
      const startTime = Date.now();
      const startPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      };
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        const easedProgress = easeInOutCubic(progress);
        
        // Interpolate camera position
        const currentPosition = {
          x: startPosition.x + (newCameraPosition.x - startPosition.x) * easedProgress,
          y: startPosition.y + (newCameraPosition.y - startPosition.y) * easedProgress,
          z: startPosition.z + (newCameraPosition.z - startPosition.z) * easedProgress
        };
        
        // Use controls methods to set position if available, otherwise set directly
        if (controlsMethodsRef.current) {
          controlsMethodsRef.current.setPosition(currentPosition);
        } else {
          camera.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
          camera.updateProjectionMatrix();
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete, notify parent
          onCameraUpdate({ 
            x: camera.position.x, 
            y: camera.position.y, 
            z: camera.position.z 
          });
        }
      };
      
      animate();
    }
  }, [currentPreset, geometry.workspaceBounds, machineSettings, cameraTarget, machineOrientation, camera, onCameraUpdate]);

  // Handlers
  const handleControlsReady = useCallback((controls: { setPosition: (position: Position3D) => void }) => {
    controlsMethodsRef.current = controls;
    if (onControlsReady) {
      onControlsReady();
    }
  }, [onControlsReady]);

  return (
    <>
      {/* Apply workspace rotation for machine orientation */}
      <group rotation={orientationConfig.workspaceRotation}>
        
        {/* Scene Lighting */}
        <SceneLighting 
          workspaceBounds={geometry.workspaceBounds}
          machineOrientation={machineOrientation}
        />

        {/* Machine Table */}
        {machineOrientation === 'horizontal' ? (
          <group>
            {/* Horizontal Stage */}
            <HorizontalStage 
              height={stageDimensions[0]} 
              width={stageDimensions[1]} 
              depth={stageDimensions[2]}
              position={[geometry.stagePosition.x, geometry.stagePosition.y, geometry.stagePosition.z]}
            />
          </group>
        ) : (
          <MachineTable 
            width={geometry.workspaceBounds.width * 1.2}
            depth={geometry.workspaceBounds.depth * 1.2}
            height={2}
            position={[
              geometry.workspaceBounds.centerX,
              geometry.workspaceBounds.centerY,
              geometry.workspaceBounds.minZ - 1
            ]}
          />
        )}

        {/* Coordinate System */}
        <CoordinateAxes 
          size={Math.max(geometry.workspaceBounds.width, geometry.workspaceBounds.depth) * 0.4}
          origin={[0, 0, 0]}
        />

        {/* Grid */}
        <SceneGrid
          workspaceBounds={geometry.workspaceBounds}
          machineOrientation={machineOrientation}
          units={machineSettings.units}
        />

        {/* Scene Floor for horizontal machines */}
        <SceneFloor
          workspaceBounds={geometry.workspaceBounds}
          machineOrientation={machineOrientation}
        />

        {/* Stock */}
        <InteractiveStock 
          position={stockWorldPosition} 
          size={stockSize}
          onHover={showCoordinateHover ? setHoverPosition : undefined}
        />

        {/* Coordinate hover display */}
        {showCoordinateHover && hoverPosition && (
          <CoordinateHover position={hoverPosition} units={machineSettings.units} />
        )}

        {/* Enhanced axis labels */}
        {showAxisLabels && (
          <EnhancedAxisLabels 
            workspaceBounds={geometry.workspaceBounds} 
            units={machineSettings.units} 
          />
        )}

        {/* Tool visualization */}
        <ToolVisualization 
          position={[geometry.toolPosition.x, geometry.toolPosition.y, geometry.toolPosition.z]}
          diameter={toolDiameter}
          length={DEFAULT_VISUALIZATION_CONFIG.toolLength}
          onHover={showCoordinateHover ? setHoverPosition : undefined}
        />

        {/* Probe path visualization */}
        {probeSequence && (
          <ProbePathVisualization 
            operations={probeSequence.operations}
            initialPosition={probeSequence.initialPosition}
          />
        )}

        {/* Machine workspace bounds visualization */}
        <WorkspaceBoundsVisualization workspaceBounds={geometry.workspaceBounds} />

        {/* Camera tracker for position updates */}
        {onCameraUpdate && <CameraTracker onCameraUpdate={onCameraUpdate} />}
      </group>

      {/* Enhanced Controls - outside the rotated workspace group */}
      <EnhancedOrbitControls 
        target={cameraTarget}
        machineSettings={machineSettings}
        onControlsReady={handleControlsReady}
      />
    </>
  );
};
