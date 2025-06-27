import React, { useRef, useMemo, useCallback, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneObject } from '../SceneToolbar';

interface RotateGizmoProps {
  position: [number, number, number];
  rotation: [number, number, number];
  selectedObject: SceneObject;
  onRotate: (delta: THREE.Euler, axis?: 'x' | 'y' | 'z') => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  visible: boolean;
  machineOrientation: 'vertical' | 'horizontal';
}

interface RotationRing {
  axis: 'x' | 'y' | 'z';
  color: string;
  hoverColor: string;
  normal: THREE.Vector3;
  enabled: boolean;
}

/**
 * Interactive rotate gizmo with axis-constrained rotation
 */
export const RotateGizmo: React.FC<RotateGizmoProps> = ({
  position,
  rotation,
  selectedObject,
  onRotate,
  onDragStart,
  onDragEnd,
  visible
}) => {
  const { camera, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredAxis, setHoveredAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    axis: 'x' | 'y' | 'z' | null;
    startAngle: number;
    lastAngle: number;
    center: THREE.Vector3;
    normal: THREE.Vector3;
    hasMovedMouse: boolean;
    startRotation: [number, number, number]; // Store the rotation when drag started
  }>({
    isDragging: false,
    axis: null,
    startAngle: 0,
    lastAngle: 0,
    center: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    hasMovedMouse: false,
    startRotation: [0, 0, 0]
  });

  // Define rotation ring configurations based on object constraints
  const ringConfig = useMemo((): RotationRing[] => {
    const baseRings: RotationRing[] = [
      { 
        axis: 'x', 
        color: '#ff0000', 
        hoverColor: '#ff6666',
        normal: new THREE.Vector3(1, 0, 0),
        enabled: true
      },
      { 
        axis: 'y', 
        color: '#00ff00', 
        hoverColor: '#66ff66',
        normal: new THREE.Vector3(0, 1, 0),
        enabled: true
      },
      { 
        axis: 'z', 
        color: '#0000ff', 
        hoverColor: '#6666ff',
        normal: new THREE.Vector3(0, 0, 1),
        enabled: true
      }
    ];

    // Apply constraints based on selected object
    switch (selectedObject) {
      case 'stock':
      case 'model':
        // Stock/model can rotate around all axes
        return baseRings;
      
      case 'stage':
      case 'spindle':
        // Stage and spindle typically don't rotate in this application
        return baseRings.map(ring => ({ ...ring, enabled: false }));
      
      default:
        return baseRings.map(ring => ({ ...ring, enabled: false }));
    }
  }, [selectedObject]);

  // Handle pointer events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerDown = useCallback((event: any, axis: 'x' | 'y' | 'z') => {
    event.stopPropagation();
    // Note: event.preventDefault() is not available in React Three Fiber events
    
    const ringData = ringConfig.find(r => r.axis === axis);
    if (!ringData?.enabled) return;

    // Get mouse position in screen coordinates
    const rect = gl.domElement.getBoundingClientRect();
    const mouseScreen = new THREE.Vector2(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    // Calculate gizmo center in screen coordinates
    const gizmoCenter = new THREE.Vector3(...position);
    const gizmoCenterScreen = gizmoCenter.clone().project(camera);
    const centerScreen = new THREE.Vector2(
      (gizmoCenterScreen.x + 1) * rect.width / 2,
      (-gizmoCenterScreen.y + 1) * rect.height / 2
    );

    // Get the axis we're rotating around
    const axisVector = new THREE.Vector3();
    axisVector[axis === 'x' ? 'x' : axis === 'y' ? 'y' : 'z'] = 1;
    
    // Transform axis vector by current rotation to get the actual rotation axis in world space
    const currentRotation = new THREE.Euler(...rotation);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(currentRotation);
    const worldAxis = axisVector.clone().applyMatrix4(rotationMatrix).normalize();
    
    // Calculate two points on the ring circumference in world space to determine orientation
    const ringRadius = 1.2;
    const tangent1 = new THREE.Vector3();
    const tangent2 = new THREE.Vector3();
    
    // Find two perpendicular vectors to the axis to create tangent directions
    if (Math.abs(worldAxis.x) < 0.9) {
      tangent1.crossVectors(worldAxis, new THREE.Vector3(1, 0, 0)).normalize();
    } else {
      tangent1.crossVectors(worldAxis, new THREE.Vector3(0, 1, 0)).normalize();
    }
    tangent2.crossVectors(worldAxis, tangent1).normalize();
    
    // Create points on the ring circumference
    const ringPoint1 = gizmoCenter.clone().add(tangent1.clone().multiplyScalar(ringRadius));
    const ringPoint2 = gizmoCenter.clone().add(tangent2.clone().multiplyScalar(ringRadius));
    
    // Project ring points to screen space
    const ringPoint1Screen = ringPoint1.clone().project(camera);
    const ringPoint2Screen = ringPoint2.clone().project(camera);
    
    // Convert to pixel coordinates
    const point1Screen = new THREE.Vector2(
      (ringPoint1Screen.x + 1) * rect.width / 2,
      (-ringPoint1Screen.y + 1) * rect.height / 2
    );
    const point2Screen = new THREE.Vector2(
      (ringPoint2Screen.x + 1) * rect.width / 2,
      (-ringPoint2Screen.y + 1) * rect.height / 2
    );
    
    // Calculate the ring's orientation in screen space
    const ringDirection = point2Screen.clone().sub(point1Screen).normalize();
    const ringNormal = new THREE.Vector2(-ringDirection.y, ringDirection.x); // Perpendicular to ring direction
    
    // Calculate initial angle in the ring's coordinate system
    const currentMouseVector = mouseScreen.clone().sub(centerScreen);
    const startAngle = Math.atan2(
      currentMouseVector.dot(ringNormal),
      currentMouseVector.dot(ringDirection)
    );

    setDragState({
      isDragging: true,
      axis,
      startAngle,
      lastAngle: startAngle,
      center: gizmoCenter,
      normal: ringData.normal, // Store original normal for rotation calculation
      hasMovedMouse: false,
      startRotation: [...rotation]
    });

    onDragStart?.();
    gl.domElement.style.cursor = 'grabbing';
  }, [camera, gl.domElement, ringConfig, position, rotation, onDragStart]);

  const handlePointerUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({ 
        ...prev, 
        isDragging: false, 
        axis: null,
        hasMovedMouse: false,
        startRotation: [0, 0, 0]
      }));
      onDragEnd?.();
      gl.domElement.style.cursor = 'default';
    }
  }, [dragState.isDragging, onDragEnd, gl.domElement]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerMove = useCallback((event: any) => {
    if (!dragState.isDragging || !dragState.axis) return;

    // Get current mouse position in screen coordinates
    const rect = gl.domElement.getBoundingClientRect();
    const mouseScreen = new THREE.Vector2(
      event.clientX - rect.left,
      event.clientY - rect.top
    );

    // Calculate gizmo center in screen coordinates  
    const gizmoCenterScreen = dragState.center.clone().project(camera);
    const centerScreen = new THREE.Vector2(
      (gizmoCenterScreen.x + 1) * rect.width / 2,
      (-gizmoCenterScreen.y + 1) * rect.height / 2
    );

    // Get the axis we're rotating around
    const axisVector = new THREE.Vector3();
    axisVector[dragState.axis === 'x' ? 'x' : dragState.axis === 'y' ? 'y' : 'z'] = 1;
    
    // Transform axis vector by current rotation to get the actual rotation axis in world space
    const currentRotation = new THREE.Euler(...rotation);
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(currentRotation);
    const worldAxis = axisVector.clone().applyMatrix4(rotationMatrix).normalize();
    
    // Convert world axis to screen space to determine the rotation plane orientation
    const worldAxisScreen = worldAxis.clone().project(camera);
    
    // Calculate two points on the ring circumference in world space
    const ringRadius = 1.2;
    const tangent1 = new THREE.Vector3();
    const tangent2 = new THREE.Vector3();
    
    // Find two perpendicular vectors to the axis to create tangent directions
    if (Math.abs(worldAxis.x) < 0.9) {
      tangent1.crossVectors(worldAxis, new THREE.Vector3(1, 0, 0)).normalize();
    } else {
      tangent1.crossVectors(worldAxis, new THREE.Vector3(0, 1, 0)).normalize();
    }
    tangent2.crossVectors(worldAxis, tangent1).normalize();
    
    // Create points on the ring circumference
    const ringPoint1 = dragState.center.clone().add(tangent1.clone().multiplyScalar(ringRadius));
    const ringPoint2 = dragState.center.clone().add(tangent2.clone().multiplyScalar(ringRadius));
    
    // Project ring points to screen space
    const ringPoint1Screen = ringPoint1.clone().project(camera);
    const ringPoint2Screen = ringPoint2.clone().project(camera);
    
    // Convert to pixel coordinates
    const point1Screen = new THREE.Vector2(
      (ringPoint1Screen.x + 1) * rect.width / 2,
      (-ringPoint1Screen.y + 1) * rect.height / 2
    );
    const point2Screen = new THREE.Vector2(
      (ringPoint2Screen.x + 1) * rect.width / 2,
      (-ringPoint2Screen.y + 1) * rect.height / 2
    );
    
    // Calculate the ring's orientation in screen space
    const ringDirection = point2Screen.clone().sub(point1Screen).normalize();
    const ringNormal = new THREE.Vector2(-ringDirection.y, ringDirection.x); // Perpendicular to ring direction
    
    // Calculate mouse movement relative to ring center
    const currentMouseVector = mouseScreen.clone().sub(centerScreen);
    const lastMouseVector = new THREE.Vector2();
    
    // Calculate previous mouse position from stored angle
    lastMouseVector.x = Math.cos(dragState.lastAngle) * currentMouseVector.length();
    lastMouseVector.y = Math.sin(dragState.lastAngle) * currentMouseVector.length();
    
    // Calculate current angle in the ring's coordinate system
    const currentAngle = Math.atan2(
      currentMouseVector.dot(ringNormal),
      currentMouseVector.dot(ringDirection)
    );
    
    // Calculate incremental rotation from last angle
    let deltaAngle = currentAngle - dragState.lastAngle;
    
    // Handle angle wrapping (crossing 0/2π boundary)
    if (deltaAngle > Math.PI) {
      deltaAngle -= 2 * Math.PI;
    } else if (deltaAngle < -Math.PI) {
      deltaAngle += 2 * Math.PI;
    }
    
    // Only start applying rotation after mouse has moved significantly
    if (!dragState.hasMovedMouse) {
      // Check if mouse has moved enough to start rotation
      const angleDifferenceFromStart = Math.abs(currentAngle - dragState.startAngle);
      const minAngleThreshold = 0.02; // Minimum angle movement to start rotation (about 1 degree)
      
      if (angleDifferenceFromStart > minAngleThreshold) {
        // Mouse has moved enough, start tracking movements
        setDragState(prev => ({
          ...prev,
          hasMovedMouse: true,
          lastAngle: currentAngle // Reset lastAngle to current to avoid jump
        }));
      }
      // Don't send any rotation updates until mouse has moved significantly
      return;
    }
    
    // Only apply rotation if there's meaningful change
    if (Math.abs(deltaAngle) > 0.005) {
      // Scale the rotation for better sensitivity
      let scaledDelta = deltaAngle * 1.6;
      
      // Determine if we need to flip the rotation direction based on the camera view
      // If the axis is pointing toward the camera, we need to flip the rotation
      if (worldAxisScreen.z > 0) {
        scaledDelta = -scaledDelta;
      }
      
      // Create rotation euler based on the axis
      const deltaRotation = new THREE.Euler();
      switch (dragState.axis) {
        case 'x':
          deltaRotation.x = scaledDelta;
          break;
        case 'y':
          deltaRotation.y = scaledDelta;
          break;
        case 'z':
          deltaRotation.z = scaledDelta;
          break;
      }

      onRotate(deltaRotation, dragState.axis);
      
      // Update last angle for next frame
      setDragState(prev => ({
        ...prev,
        lastAngle: currentAngle
      }));
    }
  }, [dragState, camera, onRotate, gl.domElement, rotation]);

  // Handle mouse hover
  const handlePointerEnter = useCallback((axis: 'x' | 'y' | 'z') => {
    const ringData = ringConfig.find(r => r.axis === axis);
    if (ringData?.enabled && !dragState.isDragging) {
      setHoveredAxis(axis);
      gl.domElement.style.cursor = 'grab';
    }
  }, [ringConfig, dragState.isDragging, gl.domElement]);

  const handlePointerLeave = useCallback(() => {
    if (!dragState.isDragging) {
      setHoveredAxis(null);
      gl.domElement.style.cursor = 'default';
    }
  }, [dragState.isDragging, gl.domElement]);

  // Clear hover state when dragging starts
  React.useEffect(() => {
    if (dragState.isDragging) {
      setHoveredAxis(null);
    }
  }, [dragState.isDragging]);

  // Reset drag state if rotation changes significantly while not dragging
  React.useEffect(() => {
    if (!dragState.isDragging) {
      // Only reset if rotation has changed from what we stored
      const rotationChanged = dragState.startRotation.some((val, idx) => 
        Math.abs(val - rotation[idx]) > 0.01
      );
      if (rotationChanged) {
        setDragState(prev => ({
          ...prev,
          startRotation: [...rotation]
        }));
      }
    }
  }, [rotation, dragState.isDragging, dragState.startRotation]);

  // Add global event listeners for drag operations
  React.useEffect(() => {
    if (dragState.isDragging) {
      const canvas = gl.domElement;
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [dragState.isDragging, handlePointerMove, handlePointerUp, gl.domElement]);

  // Scale gizmo based on camera distance for consistent size
  const scale = useMemo(() => {
    const distance = camera.position.distanceTo(new THREE.Vector3(...position));
    // Balanced size - noticeable but not overwhelming
    return Math.max(1.5, Math.min(6.0, distance * 0.2));
  }, [camera.position, position]);

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale} renderOrder={1000}>
      {ringConfig.map((ring) => {
        const isHovered = hoveredAxis === ring.axis && !dragState.isDragging;
        const isDraggingThisAxis = dragState.isDragging && dragState.axis === ring.axis;
        const shouldHighlight = isHovered || isDraggingThisAxis;
        const color = ring.enabled ? (shouldHighlight ? ring.hoverColor : ring.color) : '#666666';
        const opacity = ring.enabled ? (shouldHighlight ? 0.9 : 0.7) : 0.2;

        return (
          <group key={ring.axis}>
            {/* Invisible larger click area */}
            <mesh
              rotation={
                ring.axis === 'x' ? [0, Math.PI / 2, 0] :
                ring.axis === 'y' ? [Math.PI / 2, 0, 0] :
                [0, 0, 0]
              }
              onPointerDown={(e) => handlePointerDown(e, ring.axis)}
              onPointerEnter={() => handlePointerEnter(ring.axis)}
              onPointerLeave={handlePointerLeave}
              visible={false}
            >
              <torusGeometry args={[1.2, 0.4, 8, 32]} />
            </mesh>

            {/* Rotation ring - visual only */}
            <mesh
              rotation={
                ring.axis === 'x' ? [0, Math.PI / 2, 0] :
                ring.axis === 'y' ? [Math.PI / 2, 0, 0] :
                [0, 0, 0]
              }
              visible={ring.enabled}
            >
              <torusGeometry args={[1.2, 0.06, 8, 32]} />
              <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={opacity}
                depthTest={false}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Ring highlights for better visibility */}
            {ring.enabled && (isHovered || isDraggingThisAxis) && (
              <mesh
                rotation={
                  ring.axis === 'x' ? [0, Math.PI / 2, 0] :
                  ring.axis === 'y' ? [Math.PI / 2, 0, 0] :
                  [0, 0, 0]
                }
              >
                <torusGeometry args={[1.2, 0.08, 8, 32]} />
                <meshBasicMaterial 
                  color={ring.hoverColor} 
                  transparent 
                  opacity={0.3}
                  depthTest={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Center sphere for visual reference */}
      <mesh>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.8}
          depthTest={false}
        />
      </mesh>
    </group>
  );
};
