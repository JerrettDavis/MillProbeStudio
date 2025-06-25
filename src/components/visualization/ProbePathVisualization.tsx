import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { ProbeOperation } from '@/types/machine';
import { DEFAULT_VISUALIZATION_CONFIG } from '@/config/visualization/visualizationConfig';

export interface ProbePathVisualizationProps {
  operations: ProbeOperation[];
  initialPosition: { X: number; Y: number; Z: number };
}

/**
 * Probe path visualization component
 */
export const ProbePathVisualization: React.FC<ProbePathVisualizationProps> = ({
  operations,
  initialPosition
}) => {
  const pathPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    let currentPos = { ...initialPosition };
    
    // Add initial position
    points.push(new THREE.Vector3(currentPos.X, currentPos.Y, currentPos.Z));
    
    operations.forEach((operation) => {
      // Add pre-moves
      operation.preMoves.forEach((move) => {
        if (move.type === 'rapid' && move.axesValues) {
          if (move.positionMode === 'relative') {
            currentPos.X += move.axesValues.X || 0;
            currentPos.Y += move.axesValues.Y || 0;
            currentPos.Z += move.axesValues.Z || 0;
          } else {
            currentPos.X = move.axesValues.X ?? currentPos.X;
            currentPos.Y = move.axesValues.Y ?? currentPos.Y;
            currentPos.Z = move.axesValues.Z ?? currentPos.Z;
          }
          points.push(new THREE.Vector3(currentPos.X, currentPos.Y, currentPos.Z));
        }
      });
      
      // Add probe move
      const probeEndPos = { ...currentPos };
      if (operation.axis === 'X') {
        probeEndPos.X += operation.distance * operation.direction;
      } else if (operation.axis === 'Y') {
        probeEndPos.Y += operation.distance * operation.direction;
      } else if (operation.axis === 'Z') {
        probeEndPos.Z += operation.distance * operation.direction;
      }
      points.push(new THREE.Vector3(probeEndPos.X, probeEndPos.Y, probeEndPos.Z));
      
      // Update current position after probe
      currentPos = probeEndPos;
      
      // Add post-moves
      operation.postMoves.forEach((move) => {
        if (move.type === 'rapid' && move.axesValues) {
          if (move.positionMode === 'relative') {
            currentPos.X += move.axesValues.X || 0;
            currentPos.Y += move.axesValues.Y || 0;
            currentPos.Z += move.axesValues.Z || 0;
          } else {
            currentPos.X = move.axesValues.X ?? currentPos.X;
            currentPos.Y = move.axesValues.Y ?? currentPos.Y;
            currentPos.Z = move.axesValues.Z ?? currentPos.Z;
          }
          points.push(new THREE.Vector3(currentPos.X, currentPos.Y, currentPos.Z));
        }
      });
    });
    
    return points;
  }, [operations, initialPosition]);
  
  if (pathPoints.length < 2) return null;
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(pathPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color={DEFAULT_VISUALIZATION_CONFIG.colors.probePath} 
        linewidth={3} 
      />
    </line>
  );
};
