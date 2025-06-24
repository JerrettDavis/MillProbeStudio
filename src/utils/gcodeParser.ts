// src/utils/gcodeParser.ts

import type { ProbeOperation, MovementStep } from '@/types/machine';

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
  initialPosition?: {
    X?: number;
    Y?: number;
    Z?: number;
  };
  dwellsBeforeProbe?: number;
  spindleSpeed?: number;
  units?: 'mm' | 'inch';
  errors: string[];
}

// Utility functions
const generateId = (prefix: string): string => 
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const parseAxes = (line: string): Record<string, number> => {
  const axes: Record<string, number> = {};
  const axisPattern = /([XYZ])(-?\d*\.?\d+)/gi;
  let match;
  while ((match = axisPattern.exec(line)) !== null) {
    axes[match[1].toUpperCase()] = parseFloat(match[2]);
  }
  return axes;
};

const getPositionMode = (line: string): 'relative' | 'absolute' | 'none' => 
  line.includes('G91') ? 'relative' : line.includes('G90') ? 'absolute' : 'none';

const getCoordinateSystem = (line: string): 'machine' | 'wcs' | 'none' => 
  line.includes('G53') ? 'machine' : line.includes('G54') ? 'wcs' : 'none';

const isBufferClearDwell = (line: string): boolean => {
  const cleanLine = line.split('(')[0].trim().toUpperCase();
  const dwellMatch = cleanLine.match(/G4\s+P(\d*\.?\d+)/);
  return dwellMatch ? parseFloat(dwellMatch[1]) === 0.01 : false;
};

const shouldSkipLine = (line: string): boolean =>
  !line.trim() || line.trim().startsWith('(');

const cleanLine = (line: string): string =>
  line.split('(')[0].trim().toUpperCase();

const extractValue = (line: string, pattern: RegExp): number | null => {
  const match = line.match(pattern);
  return match ? parseFloat(match[1]) : null;
};

const extractDwellTime = (line: string): number | null => 
  extractValue(line, /P(\d*\.?\d+)/);

const extractFeedRate = (line: string): number | null => 
  extractValue(line, /F(\d*\.?\d+)/);

const extractSpindleSpeed = (line: string): number | null => 
  line.includes('M4') ? extractValue(line, /S(\d+)/) : null;// Buffer clear detection using functional approach
