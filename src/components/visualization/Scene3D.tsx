import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MACHINE_ORIENTATION_CONFIGS } from '@/config/visualization/visualizationConfig';
import { 
  InteractiveStock, 
  ToolVisualization, 
  MachineTable, 
  HorizontalStage 
} from './MachineObjects';
import { CustomModelStock } from './CustomModelStock';
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
  onManualCameraChange?: () => void;
  onAnimationStateChange?: (isAnimating: boolean) => void; // Add animation state callback
  pivotMode: 'tool' | 'origin';
  modelFile?: File | null; // Add support for custom 3D model file
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
  onManualCameraChange,
  onAnimationStateChange,
  pivotMode,
  modelFile
}) => {
  const { camera } = useThree();
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Memoize model callbacks to prevent infinite reloads
  const handleModelLoad = useCallback((boundingBox: THREE.Box3) => {
    console.info('Model loaded with bounding box:', boundingBox);
  }, []);
  
  const handleModelError = useCallback((error: string) => {
    console.error('Error loading model:', error);
  }, []);
  
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
  const animationRef = useRef<{ 
    isAnimating: boolean; 
    animationId?: number; 
    isPresetAnimation?: boolean; // Flag to distinguish preset animations from other changes
  }>({ isAnimating: false });

  // Handle camera preset changes
  useEffect(() => {
    // Only animate if there's a valid preset and not already animating
    if (currentPreset && !animationRef.current.isAnimating) {
      console.log('Starting preset animation for:', currentPreset); // Debug log
      
      const targetPosition = cameraTarget;
      const newCameraPosition = calculateCameraPosition(
        currentPreset,
        geometry.workspaceBounds,
        machineSettings,
        targetPosition,
        machineOrientation
      );
      
      // Mark animation as starting
      animationRef.current.isAnimating = true;
      animationRef.current.isPresetAnimation = true; // Mark as preset animation
      setIsAnimating(true);
      onAnimationStateChange?.(true);
      
      // Animate camera to new position
      const duration = 600; // Reduced from 800ms for faster completion
      const startTime = Date.now();
      const startPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      };
      
      const animate = () => {
        // Check if animation was cancelled by manual interaction
        if (!animationRef.current.isAnimating) {
          console.log('Animation cancelled by manual interaction'); // Debug log
          return; // Exit immediately if animation was cancelled
        }
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Optimized easing function that finishes faster at the end
        const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
        const easedProgress = easeOutQuart(progress);
        
        // Interpolate camera position
        const currentPosition = {
          x: startPosition.x + (newCameraPosition.x - startPosition.x) * easedProgress,
          y: startPosition.y + (newCameraPosition.y - startPosition.y) * easedProgress,
          z: startPosition.z + (newCameraPosition.z - startPosition.z) * easedProgress
        };
        
        // Set camera position directly during animation (OrbitControls are disabled)
        camera.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
        camera.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
        camera.updateProjectionMatrix();
        
        // Calculate remaining distance to target for early termination
        const remainingDistance = Math.sqrt(
          Math.pow(newCameraPosition.x - currentPosition.x, 2) +
          Math.pow(newCameraPosition.y - currentPosition.y, 2) +
          Math.pow(newCameraPosition.z - currentPosition.z, 2)
        );
        
        // End animation early if movement becomes imperceptible (< 0.5 units) or progress complete
        if (progress < 1 && remainingDistance > 0.5) {
          animationRef.current.animationId = requestAnimationFrame(animate);
        } else {
          // Animation complete, mark as finished
          animationRef.current.isAnimating = false;
          animationRef.current.animationId = undefined;
          animationRef.current.isPresetAnimation = false; // Reset preset animation flag
          setIsAnimating(false);
          onAnimationStateChange?.(false);
          
          // Set final position and let controls handle the rest
          camera.position.set(newCameraPosition.x, newCameraPosition.y, newCameraPosition.z);
          camera.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
          camera.updateProjectionMatrix();
          
          // Don't call onCameraUpdate here - let the camera tracker handle it after controls are re-enabled
        }
      };
      
      // Start animation - ONLY call animate() once!
      animate();
      
      // Capture the current ref value for cleanup
      const animationState = animationRef.current;
      // Cleanup function to cancel animation if component unmounts or preset changes
      return () => {
        if (animationState.animationId) {
          cancelAnimationFrame(animationState.animationId);
          animationState.isAnimating = false;
          animationState.animationId = undefined;
          animationState.isPresetAnimation = false; // Reset preset animation flag
          setIsAnimating(false);
          onAnimationStateChange?.(false);
        }
      };
    }
  }, [currentPreset, geometry.workspaceBounds, machineSettings.machineOrientation, cameraTarget, camera, onCameraUpdate, onAnimationStateChange, machineOrientation, machineSettings]);

  // Handlers
  const handleControlsReady = useCallback((controls: { setPosition: (position: Position3D) => void }) => {
    controlsMethodsRef.current = controls;
    if (onControlsReady) {
      onControlsReady();
    }
  }, [onControlsReady]);

  // Handle manual camera change - cancel preset animations when user starts manual interaction
  const handleManualCameraChange = useCallback(() => {
    console.log('Manual camera change detected, animation state:', animationRef.current); // Debug log
    
    // Only cancel if this is a preset animation (not other types of camera changes)
    if (animationRef.current.animationId && animationRef.current.isPresetAnimation) {
      console.log('Cancelling preset animation due to manual interaction'); // Debug log
      cancelAnimationFrame(animationRef.current.animationId);
      animationRef.current.isAnimating = false;
      animationRef.current.animationId = undefined;
      animationRef.current.isPresetAnimation = false;
      setIsAnimating(false);
      onAnimationStateChange?.(false);
    }
    
    if (onManualCameraChange) {
      onManualCameraChange();
    }
  }, [onManualCameraChange, onAnimationStateChange]);

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
        {modelFile ? (
          <CustomModelStock 
            key={modelFile.name + modelFile.size + modelFile.lastModified}
            position={stockWorldPosition} 
            size={stockSize}
            modelFile={modelFile}
            onHover={showCoordinateHover ? setHoverPosition : undefined}
            onModelLoad={handleModelLoad}
            onModelError={handleModelError}
          />
        ) : (
          <InteractiveStock 
            position={stockWorldPosition} 
            size={stockSize}
            onHover={showCoordinateHover ? setHoverPosition : undefined}
          />
        )}

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
        {onCameraUpdate && <CameraTracker onCameraUpdate={onCameraUpdate} isAnimating={isAnimating} />}
      </group>

      {/* Enhanced Controls - outside the rotated workspace group */}
      <EnhancedOrbitControls 
        target={cameraTarget}
        machineSettings={machineSettings}
        enabled={!isAnimating} // Disable controls during animation
        isAnimating={isAnimating} // Pass animation state
        onControlsReady={handleControlsReady}
        onCameraChange={onCameraUpdate}
        onManualCameraChange={handleManualCameraChange}
      />
    </>
  );
};
