// src/hooks/visualization/useVirtualMillSimulation.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store';
import { VirtualMill } from '@/utils/machine/VirtualMill';
import type { GCodeCommand } from '@/utils/machine/VirtualMill';
import type { ProbeOperation } from '@/types/machine';

export interface VirtualMillSimulationStep {
  id: string;
  type: 'rapid' | 'linear' | 'probe' | 'dwell' | 'wcs';
  gCodeCommand: GCodeCommand;
  operation?: ProbeOperation;
  startPosition: { X: number; Y: number; Z: number };
  endPosition: { X: number; Y: number; Z: number };
  duration: number;
  gcodeLineIndex: number;
}

/**
 * Hook that integrates VirtualMill as the simulation controller
 * This replaces the custom simulation logic with VirtualMill's sophisticated simulation engine
 */
export function useVirtualMillSimulation(
  probeSequence?: { 
    operations: ProbeOperation[];
    initialPosition: { X: number; Y: number; Z: number };
  }
) {
  // Store state and actions
  const simulationState = useAppStore(state => state.simulationState);
  const machineSettings = useAppStore(state => state.machineSettings);
  const visualizationSettings = useAppStore(state => state.visualizationSettings);
  const {
    setSimulationPosition,
    addContactPoint,
    pauseSimulation,
    setSimulationStep
  } = useAppStore();

  // VirtualMill instance
  const virtualMillRef = useRef<VirtualMill | null>(null);
  const animationRef = useRef<number | null>(null);
  const [steps, setSteps] = useState<VirtualMillSimulationStep[]>([]);

  // Initialize VirtualMill
  useEffect(() => {
    if (!virtualMillRef.current) {
      const initialPosition = probeSequence?.initialPosition || { X: 0, Y: 0, Z: 0 };
      virtualMillRef.current = new VirtualMill(machineSettings, initialPosition);
      
      // Configure stock
      virtualMillRef.current.setStock(
        visualizationSettings.stockSize,
        visualizationSettings.stockPosition
      );
    }
  }, [machineSettings, visualizationSettings.stockSize, visualizationSettings.stockPosition, probeSequence]);

  // Generate simulation steps from probe sequence
  useEffect(() => {
    if (!probeSequence?.operations.length) {
      setSteps([]);
      return;
    }

    const mill = virtualMillRef.current;
    if (!mill) return;

    // Reset mill to initial position
    const initialPos = probeSequence.initialPosition;
    mill.reset(initialPos);

    const simulationSteps: VirtualMillSimulationStep[] = [];
    let stepId = 0;
    let gcodeLineIndex = 0;

    // Convert probe operations to G-code commands
    probeSequence.operations.forEach((operation) => {
      const currentPos = mill.getCurrentPosition();

      // Pre-moves
      operation.preMoves?.forEach((move) => {
        const command: GCodeCommand = {
          type: move.type as 'rapid' | 'linear',
          ...move.axesValues,
          positionMode: move.positionMode === 'none' ? 'absolute' : move.positionMode,
          coordinateSystem: move.coordinateSystem === 'none' ? 'machine' : move.coordinateSystem || 'machine'
        };

        const endPos = calculateEndPosition(currentPos, command);
        
        simulationSteps.push({
          id: `step-${stepId++}`,
          type: command.type as 'rapid' | 'linear' | 'probe' | 'dwell' | 'wcs',
          gCodeCommand: command,
          startPosition: { ...currentPos },
          endPosition: endPos,
          duration: calculateDuration(currentPos, endPos, command),
          gcodeLineIndex: gcodeLineIndex++
        });

        // Update virtual position for next calculation
        mill.executeGCodeSync(command);
      });

      // Probe move
      const probeCommand: GCodeCommand = {
        type: 'probe',
        axis: operation.axis,
        direction: operation.direction,
        distance: operation.distance,
        feedRate: operation.feedRate
      };

      const probeEndPos = calculateProbeEndPosition(mill.getCurrentPosition(), probeCommand);
      
      simulationSteps.push({
        id: `step-${stepId++}`,
        type: 'probe',
        gCodeCommand: probeCommand,
        operation,
        startPosition: { ...mill.getCurrentPosition() },
        endPosition: probeEndPos,
        duration: (operation.distance / operation.feedRate) * 60 * 1000, // Convert to milliseconds
        gcodeLineIndex: gcodeLineIndex++
      });

      // Execute probe command to update mill state
      mill.executeGCodeSync(probeCommand);

      // Post-moves
      operation.postMoves?.forEach((move) => {
        const command: GCodeCommand = {
          type: move.type as 'rapid' | 'linear',
          ...move.axesValues,
          positionMode: move.positionMode === 'none' ? 'absolute' : move.positionMode,
          coordinateSystem: move.coordinateSystem === 'none' ? 'machine' : move.coordinateSystem || 'machine'
        };

        const endPos = calculateEndPosition(mill.getCurrentPosition(), command);
        
        simulationSteps.push({
          id: `step-${stepId++}`,
          type: command.type as 'rapid' | 'linear' | 'probe' | 'dwell' | 'wcs',
          gCodeCommand: command,
          startPosition: { ...mill.getCurrentPosition() },
          endPosition: endPos,
          duration: calculateDuration(mill.getCurrentPosition(), endPos, command),
          gcodeLineIndex: gcodeLineIndex++
        });

        mill.executeGCodeSync(command);
      });
    });

    setSteps(simulationSteps);
  }, [probeSequence]);

  // Animation loop using VirtualMill's real-time movement
  const animate = useCallback(async () => {
    const mill = virtualMillRef.current;
    if (!mill || !simulationState.isActive || !simulationState.isPlaying) {
      return;
    }

    const currentStep = steps[simulationState.currentStepIndex];
    if (!currentStep) {
      pauseSimulation();
      return;
    }

    try {
      // Execute the G-code command with VirtualMill's real-time animation
      const result = await mill.executeGCode(currentStep.gCodeCommand);
      
      // Handle collision detection for probe moves
      if (currentStep.type === 'probe' && result.contactPoint) {
        addContactPoint({
          position: result.contactPoint,
          probeOperationId: currentStep.operation?.id || '',
          axis: currentStep.gCodeCommand.axis!
        });
      }

      // Move to next step
      const nextIndex = simulationState.currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setSimulationStep(nextIndex);
      } else {
        pauseSimulation();
      }
    } catch (error) {
      console.error('Simulation error:', error);
      pauseSimulation();
    }
  }, [simulationState, steps, pauseSimulation, setSimulationStep, addContactPoint]);

  // Real-time position updates
  useEffect(() => {
    if (!simulationState.isActive || !simulationState.isPlaying) {
      return;
    }

    const updatePosition = () => {
      const mill = virtualMillRef.current;
      if (mill) {
        const currentPosition = mill.isMoving() 
          ? mill.getInterpolatedPosition()
          : mill.getCurrentPosition();
        
        setSimulationPosition(currentPosition);
      }
      
      animationRef.current = requestAnimationFrame(updatePosition);
    };

    animationRef.current = requestAnimationFrame(updatePosition);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [simulationState.isActive, simulationState.isPlaying, setSimulationPosition]);

  // Execute current step when simulation starts or step changes
  useEffect(() => {
    if (simulationState.isActive && simulationState.isPlaying) {
      animate();
    }
  }, [simulationState.currentStepIndex, simulationState.isPlaying, animate]);

  // Reset VirtualMill when simulation resets
  useEffect(() => {
    if (!simulationState.isActive && virtualMillRef.current && probeSequence) {
      virtualMillRef.current.reset(probeSequence.initialPosition);
      virtualMillRef.current.stopMovement(); // Stop any ongoing movement
    }
  }, [simulationState.isActive, probeSequence]);

  return {
    steps,
    totalSteps: steps.length,
    isReady: steps.length > 0,
    currentStep: steps[simulationState.currentStepIndex] || null,
    virtualMill: virtualMillRef.current,
    // Additional methods for debugging/inspection
    getCurrentMovement: () => virtualMillRef.current?.getCurrentMovement() || null,
    isMoving: () => virtualMillRef.current?.isMoving() || false,
  };
}

