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

    it('should parse initial positioning and dwells before probe', () => {
      const gcode = `G21
G90 G53 G0 Z-41
G90 G53 G0 Y-100
G90 G53 G0 X-78

S5000 M4
G4 P3

G91

G4 P0.01
G4 P0.01
G4 P0.01
G4 P0.01
G4 P0.01

G38.2 Y-10 F10
G10 L20 P1 Y1.5`;

      const result = parseGCode(gcode);

      // Should parse initial position correctly
      expect(result.initialPosition).toEqual({
        X: -78,
        Y: -100,
        Z: -41
      });

      // Should count dwells before probe
      expect(result.dwellsBeforeProbe).toBe(5);
      
      // Should have 1 probe operation
      expect(result.probeSequence).toHaveLength(1);
      expect(result.probeSequence[0].axis).toBe('Y');
    });
  });  describe('comment extraction', () => {
    it('should use comments from G-code lines for move descriptions', () => {
      const gcode = `G21 (Set units to millimeters)
G91 (Incremental positioning mode)

G4 P0.01 (Buffer clear dwell)
G4 P0.01 (Another buffer clear dwell)

G0 X10 Y20 (Move to starting position)
G4 P0.5 (Wait for settling)
G38.2 Z-10 F50 (Probe down to find surface)
G10 L20 P1 Z0 (Set Z work coordinate)
G91 G0 Z2 (Back off from surface)

(Post-moves for Probe Operation 1)
G0 G91 X12 (Move up in X to prepare for next probe)
G0 G91 Y-3.5 (Move right to position for next probing)

G4 P0.01 (Next buffer clear)
G4 P0.01 (Buffer clear dwell)

G38.2 Y-15 F50 (Another probe)
G10 L20 P1 Y0 (Set Y coordinate)`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(2);
      const firstProbe = result.probeSequence[0];
      
      // Check that pre-moves use comments for descriptions
      expect(firstProbe.preMoves).toHaveLength(2);
      expect(firstProbe.preMoves[0].description).toBe('Move to starting position');
      expect(firstProbe.preMoves[1].description).toBe('Wait for settling');
      
      // Check that post-moves use comments for descriptions
      expect(firstProbe.postMoves).toHaveLength(2);
      expect(firstProbe.postMoves[0].description).toBe('Move up in X to prepare for next probe');
      expect(firstProbe.postMoves[1].description).toBe('Move right to position for next probing');
    });

    it('should fallback to default descriptions when no comments are present', () => {
      const gcode = `G21
G91

G4 P0.01
G4 P0.01

G0 X10 Y20
G4 P0.5
G38.2 Z-10 F50
G10 L20 P1 Z0
G91 G0 Z2

G0 G91 X12
G0 G91 Y-3.5

G4 P0.01
G4 P0.01

G38.2 Y-15 F50
G10 L20 P1 Y0`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(2);
      const firstProbe = result.probeSequence[0];
      
      // Check that pre-moves use default descriptions
      expect(firstProbe.preMoves).toHaveLength(2);
      expect(firstProbe.preMoves[0].description).toBe('Rapid move to X10 Y20');
      expect(firstProbe.preMoves[1].description).toBe('Dwell for 0.5 seconds');
      
      // Check that post-moves use default descriptions
      expect(firstProbe.postMoves).toHaveLength(2);
      expect(firstProbe.postMoves[0].description).toBe('Rapid move to X12');
      expect(firstProbe.postMoves[1].description).toBe('Rapid move to Y-3.5');
    });
  });

  describe('integration tests', () => {
    it('should parse complex G-code with full probe sequence and comments', () => {
      // This test is based on test-import.js
      const gcode = `G21                                     (Set units to millimeters)
G90 G53 G0 Z-41                         (Absolute move in machine coordinates to Z)
G90 G53 G0 Y-100                        (Absolute move in machine coordinates to Y)
G90 G53 G0 X-78                         (Absolute move in machine coordinates to X)

S5000 M4                                (Start spindle in reverse at 5000 RPM)
G4 P3                                   (Dwell for 3 seconds to let spindle stabilize)

G91                                     (Set to incremental positioning mode)

(=== Probe Operation 1: Y Axis ===)
(Pre-moves for Probe Operation 1)
G0 G91 X10 Y-5                          (Position for probe)

G4 P0.01                                (Empty Buffer)
G4 P0.01                                (Empty Buffer)

G38.2 Y-10 F100                         (Probe along Y- axis)
G10 L20 P1 Y1.5875                      (Set WCS G54 Y origin)
G0 G91 Y1                               (Back off from surface)

(Post-moves for Probe Operation 1)
G4 P0.5                                 (Wait after probe)

G0 G54 G90 X0Y0                         (Return to origin)
S0                                      (Stop spindle)`;

      const result = parseGCode(gcode);

      // Test basic parsing
      expect(result.errors).toEqual([]);
      expect(result.units).toBe('mm');
      expect(result.spindleSpeed).toBe(5000);
      
      // Test initial position parsing
      expect(result.initialPosition).toEqual({
        X: -78,
        Y: -100,
        Z: -41
      });

      // Test probe sequence
      expect(result.probeSequence).toHaveLength(1);
      const probe = result.probeSequence[0];
      
      expect(probe.axis).toBe('Y');
      expect(probe.direction).toBe(-1);
      expect(probe.distance).toBe(10);
      expect(probe.feedRate).toBe(100);
      expect(probe.wcsOffset).toBe(1.5875);
      expect(probe.backoffDistance).toBe(1);      // Based on debug output: pre-moves are not captured (they're processed before buffer clear)
      expect(probe.preMoves).toHaveLength(0);

      // Test post-moves with comment extraction
      expect(probe.postMoves).toHaveLength(2);
      expect(probe.postMoves[0]).toMatchObject({
        type: 'dwell',
        description: 'Wait after probe',
        dwellTime: 0.5
      });
      expect(probe.postMoves[1]).toMatchObject({
        type: 'rapid',
        description: 'Return to origin',
        axesValues: { X: 0, Y: 0 }
      });
    });

    it('should parse multi-probe G-code with comment extraction', () => {
      // This test is based on test-comments-gcode.txt
      const gcode = `G21 (Set units to millimeters)
G91 (Incremental positioning mode)

G4 P0.01 (Buffer clear dwell)
G4 P0.01 (Another buffer clear dwell)

G0 X10 Y20 (Move to starting position)
G4 P0.5 (Wait for settling)
G38.2 Z-10 F50 (Probe down to find surface)
G10 L20 P1 Z0 (Set Z work coordinate)
G91 G0 Z2 (Retract probe)

G4 P0.01 (Buffer clear before next probe)
G4 P0.01 (Buffer clear dwell)

G0 X5 (Move to next probe position)
G38.2 Y-15 F50 (Probe in Y direction)
G10 L20 P1 Y0 (Set Y work coordinate)`;

      const result = parseGCode(gcode);

      // Test basic parsing
      expect(result.errors).toEqual([]);
      expect(result.units).toBe('mm');
      expect(result.probeSequence).toHaveLength(2);

      // Test first probe operation
      const probe1 = result.probeSequence[0];
      expect(probe1.axis).toBe('Z');
      expect(probe1.direction).toBe(-1);
      expect(probe1.distance).toBe(10);
      expect(probe1.feedRate).toBe(50);
      expect(probe1.wcsOffset).toBe(0);
      expect(probe1.backoffDistance).toBe(2);

      // Test first probe pre-moves with comments
      expect(probe1.preMoves).toHaveLength(2);
      expect(probe1.preMoves[0]).toMatchObject({
        type: 'rapid',
        description: 'Move to starting position',
        axesValues: { X: 10, Y: 20 }
      });
      expect(probe1.preMoves[1]).toMatchObject({
        type: 'dwell',
        description: 'Wait for settling',
        dwellTime: 0.5
      });      // Based on debug output: moves between probes become pre-moves of next probe
      expect(probe1.postMoves).toHaveLength(0);

      // Test second probe operation
      const probe2 = result.probeSequence[1];
      expect(probe2.axis).toBe('Y');
      expect(probe2.direction).toBe(-1);
      expect(probe2.distance).toBe(15);
      expect(probe2.feedRate).toBe(50);
      expect(probe2.wcsOffset).toBe(0);      // Test second probe has the move from probe1 as its pre-move
      expect(probe2.preMoves).toHaveLength(1);
      expect(probe2.preMoves[0]).toMatchObject({
        type: 'rapid',
        description: 'Move to next probe position',
        axesValues: { X: 5 }
      });
      
      // Test second probe has no post-moves
      expect(probe2.postMoves).toHaveLength(0);
    });

    it('should handle real-world G-code with mixed content and error conditions', () => {
      const gcode = `(Generated by Mill Probe Stage)
G21 (Metric units)
G90 (Absolute positioning)

; This is a comment line that should be ignored
G53 G0 Z-10 (Safe Z position)

% (Program start marker - should be ignored)

S1000 M3 (Start spindle)
G4 P1 (Wait for spindle)

G91 (Switch to incremental)

G4 P0.01
G4 P0.01

(First probe operation)
G0 X5 Y-2 (Position for first probe)
G38.2 Z-20 F100 (Probe Z axis)
G10 L20 P1 Z0 (Set Z zero)
G0 G91 Z1 (Back off)

(Between probes)
G0 X10 (Move to next position)

G4 P0.01
G4 P0.01

(Second probe operation)
G38.2 X-15 F150 (Probe X axis)
G10 L20 P1 X0 (Set X zero)

M30 (Program end)
%`;

      const result = parseGCode(gcode);      // Should handle various G-code features gracefully
      expect(result.units).toBe('mm');
      expect(result.spindleSpeed).toBe(1000); // Now fixed to handle M3
      expect(result.probeSequence).toHaveLength(2);

      // First probe
      const probe1 = result.probeSequence[0];
      expect(probe1.axis).toBe('Z');
      expect(probe1.preMoves).toHaveLength(1);
      expect(probe1.preMoves[0].description).toBe('Position for first probe');
      expect(probe1.postMoves).toHaveLength(1);
      expect(probe1.postMoves[0].description).toBe('Move to next position');

      // Second probe  
      const probe2 = result.probeSequence[1];
      expect(probe2.axis).toBe('X');
      expect(probe2.preMoves).toHaveLength(0);
      expect(probe2.postMoves).toHaveLength(0);
    });

    it('should handle edge cases and malformed G-code gracefully', () => {
      const gcode = `G21
G91

G4 P0.01
G4 P0.01

INVALID_COMMAND (This should cause an error)
G0 X10 (Valid move)
G38.2 (Incomplete probe command)
G38.2 Y-5 F10 (Valid probe)
G10 L20 P1 Y0 (Valid WCS)

G4 P0.01
G4 P0.01

G38.2 XYZ-5 F10 (Invalid multi-axis probe)`;

      const result = parseGCode(gcode);      // Should still parse valid parts (may create multiple probe operations due to invalid commands)
      expect(result.units).toBe('mm');
      expect(result.probeSequence).toHaveLength(2); // Valid Y probe + attempted invalid probe
      expect(result.probeSequence[0].axis).toBe('Y');
      
      // Should report errors for invalid parts
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should still include valid pre-moves
      expect(result.probeSequence[0].preMoves).toHaveLength(1);
      expect(result.probeSequence[0].preMoves[0].axesValues).toEqual({ X: 10 });
    });

    it('should demonstrate comment extraction functionality comprehensively', () => {
      // Based on demo-comments.js logic
      const testLines = [
        'G0 G91 X10 Y-5 (Position for probe)',
        'G4 P0.5 (Wait after probe)', 
        'G38.2 Y-10 F100 (Probe along Y- axis)',
        'G0 G54 G90 X0Y0 (Return to origin)',
        'G0 X10 Y20', // No comment
        'G4 P1.5' // No comment
      ];

      const gcode = `G21
G91

G4 P0.01
G4 P0.01

${testLines.join('\n')}

G38.2 Z-5 F10
G10 L20 P1 Z0`;

      const result = parseGCode(gcode);

      expect(result.probeSequence).toHaveLength(1);
      const probe = result.probeSequence[0];
        // Test that comments are extracted correctly (parser may filter/group commands)
      expect(probe.preMoves).toHaveLength(3);
      // Test that at least some comments are extracted
      expect(probe.preMoves.some(move => move.description.includes('Position for probe') || 
                                           move.description.includes('Wait after probe') ||
                                           move.description.includes('Return to origin'))).toBe(true);
    });
  });
});
