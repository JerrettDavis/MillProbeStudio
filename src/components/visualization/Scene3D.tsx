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
import { useSceneInteraction } from './useSceneInteraction';
import { MoveGizmo, RotateGizmo } from './gizmos';
import type { SceneInteractionTool, SceneObject } from './SceneToolbar';
import { 
  calculateToolPosition,
  type MachineGeometry 
} from '@/utils/visualization/machineGeometry';
import { 
  calculateCameraPosition,
  type CameraPreset
} from '@/utils/visualization/cameraPresets';
import { DEFAULT_VISUALIZATION_CONFIG } from '@/config/visualization/visualizationConfig';
import type { MachineSettings, ProbeSequenceSettings } from '@/types/machine';
import type { Position3D } from '@/utils/visualization/machineGeometry';
import useProbeSimulation from '@/hooks/visualization/useProbeSimulation';
import { useAppStore } from '@/store';

export interface Scene3DProps {
  machineSettings: MachineSettings;
  probeSequence?: ProbeSequenceSettings;
  geometry: MachineGeometry;
  stockSize: [number, number, number];
  stockPosition: [number, number, number];
  stockRotation?: [number, number, number];
  showAxisLabels?: boolean;
  showCoordinateHover?: boolean;
  currentPreset?: CameraPreset;
  onCameraUpdate?: (position: { x: number; y: number; z: number }) => void;
  onControlsReady?: () => void;
  onManualCameraChange?: () => void;
  onAnimationStateChange?: (isAnimating: boolean) => void;
  pivotMode: 'tool' | 'origin';
  modelFile?: File | null;
  // Scene interaction callbacks
  onStockPositionChange?: (position: [number, number, number]) => void;
  onStockRotationChange?: (rotation: [number, number, number]) => void;
  onSpindlePositionChange?: (position: [number, number, number]) => void;
  onStagePositionChange?: (position: number) => void;
  // Toolbar control callbacks
  onSceneInteractionChange?: (state: {
    selectedTool: SceneInteractionTool;
    selectedObject: SceneObject;
    canMove: boolean;
    canRotate: boolean;
    handleToolChange: (tool: SceneInteractionTool) => void;
    handleObjectDeselect: () => void;
  }) => void;
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
  stockRotation = [0, 0, 0],
  showAxisLabels = true,
  showCoordinateHover = true,
  currentPreset,
  onCameraUpdate,
  onControlsReady,
  onManualCameraChange,
  onAnimationStateChange,
  pivotMode,
  modelFile,
  onStockPositionChange,
  onStockRotationChange,
  onSpindlePositionChange,
  onStagePositionChange,
  onSceneInteractionChange
}) => {
  const { camera } = useThree();
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isGizmoDragging, setIsGizmoDragging] = useState(false);
  
  // Local rotation state for smooth gizmo interaction
  const [localRotationState, setLocalRotationState] = useState<{
    isActive: boolean;
    originalRotation: [number, number, number];
    accumulatedRotation: [number, number, number];
  }>({ 
    isActive: false, 
    originalRotation: [0, 0, 0],
    accumulatedRotation: [0, 0, 0] 
  });
  
  // Scene interaction hook
  const sceneInteraction = useSceneInteraction({
    onStockPositionChange,
    onStockRotationChange,
    onSpindlePositionChange,
    onStagePositionChange,
    machineOrientation: machineSettings.machineOrientation,
  });

  // Object selection handlers - only work in select mode and when not dragging gizmos
  const handleStockSelect = useCallback(() => {
    if (sceneInteraction.interactionState.selectedTool === 'select' && !isGizmoDragging) {
      sceneInteraction.handleObjectSelect(modelFile ? 'model' : 'stock');
    }
  }, [sceneInteraction, modelFile, isGizmoDragging]);

  const handleSpindleSelect = useCallback(() => {
    if (sceneInteraction.interactionState.selectedTool === 'select' && !isGizmoDragging) {
      sceneInteraction.handleObjectSelect('spindle');
    }
  }, [sceneInteraction, isGizmoDragging]);

  const handleStageSelect = useCallback(() => {
    if (sceneInteraction.interactionState.selectedTool === 'select' && !isGizmoDragging) {
      sceneInteraction.handleObjectSelect('stage');
    }
  }, [sceneInteraction, isGizmoDragging]);
  
  // Notify parent of scene interaction state changes
  useEffect(() => {
    if (onSceneInteractionChange) {
      onSceneInteractionChange({
        selectedTool: sceneInteraction.interactionState.selectedTool,
        selectedObject: sceneInteraction.interactionState.selectedObject,
        canMove: sceneInteraction.canMove,
        canRotate: sceneInteraction.canRotate,
        handleToolChange: sceneInteraction.handleToolChange,
        handleObjectDeselect: sceneInteraction.handleObjectDeselect,
      });
    }
  }, [
    sceneInteraction.interactionState.selectedTool,
    sceneInteraction.interactionState.selectedObject,
    sceneInteraction.canMove,
    sceneInteraction.canRotate,
    sceneInteraction.handleToolChange,
    sceneInteraction.handleObjectDeselect,
    onSceneInteractionChange
  ]);
  
  // Memoize model callbacks to prevent infinite reloads
  const handleModelLoad = useCallback((boundingBox: THREE.Box3) => {
    console.info('Model loaded with bounding box:', boundingBox);
  }, []);
  
  const handleModelError = useCallback((error: string) => {
    console.error('Error loading model:', error);
  }, []);
  
  // Simulation state and logic
  const simulationState = useAppStore(state => state.simulationState);
  const probeOps = probeSequence?.operations || [];
  const initialPosition = probeSequence?.initialPosition || { X: 0, Y: 0, Z: 0 };
  useProbeSimulation(probeOps, initialPosition); // Only call for side effect, do not assign
  
  // Extract machine orientation and stage dimensions from machine settings
  const machineOrientation = machineSettings.machineOrientation;
  const stageDimensions = machineSettings.stageDimensions;
  
  // Get machine orientation configuration
  const orientationConfig = MACHINE_ORIENTATION_CONFIGS[machineOrientation];
  
  // Tool properties
  const toolDiameter = probeSequence?.endmillSize.sizeInMM || 6;
  
  // Calculate effective tool position (simulation overrides normal position when active)
  const effectiveToolPosition = useMemo(() => {
    if (simulationState.isActive) {
      // Create a temporary probe sequence settings with the current simulation position
      const tempProbeSequence: ProbeSequenceSettings = {
        ...probeSequence,
        initialPosition: simulationState.currentPosition
      } as ProbeSequenceSettings;
      
      // Use the same coordinate transformation logic as the normal probe position
      return calculateToolPosition(machineSettings, tempProbeSequence, machineOrientation);
    } else {
      // Use geometry-calculated position when simulation is not active
      return geometry.toolPosition;
    }
  }, [simulationState.isActive, simulationState.currentPosition, geometry.toolPosition, machineSettings, probeSequence, machineOrientation]);
  
  // Calculate camera target based on pivot mode
  const cameraTarget: Position3D = useMemo(() => {
    switch (pivotMode) {
      case 'origin':
        return { x: 0, y: 0, z: 0 };
      case 'tool':
      default:
        return effectiveToolPosition;
    }
  }, [effectiveToolPosition, pivotMode]);

  // Use local accumulated rotation during drag, store rotation otherwise
  const effectiveStockRotation = useMemo((): [number, number, number] => {
    return localRotationState.isActive 
      ? localRotationState.accumulatedRotation 
      : stockRotation;
  }, [localRotationState.isActive, localRotationState.accumulatedRotation, stockRotation]);

  // Calculate stock world position for display (with virtual X grounding for horizontal)
  const stockWorldPosition = useMemo((): [number, number, number] => {
    if (machineOrientation === 'horizontal') {
      // 1. Compute the world position as usual (user offset)
      const stage = geometry.stagePosition;
      const dims = stageDimensions;
      const stageXPlusFace = stage.x + dims[0] / 2;
      const baseX = stageXPlusFace + stockSize[0] / 2 + stockPosition[0];
      const baseY = stage.y + stockPosition[1];
      const stageTop = stage.z + dims[2] / 2;
      const baseZ = stageTop + stockSize[2] / 2 + stockPosition[2];
      // 2. Compute the minimum X of the rotated box in world space
      const corners = [
        [-stockSize[0]/2, -stockSize[1]/2, -stockSize[2]/2],
        [-stockSize[0]/2, -stockSize[1]/2,  stockSize[2]/2],
        [-stockSize[0]/2,  stockSize[1]/2, -stockSize[2]/2],
        [-stockSize[0]/2,  stockSize[1]/2,  stockSize[2]/2],
        [ stockSize[0]/2, -stockSize[1]/2, -stockSize[2]/2],
        [ stockSize[0]/2, -stockSize[1]/2,  stockSize[2]/2],
        [ stockSize[0]/2,  stockSize[1]/2, -stockSize[2]/2],
        [ stockSize[0]/2,  stockSize[1]/2,  stockSize[2]/2],
      ];
      const euler = new THREE.Euler(effectiveStockRotation[0], effectiveStockRotation[1], effectiveStockRotation[2], 'XYZ');
      const worldXs = corners.map(([x, y, z]) => {
        const v = new THREE.Vector3(x, y, z);
        v.applyEuler(euler);
        v.x += baseX;
        v.y += baseY;
        v.z += baseZ;
        return v.x;
      });
      const minX = Math.min(...worldXs);
      // 3. Apply a virtual offset so the closest face is flush with the stage X+ face (X=stageXPlusFace)
      const virtualOffset = stageXPlusFace - minX;
      return [baseX + virtualOffset, baseY, baseZ];
    } else {
      // For vertical, use absolute
      return [stockPosition[0], stockPosition[1], stockPosition[2]];
    }
  }, [machineOrientation, geometry.stagePosition, stockSize, stockPosition, stageDimensions, effectiveStockRotation]);

  // NOTE: The stock grounding logic (ensuring the closest point is flush with the stage at X=0)
  // is handled upstream (typically in StockControls.tsx or a related utility). This component
  // expects that the provided stockPosition is already grounded correctly for any rotation.
  // If you need to verify grounding at runtime, add a debug log here:
  // if (process.env.NODE_ENV === 'development' && stockWorldPosition[0] !== 0) {
  //   console.warn('[Scene3D] Stock is not flush with stage (X != 0):', stockWorldPosition);
  // }

  // Gizmo interaction handlers
  const handleGizmoMove = useCallback((delta: THREE.Vector3, axis?: 'x' | 'y' | 'z') => {
    const selectedObject = sceneInteraction.interactionState.selectedObject;
    
    if (!axis) return; // Safety check - we need to know which axis is being moved
    
    switch (selectedObject) {
      case 'stock':
      case 'model':
        if (onStockPositionChange) {
          // Update only the specific axis in the stock position state
          const currentPos = stockPosition; // Use state position, not world position
          const newPosition: [number, number, number] = [...currentPos];
          
          // Map axis to array index and update only that axis
          const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
          newPosition[axisIndex] = currentPos[axisIndex] + delta[axis];
          
          console.log(`[Scene3D] Updating stock ${axis.toUpperCase()}-axis: ${currentPos[axisIndex].toFixed(3)} + ${delta[axis].toFixed(3)} = ${newPosition[axisIndex].toFixed(3)}`);
          console.log('[Scene3D] Calling onStockPositionChange with:', newPosition);
          onStockPositionChange(newPosition);
        } else {
          console.warn('[Scene3D] onStockPositionChange callback is undefined!');
        }
        break;
        
      case 'spindle':
        if (onSpindlePositionChange) {
          const currentPos = geometry.toolPosition;
          const newPosition: [number, number, number] = [
            axis === 'x' ? currentPos.x + delta.x : currentPos.x,
            axis === 'y' ? currentPos.y + delta.y : currentPos.y,
            axis === 'z' ? currentPos.z + delta.z : currentPos.z
          ];
          onSpindlePositionChange(newPosition);
        }
        break;
        
      case 'stage':
        if (onStagePositionChange && axis === 'z') {
          // Stage only moves in Z direction
          onStagePositionChange(geometry.stagePosition.z + delta.z);
        }
        break;
    }
  }, [
    sceneInteraction.interactionState.selectedObject,
    onStockPositionChange,
    onSpindlePositionChange,
    onStagePositionChange,
    stockPosition, // Use state position instead of world position
    geometry.toolPosition,
    geometry.stagePosition
  ]);

  // Gizmo drag state handlers
  const handleGizmoDragStart = useCallback(() => {
    setIsGizmoDragging(true);
    // Store original rotation and initialize accumulated rotation when drag starts
    setLocalRotationState({
      isActive: true,
      originalRotation: [...stockRotation],
      accumulatedRotation: [...stockRotation]
    });
  }, [stockRotation]);

  const handleGizmoDragEnd = useCallback(() => {
    setIsGizmoDragging(false);
    
    // Calculate delta rotation from original to accumulated and commit to store
    if (localRotationState.isActive && onStockRotationChange) {
      const deltaRotation: [number, number, number] = [
        localRotationState.accumulatedRotation[0] - localRotationState.originalRotation[0],
        localRotationState.accumulatedRotation[1] - localRotationState.originalRotation[1],
        localRotationState.accumulatedRotation[2] - localRotationState.originalRotation[2]
      ];
      onStockRotationChange(deltaRotation);
    }
    
    // Reset local rotation state
    setLocalRotationState({ 
      isActive: false, 
      originalRotation: [0, 0, 0],
      accumulatedRotation: [0, 0, 0] 
    });
  }, [localRotationState, onStockRotationChange]);

  const handleGizmoRotate = useCallback((delta: THREE.Euler) => {
    const selectedObject = sceneInteraction.interactionState.selectedObject;
    
    switch (selectedObject) {
      case 'stock':
      case 'model':
        if (localRotationState.isActive) {
          // During drag: accumulate rotation incrementally from the current position
          setLocalRotationState(prev => ({
            ...prev,
            accumulatedRotation: [
              prev.accumulatedRotation[0] + delta.x,
              prev.accumulatedRotation[1] + delta.y,
              prev.accumulatedRotation[2] + delta.z
            ]
          }));
        } else {
          // If not in drag state, apply rotation directly to store (fallback)
          if (onStockRotationChange) {
            onStockRotationChange([delta.x, delta.y, delta.z]);
          }
        }
        break;
        
      // Spindle and stage don't typically rotate in this application
    }
  }, [
    sceneInteraction.interactionState.selectedObject,
    localRotationState.isActive,
    onStockRotationChange
  ]);

  // Cleanup local rotation state if component unmounts during drag
  React.useEffect(() => {
    return () => {
      if (localRotationState.isActive && onStockRotationChange) {
        // Calculate and commit any pending rotation changes on unmount
        const deltaRotation: [number, number, number] = [
          localRotationState.accumulatedRotation[0] - localRotationState.originalRotation[0],
          localRotationState.accumulatedRotation[1] - localRotationState.originalRotation[1],
          localRotationState.accumulatedRotation[2] - localRotationState.originalRotation[2]
        ];
        onStockRotationChange(deltaRotation);
      }
    };
  }, [localRotationState.isActive, localRotationState.accumulatedRotation, localRotationState.originalRotation, onStockRotationChange]);

  // Calculate gizmo position based on selected object
  const gizmoPosition = useMemo((): [number, number, number] => {
    const selectedObject = sceneInteraction.interactionState.selectedObject;
    
    switch (selectedObject) {
      case 'stock':
      case 'model':
        return stockWorldPosition;
        
      case 'spindle':
        return [geometry.toolPosition.x, geometry.toolPosition.y, geometry.toolPosition.z];
        
      case 'stage':
        return [geometry.stagePosition.x, geometry.stagePosition.y, geometry.stagePosition.z];
        
      default:
        return [0, 0, 0];
    }
  }, [
    sceneInteraction.interactionState.selectedObject,
    stockWorldPosition,
    geometry.toolPosition,
    geometry.stagePosition
  ]);

  // Calculate gizmo rotation (for rotate gizmo)
  const gizmoRotation = useMemo((): [number, number, number] => {
    const selectedObject = sceneInteraction.interactionState.selectedObject;
    
    switch (selectedObject) {
      case 'stock':
      case 'model':
        return effectiveStockRotation;
      default:
        return [0, 0, 0];
    }
  }, [sceneInteraction.interactionState.selectedObject, effectiveStockRotation]);

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
      {/* Background plane for deselection - only in select mode */}
      {sceneInteraction.interactionState.selectedTool === 'select' && (
        <mesh
          position={[0, 0, -50]}
          onClick={(e) => {
            e.stopPropagation();
            sceneInteraction.handleObjectDeselect();
          }}
          visible={false}
        >
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {/* Apply workspace rotation for machine orientation */}
      <group rotation={orientationConfig.workspaceRotation}>
        
        {/* Scene Lighting */}
        <SceneLighting 
          workspaceBounds={geometry.workspaceBounds}
          machineOrientation={machineOrientation}
        />

        {/* Horizontal Stage */}
        {machineOrientation === 'horizontal' ? (
          <group>
            {/* Horizontal Stage */}
            <HorizontalStage 
              height={stageDimensions[0]} 
              width={stageDimensions[1]} 
              depth={stageDimensions[2]}
              position={[geometry.stagePosition.x, geometry.stagePosition.y, geometry.stagePosition.z]}
              onSelect={handleStageSelect}
              isSelected={sceneInteraction.interactionState.selectedObject === 'stage'}
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
        {/* --- Ground Stock logic is handled upstream ---
        The logic that ensures the closest X point of the stock (after rotation) is flush with the stage (X=0)
        is implemented in StockControls or upstream logic, not here. This applies to both box and custom STL stocks.
        If you need to debug or verify grounding, check the upstream logic and logs.
        
        Example debug (uncomment for development):
        console.debug('[Scene3D] Stock world position (should be grounded):', stockWorldPosition, 'Rotation:', effectiveStockRotation);
        */}
        {modelFile ? (
          <CustomModelStock 
            key={modelFile.name + modelFile.size + modelFile.lastModified}
            // Calculate the world position so that after rotation, the minimum X of the stock aligns with the stage X+ face
            position={stockWorldPosition}
            size={stockSize}
            rotation={effectiveStockRotation}
            modelFile={modelFile}
            onHover={showCoordinateHover && !isGizmoDragging ? setHoverPosition : undefined}
            onModelLoad={handleModelLoad}
            onModelError={handleModelError}
            onSelect={!isGizmoDragging ? handleStockSelect : undefined}
            isSelected={sceneInteraction.interactionState.selectedObject === 'model'}
          />
        ) : (
          <InteractiveStock 
            position={stockWorldPosition} 
            size={stockSize}
            rotation={effectiveStockRotation}
            onHover={showCoordinateHover && !isGizmoDragging ? setHoverPosition : undefined}
            onSelect={!isGizmoDragging ? handleStockSelect : undefined}
            isSelected={sceneInteraction.interactionState.selectedObject === 'stock'}
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
          position={[effectiveToolPosition.x, effectiveToolPosition.y, effectiveToolPosition.z]}
          diameter={toolDiameter}
          length={DEFAULT_VISUALIZATION_CONFIG.toolLength}
          onHover={showCoordinateHover && !isGizmoDragging ? setHoverPosition : undefined}
          onSelect={!isGizmoDragging ? handleSpindleSelect : undefined}
          isSelected={sceneInteraction.interactionState.selectedObject === 'spindle'}
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

        {/* Contact points visualization during simulation */}
        {simulationState.isActive && simulationState.contactPoints.map((contactPoint) => {
          // Transform contact point coordinates using the same logic as tool position
          const tempProbeSequence: ProbeSequenceSettings = {
            ...probeSequence,
            initialPosition: contactPoint.position
          } as ProbeSequenceSettings;
          
          const contactWorldPosition = calculateToolPosition(machineSettings, tempProbeSequence, machineOrientation);
          
          return (
            <group key={contactPoint.id}>
              {/* Contact point sphere */}
              <mesh position={[contactWorldPosition.x, contactWorldPosition.y, contactWorldPosition.z]}>
                <sphereGeometry args={[0.8, 12, 8]} />
                <meshBasicMaterial color="#ff4444" />
              </mesh>
              {/* Contact point glow effect */}
              <mesh position={[contactWorldPosition.x, contactWorldPosition.y, contactWorldPosition.z]}>
                <sphereGeometry args={[1.2, 8, 6]} />
                <meshBasicMaterial color="#ff4444" transparent opacity={0.3} />
              </mesh>
            </group>
          );
        })}

        {/* Interactive Gizmos */}
        {sceneInteraction.interactionState.selectedObject !== 'none' && (
          <>
            {/* Move Gizmo */}
            <MoveGizmo
              position={gizmoPosition}
              selectedObject={sceneInteraction.interactionState.selectedObject}
              onMove={handleGizmoMove}
              onDragStart={handleGizmoDragStart}
              onDragEnd={handleGizmoDragEnd}
              visible={sceneInteraction.interactionState.selectedTool === 'move'}
              machineOrientation={machineOrientation}
            />

            {/* Rotate Gizmo */}
            <RotateGizmo
              position={gizmoPosition}
              rotation={gizmoRotation}
              selectedObject={sceneInteraction.interactionState.selectedObject}
              onRotate={handleGizmoRotate}
              onDragStart={handleGizmoDragStart}
              onDragEnd={handleGizmoDragEnd}
              visible={sceneInteraction.interactionState.selectedTool === 'rotate'}
              machineOrientation={machineOrientation}
            />
          </>
        )}

        {/* Camera tracker for position updates */}
        {onCameraUpdate && <CameraTracker onCameraUpdate={onCameraUpdate} isAnimating={isAnimating} />}
      </group>

      {/* Enhanced Controls - outside the rotated workspace group */}
      <EnhancedOrbitControls 
        target={cameraTarget}
        machineSettings={machineSettings}
        enabled={!isAnimating && !isGizmoDragging} // Disable during animation or gizmo dragging
        isAnimating={isAnimating} // Pass animation state
        onControlsReady={handleControlsReady}
        onCameraChange={onCameraUpdate}        onManualCameraChange={handleManualCameraChange}
      />
    </>
  );
};
