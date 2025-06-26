import { useMemo } from 'react';
import type { MachineSettings, ProbeSequenceSettings } from '@/types/machine';
import { calculateMachineGeometry, type MachineGeometry } from '@/utils/visualization/machineGeometry';

export interface UseMachineGeometryProps {
  machineSettings: MachineSettings;
  probeSequence?: ProbeSequenceSettings;
  stockSize: [number, number, number];
  stockPosition: [number, number, number];
}

/**
 * Hook for calculating machine geometry with memoization
 */
export const useMachineGeometry = ({
  machineSettings,
  probeSequence,
  stockSize,
  stockPosition
}: UseMachineGeometryProps): MachineGeometry => {
  return useMemo(() => {
    return calculateMachineGeometry(
      machineSettings,
      probeSequence,
      stockSize,
      stockPosition,
      machineSettings.machineOrientation,
      machineSettings.stageDimensions
    );
  }, [
    machineSettings,
    probeSequence,
    stockSize,
    stockPosition
  ]);
};
