// src/hooks/visualization/__tests__/useVirtualMillSimulation.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVirtualMillSimulation } from '../useVirtualMillSimulation';
import { useAppStore } from '@/store';
import type { ProbeOperation } from '@/types/machine';

// Mock the store
vi.mock('@/store', () => ({
  useAppStore: vi.fn()
}));

const mockUseAppStore = vi.mocked(useAppStore);

describe('useVirtualMillSimulation', () => {
  const mockSimulationState = {
    isActive: false,
    isPlaying: false,
    currentStepIndex: 0,
    currentPosition: { X: 0, Y: 0, Z: 0 },
    contactPoints: [],
    speed: 1.0,
    totalSteps: 0
  };

  const mockMachineSettings = {
    units: 'mm' as const,
    axes: {
      X: { positiveDirection: 'Down' as const, negativeDirection: 'Up' as const, polarity: 1 as const, min: -86, max: -0.5 },
      Y: { positiveDirection: 'Right' as const, negativeDirection: 'Left' as const, polarity: 1 as const, min: -0.5, max: -241.50 },
      Z: { positiveDirection: 'In' as const, negativeDirection: 'Out' as const, polarity: -1 as const, min: -0.5, max: -78.50 }
    },
    machineOrientation: 'horizontal' as const,
    stageDimensions: [12.7, 304.8, 63.5] as [number, number, number]
  };

  const mockVisualizationSettings = {
    stockSize: [25, 25, 10] as [number, number, number],
    stockPosition: [0, 0, 0] as [number, number, number],
    stockRotation: [0, 0, 0] as [number, number, number],
    showAxisLabels: true,
    showCoordinateHover: true,
    modelFile: null,
    serializedModelFile: null,
    isLoadingModelFile: false
  };

  const mockStoreActions = {
    setSimulationPosition: vi.fn(),
    addContactPoint: vi.fn(),
    pauseSimulation: vi.fn(),
    setSimulationStep: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAppStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        const state = {
          simulationState: mockSimulationState,
          machineSettings: mockMachineSettings,
          visualizationSettings: mockVisualizationSettings,
          probeSequence: [],
          probeSequenceSettings: {
            initialPosition: { X: -78, Y: -100, Z: -41 },
            dwellsBeforeProbe: 15,
            spindleSpeed: 5000,
            units: 'mm' as const,
            endmillSize: {
              input: '1/8',
              unit: 'fraction' as const,
              sizeInMM: 3.175
            },
            operations: []
          },
          generatedGCode: '',
          importCounter: 0,
          cameraSettings: {
            position: { x: -200, y: 200, z: -100 },
            preset: null,
            pivotMode: 'tool' as const,
            isManuallyMoved: false
          },
          ...mockStoreActions
        };
        return selector(state as any);
      }
      return mockStoreActions;
    });
  });

  it('should initialize with empty steps when no probe sequence provided', () => {
    const { result } = renderHook(() => useVirtualMillSimulation());

    expect(result.current.steps).toEqual([]);
    expect(result.current.totalSteps).toBe(0);
    expect(result.current.isReady).toBe(false);
    expect(result.current.currentStep).toBe(null);
  });

  it('should initialize with empty steps when probe sequence has no operations', () => {
    const emptyProbeSequence = {
      operations: [],
      initialPosition: { X: 0, Y: 0, Z: 0 }
    };

    const { result } = renderHook(() => 
      useVirtualMillSimulation(emptyProbeSequence)
    );

    expect(result.current.steps).toEqual([]);
    expect(result.current.totalSteps).toBe(0);
    expect(result.current.isReady).toBe(false);
  });

  it('should generate simulation steps from probe operations', () => {
    const probeSequence = {
      operations: [
        {
          id: 'probe-1',
          axis: 'Z' as const,
          direction: -1 as const,
          distance: 10,
          feedRate: 100,
          backoffDistance: 2,
          wcsOffset: 0,
          preMoves: [],
          postMoves: []
        }
      ] as ProbeOperation[],
      initialPosition: { X: 0, Y: 0, Z: 0 }
    };

    const { result } = renderHook(() => 
      useVirtualMillSimulation(probeSequence)
    );

    expect(result.current.isReady).toBe(true);
    expect(result.current.totalSteps).toBe(1);
    expect(result.current.steps).toHaveLength(1);
    
    const step = result.current.steps[0];
    expect(step.type).toBe('probe');
    expect(step.gCodeCommand.axis).toBe('Z');
    expect(step.gCodeCommand.direction).toBe(-1);
    expect(step.gCodeCommand.distance).toBe(10);
  });

  it('should generate steps for pre-moves and post-moves', () => {
    const probeSequence = {
      operations: [
        {
          id: 'probe-1',
          axis: 'Z' as const,
          direction: -1 as const,
          distance: 10,
          feedRate: 100,
          backoffDistance: 2,
          wcsOffset: 0,
          preMoves: [
            {
              id: 'pre-1',
              type: 'rapid' as const,
              description: 'Pre-move',
              axesValues: { X: 10, Y: 20 },
              positionMode: 'absolute' as const,
              coordinateSystem: 'machine' as const
            }
          ],
          postMoves: [
            {
              id: 'post-1',
              type: 'rapid' as const,
              description: 'Post-move',
              axesValues: { Z: 5 },
              positionMode: 'relative' as const,
              coordinateSystem: 'machine' as const
            }
          ]
        }
      ] as ProbeOperation[],
      initialPosition: { X: 0, Y: 0, Z: 0 }
    };

    const { result } = renderHook(() => 
      useVirtualMillSimulation(probeSequence)
    );

    expect(result.current.totalSteps).toBe(3); // pre-move + probe + post-move
    expect(result.current.steps[0].type).toBe('rapid'); // pre-move
    expect(result.current.steps[1].type).toBe('probe'); // probe
    expect(result.current.steps[2].type).toBe('linear'); // post-move
  });

  it('should provide VirtualMill instance', () => {
    const { result } = renderHook(() => useVirtualMillSimulation());

    expect(result.current.virtualMill).toBeDefined();
    expect(typeof result.current.isMoving).toBe('function');
    expect(typeof result.current.getCurrentMovement).toBe('function');
  });

  it('should handle coordinate system conversion for moves', () => {
    const probeSequence = {
      operations: [
        {
          id: 'probe-1',
          axis: 'Z' as const,
          direction: -1 as const,
          distance: 10,
          feedRate: 100,
          backoffDistance: 2,
          wcsOffset: 0,
          preMoves: [
            {
              id: 'pre-1',
              type: 'rapid' as const,
              description: 'Pre-move with none coordinate system',
              axesValues: { X: 10 },
              positionMode: 'none' as const, // Should convert to 'absolute'
              coordinateSystem: 'none' as const // Should convert to 'machine'
            }
          ],
          postMoves: []
        }
      ] as ProbeOperation[],
      initialPosition: { X: 0, Y: 0, Z: 0 }
    };

    const { result } = renderHook(() => 
      useVirtualMillSimulation(probeSequence)
    );

    const preMove = result.current.steps[0];
    expect(preMove.gCodeCommand.positionMode).toBe('absolute');
    expect(preMove.gCodeCommand.coordinateSystem).toBe('machine');
  });
});
