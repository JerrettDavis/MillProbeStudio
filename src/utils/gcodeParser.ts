// src/utils/gcodeParser.ts
// Functional GCode parser with declarative patterns

import type { ProbeOperation, MovementStep } from '@/types/machine';
import { conditionally } from './functional';

export interface ParsedGCodeResult {
  probeSequence: ProbeOperation[];
  initialPosition?: {
    X: number;
    Y: number;
    Z: number;
  };
  dwellsBeforeProbe?: number;
  spindleSpeed?: number;
  units?: 'mm' | 'inch';
  errors: string[];
}

interface ParsedProbe {
  axis: 'X' | 'Y' | 'Z';
  direction: 1 | -1;
  distance: number;
  feedRate: number;
  backoffDistance: number;
  wcsOffset?: number;
  preMoves: MovementStep[];
  postMoves: MovementStep[];
}

interface ParserState {
  probeSequence: ProbeOperation[];
  currentProbe: ParsedProbe | null;
  pendingMoves: MovementStep[];
  hasSeenFirstBufferBlock: boolean;
  expectingBackoffMove: boolean;
  initialPosition?: Record<'X' | 'Y' | 'Z', number>;
  dwellsBeforeProbe?: number;
  spindleSpeed?: number;
  units?: 'mm' | 'inch';
  errors: string[];
}

// Line processing utilities
const lineParsers = {
  extractAxes: (line: string): Record<string, number> => {
    const axisPattern = /([XYZ])(-?\d*\.?\d+)/gi;
    const axes: Record<string, number> = {};
    let match;
    while ((match = axisPattern.exec(line)) !== null) {
      axes[match[1].toUpperCase()] = parseFloat(match[2]);
    }
    return axes;
  },

  extractValue: (line: string, pattern: RegExp): number | null => {
    const match = line.match(pattern);
    return match ? parseFloat(match[1]) : null;
  },

  extractComment: (line: string): string | null => {
    const commentMatch = line.match(/\((.+)\)/);
    return commentMatch ? commentMatch[1].trim() : null;
  }
};

// Pattern matchers for functional command detection
const patterns = {
  units: /G20|G21/,
  spindle: /(S\d+.*(M3|M4))|(M3.*S\d+)|(M4.*S\d+)/,
  probe: /G38\.2/,
  wcs: /G10.*L20.*P1/,
  rapid: /G0(?!.*G10)/,
  dwell: /G4/,
  bufferClear: /G4\s+P0\.01/,
  absoluteMode: /G90/,
  relativeMode: /G91/,
  machineCoords: /G53/,
  wcsCoords: /G54/
};

// Functional extractors
const extractors = {
  feedRate: (line: string) => lineParsers.extractValue(line, /F(\d*\.?\d+)/),
  dwellTime: (line: string) => lineParsers.extractValue(line, /P(\d*\.?\d+)/),
  spindleSpeed: (line: string) => 
    (patterns.spindle.test(line)) ? lineParsers.extractValue(line, /S(\d+)/) : null,
  
  positionMode: (line: string): 'relative' | 'absolute' | 'none' =>
    conditionally.ifElse(
      patterns.relativeMode.test(line), 
      'relative' as const,
      conditionally.ifElse(
        patterns.absoluteMode.test(line),
        'absolute' as const,
        'none' as const
      )
    ),

  coordinateSystem: (line: string): 'machine' | 'wcs' | 'none' =>
    conditionally.ifElse(
      patterns.machineCoords.test(line),
      'machine' as const,
      conditionally.ifElse(
        patterns.wcsCoords.test(line),
        'wcs' as const,
        'none' as const
      )
    )
};

// Line filtering and processing
const lineFilters = {
  isEmptyOrComment: (line: string): boolean => 
    !line.trim() || line.trim().startsWith('('),
    
  isBufferClear: (line: string): boolean => 
    patterns.bufferClear.test(line.split('(')[0].trim().toUpperCase()),
    
  cleanLine: (line: string): string => 
    line.split('(')[0].trim().toUpperCase()
};

// Command type detector using functional approach
const detectCommandType = (line: string): string => {
  const commandMappings = [
    { pattern: patterns.units, type: 'units' },
    { pattern: patterns.spindle, type: 'spindle' },
    { pattern: patterns.probe, type: 'probe' },
    { pattern: patterns.wcs, type: 'wcs' },
    { pattern: patterns.rapid, type: 'rapid' },
    { pattern: patterns.dwell, type: 'dwell' }
  ];

  const matchedCommand = commandMappings.find(({ pattern }) => pattern.test(line));
  return matchedCommand?.type || 'other';
};

// Movement step factory
const createMovementStep = (
  type: 'rapid' | 'dwell',
  description: string,
  additionalProps: Partial<MovementStep> = {}
): MovementStep => ({
  id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  description,
  ...additionalProps
});

