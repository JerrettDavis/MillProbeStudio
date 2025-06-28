// src/hooks/visualization/useProbeSimulation.ts
import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import type { ProbeOperation, MovementStep } from '@/types/machine';
import { calculateStagePosition, calculateStockWorldPosition } from '@/utils/visualization/machineGeometry';

export interface SimulationStep {
  id: string;
  type: 'rapid' | 'probe' | 'dwell' | 'backoff';
  startPosition: { X: number; Y: number; Z: number };
  endPosition: { X: number; Y: number; Z: number };
  duration: number; // Animation duration in milliseconds
  operation?: ProbeOperation;
  movement?: MovementStep;
  axis?: 'X' | 'Y' | 'Z';
  isProbing?: boolean; // True for actual probe moves where collision detection should happen
}

const BASE_RAPID_SPEED = 2000; // mm/min for rapid moves

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
  // Project the probe tip onto the plane perpendicular to the probe axis
  // and check if the circle (cylinder cross-section) overlaps the box face.
  // For each axis, check the 2D circle/rectangle overlap in the other two axes.
  if (axis === 'X') {
    // Probe moves along X, cylinder axis is X, circle in YZ
    const y = probePos.Y;
    const z = probePos.Z;
    // Clamp Y/Z to box
    const closestY = Math.max(stockMin.Y, Math.min(y, stockMax.Y));
    const closestZ = Math.max(stockMin.Z, Math.min(z, stockMax.Z));
    const distSq = (y - closestY) ** 2 + (z - closestZ) ** 2;
    // If the circle at (y,z) with radius toolRadius overlaps the box in YZ, collision
    if (distSq <= toolRadius ** 2) {
      // Also check X overlap (cylinder must overlap box in X)
      if (probePos.X >= stockMin.X - 0.5 && probePos.X <= stockMax.X + 0.5) {
        return { collision: true };
      }
    }
  } else if (axis === 'Y') {
    // Probe moves along Y, cylinder axis is Y, circle in XZ
    const x = probePos.X;
    const z = probePos.Z;
    const epsilon = 0.01;
    if (direction > 0) {
      if ((probePos.Y + (toolRadius * 3)) >= stockMin.Y + 0.01) {
        // Should trigger when the Y- edge of the cylinder just touches the Y- face
        return { collision: true, contactPoint: { X: probePos.X, Y: probePos.Y + toolRadius, Z: probePos.Z } };
      }
    } else if (direction < 0) {
      if ((probePos.Y - (toolRadius * 3)) <= stockMax.Y - 0.01) {
        // Should trigger when the Y+ edge of the cylinder just touches the Y+ face
        return { collision: true, contactPoint: { X: probePos.X, Y: probePos.Y - toolRadius, Z: probePos.Z } };
      }
    }
  } else if (axis === 'Z') {
    // Probe moves along Z, cylinder axis is Z, circle in XY
    const x = probePos.X;
    const y = probePos.Y;
    const closestX = Math.max(stockMin.X, Math.min(x, stockMax.X));
    const closestY = Math.max(stockMin.Y, Math.min(y, stockMax.Y));
    const distSq = (x - closestX) ** 2 + (y - closestY) ** 2;
    if (distSq <= toolRadius ** 2) {
      if (probePos.Z >= stockMin.Z - 0.5 && probePos.Z <= stockMax.Z + 0.5) {
        return { collision: true };
      }
    }
  }
  return { collision: false };
}

