import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneObject } from '../SceneToolbar';

interface MoveGizmoProps {
    position: [number, number, number];
    selectedObject: SceneObject;
    onMove: (delta: THREE.Vector3, axis?: 'x' | 'y' | 'z') => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    visible: boolean;
    machineOrientation: 'vertical' | 'horizontal';
}

interface GizmoAxis {
    axis: 'x' | 'y' | 'z';
    color: string;
    hoverColor: string;
    direction: THREE.Vector3;
    enabled: boolean;
}

// Throttle helper
const throttle = <T extends unknown[]>(fn: (...args: T) => void, delay: number) => {
  let lastCall = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  };
};

export const MoveGizmo: React.FC<MoveGizmoProps> = ({
    position,
    selectedObject,
    onMove,
    onDragStart,
    onDragEnd,
    visible,
    machineOrientation
}) => {
    const { camera, gl } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const lastMousePosition = useRef<THREE.Vector2>(new THREE.Vector2());
    const [hoveredAxis, setHoveredAxis] = useState<'x' | 'y' | 'z' | null>(null);
    const [dragState, setDragState] = useState({
        isDragging: false,
        axis: null as 'x' | 'y' | 'z' | null,
        startPosition: new THREE.Vector3()
    });

    // Throttled version of onMove to prevent excessive updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const throttledOnMove = useCallback(
        throttle((delta: THREE.Vector3, axis?: 'x' | 'y' | 'z') => {
            onMove(delta, axis);
        }, 50), // Throttle to max 20 updates per second
        [onMove]
    );

    const axisConfig = useMemo((): GizmoAxis[] => {
        const baseAxes: GizmoAxis[] = [
            { axis: 'x', color: '#ff0000', hoverColor: '#ff6666', direction: new THREE.Vector3(1, 0, 0), enabled: true },
            { axis: 'y', color: '#00ff00', hoverColor: '#66ff66', direction: new THREE.Vector3(0, 1, 0), enabled: true },
            { axis: 'z', color: '#0000ff', hoverColor: '#6666ff', direction: new THREE.Vector3(0, 0, 1), enabled: true }
        ];

        switch (selectedObject) {
            case 'stage':
                return baseAxes.map(a => ({ ...a, enabled: a.axis === 'z' }));
            case 'spindle':
                return baseAxes.map(a => ({
                    ...a,
                    enabled: machineOrientation === 'horizontal' ? a.axis === 'y' || a.axis === 'z' : true
                }));
            case 'stock':
            case 'model':
                return baseAxes;
            default:
                return baseAxes.map(a => ({ ...a, enabled: false }));
        }
    }, [selectedObject, machineOrientation]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePointerDown = useCallback((event: any, axis: 'x' | 'y' | 'z') => {
        event.stopPropagation();
        const rect = gl.domElement.getBoundingClientRect();
        const initialMouse = new THREE.Vector2(event.clientX - rect.left, event.clientY - rect.top);

        setDragState({
            isDragging: true,
            axis,
            startPosition: new THREE.Vector3(...position)
        });

        lastMousePosition.current = initialMouse.clone();
        onDragStart?.();
        gl.domElement.style.cursor = 'grabbing';
    }, [gl.domElement, onDragStart, position]);

    const handlePointerUp = useCallback(() => {
        if (dragState.isDragging) {
            setDragState({ isDragging: false, axis: null, startPosition: new THREE.Vector3() });
            onDragEnd?.();
            gl.domElement.style.cursor = 'default';
        }
    }, [dragState.isDragging, gl.domElement, onDragEnd]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePointerMove = useCallback((event: any) => {
        if (!dragState.isDragging || !dragState.axis) return;

        const rect = gl.domElement.getBoundingClientRect();
        const currentMouse = new THREE.Vector2(event.clientX - rect.left, event.clientY - rect.top);
        const mouseDelta = currentMouse.clone().sub(lastMousePosition.current);
        lastMousePosition.current = currentMouse.clone();

        const gizmoWorldPos = new THREE.Vector3(...position);
        const cameraDistance = camera.position.distanceTo(gizmoWorldPos);
        const baseSensitivity = cameraDistance * 0.005; // Reduced from 0.001 to make it less sensitive

        // Get the world axis direction for the current drag axis
        const axisDirection = new THREE.Vector3();
        axisDirection[dragState.axis === 'x' ? 'x' : dragState.axis === 'y' ? 'y' : 'z'] = 1;

        // Project the axis direction to screen space
        const axisStart = gizmoWorldPos.clone();
        const axisEnd = gizmoWorldPos.clone().add(axisDirection);
        
        // Convert world positions to screen coordinates
        const startScreen = axisStart.clone().project(camera);
        const endScreen = axisEnd.clone().project(camera);
        
        // Convert normalized device coordinates to screen pixels
        const canvas = gl.domElement;
        startScreen.x = (startScreen.x + 1) * canvas.width / 2;
        startScreen.y = (-startScreen.y + 1) * canvas.height / 2;
        endScreen.x = (endScreen.x + 1) * canvas.width / 2;
        endScreen.y = (-endScreen.y + 1) * canvas.height / 2;
        
        // Calculate the axis direction in screen space
        const screenAxisDirection = new THREE.Vector2(
            endScreen.x - startScreen.x,
            endScreen.y - startScreen.y
        ).normalize();
        
        // For horizontal mills, rotate Z-axis screen direction by 90 degrees CCW
        if (machineOrientation === 'horizontal' && dragState.axis === 'z') {
            // Rotate 90 degrees CCW: (x, y) -> (-y, x)
            const rotatedDirection = new THREE.Vector2(-screenAxisDirection.y, screenAxisDirection.x);
            screenAxisDirection.copy(rotatedDirection);
        }
        
        // Calculate movement by projecting mouse delta onto the screen axis direction
        const movement = mouseDelta.dot(screenAxisDirection) * baseSensitivity;

        if (Math.abs(movement) > 0.001) { // Add minimum threshold to prevent micro-movements
            const delta = new THREE.Vector3();
            delta[dragState.axis] = movement;
            throttledOnMove(delta, dragState.axis);
        }
    }, [dragState, position, camera, throttledOnMove, gl.domElement, machineOrientation]);

    const handlePointerEnter = useCallback((axis: 'x' | 'y' | 'z') => {
        if (!dragState.isDragging) {
            setHoveredAxis(axis);
            gl.domElement.style.cursor = 'grab';
        }
    }, [dragState.isDragging, gl.domElement]);

    const handlePointerLeave = useCallback(() => {
        if (!dragState.isDragging) {
            setHoveredAxis(null);
            gl.domElement.style.cursor = 'default';
        }
    }, [dragState.isDragging, gl.domElement]);

    useEffect(() => {
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

    const scale = useMemo(() => {
        const distance = camera.position.distanceTo(new THREE.Vector3(...position));
        return Math.max(2.0, Math.min(8.0, distance * 0.25));
    }, [camera.position, position]);

    if (!visible) return null;


    const getTransform = (axis: 'x' | 'y' | 'z', scalar: number) => {
        const dir = axisConfig.find(a => a.axis === axis)?.direction.clone().normalize() ?? new THREE.Vector3();
        const pos = dir.clone().multiplyScalar(scalar);
        const rot: [number, number, number] = axis === 'x'
            ? [0, 0, -Math.PI / 2]
            : axis === 'z'
                ? [Math.PI / 2, 0, 0]
                : [0, 0, 0];
        return { pos: pos.toArray() as [number, number, number], rot };
    };


    return (
        <group ref={groupRef} position={position} scale={scale} renderOrder={1500}>
            {axisConfig.map(axis => {
                const isHovered = hoveredAxis === axis.axis && !dragState.isDragging;
                const isDraggingThis = dragState.isDragging && dragState.axis === axis.axis;
                const shouldHighlight = isHovered || isDraggingThis;
                const color = axis.enabled ? (shouldHighlight ? axis.hoverColor : axis.color) : '#666666';
                const opacity = axis.enabled ? 1.0 : 0.3;

                const shaft = getTransform(axis.axis, 0.7);
                const head = getTransform(axis.axis, 1.6);
                const label = getTransform(axis.axis, 1.8);

                return (
                    <group key={axis.axis}>
                        {/* Shaft click area */}
                        <mesh
                            position={shaft.pos}
                            rotation={shaft.rot}
                            onPointerDown={(e) => handlePointerDown(e, axis.axis)}
                            onPointerEnter={() => handlePointerEnter(axis.axis)}
                            onPointerLeave={handlePointerLeave}
                            visible={false}
                            userData={{ testId: `${axis.axis}-axis-handle` }}
                            renderOrder={2000}
                        >
                            <cylinderGeometry args={[0.12, 0.12, 1.4]} />
                        </mesh>

                        {/* Head click area */}
                        <mesh
                            position={head.pos}
                            rotation={head.rot}
                            onPointerDown={(e) => handlePointerDown(e, axis.axis)}
                            onPointerEnter={() => handlePointerEnter(axis.axis)}
                            onPointerLeave={handlePointerLeave}
                            visible={false}
                            userData={{ testId: `${axis.axis}-axis-head` }}
                            renderOrder={2000}
                        >
                            <coneGeometry args={[0.18, 0.4]} />
                        </mesh>

                        {/* Shaft visible */}
                        <mesh position={shaft.pos} rotation={shaft.rot} visible={axis.enabled} renderOrder={1600}>
                            <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
                            <meshStandardMaterial 
                                color={color} 
                                transparent 
                                opacity={opacity} 
                                metalness={0.1} 
                                roughness={0.8} 
                                side={THREE.DoubleSide} 
                                depthWrite={true}
                                depthTest={true}
                            />
                        </mesh>

                        {/* Head visible */}
                        <mesh position={head.pos} rotation={head.rot} visible={axis.enabled} renderOrder={1600}>
                            <coneGeometry args={[0.15, 0.4, 16]} />
                            <meshStandardMaterial 
                                color={color} 
                                transparent 
                                opacity={opacity} 
                                metalness={0.1} 
                                roughness={0.8} 
                                side={THREE.DoubleSide} 
                                depthWrite={true}
                                depthTest={true}
                            />
                        </mesh>

                        {/* Label */}
                        {axis.enabled && (
                            <Text
                                position={label.pos}
                                fontSize={0.25}
                                color={color}
                                anchorX="center"
                                anchorY="middle"
                                renderOrder={1700}
                                material-transparent={true}
                                material-opacity={opacity}
                                material-depthTest={false}
                            >
                                {axis.axis.toUpperCase()}
                            </Text>
                        )}
                    </group>
                );
            })}

            {/* Center sphere */}
            <mesh>
                <sphereGeometry args={[0.06]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthTest={false} />
            </mesh>
        </group>
    );
};
