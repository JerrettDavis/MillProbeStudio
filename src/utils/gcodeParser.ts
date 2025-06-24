// src/utils/gcodeParser.ts

import type { ProbeOperation, MovementStep } from '@/types/machine';

export interface ParsedGCodeResult {
  probeSequence: ProbeOperation[];
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

export function parseGCode(gcode: string): ParsedGCodeResult {
  const lines = gcode.split('\n');
  const result: ParsedGCodeResult = {
    probeSequence: [],
    errors: []
  };
  let currentSpindleSpeed: number | undefined;
  let currentUnits: 'mm' | 'inch' | undefined;let currentProbe: ParsedProbe | null = null;
  let pendingMoves: MovementStep[] = [];
  let hasSeenFirstBufferBlock = false; // Track if we've seen the first buffer clear block
  let expectingBackoffMove = false; // Track if we're expecting an automatic backoff move after probe

  // Helper to generate unique IDs
  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Helper to parse axis values from a G-code line
  const parseAxes = (line: string): { [axis: string]: number } => {
    const axes: { [axis: string]: number } = {};
    const axisPattern = /([XYZ])(-?\d*\.?\d+)/gi;
    let match;
    while ((match = axisPattern.exec(line)) !== null) {
      axes[match[1].toUpperCase()] = parseFloat(match[2]);
    }
    return axes;
  };

  // Helper to determine if movement is relative or absolute
  const getPositionMode = (line: string): 'relative' | 'absolute' | 'none' => {
    if (line.includes('G91')) return 'relative';
    if (line.includes('G90')) return 'absolute';
    return 'none';
  };

  // Helper to determine coordinate system
  const getCoordinateSystem = (line: string): 'machine' | 'wcs' | 'none' => {
    if (line.includes('G53')) return 'machine';
    if (line.includes('G54')) return 'wcs';
    return 'none';
  };

  // Helper to check if line is a buffer clear dwell (G4 P0.01)
  const isBufferClearDwell = (line: string): boolean => {
    const cleanLine = line.split('(')[0].trim().toUpperCase();
    if (!cleanLine.includes('G4')) return false;
    const dwellMatch = cleanLine.match(/P(\d*\.?\d+)/);
    return dwellMatch ? parseFloat(dwellMatch[1]) === 0.01 : false;
  };
  // Pre-process lines to detect buffer clear blocks (2+ consecutive G4 P0.01 lines)
  const bufferClearLines = new Set<number>(); // Set of line indices that are part of buffer clear blocks
  let consecutiveBufferClears = 0;
  let bufferClearStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('(')) {
      // Skip empty lines and comments when counting consecutive buffer clears
      continue;
    }

