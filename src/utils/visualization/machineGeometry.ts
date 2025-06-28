import type { MachineSettings, ProbeSequenceSettings } from '@/types/machine';

export interface WorkspaceBounds {
  width: number;
  depth: number;
  height: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface MachineGeometry {
  workspaceBounds: WorkspaceBounds;
  toolPosition: Position3D;
  stagePosition: Position3D;
  stockWorldPosition: Position3D;
  cameraDistance: number;
}

/**
 * Calculate workspace bounds from machine settings
 */
export const calculateWorkspaceBounds = (machineSettings: MachineSettings): WorkspaceBounds => {
  const { X, Y, Z } = machineSettings.axes;
  
  return {
    width: Math.abs(X.max - X.min),
    depth: Math.abs(Y.max - Y.min),
    height: Math.abs(Z.max - Z.min),
    centerX: (X.max + X.min) / 2,
    centerY: (Y.max + Y.min) / 2,
    centerZ: (Z.max + Z.min) / 2,
    minX: X.min,
    maxX: X.max,
    minY: Y.min,
    maxY: Y.max,
    minZ: Z.min,
    maxZ: Z.max,
  };
};

/**
 * Calculate tool position based on machine orientation and probe sequence
 */
export const calculateToolPosition = (
  machineSettings: MachineSettings,
  probeSequence?: ProbeSequenceSettings,
  machineOrientation: 'vertical' | 'horizontal' = 'horizontal'
): Position3D => {
  const baseX = probeSequence?.initialPosition.X || 0;
  const baseY = probeSequence?.initialPosition.Y || 0;
  const baseZ = probeSequence?.initialPosition.Z || 0;

  if (machineOrientation === 'horizontal') {
    // For horizontal machines, spindle is fixed in space
    const spindleFixedX = machineSettings.axes.X.max;
    return { x: spindleFixedX, y: baseY, z: baseZ };
  } else {
    // For vertical machines, tool follows probe position
    return { x: baseX, y: baseY, z: baseZ };
  }
};

/**
 * Calculate stage position for horizontal machines
 */
export const calculateStagePosition = (
  machineSettings: MachineSettings,
  probeSequence?: ProbeSequenceSettings
): Position3D => {
  const { X, Y, Z } = machineSettings.axes;
  // Calculate stage position based on probe X position (inverted relationship)
  const probeX = probeSequence?.initialPosition.X || X.min;
  // Stage X is offset by half its X size so X+ face aligns with desired position
  const stageXSize = 12.7; // mm, default stage X size (width), update if dynamic
  const stageX = X.max - (probeX - X.min) - stageXSize / 2;
  const stageY = (Y.max + Y.min) / 2; // Stage Y position (centered)
  const stageZ = (Z.max + Z.min) / 2; // Stage centered within Z bounds

  return { x: stageX, y: stageY, z: stageZ };
};

/**
 * Calculate stock world position for horizontal machines
 */
export const calculateStockWorldPosition = (
  stagePosition: Position3D,
  stockSize: [number, number, number],
  stockPosition: [number, number, number],
  stageDimensions: [number, number, number]
): Position3D => {
  // Stock attached to X+ face of stage
  const stageXPlusFace = stagePosition.x + stageDimensions[0] / 2;
  const stockWorldX = stageXPlusFace + stockSize[0] / 2 + stockPosition[0];
  const stockWorldY = stagePosition.y + stockPosition[1];
  
  // Stock sitting on stage top
  const stageTop = stagePosition.z + stageDimensions[2] / 2;
  const stockWorldZ = stageTop + stockSize[2] / 2 + stockPosition[2];

  return { x: stockWorldX, y: stockWorldY, z: stockWorldZ };
};

/**
 * Calculate stock relative position from world position
 */
export const calculateStockRelativePosition = (
  worldPosition: Position3D,
  stagePosition: Position3D,
  stockSize: [number, number, number],
  stageDimensions: [number, number, number]
): [number, number, number] => {
  const stageXPlusFace = stagePosition.x + stageDimensions[0] / 2;
  const stageTop = stagePosition.z + stageDimensions[2] / 2;
  
  return [
    worldPosition.x - (stageXPlusFace + stockSize[0] / 2),
    worldPosition.y - stagePosition.y,
    worldPosition.z - (stageTop + stockSize[2] / 2)
  ];
};

/**
 * Calculate default stock position based on machine orientation
 */
export const calculateDefaultStockPosition = (
  machineSettings: MachineSettings,
  stockSize: [number, number, number],
  machineOrientation: 'vertical' | 'horizontal'
): [number, number, number] => {
  if (machineOrientation === 'horizontal') {
    // For horizontal machines: relative to stage
    return [0, 0, 0]; // Centered on stage
  } else {
    // For vertical machines: absolute world coordinates
    const { X, Y, Z } = machineSettings.axes;
    const stockX = X.min + (Math.abs(X.max - X.min) * 0.3);
    const stockY = (Y.max + Y.min) / 2;
    const stockZ = Z.min + stockSize[2] / 2;
    return [stockX, stockY, stockZ];
  }
};

/**
 * Calculate appropriate camera distance based on workspace size
 */
export const calculateCameraDistance = (workspaceBounds: WorkspaceBounds): number => {
  const maxDimension = Math.max(workspaceBounds.width, workspaceBounds.depth, workspaceBounds.height);
  return maxDimension * 1.5;
};

/**
 * Calculate all machine geometry in one function for efficiency
 */
export const calculateMachineGeometry = (
  machineSettings: MachineSettings,
  probeSequence?: ProbeSequenceSettings,
  stockSize: [number, number, number] = [25, 25, 10],
  stockPosition: [number, number, number] = [0, 0, 0],
  machineOrientation: 'vertical' | 'horizontal' = 'horizontal',
  stageDimensions: [number, number, number] = [12.7, 304.8, 63.5]
): MachineGeometry => {
  const workspaceBounds = calculateWorkspaceBounds(machineSettings);
  const toolPosition = calculateToolPosition(machineSettings, probeSequence, machineOrientation);
  const stagePosition = calculateStagePosition(machineSettings, probeSequence);
  const stockWorldPosition = machineOrientation === 'horizontal' 
    ? calculateStockWorldPosition(stagePosition, stockSize, stockPosition, stageDimensions)
    : { x: stockPosition[0], y: stockPosition[1], z: stockPosition[2] };
  const cameraDistance = calculateCameraDistance(workspaceBounds);

  return {
    workspaceBounds,
    toolPosition,
    stagePosition,
    stockWorldPosition,
    cameraDistance
  };
};
