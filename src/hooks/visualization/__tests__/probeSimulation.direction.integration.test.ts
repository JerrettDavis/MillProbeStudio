import { describe, it, expect } from 'vitest';
import { generateSimulationSteps } from '../useProbeSimulation';
import type { ParsedGCodeLine } from '../useProbeSimulation';

describe('probe simulation step direction', () => {
  it('should generate a SimulationStep that moves Y- for a Y- probe', () => {
    const probeOp: ParsedGCodeLine = {
      type: 'probe',
      id: 'probe-y',
      axis: 'Y',
      direction: -1,
      distance: 10,
      feedRate: 10,
      // Include other required properties for probe operations
      preMoves: [],
      postMoves: []
    };
    const initialPosition = { X: 0, Y: 0, Z: 0 };
    const steps = generateSimulationSteps([probeOp], initialPosition);
    const probeStep = steps.find(s => s.type === 'probe');
    expect(probeStep).toBeDefined();
    expect(probeStep!.startPosition.Y).toBe(0);
    expect(probeStep!.endPosition.Y).toBe(-10);
  });
});
