// src/utils/machine/VirtualMill.ts

import type { MachineSettings } from '@/types/machine';
import { CustomModelCollision, type CustomModelInfo } from './CustomModelCollision';

/**
 * Represents a 3D position in machine coordinates
 */
export interface Position3D {
  X: number;
  Y: number;
  Z: number;
}

/**
 * Represents a bounding box in 3D space
 */
export interface BoundingBox {
  min: Position3D;
  max: Position3D;
}

/**
 * Coordinate system types
 */
export type CoordinateSystem = 'machine' | 'wcs';

/**
 * Position mode types
 */
export type PositionMode = 'absolute' | 'relative';

/**
 * Collision detection result
 */
export interface CollisionResult {
  collision: boolean;
  contactPoint?: Position3D;
  penetrationDepth?: number;
}

/**
 * Movement execution result for real-time simulation
 */
export interface MovementResult {
  success: boolean;
  finalPosition: Position3D;
  contactPoint?: Position3D;
  duration: number;
  distance: number;
  feedrate: number;
}

/**
 * Real-time movement state for animation
 */
export interface MovementState {
  startPosition: Position3D;
  endPosition: Position3D;
  startTime: number;
  duration: number;
  feedrate: number;
  distance: number;
  type: 'rapid' | 'linear' | 'probe';
  axis?: 'X' | 'Y' | 'Z';
  direction?: number;
  isActive: boolean;
  contactExpected: boolean;
  contactPoint?: Position3D;
}

/**
 * Ray for collision detection
 */
export interface Ray {
  origin: Position3D;
  direction: Position3D;
}

/**
 * Command handler function type
 */
// Kept for potential future use in command registry pattern
// type CommandHandler<T = any> = (state: VirtualMillState, command: GCodeCommand) => T;

/**
 * Virtual mill internal state (for functional operations)
 * Kept for potential future use in functional refactoring
 */
// interface VirtualMillState {
//   currentPosition: Position3D;
//   wcsOffset: Position3D;
//   positionMode: PositionMode;
//   coordinateSystem: CoordinateSystem;
//   stockSize: [number, number, number];
//   stockPosition: [number, number, number];
//   toolRadius: number;
// }

/**
 * G-code command for execution
 */
export interface GCodeCommand {
  type: 'rapid' | 'linear' | 'probe' | 'wcs' | 'mode' | 'dwell';
  
  // Movement commands
  X?: number;
  Y?: number;
  Z?: number;
  
  // Probe commands
  axis?: 'X' | 'Y' | 'Z';
  direction?: 1 | -1;
  distance?: number;
  feedRate?: number;
  
  // WCS commands
  wcsAxis?: 'X' | 'Y' | 'Z';
  wcsValue?: number;
  
  // Mode commands
  positionMode?: PositionMode;
  coordinateSystem?: CoordinateSystem;
  
  // Dwell commands
  dwellTime?: number;
}

/**
 * Pure functional utilities for geometric calculations
 */
