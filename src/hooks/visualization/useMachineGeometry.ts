import { useMemo } from 'react';
import type { MachineSettings, ProbeSequenceSettings } from '@/types/machine';
import { calculateMachineGeometry, type MachineGeometry } from '@/utils/visualization/machineGeometry';

export interface UseMachineGeometryProps {
  machineSettings: MachineSettings;
  probeSequence?: ProbeSequenceSettings;
  stockSize: [number, number, number];
  stockPosition: [number, number, number];
  machineOrientation: 'vertical' | 'horizontal';
  stageDimensions: [number, number, number];
}

/**
 * Hook for calculating machine geometry with memoization
 */
export const useMachineGeometry = ({
  machineSettings,
  probeSequence,
  stockSize,
  stockPosition,
  machineOrientation,
  stageDimensions
}: UseMachineGeometryProps): MachineGeometry => {
  return useMemo(() => {
    return calculateMachineGeometry(
      machineSettings,
      probeSequence,
      stockSize,
      stockPosition,
      machineOrientation,
      stageDimensions
    );
  }, [
    machineSettings,
    probeSequence,
    stockSize,
    stockPosition,
    machineOrientation,
    stageDimensions
  ]);
};
