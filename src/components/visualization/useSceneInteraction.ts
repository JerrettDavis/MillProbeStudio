import { useRef, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneInteractionTool, SceneObject } from './SceneToolbar';

export interface SceneInteractionState {
  selectedTool: SceneInteractionTool;
  selectedObject: SceneObject;
  isDragging: boolean;
  dragStartPosition: THREE.Vector3 | null;
  objectStartPosition: THREE.Vector3 | null;
  objectStartRotation: THREE.Euler | null;
}

export interface SceneInteractionHookProps {
  onStockPositionChange?: (position: [number, number, number]) => void;
  onStockRotationChange?: (rotation: [number, number, number]) => void;
  onSpindlePositionChange?: (position: [number, number, number]) => void;
  onStagePositionChange?: (position: number) => void; // Only Z for stage
  machineOrientation: 'vertical' | 'horizontal';
}

/**
 * Hook for managing scene interaction state and handlers
 */
export const useSceneInteraction = ({
  onStockPositionChange,
  onStockRotationChange,
  onSpindlePositionChange,
  onStagePositionChange,
  machineOrientation
}: SceneInteractionHookProps) => {
  const { camera, raycaster } = useThree();
  const [interactionState, setInteractionState] = useState<SceneInteractionState>({
    selectedTool: 'select',
    selectedObject: 'none',
    isDragging: false,
    dragStartPosition: null,
    objectStartPosition: null,
    objectStartRotation: null,
  });

  const mousePosition = useRef(new THREE.Vector2());
  const lastMousePosition = useRef(new THREE.Vector2());

  // Handle tool change
  const handleToolChange = useCallback((tool: SceneInteractionTool) => {
    setInteractionState(prev => ({
      ...prev,
      selectedTool: tool,
      isDragging: false,
      dragStartPosition: null,
      objectStartPosition: null,
      objectStartRotation: null,
    }));
  }, []);

  // Handle object selection
  const handleObjectSelect = useCallback((object: SceneObject) => {
    setInteractionState(prev => ({
      ...prev,
      selectedObject: object,
      selectedTool: object === 'none' ? 'select' : prev.selectedTool,
    }));
  }, []);

  // Handle object deselection
  const handleObjectDeselect = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      selectedObject: 'none',
      selectedTool: 'select',
      isDragging: false,
      dragStartPosition: null,
      objectStartPosition: null,
      objectStartRotation: null,
    }));
  }, []);

  // Check if tool can be used with selected object
  const canMove = useCallback(() => {
    const { selectedObject } = interactionState;
    switch (selectedObject) {
      case 'stock':
      case 'model':
        return true;
      case 'spindle':
        return true; // Can move in available axes
      case 'stage':
        return true; // Can move up/down only
      default:
        return false;
    }
  }, [interactionState]);

  const canRotate = useCallback(() => {
    const { selectedObject } = interactionState;
    return selectedObject === 'stock' || selectedObject === 'model';
  }, [interactionState]);

  // Handle mouse down for drag operations
  const handleMouseDown = useCallback((event: MouseEvent, intersectedObject?: THREE.Object3D) => {
    if (interactionState.selectedTool === 'select') return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    mousePosition.current.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    lastMousePosition.current.copy(mousePosition.current);

    // Set up raycaster
    raycaster.setFromCamera(mousePosition.current, camera);

    // Get world position from intersection or object
    let worldPosition = new THREE.Vector3();
    if (intersectedObject) {
      intersectedObject.getWorldPosition(worldPosition);
    } else {
      // Use raycaster to find intersection with a plane
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      raycaster.ray.intersectPlane(plane, worldPosition);
    }

    setInteractionState(prev => ({
      ...prev,
      isDragging: true,
      dragStartPosition: worldPosition.clone(),
      objectStartPosition: intersectedObject ? intersectedObject.position.clone() : null,
      objectStartRotation: intersectedObject ? intersectedObject.rotation.clone() : null,
    }));
  }, [interactionState.selectedTool, camera, raycaster]);

  // Handle mouse move for drag operations
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!interactionState.isDragging || interactionState.selectedTool === 'select') return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    mousePosition.current.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const mouseDelta = mousePosition.current.clone().sub(lastMousePosition.current);
    lastMousePosition.current.copy(mousePosition.current);

    if (interactionState.selectedTool === 'move') {
      handleMoveOperation(mouseDelta);
    } else if (interactionState.selectedTool === 'rotate') {
      handleRotateOperation(mouseDelta);
    }
  }, [interactionState]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      isDragging: false,
      dragStartPosition: null,
      objectStartPosition: null,
      objectStartRotation: null,
    }));
  }, []);

  // Handle move operations
  const handleMoveOperation = useCallback((mouseDelta: THREE.Vector2) => {
    const { selectedObject } = interactionState;
    const movementScale = 50; // Adjust sensitivity

    switch (selectedObject) {
      case 'stock':
      case 'model':
        if (onStockPositionChange) {
          // Convert mouse movement to world coordinates
          const deltaX = mouseDelta.x * movementScale;
          const deltaY = -mouseDelta.y * movementScale; // Invert Y for intuitive movement
          const deltaZ = 0; // Z movement requires different input method
          
          // For now, just X and Y movement
          onStockPositionChange([deltaX, deltaY, deltaZ]);
        }
        break;
      case 'spindle':
        if (onSpindlePositionChange) {
          // Spindle movement depends on machine orientation
          if (machineOrientation === 'horizontal') {
            // Horizontal machines: Y and Z movement
            const deltaY = mouseDelta.x * movementScale;
            const deltaZ = -mouseDelta.y * movementScale;
            onSpindlePositionChange([0, deltaY, deltaZ]);
          } else {
            // Vertical machines: X and Y movement
            const deltaX = mouseDelta.x * movementScale;
            const deltaY = -mouseDelta.y * movementScale;
            onSpindlePositionChange([deltaX, deltaY, 0]);
          }
        }
        break;
      case 'stage':
        if (onStagePositionChange) {
          // Stage can only move up/down (Z axis)
          const deltaZ = -mouseDelta.y * movementScale;
          onStagePositionChange(deltaZ);
        }
        break;
    }
  }, [interactionState, onStockPositionChange, onSpindlePositionChange, onStagePositionChange, machineOrientation]);

  // Handle rotate operations
  const handleRotateOperation = useCallback((mouseDelta: THREE.Vector2) => {
    const { selectedObject } = interactionState;
    const rotationScale = 2; // Adjust sensitivity

    if ((selectedObject === 'stock' || selectedObject === 'model') && onStockRotationChange) {
      // Convert mouse movement to rotation
      const deltaRotationY = mouseDelta.x * rotationScale;
      const deltaRotationX = -mouseDelta.y * rotationScale;
      const deltaRotationZ = 0; // Z rotation requires different input method

      onStockRotationChange([deltaRotationX, deltaRotationY, deltaRotationZ]);
    }
  }, [interactionState, onStockRotationChange]);

  return {
    interactionState,
    handleToolChange,
    handleObjectSelect,
    handleObjectDeselect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    canMove: canMove(),
    canRotate: canRotate(),
  };
};
