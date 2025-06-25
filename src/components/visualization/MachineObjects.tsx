import React, { useCallback, useState, useRef } from 'react';
import * as THREE from 'three';
import { DEFAULT_VISUALIZATION_CONFIG } from '@/config/visualization/visualizationConfig';

export interface InteractiveStockProps {
  position: [number, number, number];
  size: [number, number, number];
  onPositionChange?: (position: [number, number, number]) => void;
  onHover?: (position: [number, number, number] | null) => void;
}

/**
 * Interactive stock component with hover and drag capabilities
 */
export const InteractiveStock: React.FC<InteractiveStockProps> = ({
  position,
  size,
  onHover
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerMove = useCallback((event: { point: { x: number; y: number; z: number } }) => {
    if (onHover && isHovered) {
      const point = event.point;
      onHover([point.x, point.y, point.z]);
    }
  }, [onHover, isHovered]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  const getStockColor = () => {
    const colors = DEFAULT_VISUALIZATION_CONFIG.colors.stock;
    if (isDragging) return colors.dragging;
    if (isHovered) return colors.hovered;
    return colors.default;
  };

  return (
    <mesh 
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial 
        color={getStockColor()} 
        transparent 
        opacity={DEFAULT_VISUALIZATION_CONFIG.stockOpacity} 
      />
    </mesh>
  );
};

export interface ToolVisualizationProps {
  position: [number, number, number];
  diameter: number;
  length: number;
  onHover?: (position: [number, number, number] | null) => void;
  machineOrientation?: 'vertical' | 'horizontal';
}

/**
 * Tool visualization component with hover support
 */
export const ToolVisualization: React.FC<ToolVisualizationProps> = ({
  position,
  diameter,
  length,
  onHover
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerMove = useCallback((event: { point: { x: number; y: number; z: number } }) => {
    if (onHover && isHovered) {
      const point = event.point;
      onHover([point.x, point.y, point.z]);
    }
  }, [onHover, isHovered]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  const getToolColors = () => {
    const colors = DEFAULT_VISUALIZATION_CONFIG.colors.tool;
    return {
      shank: isHovered ? colors.shankhovered : colors.shank,
      tip: isHovered ? colors.tipHovered : colors.tip
    };
  };

  const colors = getToolColors();

  // Tool positioning is the same for both orientations in this refactored version
  // The difference is handled at the scene level through rotations
  return (
    <group position={position}>
      {/* Tool shank - extends upward from tip */}
      <mesh 
        position={[0, 0, length / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <cylinderGeometry args={[diameter / 2, diameter / 2, length, 16]} />
        <meshStandardMaterial color={colors.shank} />
      </mesh>
      
      {/* Tool tip indicator - at group position */}
      <mesh 
        position={[0, 0, 0]}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <sphereGeometry args={[diameter / 4, 8, 8]} />
        <meshStandardMaterial color={colors.tip} />
      </mesh>
    </group>
  );
};

export interface MachineTableProps {
  width: number;
  depth: number;
  height: number;
  position: [number, number, number];
}

/**
 * Machine table/bed component
 */
export const MachineTable: React.FC<MachineTableProps> = ({
  width,
  depth,
  height,
  position
}) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, depth, height]} />
      <meshStandardMaterial 
        color={DEFAULT_VISUALIZATION_CONFIG.colors.machineTable} 
        transparent 
        opacity={DEFAULT_VISUALIZATION_CONFIG.machineTableOpacity} 
      />
    </mesh>
  );
};

export interface HorizontalStageProps {
  height: number; // X dimension
  width: number;  // Y dimension  
  depth: number;  // Z dimension
  position: [number, number, number];
}

/**
 * Horizontal machine stage component
 */
export const HorizontalStage: React.FC<HorizontalStageProps> = ({
  height,
  width,
  depth,
  position
}) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[height, width, depth]} />
      <meshStandardMaterial color="#444444" transparent opacity={0.9} />
    </mesh>
  );
};