function useProbeSimulation(operations?: ProbeOperation[], initialPosition?: { X: number; Y: number; Z: number }) {
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const simulationStepsRef = useRef<SimulationStep[]>([]);
  const currentStepProgressRef = useRef<number>(0);
  const prevPositionRef = useRef<{ X: number; Y: number; Z: number } | null>(null);
  const collisionRegisteredRef = useRef<boolean>(false);

  // Store state and actions
  const simulationState = useAppStore(state => state.simulationState);
  const {
    pauseSimulation,
    setSimulationStep,
    setSimulationPosition,
    addContactPoint
  } = useAppStore();

  /**
   * Convert probe sequence into simulation steps
   */
  const generateSimulationSteps = useCallback((
    operations: ProbeOperation[],
    initialPosition: { X: number; Y: number; Z: number }
  ): SimulationStep[] => {
    const steps: SimulationStep[] = [];
    let currentPos = { ...initialPosition };
    let stepId = 0;

    operations.forEach((operation) => {
      // Pre-moves
      operation.preMoves.forEach((move) => {
        if (move.type === 'rapid' && move.axesValues) {
          let endPos = { ...currentPos };
          
          if (move.positionMode === 'relative') {
            endPos.X += move.axesValues.X || 0;
            endPos.Y += move.axesValues.Y || 0;
            endPos.Z += move.axesValues.Z || 0;
          } else {
            endPos.X = move.axesValues.X ?? endPos.X;
            endPos.Y = move.axesValues.Y ?? endPos.Y;
            endPos.Z = move.axesValues.Z ?? endPos.Z;
          }

          const distance = Math.sqrt(
            Math.pow(endPos.X - currentPos.X, 2) +
            Math.pow(endPos.Y - currentPos.Y, 2) +
            Math.pow(endPos.Z - currentPos.Z, 2)
          );

          steps.push({
            id: `step-${stepId++}`,
            type: 'rapid',
            startPosition: { ...currentPos },
            endPosition: endPos,
            duration: (distance / BASE_RAPID_SPEED) * 60 * 1000, // Convert to ms
            movement: move
          });

          currentPos = endPos;
        } else if (move.type === 'dwell' && move.dwellTime) {
          steps.push({
            id: `step-${stepId++}`,
            type: 'dwell',
            startPosition: { ...currentPos },
            endPosition: { ...currentPos },
            duration: move.dwellTime * 1000, // Convert to ms
            movement: move
          });
        }
      });

      // Probe move
      const probeEndPos = { ...currentPos };
      if (operation.axis === 'X') {
        probeEndPos.X += operation.distance * operation.direction;
      } else if (operation.axis === 'Y') {
        probeEndPos.Y += operation.distance * operation.direction;
      } else if (operation.axis === 'Z') {
        probeEndPos.Z += operation.distance * operation.direction;
      }

      const probeDistance = operation.distance;
      const probeDuration = (probeDistance / operation.feedRate) * 60 * 1000; // Convert to ms

      steps.push({
        id: `step-${stepId++}`,
        type: 'probe',
        startPosition: { ...currentPos },
        endPosition: probeEndPos,
        duration: probeDuration,
        operation,
        axis: operation.axis,
        isProbing: true
      });

      // Backoff move
      const backoffPos = { ...probeEndPos };
      if (operation.axis === 'X') {
        backoffPos.X -= operation.backoffDistance * operation.direction;
      } else if (operation.axis === 'Y') {
        backoffPos.Y -= operation.backoffDistance * operation.direction;
      } else if (operation.axis === 'Z') {
        backoffPos.Z -= operation.backoffDistance * operation.direction;
      }

      const backoffDuration = (operation.backoffDistance / BASE_RAPID_SPEED) * 60 * 1000;

      steps.push({
        id: `step-${stepId++}`,
        type: 'backoff',
        startPosition: probeEndPos,
        endPosition: backoffPos,
        duration: backoffDuration,
        operation,
        axis: operation.axis
      });

      currentPos = backoffPos;

      // Post-moves
      operation.postMoves.forEach((move) => {
        if (move.type === 'rapid' && move.axesValues) {
          let endPos = { ...currentPos };
          
          if (move.positionMode === 'relative') {
            endPos.X += move.axesValues.X || 0;
            endPos.Y += move.axesValues.Y || 0;
            endPos.Z += move.axesValues.Z || 0;
          } else {
            endPos.X = move.axesValues.X ?? endPos.X;
            endPos.Y = move.axesValues.Y ?? endPos.Y;
            endPos.Z = move.axesValues.Z ?? endPos.Z;
          }

          const distance = Math.sqrt(
            Math.pow(endPos.X - currentPos.X, 2) +
            Math.pow(endPos.Y - currentPos.Y, 2) +
            Math.pow(endPos.Z - currentPos.Z, 2)
          );

          steps.push({
            id: `step-${stepId++}`,
            type: 'rapid',
            startPosition: { ...currentPos },
            endPosition: endPos,
            duration: (distance / BASE_RAPID_SPEED) * 60 * 1000,
            movement: move
          });

          currentPos = endPos;
        } else if (move.type === 'dwell' && move.dwellTime) {
          steps.push({
            id: `step-${stepId++}`,
            type: 'dwell',
            startPosition: { ...currentPos },
            endPosition: { ...currentPos },
            duration: move.dwellTime * 1000,
            movement: move
          });
        }
      });
    });

    return steps;
  }, []);

  const pauseSimulationAndReset = useCallback(() => {
    pauseSimulation();
    lastTimestampRef.current = 0;
    currentStepProgressRef.current = 0;
  }, [pauseSimulation]);

  /**
   * Animation loop
   */
  const animate = useCallback((timestamp: number) => {
    if (!simulationState.isPlaying || !simulationState.isActive) {
      return;
    }

    const deltaTime = timestamp - lastTimestampRef.current;
    const adjustedDelta = deltaTime * simulationState.speed;
    lastTimestampRef.current = timestamp;

    const currentStep = simulationStepsRef.current[simulationState.currentStepIndex];
    if (!currentStep) {
      pauseSimulationAndReset();
      return;
    }

    // Store previous position for accurate collision interpolation
    if (!prevPositionRef.current) {
      prevPositionRef.current = { ...currentStep.startPosition };
    }
    let prevPosition = { ...prevPositionRef.current };

    // Update step progress
    currentStepProgressRef.current += adjustedDelta;
    let progress = Math.min(currentStepProgressRef.current / currentStep.duration, 1);

    // Interpolate position
    let newPosition = {
      X: currentStep.startPosition.X + (currentStep.endPosition.X - currentStep.startPosition.X) * progress,
      Y: currentStep.startPosition.Y + (currentStep.endPosition.Y - currentStep.startPosition.Y) * progress,
      Z: currentStep.startPosition.Z + (currentStep.endPosition.Z - currentStep.startPosition.Z) * progress
    };

    // Check for collision during probe moves (check continuously, not just at step completion)
    if (currentStep.isProbing && currentStep.operation && progress > 0.1) {
      const { stockPosition, stockSize } = useAppStore.getState().visualizationSettings;
      const machineSettings = useAppStore.getState().machineSettings;
      const stageDimensions = machineSettings.stageDimensions;
      const stagePosition = calculateStagePosition(machineSettings, useAppStore.getState().probeSequenceSettings);
      // Calculate world position of the stock (center)
      const stockWorld = calculateStockWorldPosition(stagePosition, stockSize, stockPosition, stageDimensions);
      // Stock bounding box min/max in world coordinates
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
      const toolDiameter = useAppStore.getState().probeSequenceSettings.endmillSize.sizeInMM || 6;
      const toolRadius = toolDiameter / 2;
      const tip = { ...newPosition };
      const prevTip = { ...prevPosition };
      // Only check collision if not already registered for this step
      if (!collisionRegisteredRef.current) {
        const result = doesProbeCylinderIntersectStock({ probePos: tip, axis: currentStep.axis!, toolRadius, stockMin, stockMax, direction: currentStep.operation.direction });
        if (result.collision) {
          // Interpolate to find the exact collision point between prevTip and tip
          let t = 0;
          if (currentStep.axis === 'Y' && currentStep.operation.direction < 0) {
            // Y-: solve for (Y - toolRadius) == stockMax.Y
            const y0 = prevTip.Y - toolRadius;
            const y1 = tip.Y - toolRadius;
            const denom = y1 - y0;
            if (Math.abs(denom) > 1e-8) {
              t = (stockMax.Y - y0) / denom;
              t = Math.max(0, Math.min(1, t));
            }
          } else if (currentStep.axis === 'Y' && currentStep.operation.direction > 0) {
            // Y+: solve for (Y + toolRadius) == stockMin.Y
            const y0 = prevTip.Y + toolRadius;
            const y1 = tip.Y + toolRadius;
            const denom = y1 - y0;
            if (Math.abs(denom) > 1e-8) {
              t = (stockMin.Y - y0) / denom;
              t = Math.max(0, Math.min(1, t));
            }
          }
          // Interpolate to collision point
          const collisionPosition = {
            X: prevTip.X + (tip.X - prevTip.X) * t,
            Y: prevTip.Y + (tip.Y - prevTip.Y) * t,
            Z: prevTip.Z + (tip.Z - prevTip.Z) * t
          };
          setSimulationPosition(result.contactPoint || collisionPosition);
          addContactPoint({
            position: result.contactPoint || collisionPosition,
            probeOperationId: currentStep.operation.id,
            axis: currentStep.axis!
          });
          collisionRegisteredRef.current = true;
          const nextStepIndex = simulationState.currentStepIndex + 1;
          if (nextStepIndex < simulationStepsRef.current.length) {
            setSimulationStep(nextStepIndex);
          } else {
            pauseSimulationAndReset();
          }
          prevPositionRef.current = null;
          return;
        }
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
  }, [simulationState, setSimulationStep, setSimulationPosition, pauseSimulationAndReset, addContactPoint]);

  /**
   * Start simulation with given probe sequence
   */
  const startSimulation = useCallback((
    operations: ProbeOperation[],
    initialPosition: { X: number; Y: number; Z: number }
  ) => {
    // Convert operations to simulation steps
    const steps = generateSimulationSteps(operations, initialPosition);
    simulationStepsRef.current = steps;
    currentStepProgressRef.current = 0;
    collisionRegisteredRef.current = false;

    // Reset simulation state
    pauseSimulationAndReset();

    // Start animation
    animationRef.current = requestAnimationFrame(animate);
  }, [generateSimulationSteps, animate, pauseSimulationAndReset]);

  // Start simulation when operations or initialPosition change
  useEffect(() => {
    if (operations && operations.length > 0 && initialPosition) {
      startSimulation(operations, initialPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(operations), initialPosition && `${initialPosition.X},${initialPosition.Y},${initialPosition.Z}`]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Only run animation loop if simulation is playing and active
  useEffect(() => {
    if (simulationState.isPlaying && simulationState.isActive) {
      animationRef.current = requestAnimationFrame(animate);
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

  return {
    startSimulation,
    pauseSimulation: pauseSimulationAndReset,
    isPlaying: simulationState.isPlaying,
    currentStepIndex: simulationState.currentStepIndex,
    totalSteps: simulationStepsRef.current.length,
    isReady: simulationStepsRef.current.length > 0,
    currentStep: simulationStepsRef.current[simulationState.currentStepIndex] || null
  };
}

export default useProbeSimulation;
