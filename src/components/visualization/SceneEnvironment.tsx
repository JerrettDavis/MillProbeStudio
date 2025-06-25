import React from 'react';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { getLightingConfig, getGridConfig } from '@/config/visualization/visualizationConfig';
import type { WorkspaceBounds } from '@/utils/visualization/machineGeometry';

export interface SceneLightingProps {
  workspaceBounds: WorkspaceBounds;
  machineOrientation: 'vertical' | 'horizontal';
}

/**
 * Scene lighting component
 */
export const SceneLighting: React.FC<SceneLightingProps> = ({
  workspaceBounds,
  machineOrientation
}) => {
  const lightingConfig = getLightingConfig(workspaceBounds, machineOrientation);

  return (
    <>
      <ambientLight intensity={lightingConfig.ambient.intensity} />
      {lightingConfig.directional.map((light, index) => (
        <directionalLight
          key={`directional-${index}`}
          position={light.position}
          intensity={light.intensity}
        />
      ))}
      {lightingConfig.point.map((light, index) => (
        <pointLight
          key={`point-${index}`}
          position={light.position}
          intensity={light.intensity}
        />
      ))}
    </>
  );
};

export interface SceneGridProps {
  workspaceBounds: WorkspaceBounds;
  machineOrientation: 'vertical' | 'horizontal';
  units: string;
}

/**
 * Scene grid component
 */
export const SceneGrid: React.FC<SceneGridProps> = ({
  workspaceBounds,
  machineOrientation,
  units
}) => {
  const gridConfig = getGridConfig(machineOrientation, workspaceBounds, units);

  return (
    <Grid
      args={gridConfig.args}
      cellSize={gridConfig.cellSize}
      position={gridConfig.position}
      rotation={gridConfig.rotation}
      infiniteGrid={gridConfig.infiniteGrid}
      fadeDistance={gridConfig.fadeDistance}
      fadeStrength={gridConfig.fadeStrength}
      side={THREE.DoubleSide}
    />
  );
};

export interface SceneFloorProps {
  workspaceBounds: WorkspaceBounds;
  machineOrientation: 'vertical' | 'horizontal';
}

/**
 * Scene floor component for horizontal machines
 */
export const SceneFloor: React.FC<SceneFloorProps> = ({
  workspaceBounds,
  machineOrientation
}) => {
  if (machineOrientation !== 'horizontal') return null;

  return (
    <mesh position={[workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.minZ - 0.1]}>
      <planeGeometry args={[workspaceBounds.width * 1.2, workspaceBounds.depth * 1.2]} />
      <meshStandardMaterial 
        color="#2D5016" 
        transparent 
        opacity={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