// Probe operation factory
const createProbeOperation = (probe: ParsedProbe, postMoves: MovementStep[]): ProbeOperation => ({
  id: `probe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  axis: probe.axis,
  direction: probe.direction,
  distance: probe.distance,
  feedRate: probe.feedRate,
  backoffDistance: probe.backoffDistance,
  wcsOffset: probe.wcsOffset || 0,
  preMoves: [...probe.preMoves],
  postMoves: [...postMoves]
});

// State mutation utilities (using functional patterns)
const stateUpdaters = {
  setUnits: (state: ParserState, line: string) => {
    state.units = patterns.units.test(line) && line.includes('G20') ? 'inch' : 'mm';
  },

  setSpindleSpeed: (state: ParserState, speed: number) => {
    state.spindleSpeed = speed;
  },

  addError: (state: ParserState, lineIndex: number, originalLine: string, message: string) => {
    state.errors.push(`Error parsing line ${lineIndex + 1}: "${originalLine}" - ${message}`);
  },

  addPendingMove: (state: ParserState, move: MovementStep) => {
    state.pendingMoves.push(move);
  },

  clearPendingMoves: (state: ParserState) => {
    state.pendingMoves = [];
  },

  finalizeCurrentProbe: (state: ParserState) => {
    if (state.currentProbe) {
      const probeOperation = createProbeOperation(state.currentProbe, state.pendingMoves);
      state.probeSequence.push(probeOperation);
      stateUpdaters.clearPendingMoves(state);
      state.currentProbe = null;
      state.expectingBackoffMove = false;
    }
  }
};

// Command processors with functional approach
const commandProcessors = {
  units: (line: string, state: ParserState) => 
    stateUpdaters.setUnits(state, line),
  
  spindle: (line: string, state: ParserState) => 
    conditionally.maybe(
      extractors.spindleSpeed(line),
      speed => stateUpdaters.setSpindleSpeed(state, speed)
    ),
  
  probe: (line: string, state: ParserState, lineIndex: number, originalLine: string) => {
    const axes = lineParsers.extractAxes(line);
    const feedRate = extractors.feedRate(line);
    
    const axisKeys = Object.keys(axes);
    if (axisKeys.length !== 1) {
      stateUpdaters.addError(state, lineIndex, originalLine, 'Invalid probe command, expected exactly one axis');
      return;
    }

    const axis = axisKeys[0] as 'X' | 'Y' | 'Z';
    const value = axes[axis];
    
    state.currentProbe = {
      axis,
      direction: value < 0 ? -1 : 1,
      distance: Math.abs(value),
      feedRate: feedRate || 10,
      backoffDistance: 1,
      preMoves: [...state.pendingMoves],
      postMoves: []
    };
    
    stateUpdaters.clearPendingMoves(state);
  },
  
  wcs: (line: string, state: ParserState) => {
    if (!state.currentProbe) return;
    
    const axes = lineParsers.extractAxes(line);
    const axisValue = axes[state.currentProbe.axis];
    
    if (axisValue !== undefined) {
      state.currentProbe.wcsOffset = Math.abs(axisValue);
      state.expectingBackoffMove = true;
    }
  },

  rapid: (line: string, state: ParserState, _lineIndex: number, originalLine: string) => {
    const axes = lineParsers.extractAxes(line);
    if (Object.keys(axes).length === 0) return;

    // Handle initial positioning
    if (!state.hasSeenFirstBufferBlock && line.includes('G90') && line.includes('G53')) {
      if (!state.initialPosition) {
        state.initialPosition = {} as Record<'X' | 'Y' | 'Z', number>;
      }
      Object.entries(axes).forEach(([axis, value]) => {
        if (['X', 'Y', 'Z'].includes(axis)) {
          state.initialPosition![axis as 'X' | 'Y' | 'Z'] = value;
        }
      });
      return;
    }

    // Handle automatic backoff move
    const isBackoff = state.expectingBackoffMove && 
                     state.currentProbe !== null &&
                     line.includes('G91') && 
                     Object.keys(axes).length === 1 && 
                     axes[state.currentProbe.axis] !== undefined;

    if (isBackoff && state.currentProbe) {
      state.currentProbe.backoffDistance = Math.abs(axes[state.currentProbe.axis]);
      state.expectingBackoffMove = false;
      return;
    }

    // Create rapid move
    const comment = lineParsers.extractComment(originalLine);
    const defaultDescription = `Rapid move to ${Object.entries(axes).map(([axis, value]) => `${axis}${value}`).join(' ')}`;
    const description = comment || defaultDescription;

    const move = createMovementStep('rapid', description, {
      axesValues: axes,
      positionMode: extractors.positionMode(line),
      coordinateSystem: extractors.coordinateSystem(line)
    });

    stateUpdaters.addPendingMove(state, move);
    state.expectingBackoffMove = false;
  },

  dwell: (line: string, state: ParserState, _lineIndex: number, originalLine: string) => {
    const dwellTime = extractors.dwellTime(line);
    if (dwellTime === null) return;

    const comment = lineParsers.extractComment(originalLine);
    const defaultDescription = `Dwell for ${dwellTime} seconds`;
    const description = comment || defaultDescription;

    const move = createMovementStep('dwell', description, { dwellTime });
    stateUpdaters.addPendingMove(state, move);
  }
};

// Buffer clear analysis with functional approach
const analyzeBufferClear = (lines: string[]) => {
  const validLines = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => !lineFilters.isEmptyOrComment(line));

  const ranges: Array<{ start: number; end: number }> = [];
  
  const finalRange = validLines.reduce<{ start: number; count: number } | null>(
    (currentRange, { line, index }) => {
      if (lineFilters.isBufferClear(line)) {
        return currentRange ? 
          { ...currentRange, count: currentRange.count + 1 } :
          { start: index, count: 1 };
      } else {
        if (currentRange && currentRange.count >= 2) {
          ranges.push({ start: currentRange.start, end: currentRange.start + currentRange.count });
        }
        return null;
      }
    },
    null
  );

  if (finalRange && finalRange.count >= 2) {
    ranges.push({ start: finalRange.start, end: finalRange.start + finalRange.count });
  }

  return {
    lines: new Set(
      ranges.flatMap(({ start, end }) => 
        Array.from({ length: end - start }, (_, i) => start + i)
          .filter(i => lineFilters.isBufferClear(lines[i]?.trim()))
      )
    ),
    blocks: ranges.map(({ start }) => start)
  };
};

// Buffer clear block handler
const handleBufferClearBlock = (lines: string[], currentIndex: number, state: ParserState) => {
  if (!state.hasSeenFirstBufferBlock) {
    state.hasSeenFirstBufferBlock = true;
    
    // Count dwells functionally
    const dwellCount = lines
      .slice(currentIndex)
      .takeWhile(line => lineFilters.isBufferClear(line?.trim()))
      .length;
    
    state.dwellsBeforeProbe = dwellCount;
    
    // Check if we should clear pre-moves
    const shouldClear = lines
      .slice(0, currentIndex)
      .some(line => {
        const upperLine = line.trim().toUpperCase();
        return upperLine.includes('G53') || upperLine.includes('M4');
      });

    if (shouldClear) {
      stateUpdaters.clearPendingMoves(state);
    }
    return;
  }

  // Finalize current probe for subsequent buffer blocks
  stateUpdaters.finalizeCurrentProbe(state);
};

// Main parsing function with functional flow
export function parseGCode(gcode: string): ParsedGCodeResult {
  const lines = gcode.split('\n');
  const bufferClearInfo = analyzeBufferClear(lines);
  
  const state: ParserState = {
    probeSequence: [],
    currentProbe: null,
    pendingMoves: [],
    hasSeenFirstBufferBlock: false,
    expectingBackoffMove: false,
    errors: []
  };

  // Process lines with functional pipeline
  lines
    .map((line, index) => ({
      content: line.trim().toUpperCase(),
      original: line.trim(),
      index
    }))
    .filter(({ content }) => !lineFilters.isEmptyOrComment(content))
    .forEach(({ content, original, index }) => {
      // Handle buffer clear blocks
      if (bufferClearInfo.blocks.includes(index)) {
        handleBufferClearBlock(lines, index, state);
      }

      // Skip buffer clearing commands
      if (bufferClearInfo.lines.has(index)) return;

      const cleaned = lineFilters.cleanLine(content);
      if (!cleaned) return;

      try {
        const commandType = detectCommandType(cleaned);
        const processor = commandProcessors[commandType as keyof typeof commandProcessors];
        
        if (processor) {
          processor(cleaned, state, index, original);
        }
      } catch (error) {
        stateUpdaters.addError(state, index, original, String(error));
      }
    });

  // Finalize the last probe
  stateUpdaters.finalizeCurrentProbe(state);

  return {
    probeSequence: state.probeSequence,
    initialPosition: state.initialPosition && Object.keys(state.initialPosition).length > 0 
      ? {
          X: state.initialPosition.X || 0,
          Y: state.initialPosition.Y || 0,
          Z: state.initialPosition.Z || 0
        }
      : undefined,
    dwellsBeforeProbe: state.dwellsBeforeProbe,
    spindleSpeed: state.spindleSpeed,
    units: state.units,
    errors: state.errors
  };
}

// Add takeWhile to Array prototype for functional chaining
declare global {
  interface Array<T> {
    takeWhile(predicate: (item: T) => boolean): T[];
  }
}

if (!Array.prototype.takeWhile) {
  Array.prototype.takeWhile = function<T>(this: T[], predicate: (item: T) => boolean): T[] {
    const result: T[] = [];
    for (const item of this) {
      if (predicate(item)) {
        result.push(item);
      } else {
        break;
      }
    }
    return result;
  };
}
