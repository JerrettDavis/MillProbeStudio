// src/components/visualization/VirtualMillScene3D.tsx
import React from 'react';
import { Scene3D } from './Scene3D';
import { VirtualMillSimulationBridge } from './VirtualMillSimulationBridge';
import type { Scene3DProps } from './Scene3D';

/**
 * Enhanced Scene3D component that uses VirtualMill as the simulation controller
 * This is a drop-in replacement for Scene3D that adds VirtualMill simulation capabilities
 */
export const VirtualMillScene3D: React.FC<Scene3DProps> = (props) => {
  return (
    <VirtualMillSimulationBridge probeSequence={props.probeSequence}>
      <Scene3D {...props} />
    </VirtualMillSimulationBridge>
  );
};

export default VirtualMillScene3D;
