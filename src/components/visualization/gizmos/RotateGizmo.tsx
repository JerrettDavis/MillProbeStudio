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
  visible,
  machineOrientation: _machineOrientation
}) => {
  const { camera, raycaster, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredAxis, setHoveredAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    axis: 'x' | 'y' | 'z' | null;
    startAngle: number;
    lastAngle: number;
    center: THREE.Vector3;
    normal: THREE.Vector3;
  }>({
    isDragging: false,
    axis: null,
    startAngle: 0,
    lastAngle: 0,
    center: new THREE.Vector3(),
    normal: new THREE.Vector3()
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
  const handlePointerDown = useCallback((event: any, axis: 'x' | 'y' | 'z') => {
    event.stopPropagation();
    // Note: event.preventDefault() is not available in React Three Fiber events
    
    const ringData = ringConfig.find(r => r.axis === axis);
    if (!ringData?.enabled) return;

    // Calculate initial angle from center to mouse position
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    
    // Create a plane for the rotation axis
    const plane = new THREE.Plane(ringData.normal, 0);
    const center = new THREE.Vector3(...position);
    plane.setFromNormalAndCoplanarPoint(ringData.normal, center);
    
    const intersection = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, intersection)) {
      const toMouse = intersection.clone().sub(center);
      const startAngle = Math.atan2(
        toMouse.dot(getPerpendicularVector(ringData.normal)),
        toMouse.dot(getSecondPerpendicularVector(ringData.normal))
      );

      setDragState({
        isDragging: true,
        axis,
        startAngle,
        lastAngle: startAngle,
        center,
        normal: ringData.normal
      });

      onDragStart?.();
      gl.domElement.style.cursor = 'grabbing';
    }
  }, [camera, raycaster, ringConfig, position, gl.domElement]);

  const handlePointerUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: false, axis: null }));
      onDragEnd?.();
      gl.domElement.style.cursor = 'default';
    }
  }, [dragState.isDragging, onDragEnd, gl.domElement]);

  const handlePointerMove = useCallback((event: any) => {
    if (!dragState.isDragging || !dragState.axis) return;

    // Calculate current mouse angle
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    
    const plane = new THREE.Plane(dragState.normal, 0);
    plane.setFromNormalAndCoplanarPoint(dragState.normal, dragState.center);
    
    const intersection = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, intersection)) {
      const toMouse = intersection.clone().sub(dragState.center);
      const currentAngle = Math.atan2(
        toMouse.dot(getPerpendicularVector(dragState.normal)),
        toMouse.dot(getSecondPerpendicularVector(dragState.normal))
      );

      // Calculate incremental rotation from last angle
      let deltaAngle = currentAngle - dragState.lastAngle;
      
      // Handle angle wrapping (crossing 0/2π boundary)
      if (deltaAngle > Math.PI) {
        deltaAngle -= 2 * Math.PI;
      } else if (deltaAngle < -Math.PI) {
        deltaAngle += 2 * Math.PI;
      }
      
      // Only apply rotation if there's meaningful change
      if (Math.abs(deltaAngle) > 0.005) {
        // Scale down the rotation to make it less sensitive, but not too much
        const scaledDelta = deltaAngle * 0.8;
        
        // Create rotation euler based on axis
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
    }
  }, [dragState, camera, raycaster, onRotate, gl.domElement]);

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

// Helper functions to get perpendicular vectors for angle calculations
function getPerpendicularVector(normal: THREE.Vector3): THREE.Vector3 {
  if (Math.abs(normal.x) > 0.9) {
    return new THREE.Vector3(0, 1, 0);
  } else {
    return new THREE.Vector3(1, 0, 0);
  }
}

function getSecondPerpendicularVector(normal: THREE.Vector3): THREE.Vector3 {
  const first = getPerpendicularVector(normal);
  const second = new THREE.Vector3();
  second.crossVectors(normal, first).normalize();
  return second;
}
