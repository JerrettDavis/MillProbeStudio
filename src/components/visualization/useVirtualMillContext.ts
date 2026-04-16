import { createContext, useContext } from 'react';
import type { VirtualMillSimulationStep } from '@/hooks/visualization/useVirtualMillSimulation';
import type { Position3D } from '@/utils/machine/VirtualMill';

export interface VirtualMillSimulationContext {
  contactPoints: Position3D[];
  hasCustomModel: boolean;
  clearContactPoints: () => void;
  isUsingVirtualMill: boolean;
  totalSteps: number;
  currentStep: VirtualMillSimulationStep | null;
  currentGCodeLineIndex: number;
  isReady: boolean;
}

const VirtualMillContext = createContext<VirtualMillSimulationContext | null>(null);

export const useVirtualMillContext = () => {
  const context = useContext(VirtualMillContext);
  return context;
};

export { VirtualMillContext };