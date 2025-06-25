
export interface MachineOrientationConfig {
  gridRotation: [number, number, number];
  upVector: [number, number, number];
  workspaceRotation: [number, number, number];
  gridCellSize: (units: string) => number;
  lightingIntensity: {
    ambient: number;
    directional: number;
    point: number;
  };
}

export interface VisualizationConfig {
  defaultStockSize: [number, number, number];
  defaultStageDimensions: [number, number, number];
  toolLength: number;
  machineTableOpacity: number;
  stockOpacity: number;
  gridOpacity: number;
  colors: {
    machineTable: string;
    stock: {
      default: string;
      hovered: string;
      dragging: string;
    };
    tool: {
      shank: string;
      tip: string;
      shankhovered: string;
      tipHovered: string;
    };
    axes: {
      x: string;
      y: string;
      z: string;
    };
    workspace: string;
    grid: string;
    probePath: string;
  };
}

/**
 * Configuration for different machine orientations
 */
export const MACHINE_ORIENTATION_CONFIGS: Record<'vertical' | 'horizontal', MachineOrientationConfig> = {
  vertical: {
    gridRotation: [Math.PI / 2, 0, 0],
    upVector: [0, 0, 1],
    workspaceRotation: [0, 0, 0],
    gridCellSize: (units: string) => units === 'mm' ? 10 : 0.5,
    lightingIntensity: {
      ambient: 0.4,
      directional: 0.6,
      point: 0.5
    }
  },
  horizontal: {
    gridRotation: [Math.PI / 2, 0, 0],
    upVector: [0, 0, -1],
    workspaceRotation: [0, Math.PI / 2, 0],
    gridCellSize: (units: string) => units === 'mm' ? 10 : 0.5,
    lightingIntensity: {
      ambient: 0.4,
      directional: 0.6,
      point: 0.5
    }
  }
};

/**
 * Default visualization configuration
 */
export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  defaultStockSize: [25, 25, 10],
  defaultStageDimensions: [12.7, 304.8, 63.5],
  toolLength: 30,
  machineTableOpacity: 0.8,
  stockOpacity: 0.7,
  gridOpacity: 0.3,
  colors: {
    machineTable: '#666666',
    stock: {
      default: '#8B4513',
      hovered: '#DEB887',
      dragging: '#CD853F'
    },
    tool: {
      shank: '#C0C0C0',
      tip: '#FFD700',
      shankhovered: '#E5E5E5',
      tipHovered: '#FFED4A'
    },
    axes: {
      x: 'red',
      y: 'green',
      z: 'blue'
    },
    workspace: '#00FF00',
    grid: '#2D5016',
    probePath: '#FF6B6B'
  }
};

/**
 * Calculate grid positioning based on machine orientation
 */
export const getGridConfig = (
  machineOrientation: 'vertical' | 'horizontal',
  workspaceBounds: { centerX: number; centerY: number; centerZ: number; minZ: number; width: number; depth: number },
  units: string
) => {
  const config = MACHINE_ORIENTATION_CONFIGS[machineOrientation];
  
  if (machineOrientation === 'horizontal') {
    return {
      args: [workspaceBounds.width, workspaceBounds.depth] as [number, number],
      cellSize: config.gridCellSize(units),
      position: [workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.minZ - 0.1] as [number, number, number],
      rotation: config.gridRotation,
      infiniteGrid: false,
      fadeDistance: workspaceBounds.width * 2,
      fadeStrength: 1
    };
  } else {
    return {
      args: [workspaceBounds.width, workspaceBounds.depth] as [number, number],
      cellSize: config.gridCellSize(units),
      position: [workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.minZ - 0.1] as [number, number, number],
      rotation: config.gridRotation,
      infiniteGrid: false,
      fadeDistance: workspaceBounds.width * 2,
      fadeStrength: 1
    };
  }
};

/**
 * Calculate lighting positions based on workspace
 */
export const getLightingConfig = (
  workspaceBounds: { centerX: number; centerY: number; centerZ: number; minZ: number; maxX: number; maxY: number },
  machineOrientation: 'vertical' | 'horizontal'
) => {
  const config = MACHINE_ORIENTATION_CONFIGS[machineOrientation];
  
  return {
    ambient: { intensity: config.lightingIntensity.ambient },
    directional: [
      { position: [10, 10, 5] as [number, number, number], intensity: config.lightingIntensity.directional },
      { position: [-10, -10, -30] as [number, number, number], intensity: 0.8 }
    ],
    point: [
      { 
        position: [workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.minZ - 20] as [number, number, number], 
        intensity: config.lightingIntensity.point 
      },
      { 
        position: [workspaceBounds.maxX, workspaceBounds.maxY, workspaceBounds.centerZ] as [number, number, number], 
        intensity: 0.3 
      }
    ]
  };
};
