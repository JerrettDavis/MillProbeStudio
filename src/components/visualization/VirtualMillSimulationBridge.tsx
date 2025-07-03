// src/components/visualization/VirtualMillSimulationBridge.tsx
import React, { useEffect, createContext, useContext } from 'react';
import { useVirtualMillSimulation } from '@/hooks/visualization/useVirtualMillSimulation';
import { useAppStore } from '@/store';
import type { ProbeSequenceSettings } from '@/types/machine';
import type { Position3D } from '@/utils/machine/VirtualMill';

// Context to provide VirtualMill simulation data to child components
interface VirtualMillSimulationContext {
  contactPoints: Position3D[];
  hasCustomModel: boolean;
  clearContactPoints: () => void;
  isUsingVirtualMill: boolean;
}

const VirtualMillContext = createContext<VirtualMillSimulationContext | null>(null);

export const useVirtualMillContext = () => {
  const context = useContext(VirtualMillContext);
  return context;
};

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
  
  // Create context value
  const contextValue: VirtualMillSimulationContext = {
    contactPoints: virtualMillSim.contactPoints,
    hasCustomModel: virtualMillSim.hasCustomModel,
    clearContactPoints: virtualMillSim.clearContactPoints,
    isUsingVirtualMill: true
  };
  
  useEffect(() => {
    // Update simulation metadata in store when VirtualMill simulation is ready
    if (virtualMillSim.isReady && virtualMillSim.totalSteps !== simulationState?.totalSteps) {
      // Note: We don't directly update totalSteps in store as it might conflict with existing logic
      // Instead, we ensure the VirtualMill simulation provides accurate step information
      console.log(`VirtualMill simulation ready with ${virtualMillSim.totalSteps} steps`);
    }
  }, [virtualMillSim.isReady, virtualMillSim.totalSteps, simulationState?.totalSteps]);

  // Sync speed changes from store to VirtualMill (if needed)
  useEffect(() => {
    if (virtualMillSim.virtualMill && simulationState?.speed !== 1.0) {
      // VirtualMill doesn't have built-in speed control, but we could implement it
      // For now, we'll let the existing speed control work through the animation timing
      console.log(`Simulation speed changed to ${simulationState?.speed}x`);
    }
  }, [simulationState?.speed, virtualMillSim.virtualMill]);

  // Debug logging for development (only when key values change)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('VirtualMill Simulation State:', {
        isReady: virtualMillSim.isReady,
        totalSteps: virtualMillSim.totalSteps,
        currentStep: virtualMillSim.currentStep?.id,
        isMoving: virtualMillSim.isMoving(),
        contactPoints: virtualMillSim.contactPoints.length,
        hasCustomModel: virtualMillSim.hasCustomModel
      });
    }
  }, [
    virtualMillSim.isReady, 
    virtualMillSim.totalSteps, 
    virtualMillSim.currentStep?.id,
    virtualMillSim.contactPoints.length,
    virtualMillSim.hasCustomModel
  ]); // Only log when these specific values change

  return (
    <VirtualMillContext.Provider value={contextValue}>
      {children}
    </VirtualMillContext.Provider>
  );
};

export default VirtualMillSimulationBridge;
