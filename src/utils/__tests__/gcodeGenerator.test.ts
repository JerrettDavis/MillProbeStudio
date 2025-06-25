// src/utils/__tests__/gcodeGenerator.test.ts

import { describe, it, expect } from 'vitest';
import { generateGCode, GCodeGenerator } from '../gcodeGenerator';
import type { ProbeOperation, ProbeSequenceSettings } from '@/types/machine';

describe('gcodeGenerator', () => {
  const sampleProbeSequenceSettings: ProbeSequenceSettings = {
    initialPosition: { X: -78, Y: -100, Z: -41 },
    dwellsBeforeProbe: 2,
    spindleSpeed: 5000,
    units: 'mm',
    endmillSize: {
      input: '1/8',
      unit: 'fraction',
      sizeInMM: 3.175
    },
    operations: []
  };

  const sampleProbeOperation: ProbeOperation = {
    id: 'probe-1',
    axis: 'Y',
    direction: -1,
    distance: 10,
    feedRate: 100,
    backoffDistance: 1,
    wcsOffset: 1.5875,
    preMoves: [],
    postMoves: []
  };

  describe('GCodeGenerator.generate', () => {    it('should generate header with correct units and initial positioning', () => {
      const gcode = GCodeGenerator.generate([], sampleProbeSequenceSettings);
      
      expect(gcode).toContain('G21                                     (Set units to millimeters)');
      expect(gcode).toContain('G90 G53 G0 Z-41                         (Absolute move in machine coordinates to Z)');
      expect(gcode).toContain('G90 G53 G0 Y-100                        (Absolute move in machine coordinates to Y)');
      expect(gcode).toContain('G90 G53 G0 X-78                         (Absolute move in machine coordinates to X)');
    });    it('should generate spindle commands with correct speed', () => {
      const gcode = GCodeGenerator.generate([], sampleProbeSequenceSettings);
      
      expect(gcode).toContain('S5000 M4                                (Start spindle in reverse at 5000 RPM)');
      expect(gcode).toContain('G4 P3                                   (Dwell for 3 seconds to let spindle stabilize)');
    });    it('should generate probe operation with buffer clearing', () => {
      const gcode = GCodeGenerator.generate([sampleProbeOperation], sampleProbeSequenceSettings);
          // Should contain buffer clearing dwells
    const bufferClearCount = (gcode.match(/G4 P0\.01\s{32}\(Empty Buffer\)/g) || []).length;
      expect(bufferClearCount).toBe(2); // dwellsBeforeProbe = 2
      
      // Should contain probe command
      expect(gcode).toContain('G38.2 Y-10 F100                         (Probe along Y- axis)');
      expect(gcode).toContain('G10 L20 P1 Y1.5875                      (Set WCS G54 Y origin)');
      expect(gcode).toContain('G0 G91 Y1                               (Back off from surface)');
    });    it('should generate movement steps correctly', () => {
      const probeWithMoves: ProbeOperation = {
        ...sampleProbeOperation,
        preMoves: [{
          id: 'pre-1',
          type: 'rapid',
          description: 'Position for probe',
          axesValues: { X: 10, Y: -5 },
          positionMode: 'relative',
          coordinateSystem: 'none'
        }],
        postMoves: [{
          id: 'post-1',
          type: 'dwell',
          description: 'Wait after probe',
          dwellTime: 0.5
        }]
      };

      const gcode = GCodeGenerator.generate([probeWithMoves], sampleProbeSequenceSettings);
      
      expect(gcode).toContain('(Pre-moves for Probe Operation 1)');
      expect(gcode).toContain('G0 G91 X10 Y-5                          (Position for probe)');
      expect(gcode).toContain('(Post-moves for Probe Operation 1)');
      expect(gcode).toContain('G4 P0.5                                 (Wait after probe)');
    });    it('should generate final cleanup commands', () => {
      const gcode = GCodeGenerator.generate([], sampleProbeSequenceSettings);
      
      expect(gcode).toContain('G0 G54 G90 X0Y0                         (Return to origin)');
      expect(gcode).toContain('S0                                      (Stop spindle)');
    });

    it('should handle inch units correctly', () => {
      const inchSettings: ProbeSequenceSettings = {
        ...sampleProbeSequenceSettings,
        units: 'inch'
      };

      const gcode = GCodeGenerator.generate([], inchSettings);
      
      expect(gcode).toContain('G20                                     (Set units to inches)');
    });
  });

  describe('generateGCode convenience function', () => {
    it('should work the same as GCodeGenerator.generate', () => {
      const gcodeFromClass = GCodeGenerator.generate([sampleProbeOperation], sampleProbeSequenceSettings);
      const gcodeFromFunction = generateGCode([sampleProbeOperation], sampleProbeSequenceSettings);
      
      expect(gcodeFromFunction).toBe(gcodeFromClass);
    });
  });
});
