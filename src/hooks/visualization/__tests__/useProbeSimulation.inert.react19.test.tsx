import { render, act } from '@testing-library/react';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';
import useProbeSimulation from '../useProbeSimulation';

const mockOperations = [
  {
    id: 'op1',
    axis: 'Y' as const,
    direction: -1 as const,
    distance: 5,
    feedRate: 100,
    backoffDistance: 1,
    wcsOffset: 0,
    preMoves: [],
    postMoves: []
  }
];

const initialPosition = { X: 0, Y: 0, Z: 0 };

interface HookWrapperProps {
  operations: any[];
  position: { X: number; Y: number; Z: number };
  resultRef: { current: ReturnType<typeof useProbeSimulation> | null };
}

function HookWrapper({ operations, position, resultRef }: HookWrapperProps) {
  const result = useProbeSimulation(operations, position);
  resultRef.current = result;
  return null;
}

describe('useProbeSimulation', () => {
  it('does not increment step or position unless simulation is running', () => {
    const resultRef = { current: null };
    render(<HookWrapper operations={mockOperations} position={initialPosition} resultRef={resultRef} />);
    // Initial state
    const result = resultRef.current;
    expect(result).toBeTruthy();
    expect(result!.isPlaying).toBe(false);
    const stepIndexBefore = result!.currentStepIndex;
    const stepObjBefore = result!.currentStep;
    // Simulate rerender (e.g. operations/position change)
    act(() => {
      render(<HookWrapper operations={mockOperations} position={initialPosition} resultRef={resultRef} />);
    });
    // State should not change
    const resultAfter = resultRef.current;
    expect(resultAfter).toBeTruthy();
    expect(resultAfter!.isPlaying).toBe(false);
    expect(resultAfter!.currentStepIndex).toBe(stepIndexBefore);
    expect(resultAfter!.currentStep).toEqual(stepObjBefore);
  });
});
