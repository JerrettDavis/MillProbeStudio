import { describe, it, expect } from 'vitest';
import { parseGCode } from '@/utils/gcodeParser';

// Unit test: G38.2 Y-10 should produce direction -1 and a SimulationStep that moves Y-
describe('probe direction handling', () => {
  it('should parse G38.2 Y-10 as direction -1', () => {
    const gcode = 'G38.2 Y-10 F10';
    const result = parseGCode(gcode);
    expect(result.probeSequence).toHaveLength(1);
    const probe = result.probeSequence[0];
    expect(probe.axis).toBe('Y');
    expect(probe.direction).toBe(-1);
    expect(probe.distance).toBe(10);
  });
});