const GeometryUtils = {
  /**
   * Calculate distance between two positions
   */
  distance: (pos1: Position3D, pos2: Position3D): number => {
    const dx = pos2.X - pos1.X;
    const dy = pos2.Y - pos1.Y;
    const dz = pos2.Z - pos1.Z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  /**
   * Interpolate between two positions
   */
  interpolate: (start: Position3D, end: Position3D, progress: number): Position3D => ({
    X: start.X + (end.X - start.X) * progress,
    Y: start.Y + (end.Y - start.Y) * progress,
    Z: start.Z + (end.Z - start.Z) * progress
  }),

  /**
   * Create a ray from position and direction
   */
  createRay: (origin: Position3D, axis: 'X' | 'Y' | 'Z', direction: number): Ray => ({
    origin,
    direction: {
      X: axis === 'X' ? direction : 0,
      Y: axis === 'Y' ? direction : 0,
      Z: axis === 'Z' ? direction : 0
    }
  }),

  /**
   * Expand bounding box by radius
   */
  expandBounds: (bounds: BoundingBox, radius: number): BoundingBox => ({
    min: {
      X: bounds.min.X - radius,
      Y: bounds.min.Y - radius,
      Z: bounds.min.Z - radius
    },
    max: {
      X: bounds.max.X + radius,
      Y: bounds.max.Y + radius,
      Z: bounds.max.Z + radius
    }
  })
};

/**
 * Pure coordinate transformation utilities
 */
const CoordinateUtils = {
  /**
   * Transform coordinates between systems
   */
  transform: (
    position: Position3D,
    from: CoordinateSystem,
    to: CoordinateSystem,
    wcsOffset: Position3D
  ): Position3D => {
    if (from === to) return { ...position };
    
    const operations = {
      'machine->wcs': (pos: Position3D) => ({
        X: pos.X - wcsOffset.X,
        Y: pos.Y - wcsOffset.Y,
        Z: pos.Z - wcsOffset.Z
      }),
      'wcs->machine': (pos: Position3D) => ({
        X: pos.X + wcsOffset.X,
        Y: pos.Y + wcsOffset.Y,
        Z: pos.Z + wcsOffset.Z
      })
    };

    const key = `${from}->${to}` as keyof typeof operations;
    return operations[key]?.(position) ?? { ...position };
  },

  /**
   * Calculate target position based on mode and coordinate system
   */
  calculateTarget: (
    current: Position3D,
    command: GCodeCommand,
    mode: PositionMode,
    coordinateSystem: CoordinateSystem,
    wcsOffset: Position3D
  ): Position3D => {
    const newPosition = { ...current };
    
    const applyCoordinate = (axis: keyof Position3D, value: number) => {
      if (mode === 'relative') {
        newPosition[axis] += value;
      } else {
        newPosition[axis] = coordinateSystem === 'wcs' 
          ? value + wcsOffset[axis] 
          : value;
      }
    };

    if (command.X !== undefined) applyCoordinate('X', command.X);
    if (command.Y !== undefined) applyCoordinate('Y', command.Y);
    if (command.Z !== undefined) applyCoordinate('Z', command.Z);
    
    return newPosition;
  }
};

/**
 * Validation utilities
 */
const ValidationUtils = {
  /**
   * Check if position is within axis limits
   */
  isWithinLimits: (
    position: Position3D,
    limits: { X: [number, number]; Y: [number, number]; Z: [number, number] }
  ): boolean => 
    position.X >= limits.X[0] && position.X <= limits.X[1] &&
    position.Y >= limits.Y[0] && position.Y <= limits.Y[1] &&
    position.Z >= limits.Z[0] && position.Z <= limits.Z[1],

  /**
   * Validate probe command
   */
  validateProbeCommand: (command: GCodeCommand): void => {
    if (!command.axis || !command.direction || !command.distance) {
      throw new Error('Invalid probe command: missing axis, direction, or distance');
    }
  }
};

/**
 * Ray-box intersection using functional composition
 */
const RayBoxIntersection = {
  /**
   * Check if ray is parallel to axis and within bounds
   */
  checkParallelAxis: (
    rayOrigin: number,
    rayDirection: number,
    boundsMin: number,
    boundsMax: number
  ): { valid: boolean; tMin?: number; tMax?: number } => {
    if (Math.abs(rayDirection) < 1e-8) {
      return {
        valid: rayOrigin >= boundsMin && rayOrigin <= boundsMax
      };
    }

    const t1 = (boundsMin - rayOrigin) / rayDirection;
    const t2 = (boundsMax - rayOrigin) / rayDirection;
    
    return {
      valid: true,
      tMin: Math.min(t1, t2),
      tMax: Math.max(t1, t2)
    };
  },

  /**
   * Calculate intersection for all axes
   */
  calculateIntersection: (
    ray: Ray,
    bounds: BoundingBox,
    maxDistance: number
  ): { hit: boolean; point?: Position3D; distance?: number } => {
    const { origin, direction } = ray;
    const { min, max } = bounds;
    
    let tMin = 0;
    let tMax = maxDistance;

    // Check each axis using functional approach
    const axes: Array<{ 
      origin: number; 
      direction: number; 
      min: number; 
      max: number; 
    }> = [
      { origin: origin.X, direction: direction.X, min: min.X, max: max.X },
      { origin: origin.Y, direction: direction.Y, min: min.Y, max: max.Y },
      { origin: origin.Z, direction: direction.Z, min: min.Z, max: max.Z }
    ];

    for (const axis of axes) {
      const result = RayBoxIntersection.checkParallelAxis(
        axis.origin,
        axis.direction,
        axis.min,
        axis.max
      );

      if (!result.valid) {
        return { hit: false };
      }

      if (result.tMin !== undefined && result.tMax !== undefined) {
        tMin = Math.max(tMin, result.tMin);
        tMax = Math.min(tMax, result.tMax);

        if (tMin > tMax) {
          return { hit: false };
        }
      }
    }

    const intersectionDistance = tMin;
    const intersectionPoint = {
      X: origin.X + direction.X * intersectionDistance,
      Y: origin.Y + direction.Y * intersectionDistance,
      Z: origin.Z + direction.Z * intersectionDistance
    };

    return {
      hit: true,
      point: intersectionPoint,
      distance: intersectionDistance
    };
  }
};

// =============================================================================
// VIRTUAL MILL CLASS
// =============================================================================
/**
 * VirtualMill - A virtual representation of a CNC mill that handles coordinate systems,
 * positioning, collision detection, and G-code execution independently of visualization.
 */
export class VirtualMill {
  private machineSettings: MachineSettings;
  private stockSize: [number, number, number];
  private stockPosition: [number, number, number];
  
  // Machine state
  private currentPosition: Position3D;
  private wcsOffset: Position3D;
  private positionMode: PositionMode;
  private coordinateSystem: CoordinateSystem;
  
  // Real-time movement state
  private currentMovement: MovementState | null = null;
  private toolRadius: number = 3; // Default tool radius - should be configurable
  
  // Custom model for enhanced collision detection
  private customModel: CustomModelInfo | null = null;
  private contactPoints: Position3D[] = [];
  
  // Animation and timing
  private animationId: number | null = null;

  // Command handlers registry for declarative execution
  private readonly commandHandlers = {
    mode: this.handleModeCommand.bind(this),
    rapid: this.handleMovementCommand.bind(this),
    linear: this.handleMovementCommand.bind(this),
    probe: this.handleProbeCommand.bind(this),
    wcs: this.handleWCSCommand.bind(this),
    dwell: this.handleDwellCommand.bind(this)
  };

  // Sync command handlers for backward compatibility
  private readonly syncCommandHandlers = {
    mode: this.handleModeCommandSync.bind(this),
    rapid: this.handleMovementCommandSync.bind(this),
    linear: this.handleMovementCommandSync.bind(this),
    probe: this.handleProbeCommandSync.bind(this),
    wcs: this.handleWCSCommandSync.bind(this),
    dwell: () => {} // Dwell has no effect in sync mode
  };

  /**
   * Synchronous command handlers for backward compatibility
   */
  private handleModeCommandSync(command: GCodeCommand): void {
    if (command.positionMode) {
      this.positionMode = command.positionMode;
    }
    if (command.coordinateSystem) {
      this.coordinateSystem = command.coordinateSystem;
    }
  }

  private handleMovementCommandSync(command: GCodeCommand): void {
    const targetPosition = CoordinateUtils.calculateTarget(
      this.currentPosition,
      command,
      this.positionMode,
      this.coordinateSystem,
      this.wcsOffset
    );
    
    if (!ValidationUtils.isWithinLimits(targetPosition, this.getAxisLimits())) {
      const limits = this.getAxisLimits();
      const clampedPosition = {
        X: Math.max(limits.X[0], Math.min(limits.X[1], targetPosition.X)),
        Y: Math.max(limits.Y[0], Math.min(limits.Y[1], targetPosition.Y)),
        Z: Math.max(limits.Z[0], Math.min(limits.Z[1], targetPosition.Z))
      };
      
      console.warn(`Position ${JSON.stringify(targetPosition)} exceeds machine limits. ` +
                   `Clamping to ${JSON.stringify(clampedPosition)}`);
      
      // Use clamped position instead of throwing error
      this.currentPosition = clampedPosition;
      return;
    }
    
    this.currentPosition = targetPosition;
  }

  private handleProbeCommandSync(command: GCodeCommand): Position3D | null {
    ValidationUtils.validateProbeCommand(command);
    
    const startPosition = { ...this.currentPosition };
    const contactPrediction = this.predictProbeContactFunctional(
      startPosition,
      command.axis!,
      command.direction!,
      command.distance!
    );
    
    if (contactPrediction.hasContact && contactPrediction.contactPoint) {
      this.currentPosition = contactPrediction.contactPoint;
      return contactPrediction.contactPoint;
    } else {
      this.currentPosition = this.calculateProbeEndPosition(startPosition, command);
      return null;
    }
  }

  private handleWCSCommandSync(command: GCodeCommand): void {
    if (command.wcsAxis && command.wcsValue !== undefined) {
      this.wcsOffset[command.wcsAxis] = this.currentPosition[command.wcsAxis] - command.wcsValue;
    }
  }
  
  constructor(
    machineSettings: MachineSettings,
    initialPosition: Position3D = { X: 0, Y: 0, Z: 0 }
  ) {
    this.machineSettings = { ...machineSettings };
    this.currentPosition = { ...initialPosition };
    this.wcsOffset = { X: 0, Y: 0, Z: 0 };
    this.positionMode = 'absolute';
    this.coordinateSystem = 'machine';
    
    // Default stock setup
    this.stockSize = [25, 25, 10]; // Default 25x25x10mm stock
    this.stockPosition = [0, 0, 0]; // Default centered at origin
  }
  
  /**
   * Configure the stock dimensions and position
   */
  setStock(size: [number, number, number], position: [number, number, number]): void {
    this.stockSize = [...size];
    this.stockPosition = [...position];
  }
  
  /**
   * Set custom model for enhanced collision detection
   */
  setCustomModel(modelInfo: CustomModelInfo | null): void {
    this.customModel = modelInfo;
    // Clear existing contact points when model changes
    this.contactPoints = [];
  }
  
  /**
   * Get current custom model info
   */
  getCustomModel(): CustomModelInfo | null {
    return this.customModel;
  }
  
  /**
   * Get all recorded contact points
   */
  getContactPoints(): Position3D[] {
    return [...this.contactPoints];
  }
  
  /**
   * Add a contact point from collision detection
   */
  addContactPoint(point: Position3D): void {
    this.contactPoints.push({ ...point });
  }
  
  /**
   * Clear all contact points
   */
  clearContactPoints(): void {
    this.contactPoints = [];
  }
  
  /**
   * Check if using custom model for collision detection
   */
  hasCustomModel(): boolean {
    return this.customModel !== null;
  }
  
  /**
   * Get current machine position
   */
  getCurrentPosition(): Position3D {
    return { ...this.currentPosition };
  }
  
  /**
   * Get current WCS offset
   */
  getWCSOffset(): Position3D {
    return { ...this.wcsOffset };
  }
  
  /**
   * Get current position mode
   */
  getPositionMode(): PositionMode {
    return this.positionMode;
  }
  
  /**
   * Get current coordinate system
   */
  getCoordinateSystem(): CoordinateSystem {
    return this.coordinateSystem;
  }
  
  /**
   * Check if machine is horizontal orientation
   */
  isHorizontal(): boolean {
    return this.machineSettings.machineOrientation === 'horizontal';
  }
  
  /**
   * Check if machine is vertical orientation
   */
  isVertical(): boolean {
    return this.machineSettings.machineOrientation === 'vertical';
  }
  
  /**
   * Get axis limits for the machine
   */
  getAxisLimits(): { X: [number, number]; Y: [number, number]; Z: [number, number] } {
    const { axes } = this.machineSettings;
    return {
      X: [Math.min(axes.X.min, axes.X.max), Math.max(axes.X.min, axes.X.max)],
      Y: [Math.min(axes.Y.min, axes.Y.max), Math.max(axes.Y.min, axes.Y.max)],
      Z: [Math.min(axes.Z.min, axes.Z.max), Math.max(axes.Z.min, axes.Z.max)]
    };
  }
  
  /**
   * Check if an axis is inverted based on polarity
   */
  isAxisInverted(axis: 'X' | 'Y' | 'Z'): boolean {
    return this.machineSettings.axes[axis].polarity === -1;
  }
  
  /**
   * Get the stage bounding box in world coordinates
   */
  getStageBounds(): BoundingBox {
    const [height, width, depth] = this.machineSettings.stageDimensions;
    
    if (this.isHorizontal()) {
      // For horizontal mills, stage is in YZ plane
      return {
        min: { X: 0, Y: -width / 2, Z: -depth / 2 },
        max: { X: height, Y: width / 2, Z: depth / 2 }
      };
    } else {
      // For vertical mills, stage is in XY plane
      return {
        min: { X: -width / 2, Y: -depth / 2, Z: 0 },
        max: { X: width / 2, Y: depth / 2, Z: height }
      };
    }
  }
  
  /**
   * Get the stock bounding box in configured coordinates
   */
  getStockBounds(): BoundingBox {
    const [sizeX, sizeY, sizeZ] = this.stockSize;
    const [posX, posY, posZ] = this.stockPosition;
    
    return {
      min: {
        X: posX - sizeX / 2,
        Y: posY - sizeY / 2,
        Z: posZ - sizeZ / 2
      },
      max: {
        X: posX + sizeX / 2,
        Y: posY + sizeY / 2,
        Z: posZ + sizeZ / 2
      }
    };
  }
  
  /**
   * Get stock bounds in physical coordinates for visualization
   * This accounts for stage movement on horizontal mills where the stage moves
   * since the stage moves instead of the spindle in X dimension
   * 
   * Note: This method is designed for visualization purposes and compensates for
   * stage movement to show the correct relative position between spindle and stock.
   * For collision detection, use getStockBoundsForCollision() instead.
   */
  getPhysicalStockBounds(): BoundingBox {
    const [sizeX, sizeY, sizeZ] = this.stockSize;
    let posX: number;
    const posY = this.stockPosition[1];
    const posZ = this.stockPosition[2];
    
    if (this.isHorizontal()) {
      // On horizontal mills, X movement moves the stage, not the spindle
      // So the stock position in world coordinates is affected by machine X position
      // The stage moves opposite to the machine coordinate direction
      posX = this.stockPosition[0] - this.currentPosition.X;
    } else {
      posX = this.stockPosition[0];
    }
    
    return {
      min: {
        X: posX - sizeX / 2,
        Y: posY - sizeY / 2,
        Z: posZ - sizeZ / 2
      },
      max: {
        X: posX + sizeX / 2,
        Y: posY + sizeY / 2,
        Z: posZ + sizeZ / 2
      }
    };
  }
  
  /**
   * Get stock bounds in world coordinates for collision detection
   * This does not compensate for stage movement - it returns the fixed stock position
   * 
   * Note: This method is specifically designed for collision detection and mathematical
   * calculations. It provides consistent world coordinates regardless of machine position.
   * For visualization that needs to show stage movement, use getPhysicalStockBounds().
   */
  getStockBoundsForCollision(): BoundingBox {
    const [sizeX, sizeY, sizeZ] = this.stockSize;
    const [posX, posY, posZ] = this.stockPosition;
    
    return {
      min: {
        X: posX - sizeX / 2,
        Y: posY - sizeY / 2,
        Z: posZ - sizeZ / 2
      },
      max: {
        X: posX + sizeX / 2,
        Y: posY + sizeY / 2,
        Z: posZ + sizeZ / 2
      }
    };
  }

  /**
   * Transform coordinates between different coordinate systems (functional wrapper)
   */
  transformCoordinates(
    position: Position3D,
    from: CoordinateSystem,
    to: CoordinateSystem
  ): Position3D {
    return CoordinateUtils.transform(position, from, to, this.wcsOffset);
  }
  
  /**
   * Check if a position is within machine axis limits (functional wrapper)
   */
  isWithinAxisLimits(position: Position3D): boolean {
    return ValidationUtils.isWithinLimits(position, this.getAxisLimits());
  }
  
  /**
   * Functional approach to probe contact prediction
   */
  private predictProbeContactFunctional(
    startPos: Position3D,
    axis: 'X' | 'Y' | 'Z',
    direction: number,
    distance: number
  ): { hasContact: boolean; contactPoint?: Position3D; contactDistance?: number } {
    // Check for custom model collision first
    if (this.customModel) {
      const customCollision = CustomModelCollision.checkProbeCollision(
        startPos,
        axis,
        direction,
        distance,
        this.customModel,
        this.toolRadius
      );
      
      if (customCollision.collision && customCollision.contactPoint) {
        // Record contact point
        this.addContactPoint(customCollision.contactPoint);
        
        return {
          hasContact: true,
          contactPoint: customCollision.contactPoint,
          contactDistance: customCollision.penetrationDepth
        };
      }
    }
    
    // Fall back to standard box collision detection
    const stockBounds = this.getStockBoundsForCollision();
    
    // Create ray using functional utility
    const ray = GeometryUtils.createRay(startPos, axis, direction);
    
    // Expand bounds and calculate intersection using functional approach
    const expandedBounds = GeometryUtils.expandBounds(stockBounds, this.toolRadius);
    const intersection = RayBoxIntersection.calculateIntersection(ray, expandedBounds, distance);
    
    if (!intersection.hit || !intersection.point) {
      return { hasContact: false };
    }

    // Calculate surface contact point using declarative mapping
    const contactPointCalculators = {
      X: (point: Position3D) => ({ ...point, X: direction > 0 ? stockBounds.min.X : stockBounds.max.X }),
      Y: (point: Position3D) => ({ ...point, Y: direction > 0 ? stockBounds.min.Y : stockBounds.max.Y }),
      Z: (point: Position3D) => ({ ...point, Z: direction > 0 ? stockBounds.min.Z : stockBounds.max.Z })
    };

    const contactPoint = contactPointCalculators[axis](intersection.point);
    
    // Record contact point for box collision too
    this.addContactPoint(contactPoint);
    
    return {
      hasContact: true,
      contactPoint,
      contactDistance: intersection.distance
    };
  }

  /**
   * Legacy predict probe contact (uses functional implementation)
   */
  predictProbeContact(
    startPos: Position3D,
    axis: 'X' | 'Y' | 'Z',
    direction: number,
    distance: number
  ): { hasContact: boolean; contactPoint?: Position3D; contactDistance?: number } {
    return this.predictProbeContactFunctional(startPos, axis, direction, distance);
  }
  

  /**
   * Execute a G-code command with real-time simulation (declarative approach)
   * Returns a Promise that resolves when the movement is complete
   */
  async executeGCode(command: GCodeCommand): Promise<MovementResult> {
    // Declarative command execution using handler registry
    const handler = this.commandHandlers[command.type];
    if (!handler) {
      throw new Error(`Unknown command type: ${command.type}`);
    }
    
    return handler(command);
  }

  /**
   * Command handlers for declarative execution
   */
  private async handleModeCommand(command: GCodeCommand): Promise<MovementResult> {
    if (command.positionMode) {
      this.positionMode = command.positionMode;
    }
    if (command.coordinateSystem) {
      this.coordinateSystem = command.coordinateSystem;
    }
    
    return this.createSuccessResult(this.currentPosition, 0, 0, 0);
  }

  private async handleMovementCommand(command: GCodeCommand): Promise<MovementResult> {
    const startPosition = { ...this.currentPosition };
    const targetPosition = CoordinateUtils.calculateTarget(
      this.currentPosition,
      command,
      this.positionMode,
      this.coordinateSystem,
      this.wcsOffset
    );
    
    // Validate position using functional approach
    if (!ValidationUtils.isWithinLimits(targetPosition, this.getAxisLimits())) {
      const limits = this.getAxisLimits();
      const clampedPosition = {
        X: Math.max(limits.X[0], Math.min(limits.X[1], targetPosition.X)),
        Y: Math.max(limits.Y[0], Math.min(limits.Y[1], targetPosition.Y)),
        Z: Math.max(limits.Z[0], Math.min(limits.Z[1], targetPosition.Z))
      };
      
      console.warn(`Real-time movement position ${JSON.stringify(targetPosition)} exceeds machine limits. ` +
                   `Clamping to ${JSON.stringify(clampedPosition)}`);
      
      // Use clamped position for movement
      targetPosition.X = clampedPosition.X;
      targetPosition.Y = clampedPosition.Y;
      targetPosition.Z = clampedPosition.Z;
    }
    
    // Calculate movement parameters using pure functions
    const distance = GeometryUtils.distance(startPosition, targetPosition);
    const feedrate = command.type === 'rapid' ? 6000 : 1000;
    const duration = (distance / feedrate) * 60;
    
    // Create movement state declaratively
    const movement: MovementState = {
      startPosition,
      endPosition: targetPosition,
      startTime: Date.now(),
      duration: duration * 1000,
      feedrate,
      distance,
      type: command.type as 'rapid' | 'linear',
      isActive: true,
      contactExpected: false
    };
    
    this.currentMovement = movement;
    return this.animateMovement(movement);
  }

  private async handleProbeCommand(command: GCodeCommand): Promise<MovementResult> {
    ValidationUtils.validateProbeCommand(command);
    
    const startPosition = { ...this.currentPosition };
    
    // Use functional collision prediction
    const contactPrediction = this.predictProbeContactFunctional(
      startPosition,
      command.axis!,
      command.direction!,
      command.distance!
    );
    
    const { endPosition, contactExpected, contactPoint } = contactPrediction.hasContact
      ? {
          endPosition: contactPrediction.contactPoint!,
          contactExpected: true,
          contactPoint: contactPrediction.contactPoint
        }
      : {
          endPosition: this.calculateProbeEndPosition(startPosition, command),
          contactExpected: false,
          contactPoint: undefined
        };
    
    // Calculate movement parameters
    const distance = GeometryUtils.distance(startPosition, endPosition);
    const feedrate = command.feedRate || 100;
    const duration = (distance / feedrate) * 60;
    
    // Create movement state
    const movement: MovementState = {
      startPosition,
      endPosition,
      startTime: Date.now(),
      duration: duration * 1000,
      feedrate,
      distance,
      type: 'probe',
      axis: command.axis,
      direction: command.direction,
      isActive: true,
      contactExpected,
      contactPoint
    };
    
    this.currentMovement = movement;
    return this.animateMovement(movement);
  }

  private async handleWCSCommand(command: GCodeCommand): Promise<MovementResult> {
    if (command.wcsAxis && command.wcsValue !== undefined) {
      this.wcsOffset[command.wcsAxis] = this.currentPosition[command.wcsAxis] - command.wcsValue;
    }
    
    return this.createSuccessResult(this.currentPosition, 0, 0, 0);
  }

  private async handleDwellCommand(command: GCodeCommand): Promise<MovementResult> {
    const dwellTime = command.dwellTime || 1000;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.createSuccessResult(this.currentPosition, dwellTime / 1000, 0, 0));
      }, dwellTime);
    });
  }

  /**
   * Helper to create success result
   */
  private createSuccessResult(
    position: Position3D,
    duration: number,
    distance: number,
    feedrate: number,
    contactPoint?: Position3D
  ): MovementResult {
    return {
      success: true,
      finalPosition: position,
      contactPoint,
      duration,
      distance,
      feedrate
    };
  }

  /**
   * Calculate probe end position when no contact is detected
   */
  private calculateProbeEndPosition(startPosition: Position3D, command: GCodeCommand): Position3D {
    const endPosition = { ...startPosition };
    endPosition[command.axis!] += command.direction! * command.distance!;
    return endPosition;
  }
  

  

  
  /**
   * Animate movement with real-time interpolation (functional approach)
   */
  private async animateMovement(movement: MovementState): Promise<MovementResult> {
    return new Promise((resolve) => {
      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - movement.startTime;
        const progress = Math.min(elapsed / movement.duration, 1.0);
        
        // Use functional interpolation
        this.currentPosition = GeometryUtils.interpolate(
          movement.startPosition,
          movement.endPosition,
          progress
        );
        
        if (progress >= 1.0) {
          // Movement complete
          movement.isActive = false;
          this.currentMovement = null;
          
          resolve(this.createSuccessResult(
            this.currentPosition,
            movement.duration / 1000,
            movement.distance,
            movement.feedrate,
            movement.contactPoint
          ));
        } else {
          // Continue animation
          this.animationId = requestAnimationFrame(animate);
        }
      };
      
      animate();
    });
  }
  
  /**
   * Interpolate position based on movement progress
   */
  private interpolatePosition(movement: MovementState, progress: number): Position3D {
    const { startPosition, endPosition } = movement;
    
    return {
      X: startPosition.X + (endPosition.X - startPosition.X) * progress,
      Y: startPosition.Y + (endPosition.Y - startPosition.Y) * progress,
      Z: startPosition.Z + (endPosition.Z - startPosition.Z) * progress
    };
  }
  

  
  /**
   * Reset the virtual mill to initial state
   */
  reset(initialPosition: Position3D = { X: 0, Y: 0, Z: 0 }): void {
    this.currentPosition = { ...initialPosition };
    this.wcsOffset = { X: 0, Y: 0, Z: 0 };
    this.positionMode = 'absolute';
    this.coordinateSystem = 'machine';
  }
  
  /**
   * Get machine state summary
   */
  getState(): {
    position: Position3D;
    physicalProbePosition: Position3D;
    stagePosition: Position3D;
    wcsOffset: Position3D;
    positionMode: PositionMode;
    coordinateSystem: CoordinateSystem;
    stockBounds: BoundingBox;
    stageBounds: BoundingBox;
    isHorizontal: boolean;
  } {
    return {
      position: this.getCurrentPosition(),
      physicalProbePosition: this.getPhysicalProbePosition(),
      stagePosition: this.getStagePosition(),
      wcsOffset: this.getWCSOffset(),
      positionMode: this.getPositionMode(),
      coordinateSystem: this.getCoordinateSystem(),
      stockBounds: this.getStockBounds(),
      stageBounds: this.getStageBounds(),
      isHorizontal: this.isHorizontal()
    };
  }
  
  /**
   * Get the physical probe position in world coordinates
   * For horizontal mills, the probe is fixed in X at the spindle position
   * For vertical mills, the probe follows the machine coordinates
   */
  getPhysicalProbePosition(): Position3D {
    if (this.isHorizontal()) {
      // On horizontal mills, probe X is fixed at spindle position
      return {
        X: this.machineSettings.axes.X.max,
        Y: this.currentPosition.Y,
        Z: this.currentPosition.Z
      };
    } else {
      // On vertical mills, probe follows machine coordinates
      return { ...this.currentPosition };
    }
  }
  
  /**
   * Get the stage position in world coordinates
   * For horizontal mills, stage X position is offset by machine X position
   * For vertical mills, stage position is independent of machine position
   */
  getStagePosition(): Position3D {
    const stageBounds = this.getStageBounds();
    const stageCenter = {
      X: (stageBounds.min.X + stageBounds.max.X) / 2,
      Y: (stageBounds.min.Y + stageBounds.max.Y) / 2,
      Z: (stageBounds.min.Z + stageBounds.max.Z) / 2
    };
    
    if (this.isHorizontal()) {
      // On horizontal mills, stage moves in X to accommodate machine X movement
      return {
        X: stageCenter.X - this.currentPosition.X,
        Y: stageCenter.Y,
        Z: stageCenter.Z
      };
    } else {
      // On vertical mills, stage position is fixed
      return stageCenter;
    }
  }
  
  /**
   * Backward compatibility: Execute G-code command synchronously (declarative approach)
   * This method provides instant execution without real-time animation
   */
  executeGCodeSync(command: GCodeCommand): void {
    const handler = this.syncCommandHandlers[command.type];
    if (!handler) {
      throw new Error(`Unknown command type: ${command.type}`);
    }
    
    handler(command);
  }
  

  
  /**
   * Backward compatibility: Check for collision (for tests)
   * This method provides the old collision detection interface
   */
  checkProbeCollision(
    probePosition: Position3D,
    axis: 'X' | 'Y' | 'Z',
    _toolRadius: number, // Legacy parameter - not used in functional implementation
    direction: number
  ): CollisionResult {
    // Use the new functional collision prediction
    const distance = 1000; // Large distance for collision check
    const contactPrediction = this.predictProbeContactFunctional(probePosition, axis, direction, distance);
    
    if (contactPrediction.hasContact && contactPrediction.contactPoint) {
      return {
        collision: true,
        contactPoint: contactPrediction.contactPoint
      };
    }
    
    return { collision: false };
  }
  
  /**
   * Get current movement state for real-time animation
   */
  getCurrentMovement(): MovementState | null {
    return this.currentMovement;
  }
  
  /**
   * Check if machine is currently moving
   */
  isMoving(): boolean {
    return this.currentMovement?.isActive || false;
  }
  
  /**
   * Stop current movement (emergency stop)
   */
  stopMovement(): void {
    if (this.currentMovement) {
      this.currentMovement.isActive = false;
      this.currentMovement = null;
    }
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  /**
   * Get interpolated position for current movement (for real-time visualization)
   */
  getInterpolatedPosition(): Position3D {
    if (!this.currentMovement || !this.currentMovement.isActive) {
      return this.currentPosition;
    }
    
    const currentTime = Date.now();
    const elapsed = currentTime - this.currentMovement.startTime;
    const progress = Math.min(elapsed / this.currentMovement.duration, 1.0);
    
    return this.interpolatePosition(this.currentMovement, progress);
  }
  
  /**
   * Set tool radius for collision detection
   */
  setToolRadius(radius: number): void {
    this.toolRadius = radius;
  }
  
  /**
   * Get current tool radius
   */
  getToolRadius(): number {
    return this.toolRadius;
  }
}
