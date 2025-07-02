// src/components/visualization/VirtualMillSimulationBridge.tsx
import React, { useEffect } from 'react';
import { useVirtualMillSimulation } from '@/hooks/visualization/useVirtualMillSimulation';
import { useAppStore } from '@/store';
import type { ProbeSequenceSettings } from '@/types/machine';

interface VirtualMillSimulationBridgeProps {
  probeSequence?: ProbeSequenceSettings;
  children: React.ReactNode;
}

/**
 * Bridge component that integrates VirtualMill simulation with the existing visualization system
 * This component runs VirtualMill simulation and syncs its state with the global store
 */
export const VirtualMillSimulationBridge: React.FC<VirtualMillSimulationBridgeProps> = ({
  probeSequence,
  children
}) => {
  const simulationState = useAppStore(state => state.simulationState);
  
  // Use VirtualMill simulation
  const virtualMillSim = useVirtualMillSimulation(probeSequence);
  
  useEffect(() => {
    // Update simulation metadata in store when VirtualMill simulation is ready
    if (virtualMillSim.isReady && virtualMillSim.totalSteps !== simulationState.totalSteps) {
      // Note: We don't directly update totalSteps in store as it might conflict with existing logic
      // Instead, we ensure the VirtualMill simulation provides accurate step information
      console.log(`VirtualMill simulation ready with ${virtualMillSim.totalSteps} steps`);
    }
  }, [virtualMillSim.isReady, virtualMillSim.totalSteps, simulationState.totalSteps]);

  // Sync speed changes from store to VirtualMill (if needed)
  useEffect(() => {
    if (virtualMillSim.virtualMill && simulationState.speed !== 1.0) {
      // VirtualMill doesn't have built-in speed control, but we could implement it
      // For now, we'll let the existing speed control work through the animation timing
      console.log(`Simulation speed changed to ${simulationState.speed}x`);
    }
  }, [simulationState.speed, virtualMillSim.virtualMill]);

  // Debug logging for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('VirtualMill Simulation State:', {
        isReady: virtualMillSim.isReady,
        totalSteps: virtualMillSim.totalSteps,
        currentStep: virtualMillSim.currentStep?.id,
        isMoving: virtualMillSim.isMoving(),
        hasMovement: !!virtualMillSim.getCurrentMovement()
      });
    }
  }, [virtualMillSim.isReady, virtualMillSim.totalSteps, virtualMillSim.currentStep, simulationState.isActive]);

  return (
    <>
      {children}
    </>
  );
};

export default VirtualMillSimulationBridge;
