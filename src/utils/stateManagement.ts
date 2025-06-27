// src/utils/stateManagement.ts
// Declarative state management utilities

import { useCallback, useMemo } from 'react';
import { arrays } from './functional';
import type { ProbeOperation, ProbeSequenceSettings, MovementStep } from '@/types/machine';

// Type-safe state updaters
export const useProbeSequenceState = (
  probeSequence: ProbeOperation[],
  setProbeSequence: (sequence: ProbeOperation[]) => void
) => {
  return useMemo(() => ({
    // Add new probe operation
    addProbe: (template?: Partial<ProbeOperation>) => {
      const defaultProbe: ProbeOperation = {
        id: `probe-${Date.now()}`,
        axis: 'Y',
        direction: -1,
        distance: 25,
        feedRate: 10,
        backoffDistance: 1,
        wcsOffset: 0,
        preMoves: [],
        postMoves: [],
        ...template
      };
      setProbeSequence([...probeSequence, defaultProbe]);
    },

    // Update specific probe
    updateProbe: (id: string, updates: Partial<ProbeOperation>) => {
      setProbeSequence(
        arrays.updateByProperty(probeSequence, 'id', id, updates)
      );
    },

    // Remove probe
    removeProbe: (id: string) => {
      setProbeSequence(probeSequence.filter(probe => probe.id !== id));
    },

    // Add movement step to probe
    addMovement: (probeId: string, moveType: 'preMoves' | 'postMoves', template?: Partial<MovementStep>) => {
      const defaultStep: MovementStep = {
        id: `step-${Date.now()}`,
        type: 'rapid',
        description: moveType === 'preMoves' ? 'Position for probe' : 'Move away from surface',
        axesValues: {},
        positionMode: 'relative',
        coordinateSystem: 'none',
        ...template
      };

      setProbeSequence(
        probeSequence.map(probe =>
          probe.id === probeId
            ? { ...probe, [moveType]: [...probe[moveType], defaultStep] }
            : probe
        )
      );
    },

    // Update movement step
    updateMovement: (
      probeId: string,
      stepId: string,
      moveType: 'preMoves' | 'postMoves',
      updates: Partial<MovementStep>
    ) => {
      setProbeSequence(
        probeSequence.map(probe =>
          probe.id === probeId
            ? {
                ...probe,
                [moveType]: arrays.updateByProperty(probe[moveType], 'id', stepId, updates)
              }
            : probe
        )
      );
    },

    // Remove movement step
    removeMovement: (probeId: string, stepId: string, moveType: 'preMoves' | 'postMoves') => {
      setProbeSequence(
        probeSequence.map(probe =>
          probe.id === probeId
            ? {
                ...probe,
                [moveType]: probe[moveType].filter(step => step.id !== stepId)
              }
            : probe
        )
      );
    }
  }), [probeSequence, setProbeSequence]);
};

// Settings state management
export const useProbeSequenceSettings = (
  settings: ProbeSequenceSettings,
  setSettings: (settings: ProbeSequenceSettings) => void
) => {
  // Define callbacks at the hook level, not in useMemo
  const updateInitialPosition = useCallback((axis: 'X' | 'Y' | 'Z', value: number) => {
    setSettings({
      ...settings,
      initialPosition: { ...settings.initialPosition, [axis]: value }
    });
  }, [settings, setSettings]);

  const updateDwellsBeforeProbe = useCallback((value: number) => {
    setSettings({ ...settings, dwellsBeforeProbe: value });
  }, [settings, setSettings]);

  const updateSpindleSpeed = useCallback((value: number) => {
    setSettings({ ...settings, spindleSpeed: value });
  }, [settings, setSettings]);

  const updateUnits = useCallback((units: 'mm' | 'inch') => {
    setSettings({ ...settings, units });
  }, [settings, setSettings]);

  const updateEndmillSize = useCallback((
    input?: string,
    unit?: 'fraction' | 'inch' | 'mm'
  ) => {
    const currentSize = settings.endmillSize;
    const newInput = input ?? currentSize.input;
    const newUnit = unit ?? currentSize.unit;
    const sizeInMM = parseToolSize(newInput, newUnit);

    setSettings({
      ...settings,
      endmillSize: {
        input: newInput,
        unit: newUnit,
        sizeInMM
      }
    });
  }, [settings, setSettings]);

  const updateMultiple = useCallback((updates: Partial<ProbeSequenceSettings>) => {
    setSettings({ ...settings, ...updates });
  }, [settings, setSettings]);

  return useMemo(() => ({
    updateInitialPosition,
    updateDwellsBeforeProbe,
    updateSpindleSpeed,
    updateUnits,
    updateEndmillSize,
    updateMultiple
  }), [
    updateInitialPosition,
    updateDwellsBeforeProbe,
    updateSpindleSpeed,
    updateUnits,
    updateEndmillSize,
    updateMultiple
  ]);
};

// Tool size parsing utility
export const parseToolSize = (input: string, unit: 'fraction' | 'inch' | 'mm'): number => {
  switch (unit) {
    case 'mm':
      return parseFloat(input) || 0;
    case 'inch':
      return (parseFloat(input) || 0) * 25.4;
    case 'fraction': {
      const [num, denom] = input.split('/').map(Number);
      return (!isNaN(num) && !isNaN(denom) && denom !== 0)
        ? (num / denom) * 25.4
        : 0;
    }
    default:
      return 0;
  }
};

// Import handling utilities
interface ImportResult {
  probeSequence: ProbeOperation[];
  initialPosition?: { X: number; Y: number; Z: number };
  dwellsBeforeProbe?: number;
  spindleSpeed?: number;
  units?: 'mm' | 'inch';
}

export const createImportHandler = (
  setProbeSequence: (sequence: ProbeOperation[]) => void,
  setProbeSequenceSettings: (updater: (prev: ProbeSequenceSettings) => ProbeSequenceSettings) => void,
  setMachineSettings: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void,
  setImportCounter: (updater: (prev: number) => number) => void
) => {
  return (result: ImportResult) => {
    // Update probe sequence
    setProbeSequence(result.probeSequence);

    // Build settings updates conditionally
    const settingsUpdates: Partial<ProbeSequenceSettings> = {};
    
    if (result.initialPosition) {
      settingsUpdates.initialPosition = result.initialPosition;
    }
    
    if (result.dwellsBeforeProbe) {
      settingsUpdates.dwellsBeforeProbe = result.dwellsBeforeProbe;
    }
    
    if (result.spindleSpeed) {
      settingsUpdates.spindleSpeed = result.spindleSpeed;
    }

    // Apply settings updates if any
    if (Object.keys(settingsUpdates).length > 0) {
      setProbeSequenceSettings(prev => ({ ...prev, ...settingsUpdates }));
    }

    // Update machine settings if units provided
    if (result.units) {
      setMachineSettings(prev => ({ ...prev, units: result.units }));
    }

    // Force re-mount of ProbeSequenceEditor
    setImportCounter(prev => prev + 1);
  };
};
