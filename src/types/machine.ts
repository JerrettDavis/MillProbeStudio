// src/types/machine.ts

export interface AxisConfig {
  positiveDirection: string;
  negativeDirection: string;
  polarity: 1 | -1;
  min: number;
  max: number;
}

export interface MachineSettings {
  units: 'mm' | 'inch';
  axes: {
    X: AxisConfig;
    Y: AxisConfig;
    Z: AxisConfig;
  };
  machineOrientation: 'vertical' | 'horizontal';
  stageDimensions: [number, number, number]; // [height, width, depth] in mm or inches
}

export interface ProbeSequenceSettings {
  initialPosition: {
    X: number;
    Y: number;
    Z: number;
  };
  dwellsBeforeProbe: number;
  spindleSpeed: number;
  units: 'mm' | 'inch';
  endmillSize: {
    input: string;
    unit: 'fraction' | 'inch' | 'mm';
    sizeInMM: number;
  };
  operations: ProbeOperation[];
}

export interface ProbeOperation {
  id: string;
  axis: 'X' | 'Y' | 'Z';
  direction: 1 | -1;
  distance: number;
  feedRate: number;
  backoffDistance: number;
  wcsOffset: number;
  preMoves: MovementStep[];
  postMoves: MovementStep[];
}

export interface MovementStep {
  id: string;
  type: 'rapid' | 'dwell'; // Simplified to just 'rapid' (G0) and 'dwell' (G4)
  dwellTime?: number; // For dwell moves
  description: string;
  
  // For rapid moves (G0):
  axesValues?: { [axis: string]: number }; // e.g. { X: -5.5, Y: -4 }
  positionMode?: 'relative' | 'absolute' | 'none'; // G91 vs G90 vs unspecified
  coordinateSystem?: 'machine' | 'wcs' | 'none'; // G53 vs G54 vs unspecified
}
