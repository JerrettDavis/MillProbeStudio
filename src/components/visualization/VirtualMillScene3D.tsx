// src/components/visualization/VirtualMillScene3D.tsx
import React from 'react';
import { Scene3D } from './Scene3D';
import { VirtualMillSimulationBridge, useVirtualMillContext } from './VirtualMillSimulationBridge';
import { CollisionIndicator } from './CollisionIndicator';
import type { Scene3DProps } from './Scene3D';

/**
 * Enhanced Scene3D component that uses VirtualMill as the simulation controller
 * This is a drop-in replacement for Scene3D that adds VirtualMill simulation capabilities
 */
const VirtualMillScene3DContent: React.FC<Scene3DProps> = (props) => {
  const virtualMillContext = useVirtualMillContext();
  
  return (
    <>
      <Scene3D {...props} />
      
      {/* VirtualMill collision indicators */}
      {virtualMillContext && (
        <CollisionIndicator 
          contactPoints={virtualMillContext.contactPoints}
          showContactPoints={true}
          contactPointSize={0.8}
          contactPointColor={virtualMillContext.hasCustomModel ? "#ff6644" : "#4466ff"}
        />
      )}
    </>
  );
};

export const VirtualMillScene3D: React.FC<Scene3DProps> = (props) => {
  return (
    <VirtualMillSimulationBridge probeSequence={props.probeSequence}>
      <VirtualMillScene3DContent {...props} />
    </VirtualMillSimulationBridge>
  );
};

export default VirtualMillScene3D;
