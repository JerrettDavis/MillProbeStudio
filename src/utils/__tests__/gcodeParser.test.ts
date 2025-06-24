// src/utils/__tests__/gcodeParser.test.ts

import { describe, it, expect } from 'vitest';
import { parseGCode } from '../gcodeParser';

describe('gcodeParser', () => {
  describe('parseGCode', () => {
    it('should parse a complete 3-axis probe sequence correctly', () => {
      const gcode = `G21                                     (Set units to millimeters)
G90 G53 G0 Z-41                         (Absolute move in machine coordinates to Z)
G90 G53 G0 Y-100                        (Absolute move in machine coordinates to Y)
G90 G53 G0 X-78                         (Absolute move in machine coordinates to X)

S5000 M4                                (Start spindle in reverse at 5000 RPM)
G4 P3                                   (Dwell for 3 seconds to let spindle stabilize)

G91                                     (Set to incremental positioning mode)

(=== Probe Operation 1: Y Axis ===)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)

G38.2 Y-10 F10                          (Probe along Y- axis)
G10 L20 P1 Y1.5875                      (Set WCS G54 Y origin)
G0 G91 Y1                               (Back off from surface)

(Post-moves for Probe Operation 1)
G0 G91 X12                              (move up in x to prepare for x probing)
G0 G91 Y-3.5                            (move right to position for x probing)

(=== Probe Operation 2: X Axis ===)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)

G38.2 X-10 F10                          (Probe along X- axis)
G10 L20 P1 X1.5875                      (Set WCS G54 X origin)
G0 G91 X1                               (Back off from surface)

(Post-moves for Probe Operation 2)
G0 G53 Z-24                             (move z to safe probing height in machine coordinates)
G0 G90 G54 X-5.5 Y-4                    (move to center of stock for z probing)

(=== Probe Operation 3: Z Axis ===)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)

G38.2 Z-45 F15                          (Probe along Z- axis)
G10 L20 P1 Z0                           (Set WCS G54 Z origin)
G0 G91 Z2                               (Back off from surface)

(Post-moves for Probe Operation 3)
G0 G90 G54 X0 Y0                        (return to work origin)

S0                                      (Stop spindle)`;

      const result = parseGCode(gcode);

      // Check basic metadata
      expect(result.units).toBe('mm');
      expect(result.spindleSpeed).toBe(5000);
      expect(result.errors).toEqual([]);

      // Should have 3 probe operations
      expect(result.probeSequence).toHaveLength(3);      // First probe (Y axis)
      const probe1 = result.probeSequence[0];
      expect(probe1.axis).toBe('Y');
      expect(probe1.direction).toBe(-1);
      expect(probe1.distance).toBe(10);
      expect(probe1.feedRate).toBe(10);
      expect(probe1.wcsOffset).toBe(1.5875);
      expect(probe1.backoffDistance).toBe(1); // Parsed from automatic backoff move
      expect(probe1.preMoves).toHaveLength(0); // No pre-moves for first probe
      expect(probe1.postMoves).toHaveLength(2); // Two post-moves (automatic backoff excluded)
      
      // Check post-moves for probe 1
      expect(probe1.postMoves[0]).toMatchObject({
        type: 'rapid',
        axesValues: { X: 12 },
        positionMode: 'relative',
        coordinateSystem: 'none'
      });
      expect(probe1.postMoves[1]).toMatchObject({
        type: 'rapid',
        axesValues: { Y: -3.5 },
        positionMode: 'relative',
        coordinateSystem: 'none'
      });      // Second probe (X axis)
      const probe2 = result.probeSequence[1];
      expect(probe2.axis).toBe('X');
      expect(probe2.direction).toBe(-1);
      expect(probe2.distance).toBe(10);
      expect(probe2.feedRate).toBe(10);
      expect(probe2.wcsOffset).toBe(1.5875);
      expect(probe2.backoffDistance).toBe(1); // Parsed from automatic backoff move
      expect(probe2.preMoves).toHaveLength(0); // Previous post-moves are assigned to previous probe
      expect(probe2.postMoves).toHaveLength(2); // Two post-moves (automatic backoff excluded)

      // Check post-moves for probe 2
      expect(probe2.postMoves[0]).toMatchObject({
        type: 'rapid',
        axesValues: { Z: -24 },
        positionMode: 'none',
        coordinateSystem: 'machine'
      });
      expect(probe2.postMoves[1]).toMatchObject({
        type: 'rapid',
        axesValues: { X: -5.5, Y: -4 },
        positionMode: 'absolute',
        coordinateSystem: 'wcs'
      });      // Third probe (Z axis)
      const probe3 = result.probeSequence[2];
      expect(probe3.axis).toBe('Z');
      expect(probe3.direction).toBe(-1);
      expect(probe3.distance).toBe(45);
      expect(probe3.feedRate).toBe(15);
      expect(probe3.wcsOffset).toBe(0);
      expect(probe3.backoffDistance).toBe(2); // Parsed from automatic backoff move
      expect(probe3.preMoves).toHaveLength(0); // Previous post-moves are assigned to previous probe
      expect(probe3.postMoves).toHaveLength(1); // One post-move (automatic backoff excluded)

      // Check post-move for probe 3
      expect(probe3.postMoves[0]).toMatchObject({
        type: 'rapid',
        axesValues: { X: 0, Y: 0 },
        positionMode: 'absolute',
        coordinateSystem: 'wcs'
      });
    });

    it('should detect buffer clear blocks with minimum 2 consecutive G4 P0.01 lines', () => {
      const gcode = `G21
G91

G4 P0.01
G4 P0.01

G38.2 Y-5 F10
G10 L20 P1 Y1

G4 P0.01
G4 P0.01
G4 P0.01

G38.2 X-5 F10
G10 L20 P1 X1`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(2);
      expect(result.probeSequence[0].axis).toBe('Y');
      expect(result.probeSequence[1].axis).toBe('X');
    });

    it('should ignore single G4 P0.01 lines (not buffer clear blocks)', () => {
      const gcode = `G21
G91

G0 X10
G4 P0.01
G0 Y10

G4 P0.01
G4 P0.01

G38.2 Z-5 F10
G10 L20 P1 Z1`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(1);
      expect(result.probeSequence[0].axis).toBe('Z');
      // The single G4 P0.01 should be parsed as a regular dwell, not ignored
      expect(result.probeSequence[0].preMoves).toHaveLength(3); // G0 X10, G4 P0.01, G0 Y10
      expect(result.probeSequence[0].preMoves[1].type).toBe('dwell');
      expect(result.probeSequence[0].preMoves[1].dwellTime).toBe(0.01);
    });

    it('should ignore everything before the first buffer clear block', () => {
      const gcode = `G21
G90 G53 G0 Z-50
G90 G53 G0 X0 Y0
S5000 M4
G91

G0 X5
G0 Y5
G4 P2

G4 P0.01
G4 P0.01

G38.2 Z-10 F10
G10 L20 P1 Z1`;

      const result = parseGCode(gcode);

      expect(result.units).toBe('mm');
      expect(result.spindleSpeed).toBe(5000);
      expect(result.probeSequence).toHaveLength(1);
      expect(result.probeSequence[0].preMoves).toHaveLength(0); // Moves before buffer clear are ignored
    });

    it('should handle buffer clear blocks without comments', () => {
      const gcode = `G21
G91

G4 P0.01
G4 P0.01

G38.2 Y-10 F10
G10 L20 P1 Y1

G4 P0.01
G4 P0.01

G38.2 X-10 F10
G10 L20 P1 X1`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(2);
      expect(result.probeSequence[0].axis).toBe('Y');
      expect(result.probeSequence[1].axis).toBe('X');
    });

    it('should parse different positioning modes and coordinate systems', () => {
      const gcode = `G21
G91

G4 P0.01
G4 P0.01

G0 G90 X10
G0 G53 Y20
G0 G54 Z5
G0 G91 X-5

G38.2 Y-10 F10
G10 L20 P1 Y1`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(1);
      const moves = result.probeSequence[0].preMoves;
      
      expect(moves[0]).toMatchObject({
        positionMode: 'absolute',
        coordinateSystem: 'none',
        axesValues: { X: 10 }
      });
      
      expect(moves[1]).toMatchObject({
        positionMode: 'none',
        coordinateSystem: 'machine',
        axesValues: { Y: 20 }
      });
      
      expect(moves[2]).toMatchObject({
        positionMode: 'none',
        coordinateSystem: 'wcs',
        axesValues: { Z: 5 }
      });
      
      expect(moves[3]).toMatchObject({
        positionMode: 'relative',
        coordinateSystem: 'none',
        axesValues: { X: -5 }
      });
    });

    it('should handle dwell commands with different durations', () => {
      const gcode = `G21
G91

G4 P0.01
G4 P0.01

G4 P0.5
G4 P2.5
G38.2 Y-10 F10
G10 L20 P1 Y1`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(1);
      const moves = result.probeSequence[0].preMoves;
      
      expect(moves).toHaveLength(2);
      expect(moves[0]).toMatchObject({
        type: 'dwell',
        dwellTime: 0.5
      });
      expect(moves[1]).toMatchObject({
        type: 'dwell',
        dwellTime: 2.5
      });
    });

    it('should parse positive probe directions correctly', () => {
      const gcode = `G21
G91

G4 P0.01
G4 P0.01

G38.2 X15 F10
G10 L20 P1 X1

G4 P0.01
G4 P0.01

G38.2 Y20 F15
G10 L20 P1 Y2

G4 P0.01
G4 P0.01

G38.2 Z10 F5
G10 L20 P1 Z3`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(3);
      
      expect(result.probeSequence[0]).toMatchObject({
        axis: 'X',
        direction: 1,
        distance: 15,
        feedRate: 10
      });
      
      expect(result.probeSequence[1]).toMatchObject({
        axis: 'Y',
        direction: 1,
        distance: 20,
        feedRate: 15
      });
      
      expect(result.probeSequence[2]).toMatchObject({
        axis: 'Z',
        direction: 1,
        distance: 10,
        feedRate: 5
      });
    });

    it('should handle G-code with mixed case', () => {
      const gcode = `g21
g91

g4 p0.01
g4 p0.01

g38.2 y-10 f10
g10 l20 p1 y1.5`;

      const result = parseGCode(gcode);

      expect(result.units).toBe('mm');
      expect(result.probeSequence).toHaveLength(1);
      expect(result.probeSequence[0]).toMatchObject({
        axis: 'Y',
        direction: -1,
        distance: 10,
        feedRate: 10,
        wcsOffset: 1.5
      });
    });

    it('should handle inch units', () => {
      const gcode = `G20
G91

G4 P0.01
G4 P0.01

G38.2 X-1 F5
G10 L20 P1 X0.125`;

      const result = parseGCode(gcode);

      expect(result.units).toBe('inch');
      expect(result.probeSequence).toHaveLength(1);
      expect(result.probeSequence[0]).toMatchObject({
        axis: 'X',
        direction: -1,
        distance: 1,
        feedRate: 5,
        wcsOffset: 0.125
      });
    });

    it('should skip buffer clear dwells and not include them in movements', () => {
      const gcode = `G21
G91

G0 X5

G4 P0.01
G4 P0.01
G4 P0.01

G0 Y10
G38.2 Z-5 F10
G10 L20 P1 Z1

G4 P0.01
G4 P0.01

G0 X-5`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(1);
      
      // Pre-moves should not include the buffer clear dwells
      expect(result.probeSequence[0].preMoves).toHaveLength(2);
      expect(result.probeSequence[0].preMoves[0].axesValues).toEqual({ X: 5 });
      expect(result.probeSequence[0].preMoves[1].axesValues).toEqual({ Y: 10 });
      
      // Post-moves should not include the buffer clear dwells
      expect(result.probeSequence[0].postMoves).toHaveLength(0);
    });

    it('should return errors for malformed lines', () => {
      const gcode = `G21
G91

G4 P0.01
G4 P0.01

G38.2 INVALID_AXIS-10 F10`;

      const result = parseGCode(gcode);

      // Should still parse what it can
      expect(result.units).toBe('mm');
      // But should report errors for malformed lines
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty or whitespace-only lines', () => {
      const gcode = `G21


G91

   
G4 P0.01
G4 P0.01


G38.2 Y-5 F10
G10 L20 P1 Y1

   `;

      const result = parseGCode(gcode);

      expect(result.units).toBe('mm');
      expect(result.probeSequence).toHaveLength(1);
      expect(result.probeSequence[0].axis).toBe('Y');
    });

    it('should exclude automatic backoff moves from post-moves', () => {
      const gcode = `G21
G91

G4 P0.01
G4 P0.01

G38.2 Y-5 F10
G10 L20 P1 Y1.5
G0 G91 Y1.5

G0 X10
G0 Z5

G4 P0.01
G4 P0.01

G38.2 X-8 F15
G10 L20 P1 X2.0
G0 G91 X2.0

G0 Y-5`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(2);
      
      // First probe - should have backoff distance 1.5 and 2 post-moves
      const probe1 = result.probeSequence[0];
      expect(probe1.axis).toBe('Y');
      expect(probe1.backoffDistance).toBe(1.5);
      expect(probe1.postMoves).toHaveLength(2); // G0 X10, G0 Z5 (automatic G0 G91 Y1.5 excluded)
      expect(probe1.postMoves[0].axesValues).toEqual({ X: 10 });
      expect(probe1.postMoves[1].axesValues).toEqual({ Z: 5 });
      
      // Second probe - should have backoff distance 2.0 and 1 post-move
      const probe2 = result.probeSequence[1];
      expect(probe2.axis).toBe('X');
      expect(probe2.backoffDistance).toBe(2.0);
      expect(probe2.postMoves).toHaveLength(1); // G0 Y-5 (automatic G0 G91 X2.0 excluded)
      expect(probe2.postMoves[0].axesValues).toEqual({ Y: -5 });
    });
  });
});