const findBufferClearRanges = (lines: string[]): Array<{ start: number; end: number }> => {
  const validLines = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => !shouldSkipLine(line));

  const ranges: Array<{ start: number; end: number }> = [];
  
  // Use reduce to track ranges functionally
  const finalRange = validLines.reduce<{ start: number; count: number } | null>(
    (currentRange, { line, index }) => {
      if (isBufferClearDwell(line)) {
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

  // Handle trailing range
  if (finalRange && finalRange.count >= 2) {
    ranges.push({ start: finalRange.start, end: finalRange.start + finalRange.count });
  }

  return ranges;
};

const createBufferClearSets = (lines: string[]) => {
  const ranges = findBufferClearRanges(lines);
  
  return {
    lines: new Set(
      ranges.flatMap(({ start, end }) => 
        Array.from({ length: end - start }, (_, i) => start + i)
          .filter(i => isBufferClearDwell(lines[i]?.trim()))
      )
    ),
    blocks: ranges.map(({ start }) => start)
  };
};

// Command type detection
const getCommandType = (line: string): string => {
  const commands = [
    { pattern: /G20|G21/, type: 'units' },
    { pattern: /S\d+.*M4/, type: 'spindle' },
    { pattern: /G38\.2/, type: 'probe' },
    { pattern: /G10.*L20.*P1/, type: 'wcs' },
    { pattern: /G0(?!.*G10)/, type: 'rapid' },
    { pattern: /G4/, type: 'dwell' }
  ];

  return commands.find(({ pattern }) => pattern.test(line))?.type || 'other';
};

// Command processors as a lookup table
const commandProcessors = {
  units: (line: string, state: ParserState) => {
    state.units = line.includes('G20') ? 'inch' : 'mm';
  },
  
  spindle: (line: string, state: ParserState) => {
    const speed = extractSpindleSpeed(line);
    if (speed !== null) state.spindleSpeed = speed;
  },
  
  probe: (line: string, state: ParserState, lineIndex: number, originalLine: string) => {
    const axes = parseAxes(line);
    const feedRate = extractFeedRate(line);
    
    const axisKeys = Object.keys(axes);
    if (axisKeys.length !== 1) {
      state.errors.push(`Error parsing line ${lineIndex + 1}: "${originalLine}" - Invalid probe command, expected exactly one axis`);
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
    
    state.pendingMoves = [];
  },
  
  wcs: (line: string, state: ParserState) => {
    if (!state.currentProbe) return;
    
    const axes = parseAxes(line);
    const axisValue = axes[state.currentProbe.axis];
    
    if (axisValue !== undefined) {
      state.currentProbe.wcsOffset = Math.abs(axisValue);
      state.expectingBackoffMove = true;
    }
  },
    rapid: (line: string, state: ParserState) => {
    const axes = parseAxes(line);
    if (Object.keys(axes).length === 0) return;

    // Check for initial positioning (G90 G53 G0 with machine coordinates) before first buffer block
    if (!state.hasSeenFirstBufferBlock && line.includes('G90') && line.includes('G53')) {
      if (!state.initialPosition) {
        state.initialPosition = {};
      }
      Object.entries(axes).forEach(([axis, value]) => {
        if (state.initialPosition && ['X', 'Y', 'Z'].includes(axis)) {
          state.initialPosition[axis as 'X' | 'Y' | 'Z'] = value;
        }
      });
      return; // Don't add to pending moves
    }

    // Check for automatic backoff move
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

    const move: MovementStep = {
      id: generateId('step'),
      type: 'rapid',
      description: `Rapid move to ${Object.entries(axes).map(([axis, value]) => `${axis}${value}`).join(' ')}`,
      axesValues: axes,
      positionMode: getPositionMode(line),
      coordinateSystem: getCoordinateSystem(line)
    };

    state.pendingMoves.push(move);
    state.expectingBackoffMove = false;
  },
  
  dwell: (line: string, state: ParserState) => {
    const dwellTime = extractDwellTime(line);
    if (dwellTime === null) return;

    const move: MovementStep = {
      id: generateId('step'),
      type: 'dwell',
      description: `Dwell for ${dwellTime} seconds`,
      dwellTime
    };

    state.pendingMoves.push(move);
  }
};

// Higher-order functions for processing
const shouldClearPreMoves = (lines: string[], currentIndex: number): boolean =>
  lines.slice(0, currentIndex)
    .some(line => {
      const upperLine = line.trim().toUpperCase();
      return upperLine.includes('G53') || upperLine.includes('M4');
    });

const handleBufferClearBlockStart = (lines: string[], currentIndex: number, state: ParserState) => {
  if (!state.hasSeenFirstBufferBlock) {
    state.hasSeenFirstBufferBlock = true;
    
    // Count the dwells in the first buffer clear block for dwellsBeforeProbe
    let dwellCount = 0;
    for (let i = currentIndex; i < lines.length && isBufferClearDwell(lines[i]?.trim()); i++) {
      dwellCount++;
    }
    state.dwellsBeforeProbe = dwellCount;
    
    if (shouldClearPreMoves(lines, currentIndex)) {
      state.pendingMoves = [];
    }
    return;
  }

  // Save current probe and start new one
  if (state.currentProbe) {
    const probeOperation = createProbeOperation(state.currentProbe, state.pendingMoves);
    state.probeSequence.push(probeOperation);
    state.pendingMoves = [];
    state.currentProbe = null;
    state.expectingBackoffMove = false;
  }
};

const createProbeOperation = (probe: ParsedProbe, postMoves: MovementStep[]): ProbeOperation => ({
  id: generateId('probe'),
  axis: probe.axis,
  direction: probe.direction,
  distance: probe.distance,
  feedRate: probe.feedRate,
  backoffDistance: probe.backoffDistance,
  wcsOffset: probe.wcsOffset || 0,
  preMoves: [...probe.preMoves],
  postMoves: [...postMoves]
});

const processLineItem = (
  lineInfo: { content: string; original: string; index: number },
  lines: string[],
  state: ParserState,
  bufferClearInfo: { lines: Set<number>; blocks: number[] }
): void => {
  const { content, original, index } = lineInfo;
  const { lines: bufferClearLines, blocks: bufferClearBlocks } = bufferClearInfo;

  // Skip empty lines and comments
  if (shouldSkipLine(content)) return;

  // Handle buffer clear block starts
  if (bufferClearBlocks.includes(index)) {
    handleBufferClearBlockStart(lines, index, state);
  }

  // Skip buffer clearing commands
  if (bufferClearLines.has(index)) return;

  const cleaned = cleanLine(content);
  if (!cleaned) return;

  try {
    const commandType = getCommandType(cleaned);
    const processor = commandProcessors[commandType as keyof typeof commandProcessors];
    
    if (processor) {
      processor(cleaned, state, index, original);
    }
  } catch (error) {
    state.errors.push(`Error parsing line ${index + 1}: "${original}" - ${error}`);
  }
};

export function parseGCode(gcode: string): ParsedGCodeResult {
  const lines = gcode.split('\n');
  
  // Pre-process buffer clear information
  const bufferClearInfo = createBufferClearSets(lines);
  
  // Initialize parser state
  const state: ParserState = {
    probeSequence: [],
    currentProbe: null,
    pendingMoves: [],
    hasSeenFirstBufferBlock: false,
    expectingBackoffMove: false,
    errors: []
  };

  // Process all lines functionally
  lines
    .map((line, index) => ({
      content: line.trim().toUpperCase(),
      original: line.trim(),
      index
    }))
    .forEach(lineInfo => 
      processLineItem(lineInfo, lines, state, bufferClearInfo)
    );

  // Finalize the last probe
  if (state.currentProbe) {
    const probeOperation = createProbeOperation(state.currentProbe, state.pendingMoves);
    state.probeSequence.push(probeOperation);
  }
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
