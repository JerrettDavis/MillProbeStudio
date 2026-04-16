// src/hooks/visualization/useProbeSimulation.ts
import React, { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { calculateStagePosition, calculateStockWorldPosition } from '@/utils/visualization/machineGeometry';
import type { MovementStep } from '@/types/machine';

export interface ParsedGCodeLine {
  type: string; // e.g., 'rapid', 'probe', 'dwell', 'wcs' , etc.
  X?: number;
  Y?: number;
  Z?: number;
  feedRate?: number;
  dwellTime?: number;
  axis?: 'X' | 'Y' | 'Z';
  value?: number;
  positionMode?: 'relative' | 'absolute' | 'none';
  coordinateSystem?: 'machine' | 'wcs' | 'none';
  // For probe type:
  direction?: 1 | -1;
  distance?: number;
  id?: string;
  preMoves?: MovementStep[];
  postMoves?: MovementStep[];
}

// Add SimulationStep type if not imported
interface SimulationStep {
  id: string;
  type: string;
  startPosition: { X: number; Y: number; Z: number };
  endPosition: { X: number; Y: number; Z: number };
  gcodeLineIndex: number;
  gcode: ParsedGCodeLine;
  duration?: number;
  isProbing?: boolean;
  axis?: 'X' | 'Y' | 'Z';
  operation?: ParsedGCodeLine;
}

const BASE_RAPID_SPEED = 2000; // mm/min for rapid moves

/**
 * Generate simulation steps from parsed G-code
 */
export function generateSimulationSteps(
  parsedGCode: ParsedGCodeLine[],
  initialPosition: { X: number; Y: number; Z: number }
): SimulationStep[] {
  // DEBUG: Log parsedGCode for test diagnosis
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).DEBUG_PROBE_SIM) {
     
    console.log('generateSimulationSteps parsedGCode:', JSON.stringify(parsedGCode, null, 2));
  }
  const steps: SimulationStep[] = [];
  let currentPos = { ...initialPosition };
  let stepId = 0;
  const wcsOffset = { X: 0, Y: 0, Z: 0 };

  parsedGCode.forEach((line, idx) => {
    // Example: handle motion, dwell, spindle, mode, wcs, etc.
    const step: Partial<SimulationStep> = {
      id: `step-${stepId++}`,
      type: line.type,
      startPosition: { ...currentPos },
      endPosition: { ...currentPos },
      gcodeLineIndex: idx,
      gcode: line
    };
    if (line.type === 'rapid' || line.type === 'linear') {
      // G0/G1
      const endPos = { ...currentPos };
      if (line.positionMode === 'relative') {
        endPos.X += line.X ?? 0;
        endPos.Y += line.Y ?? 0;
        endPos.Z += line.Z ?? 0;
      } else {
        endPos.X = line.X !== undefined ? (line.X + wcsOffset.X) : endPos.X;
        endPos.Y = line.Y !== undefined ? (line.Y + wcsOffset.Y) : endPos.Y;
        endPos.Z = line.Z !== undefined ? (line.Z + wcsOffset.Z) : endPos.Z;
      }
      const distance = Math.sqrt(
        Math.pow(endPos.X - currentPos.X, 2) +
        Math.pow(endPos.Y - currentPos.Y, 2) +
        Math.pow(endPos.Z - currentPos.Z, 2)
      );
      step.endPosition = endPos;
      step.duration = (distance / (line.feedRate || BASE_RAPID_SPEED)) * 60 * 1000;
      currentPos = endPos;
    } else if (line.type === 'dwell') {
      step.duration = (line.dwellTime || 0) * 1000;
    } else if (line.type === 'wcs') {
      // G10 L20 P1: set WCS offset
      if (line.axis && typeof line.value === 'number') {
        wcsOffset[line.axis] = line.value - currentPos[line.axis];
      }
    } else if (line.type === 'probe') {
      // Handle probe operation as a linear move along the axis
      const endPos = { ...currentPos };
      if (
        line.axis &&
        (line.direction === 1 || line.direction === -1) &&
        typeof line.distance === 'number'
      ) {
        endPos[line.axis] += line.direction * line.distance;
      }
      step.endPosition = endPos;
      step.duration = (typeof line.distance === 'number' ? line.distance : 1) / (line.feedRate || BASE_RAPID_SPEED) * 60 * 1000;
      step.isProbing = true;
      step.axis = line.axis;
      step.operation = line;
      currentPos = endPos;
      // DEBUG: Log probe step creation
      if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).DEBUG_PROBE_SIM) {
         
        console.log('Adding probe step:', JSON.stringify(step, null, 2));
      }
    }
    // Add more types as needed (spindle, mode, etc.)
    steps.push(step as SimulationStep);
  });
  return steps;
}