// Helper functions
function calculateEndPosition(
  currentPos: { X: number; Y: number; Z: number },
  command: GCodeCommand
): { X: number; Y: number; Z: number } {
  // Use VirtualMill's coordinate transformation logic
  const targetPos = { ...currentPos };
  
  if (command.positionMode === 'relative') {
    targetPos.X += command.X || 0;
    targetPos.Y += command.Y || 0;
    targetPos.Z += command.Z || 0;
  } else {
    targetPos.X = command.X !== undefined ? command.X : targetPos.X;
    targetPos.Y = command.Y !== undefined ? command.Y : targetPos.Y;
    targetPos.Z = command.Z !== undefined ? command.Z : targetPos.Z;
  }

  return targetPos;
}

function calculateProbeEndPosition(
  currentPos: { X: number; Y: number; Z: number },
  command: GCodeCommand
): { X: number; Y: number; Z: number } {
  const endPos = { ...currentPos };
  if (command.axis && command.direction && command.distance) {
    endPos[command.axis] += command.direction * command.distance;
  }
  return endPos;
}

function calculateDuration(
  startPos: { X: number; Y: number; Z: number },
  endPos: { X: number; Y: number; Z: number },
  command: GCodeCommand
): number {
  const distance = Math.sqrt(
    Math.pow(endPos.X - startPos.X, 2) +
    Math.pow(endPos.Y - startPos.Y, 2) +
    Math.pow(endPos.Z - startPos.Z, 2)
  );
  
  const feedrate = command.feedRate || (command.type === 'rapid' ? 6000 : 1000);
  return (distance / feedrate) * 60 * 1000; // Convert to milliseconds
}