    if (isBufferClearDwell(line)) {
      if (consecutiveBufferClears === 0) {
        bufferClearStart = i;
      }
      consecutiveBufferClears++;
    } else {
      if (consecutiveBufferClears >= 2) {
        // Found a buffer clear block - mark all lines in this block
        for (let j = bufferClearStart; j < i; j++) {
          if (isBufferClearDwell(lines[j].trim())) {
            bufferClearLines.add(j);
          }
        }
      }
      consecutiveBufferClears = 0;
      bufferClearStart = -1;
    }
  }

  // Check for trailing buffer clear block
  if (consecutiveBufferClears >= 2) {
    for (let j = bufferClearStart; j < lines.length; j++) {
      if (isBufferClearDwell(lines[j].trim())) {
        bufferClearLines.add(j);
      }
    }
  }

  // Track buffer clear block boundaries for probe transitions
  const bufferClearBlocks: number[] = []; // Array of line indices where buffer clear blocks start
  consecutiveBufferClears = 0;
  bufferClearStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('(')) {
      continue;
    }

    if (isBufferClearDwell(line)) {
      if (consecutiveBufferClears === 0) {
        bufferClearStart = i;
      }
      consecutiveBufferClears++;
    } else {
      if (consecutiveBufferClears >= 2) {
        bufferClearBlocks.push(bufferClearStart);
      }
      consecutiveBufferClears = 0;
      bufferClearStart = -1;
    }
  }

  if (consecutiveBufferClears >= 2) {
    bufferClearBlocks.push(bufferClearStart);  }
    for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    const originalLine = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;

    // Skip comments
    if (line.startsWith('(')) {
      continue;
    }    // Check if we've hit a buffer clear block start (for probe transitions)
    if (bufferClearBlocks.includes(i)) {
      if (!hasSeenFirstBufferBlock) {
        hasSeenFirstBufferBlock = true;
        
        // Check if we should clear pre-moves based on complexity of setup
        // If there are machine coordinate moves (G53) or spindle commands (M4), clear pending moves
        let shouldClearPreMoves = false;
        for (let j = 0; j < i; j++) {
          const prevLine = lines[j].trim().toUpperCase();
          if (prevLine.includes('G53') || prevLine.includes('M4')) {
            shouldClearPreMoves = true;
            break;
          }
        }
        
        if (shouldClearPreMoves) {
          pendingMoves = [];
        }
      } else {        // This is a new buffer clear block, save current probe and start new one
        if (currentProbe) {
          const probeOperation: ProbeOperation = {
            id: generateId('probe'),
            axis: currentProbe.axis,
            direction: currentProbe.direction,
            distance: currentProbe.distance,
            feedRate: currentProbe.feedRate,
            backoffDistance: currentProbe.backoffDistance,
            wcsOffset: currentProbe.wcsOffset || 0,
            preMoves: [...currentProbe.preMoves],
            postMoves: [...pendingMoves]
          };          result.probeSequence.push(probeOperation);
          pendingMoves = [];
          currentProbe = null;
          expectingBackoffMove = false; // Reset the flag for next probe
        }
      }
    }    // Skip buffer clearing commands (G4 P0.01) that are part of buffer clear blocks
    if (bufferClearLines.has(i)) {
      continue;
    }    // Skip everything before the first buffer clear block
    if (!hasSeenFirstBufferBlock) {
      // Parse spindle speed and units even before first buffer block
      if (line.includes('G20')) {
        currentUnits = 'inch';
      } else if (line.includes('G21')) {
        currentUnits = 'mm';
      }
      const spindleMatch = line.match(/S(\d+)/);
      if (spindleMatch && line.includes('M4')) {
        currentSpindleSpeed = parseInt(spindleMatch[1]);
      }
      // Continue processing moves but don't collect them as pending moves
    }

    // Remove inline comments for parsing
    const cleanLine = line.split('(')[0].trim();
    if (!cleanLine) continue;

    try {
      // Parse units
      if (cleanLine.includes('G20')) {
        currentUnits = 'inch';
      } else if (cleanLine.includes('G21')) {
        currentUnits = 'mm';
      }

      // Parse spindle speed
      const spindleMatch = cleanLine.match(/S(\d+)/);
      if (spindleMatch && cleanLine.includes('M4')) {
        currentSpindleSpeed = parseInt(spindleMatch[1]);
      }      // Parse probe operations (G38.2)
      if (cleanLine.includes('G38.2')) {
        // Parse new probe
        const axes = parseAxes(cleanLine);
        const feedMatch = cleanLine.match(/F(\d*\.?\d+)/);
        
        if (Object.keys(axes).length === 1) {
          const axis = Object.keys(axes)[0] as 'X' | 'Y' | 'Z';
          const value = axes[axis];
          currentProbe = {
            axis,
            direction: value < 0 ? -1 : 1,
            distance: Math.abs(value),
            feedRate: feedMatch ? parseFloat(feedMatch[1]) : 10,
            backoffDistance: 1, // Default backoff distance
            preMoves: [...pendingMoves], // All moves before this probe are pre-moves
            postMoves: []
          };
          // Clear pending moves as they are now assigned to the probe
          pendingMoves = [];
        } else {
          // Invalid G38.2 line - report error
          result.errors.push(`Error parsing line ${i + 1}: "${originalLine}" - Invalid probe command, expected exactly one axis`);
        }
      }// Parse WCS offset (G10 L20 P1)
      else if (cleanLine.includes('G10') && cleanLine.includes('L20') && cleanLine.includes('P1') && currentProbe) {
        const axes = parseAxes(cleanLine);
        const axisKey = currentProbe.axis;
        if (axes[axisKey] !== undefined) {
          currentProbe.wcsOffset = Math.abs(axes[axisKey]);
          expectingBackoffMove = true; // After WCS setting, expect automatic backoff
        }
      }      // Parse movement commands (G0, G1, G4)
      else {
        if (cleanLine.includes('G0') && !cleanLine.includes('G10')) {
          // Rapid move
          const axes = parseAxes(cleanLine);
          if (Object.keys(axes).length > 0) {
            const positionMode = getPositionMode(cleanLine);
            const coordinateSystem = getCoordinateSystem(cleanLine);
            
            // Check if this is the automatic backoff move after probing
            if (expectingBackoffMove && currentProbe && 
                cleanLine.includes('G91') && 
                Object.keys(axes).length === 1 && 
                axes[currentProbe.axis] !== undefined) {
              // This is the automatic backoff move - extract backoff distance and skip it
              currentProbe.backoffDistance = Math.abs(axes[currentProbe.axis]);
              expectingBackoffMove = false;
              continue; // Skip adding this move to pendingMoves
            }              const move: MovementStep = {
              id: generateId('step'),
              type: 'rapid',
              description: `Rapid move to ${Object.entries(axes).map(([axis, value]) => `${axis}${value}`).join(' ')}`,
              axesValues: axes,
              positionMode,
              coordinateSystem
            };
            
            // Only add to pendingMoves after processing other logic
            pendingMoves.push(move);
            
            // Reset expectingBackoffMove if we see any other rapid move
            expectingBackoffMove = false;
          }        } else if (cleanLine.includes('G4')) {
          // Dwell
          const dwellMatch = cleanLine.match(/P(\d*\.?\d+)/);          if (dwellMatch) {
            const dwellTime = parseFloat(dwellMatch[1]);
            
            // Include all dwells (buffer clear dwells are already filtered out above)
            const move: MovementStep = {
              id: generateId('step'),
              type: 'dwell',
              description: `Dwell for ${dwellTime} seconds`,
              dwellTime
            };
            
            // Only add to pendingMoves after processing other logic
            pendingMoves.push(move);
          }
        }
      }

    } catch (error) {
      result.errors.push(`Error parsing line ${i + 1}: "${originalLine}" - ${error}`);
    }
  }  // Add the last probe if it exists
  if (currentProbe) {
    const probeOperation: ProbeOperation = {
      id: generateId('probe'),
      axis: currentProbe.axis,
      direction: currentProbe.direction,
      distance: currentProbe.distance,
      feedRate: currentProbe.feedRate,
      backoffDistance: currentProbe.backoffDistance,
      wcsOffset: currentProbe.wcsOffset || 0,
      preMoves: [...currentProbe.preMoves],
      postMoves: [...pendingMoves]
    };
    result.probeSequence.push(probeOperation);
  }
  // Set parsed values
  if (currentSpindleSpeed !== undefined) {
    result.spindleSpeed = currentSpindleSpeed;
  }
  if (currentUnits !== undefined) {
    result.units = currentUnits;
  }

  return result;
}