/**
 * Check if probe cylinder (edge) intersects stock bounding box
 */
export function doesProbeCylinderIntersectStock({
  probePos,
  axis,
  toolRadius,
  stockMin,
  stockMax,
  direction
}: {
  probePos: { X: number; Y: number; Z: number };
  axis: 'X' | 'Y' | 'Z';
  toolRadius: number;
  stockMin: { X: number; Y: number; Z: number };
  stockMax: { X: number; Y: number; Z: number };
  direction: number;
}): { collision: boolean; contactPoint?: { X: number; Y: number; Z: number } } {
  // For cylindrical collision detection, we need to check if the probe cylinder
  // intersects the stock rectangle. The cylinder extends infinitely along the movement axis.
  
  // Helper function to calculate distance from point to rectangle
  function distancePointToRectangle(
    point: { u: number; v: number }, 
    rectMin: { u: number; v: number }, 
    rectMax: { u: number; v: number }
  ): number {
    const dx = Math.max(0, Math.max(rectMin.u - point.u, point.u - rectMax.u));
    const dy = Math.max(0, Math.max(rectMin.v - point.v, point.v - rectMax.v));
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  if (axis === 'X') {
    // Probe moves along X axis, cylinder cross-section is in YZ plane
    // Check if the circular cross-section intersects the YZ rectangle of the stock
    const distance = distancePointToRectangle(
      { u: probePos.Y, v: probePos.Z },
      { u: stockMin.Y, v: stockMin.Z },
      { u: stockMax.Y, v: stockMax.Z }
    );
    
    if (distance <= toolRadius) {
      // Probe cylinder intersects stock in YZ plane, so there will be a collision
      // Determine contact point based on movement direction
      let contactX: number;
      
      if (direction > 0) {
        // Moving X+: contact is at stock front face
        contactX = stockMin.X;
      } else {
        // Moving X-: contact is at stock back face  
        contactX = stockMax.X;
      }
      
      // If probe is already inside stock (in all axes), contact is at probe position
      if (probePos.X >= stockMin.X && probePos.X <= stockMax.X &&
          probePos.Y >= stockMin.Y && probePos.Y <= stockMax.Y &&
          probePos.Z >= stockMin.Z && probePos.Z <= stockMax.Z) {
        return { 
          collision: true, 
          contactPoint: { X: probePos.X, Y: probePos.Y, Z: probePos.Z }
        };
      }
      
      // Contact point is on the stock face, clamped to stock bounds
      const contactY = Math.max(stockMin.Y, Math.min(stockMax.Y, probePos.Y));
      const contactZ = Math.max(stockMin.Z, Math.min(stockMax.Z, probePos.Z));
      
      return { 
        collision: true, 
        contactPoint: { X: contactX, Y: contactY, Z: contactZ }
      };
    }
  } else if (axis === 'Y') {
    // Probe moves along Y axis, cylinder cross-section is in XZ plane
    const distance = distancePointToRectangle(
      { u: probePos.X, v: probePos.Z },
      { u: stockMin.X, v: stockMin.Z },
      { u: stockMax.X, v: stockMax.Z }
    );
    
    if (distance <= toolRadius) {
      // Probe cylinder intersects stock in XZ plane, so there will be a collision
      // Determine contact point based on movement direction
      let contactY: number;
      
      if (direction > 0) {
        // Moving Y+: contact is at stock front face
        contactY = stockMin.Y;
      } else {
        // Moving Y-: contact is at stock back face
        contactY = stockMax.Y;
      }
      
      // If probe is already inside stock (in all axes), contact is at probe position
      if (probePos.X >= stockMin.X && probePos.X <= stockMax.X &&
          probePos.Y >= stockMin.Y && probePos.Y <= stockMax.Y &&
          probePos.Z >= stockMin.Z && probePos.Z <= stockMax.Z) {
        return { 
          collision: true, 
          contactPoint: { X: probePos.X, Y: probePos.Y, Z: probePos.Z }
        };
      }
      
      // Contact point is on the stock face, clamped to stock bounds
      const contactX = Math.max(stockMin.X, Math.min(stockMax.X, probePos.X));
      const contactZ = Math.max(stockMin.Z, Math.min(stockMax.Z, probePos.Z));
      
      return { 
        collision: true, 
        contactPoint: { X: contactX, Y: contactY, Z: contactZ }
      };
    }
  } else if (axis === 'Z') {
    // Probe moves along Z axis, cylinder cross-section is in XY plane
    const distance = distancePointToRectangle(
      { u: probePos.X, v: probePos.Y },
      { u: stockMin.X, v: stockMin.Y },
      { u: stockMax.X, v: stockMax.Y }
    );
    
    if (distance <= toolRadius) {
      // Probe cylinder intersects stock in XY plane, so there will be a collision
      // Determine contact point based on movement direction
      let contactZ: number;
      
      if (direction > 0) {
        // Moving Z+: contact is at stock front face
        contactZ = stockMin.Z;
      } else {
        // Moving Z-: contact is at stock back face
        contactZ = stockMax.Z;
      }
      
      // If probe is already inside stock (in all axes), contact is at probe position
      if (probePos.X >= stockMin.X && probePos.X <= stockMax.X &&
          probePos.Y >= stockMin.Y && probePos.Y <= stockMax.Y &&
          probePos.Z >= stockMin.Z && probePos.Z <= stockMax.Z) {
        return { 
          collision: true, 
          contactPoint: { X: probePos.X, Y: probePos.Y, Z: probePos.Z }
        };
      }
      
      // Contact point is on the stock face, clamped to stock bounds
      const contactX = Math.max(stockMin.X, Math.min(stockMax.X, probePos.X));
      const contactY = Math.max(stockMin.Y, Math.min(stockMax.Y, probePos.Y));
      
      return { 
        collision: true, 
        contactPoint: { X: contactX, Y: contactY, Z: contactZ }
      };
    }
  }
  
  return { collision: false };
}

// Restore useProbeSimulation to accept parsedGCode and initialPosition as arguments
function useProbeSimulation(parsedGCode: ParsedGCodeLine[], initialPosition: { X: number; Y: number; Z: number }) {
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const simulationStepsRef = useRef<SimulationStep[]>([]);
  const currentStepProgressRef = useRef<number>(0);
  const prevPositionRef = useRef<{ X: number; Y: number; Z: number } | null>(null);
  const collisionRegisteredRef = useRef<boolean>(false);
  const [steps, setSteps] = React.useState<SimulationStep[]>([]);

  // Cache expensive calculations to avoid recalculating on every frame
  const cachedStockBoundsRef = useRef<{
    stockMin: { X: number; Y: number; Z: number };
    stockMax: { X: number; Y: number; Z: number };
    toolRadius: number;
    lastUpdateTime: number;
  } | null>(null);

  // Store state and actions
  const simulationState = useAppStore(state => state.simulationState);
  const simulationStateRef = useRef(simulationState);
  simulationStateRef.current = simulationState;
  const {
    pauseSimulation,
    setSimulationStep,
    setSimulationPosition,
    addContactPoint
  } = useAppStore();

  const pauseSimulationAndReset = useCallback(() => {
    pauseSimulation();
    lastTimestampRef.current = 0;
    currentStepProgressRef.current = 0;
  }, [pauseSimulation]);

  // Helper function to get cached stock bounds or calculate them if needed
  const getStockBounds = useCallback(() => {
    const now = performance.now();
    const cache = cachedStockBoundsRef.current;
    
    // Use cache if it's less than 100ms old to avoid recalculating constantly
    if (cache && (now - cache.lastUpdateTime) < 100) {
      return cache;
    }
    
    // Recalculate stock bounds
    const { stockPosition, stockSize } = useAppStore.getState().visualizationSettings;
    const machineSettings = useAppStore.getState().machineSettings;
    const probeSequenceSettings = useAppStore.getState().probeSequenceSettings;
    const stageDimensions = machineSettings.stageDimensions;
    const stagePosition = calculateStagePosition(machineSettings, probeSequenceSettings);
    const stockWorld = calculateStockWorldPosition(stagePosition, stockSize, stockPosition, stageDimensions);
    
    const stockMin = {
      X: stockWorld.x - stockSize[0] / 2,
      Y: stockWorld.y - stockSize[1] / 2,
      Z: stockWorld.z - stockSize[2] / 2
    };
    const stockMax = {
      X: stockWorld.x + stockSize[0] / 2,
      Y: stockWorld.y + stockSize[1] / 2,
      Z: stockWorld.z + stockSize[2] / 2
    };
    
    const toolDiameter = probeSequenceSettings.endmillSize.sizeInMM || 6;
    const toolRadius = toolDiameter / 2;
    
    const newCache = {
      stockMin,
      stockMax,
      toolRadius,
      lastUpdateTime: now
    };
    
    cachedStockBoundsRef.current = newCache;
    return newCache;
  }, []);

  /**
   * Animation loop
   */
  const animate = useCallback((timestamp: number) => {
    const state = simulationStateRef.current;
    if (!state.isPlaying || !state.isActive) {
      return;
    }

    const deltaTime = timestamp - lastTimestampRef.current;
    const adjustedDelta = deltaTime * state.speed;
    lastTimestampRef.current = timestamp;
    const currentStep = simulationStepsRef.current[state.currentStepIndex];
    if (!currentStep) {
      pauseSimulationAndReset();
      return;
    }

    // Store previous position for accurate collision interpolation
    if (!prevPositionRef.current) {
      prevPositionRef.current = { ...currentStep.startPosition };
    }
    const prevPosition = { ...prevPositionRef.current };

    // Update step progress
    currentStepProgressRef.current += adjustedDelta;
    const progress = Math.min(currentStepProgressRef.current / currentStep.duration!, 1);

    // Interpolate position
    let newPosition: { X: number; Y: number; Z: number };
    if (currentStep.type === 'wcs') {
      // For WCS step, do not animate/interpolate; set position directly to endPosition
      newPosition = { ...currentStep.endPosition };
      // Sanity: ensure no NaN
      if (Object.values(newPosition).some(v => typeof v !== 'number' || isNaN(v))) {
        // If invalid, fallback to previous valid position
        newPosition = { ...prevPosition };
      }
      setSimulationPosition(newPosition);
      prevPositionRef.current = { ...newPosition };
      // Immediately advance to next step
      const nextStepIndex = simulationState.currentStepIndex + 1;
      if (nextStepIndex < simulationStepsRef.current.length) {
        setSimulationStep(nextStepIndex);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        pauseSimulationAndReset();
      }
      return;
    } else {
      newPosition = {
        X: currentStep.startPosition.X + (currentStep.endPosition.X - currentStep.startPosition.X) * progress,
        Y: currentStep.startPosition.Y + (currentStep.endPosition.Y - currentStep.startPosition.Y) * progress,
        Z: currentStep.startPosition.Z + (currentStep.endPosition.Z - currentStep.startPosition.Z) * progress
      };
      // Sanity: never set NaN
      if (Object.values(newPosition).some(v => typeof v !== 'number' || isNaN(v))) {
        newPosition = { ...prevPosition };
      }
      setSimulationPosition(newPosition);
      prevPositionRef.current = { ...newPosition };
    }

    // Check for collision during probe moves (check earlier and more efficiently)
    if (currentStep.isProbing && !collisionRegisteredRef.current) {
      const stockBounds = getStockBounds();
      const { stockMin, stockMax, toolRadius } = stockBounds;
      
      // Check collision at the current position
      const direction = currentStep.operation && typeof currentStep.operation.direction === 'number' ? currentStep.operation.direction : 0;
      const result = doesProbeCylinderIntersectStock({ 
        probePos: newPosition, 
        axis: currentStep.axis!, 
        toolRadius, 
        stockMin, 
        stockMax, 
        direction 
      });
      
      if (result.collision) {
        // Calculate precise contact point by interpolating between previous and current position
        let contactPoint = result.contactPoint;
        
        if (!contactPoint) {
          // Fallback: use the collision detection result or current position
          contactPoint = newPosition;
        }
        
        setSimulationPosition(contactPoint);
        addContactPoint({
          position: contactPoint,
          probeOperationId: currentStep.operation && currentStep.operation.id ? currentStep.operation.id : '',
          axis: currentStep.axis!
        });
        
        collisionRegisteredRef.current = true;
        
        // Immediately advance to next step after collision
        const nextStepIndex = simulationState.currentStepIndex + 1;
        if (nextStepIndex < simulationStepsRef.current.length) {
          setSimulationStep(nextStepIndex);
        } else {
          pauseSimulationAndReset();
        }
        prevPositionRef.current = null;
        
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
    }

    setSimulationPosition(newPosition);
    prevPositionRef.current = { ...newPosition };

    // Check if step is complete
    if (progress === 1) {
      currentStepProgressRef.current = 0;
      const nextStepIndex = simulationState.currentStepIndex + 1;
      if (nextStepIndex < simulationStepsRef.current.length) {
        setSimulationStep(nextStepIndex);
      } else {
        pauseSimulationAndReset();
      }
      prevPositionRef.current = null;
      collisionRegisteredRef.current = false;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [pauseSimulationAndReset, setSimulationStep, setSimulationPosition, addContactPoint, simulationState.currentStepIndex, getStockBounds]);

  // Only run animation loop if simulation is playing and active
  useEffect(() => {
    if (simulationState.isPlaying && simulationState.isActive) {
      // Only start animation if not already running
      if (!animationRef.current) {
        // Fix: Reset lastTimestampRef and currentStepProgressRef to prevent jump on play
        lastTimestampRef.current = performance.now();
        // Do not advance currentStepProgressRef.current here; let it continue from where it left off
        animationRef.current = requestAnimationFrame(animate);
      }
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    // Clean up on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [simulationState.isPlaying, simulationState.isActive, animate]);

  // On parsedGCode/initialPosition change, only regenerate simulation steps for display (do not update simulation step, position, or refs)
  useEffect(() => {
    if (parsedGCode && parsedGCode.length > 0 && initialPosition) {
      const steps = generateSimulationSteps(parsedGCode, initialPosition);
      simulationStepsRef.current = steps;
      setSteps(steps); // <-- update state for immediate reactivity
    } else {
      simulationStepsRef.current = [];
      setSteps([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(parsedGCode), initialPosition && `${initialPosition.X},${initialPosition.Y},${initialPosition.Z}`]);

  // Add effect to fully reset refs and cancel animation on stop/reset
  useEffect(() => {
    if (!simulationState.isActive) {
      // Cancel animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Clear cache to ensure fresh calculations on next run
      cachedStockBoundsRef.current = null;
      // Do NOT reset any refs or state here. Simulation should be inert unless started.
    }
  }, [simulationState.isActive]);

  return {
    pauseSimulation: pauseSimulationAndReset,
    isPlaying: simulationState.isPlaying,
    currentStepIndex: simulationState.currentStepIndex,
    totalSteps: steps.length,
    isReady: steps.length > 0,
    currentStep: steps[simulationState.currentStepIndex] || null,
    currentGCodeLineIndex: steps[simulationState.currentStepIndex]?.gcodeLineIndex,
    steps // expose for debugging if needed
  };
}

export default useProbeSimulation;
