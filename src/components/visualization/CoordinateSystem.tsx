import React from 'react';
import { Text, Html } from '@react-three/drei';
import { DEFAULT_VISUALIZATION_CONFIG } from '@/config/visualization/visualizationConfig';
import type { WorkspaceBounds } from '@/utils/visualization/machineGeometry';

export interface CoordinateAxesProps {
  size: number;
  origin?: [number, number, number];
}

/**
 * Coordinate system axes visualization
 */
export const CoordinateAxes: React.FC<CoordinateAxesProps> = ({
  size,
  origin = [0, 0, 0]
}) => {
  const colors = DEFAULT_VISUALIZATION_CONFIG.colors.axes;

  return (
    <group position={origin}>
      {/* X Axis - Red */}
      <mesh position={[size / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, size, 8]} />
        <meshBasicMaterial color={colors.x} />
      </mesh>
      <Text
        position={[size + 0.5, 0, 0]}
        fontSize={0.5}
        color={colors.x}
        anchorX="center"
        anchorY="middle"
      >
        X+
      </Text>
      
      {/* Y Axis - Green */}
      <mesh position={[0, size / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, size, 8]} />
        <meshBasicMaterial color={colors.y} />
      </mesh>
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.5}
        color={colors.y}
        anchorX="center"
        anchorY="middle"
      >
        Y+
      </Text>
      
      {/* Z Axis - Blue */}
      <mesh position={[0, 0, size / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, size, 8]} />
        <meshBasicMaterial color={colors.z} />
      </mesh>
      <Text
        position={[0, 0, size + 0.5]}
        fontSize={0.5}
        color={colors.z}
        anchorX="center"
        anchorY="middle"
      >
        Z+
      </Text>
    </group>
  );
};

export interface EnhancedAxisLabelsProps {
  workspaceBounds: WorkspaceBounds;
  units: string;
}

/**
 * Enhanced axis labels with min/max values
 */
export const EnhancedAxisLabels: React.FC<EnhancedAxisLabelsProps> = ({
  workspaceBounds,
  units
}) => {
  const colors = DEFAULT_VISUALIZATION_CONFIG.colors.axes;

  return (
    <group>
      {/* X Axis Labels */}
      <Text
        position={[workspaceBounds.minX - 3, workspaceBounds.centerY, 2]}
        fontSize={1.2}
        color={colors.x}
        anchorX="center"
        anchorY="middle"
      >
        X Min: {workspaceBounds.minX}{units}
      </Text>
      <Text
        position={[workspaceBounds.maxX + 3, workspaceBounds.centerY, 2]}
        fontSize={1.2}
        color={colors.x}
        anchorX="center"
        anchorY="middle"
      >
        X Max: {workspaceBounds.maxX}{units}
      </Text>
      
      {/* Y Axis Labels */}
      <Text
        position={[workspaceBounds.centerX, workspaceBounds.minY - 3, 2]}
        fontSize={1.2}
        color={colors.y}
        anchorX="center"
        anchorY="middle"
      >
        Y Min: {workspaceBounds.minY}{units}
      </Text>
      <Text
        position={[workspaceBounds.centerX, workspaceBounds.maxY + 3, 2]}
        fontSize={1.2}
        color={colors.y}
        anchorX="center"
        anchorY="middle"
      >
        Y Max: {workspaceBounds.maxY}{units}
      </Text>
      
      {/* Z Axis Labels */}
      <Text
        position={[workspaceBounds.centerX - 5, workspaceBounds.centerY - 5, workspaceBounds.minZ]}
        fontSize={1.2}
        color={colors.z}
        anchorX="center"
        anchorY="middle"
      >
        Z Min: {workspaceBounds.minZ}{units}
      </Text>
      <Text
        position={[workspaceBounds.centerX - 5, workspaceBounds.centerY - 5, workspaceBounds.maxZ + 2]}
        fontSize={1.2}
        color={colors.z}
        anchorX="center"
        anchorY="middle"
      >
        Z Max: {workspaceBounds.maxZ}{units}
      </Text>
    </group>
  );
};

export interface CoordinateHoverProps {
  position: [number, number, number] | null;
  units: string;
}

/**
 * Coordinate hover display component
 */
export const CoordinateHover: React.FC<CoordinateHoverProps> = ({
  position,
  units
}) => {
  if (!position) return null;
  
  return (
    <Html position={[position[0], position[1], position[2] + 2]}>
      <div className="bg-gray-900 bg-opacity-95 text-white px-3 py-2 rounded-lg text-sm font-mono whitespace-nowrap pointer-events-none border border-gray-600 shadow-lg">
        <div className="text-xs text-gray-300 mb-1">Coordinates:</div>
        <div className="space-y-1">
          <div>X: <span className="text-red-400">{position[0].toFixed(2)}</span>{units}</div>
          <div>Y: <span className="text-green-400">{position[1].toFixed(2)}</span>{units}</div>
          <div>Z: <span className="text-blue-400">{position[2].toFixed(2)}</span>{units}</div>
        </div>
      </div>
    </Html>
  );
};

export interface WorkspaceBoundsVisualizationProps {
  workspaceBounds: WorkspaceBounds;
}

/**
 * Machine workspace bounds visualization (wireframe)
 */
export const WorkspaceBoundsVisualization: React.FC<WorkspaceBoundsVisualizationProps> = ({
  workspaceBounds
}) => {
  return (
    <mesh position={[workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.centerZ]}>
      <boxGeometry args={[workspaceBounds.width, workspaceBounds.depth, workspaceBounds.height]} />
      <meshBasicMaterial 
        color={DEFAULT_VISUALIZATION_CONFIG.colors.workspace} 
        wireframe 
        opacity={0.3} 
        transparent 
      />
    </mesh>
  );
};
