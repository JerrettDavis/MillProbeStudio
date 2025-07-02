// src/hooks/visualization/useVirtualMillSimulation.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store';
import { VirtualMill } from '@/utils/machine/VirtualMill';
import type { GCodeCommand, Position3D } from '@/utils/machine/VirtualMill';
import type { ProbeOperation } from '@/types/machine';
import { useCustomModelInfo } from './useCustomModelInfo';
import { useNotifications } from '@/hooks/useNotifications';

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
  const storeActions = useAppStore();
  const {
    setSimulationPosition,
    addContactPoint,
    pauseSimulation,
    setSimulationStep
  } = storeActions || {};

  // VirtualMill instance
  const virtualMillRef = useRef<VirtualMill | null>(null);
  const animationRef = useRef<number | null>(null);
  const regenerationTrigger = useRef(0); // Counter to force step regeneration
  const [steps, setSteps] = useState<VirtualMillSimulationStep[]>([]);
  const [contactPoints, setContactPoints] = useState<Position3D[]>([]);

  // Custom model information
  const { customModelInfo } = useCustomModelInfo(
    visualizationSettings?.modelFile,
    visualizationSettings?.stockSize,
    visualizationSettings?.stockPosition,
    visualizationSettings?.stockRotation
  );

  // Notifications for user feedback
  const { showWarning, showError } = useNotifications();

  // Initialize VirtualMill
  useEffect(() => {
    if (!virtualMillRef.current && probeSequence) {
      const initialPosition = probeSequence.initialPosition;
      virtualMillRef.current = new VirtualMill(machineSettings, initialPosition);
      console.log('Initialized VirtualMill with position:', initialPosition);
    }
  }, [machineSettings, probeSequence]);

  // Update stock configuration when settings change
  useEffect(() => {
    if (virtualMillRef.current && visualizationSettings) {
      virtualMillRef.current.setStock(
        visualizationSettings.stockSize,
        visualizationSettings.stockPosition
      );
      console.log('Updated VirtualMill stock configuration:', {
        size: visualizationSettings.stockSize,
        position: visualizationSettings.stockPosition
      });
      
      // Force regeneration of steps since stock affects collision detection
      regenerationTrigger.current += 1;
      console.log('Stock configuration changed - triggered step regeneration');
    }
  }, [visualizationSettings]);

  // Configure custom model for enhanced collision detection
  useEffect(() => {
    const mill = virtualMillRef.current;
    if (!mill) return;

    mill.setCustomModel(customModelInfo);
    
    // Clear existing contact points when model changes
    setContactPoints([]);
  }, [customModelInfo]);

  // Update contact points from VirtualMill
  useEffect(() => {
    const mill = virtualMillRef.current;
    if (!mill) return;

    const updateContactPoints = () => {
      const points = mill.getContactPoints();
      setContactPoints(points);
    };

    // Update contact points periodically during simulation
    const interval = setInterval(updateContactPoints, 100);
    
    return () => clearInterval(interval);
  }, [simulationState?.isPlaying]);

  // Memoize notification functions to avoid unnecessary re-renders
  const memoizedShowWarning = useCallback(showWarning, [showWarning]);
  const memoizedShowError = useCallback(showError, [showError]);

  // Generate simulation steps from probe sequence
  useEffect(() => {
    if (!probeSequence?.operations.length) {
      setSteps([]);
      return;
    }

    const mill = virtualMillRef.current;
    if (!mill) {
      console.log('VirtualMill not ready for step generation');
      return;
    }

    console.log('Generating simulation steps with regeneration trigger:', regenerationTrigger.current);

    try {
      // Reset mill to initial position before generating steps
      const initialPos = probeSequence.initialPosition;
      mill.reset(initialPos);
      console.log('Reset mill to initial position for step generation:', initialPos);

      const simulationSteps: VirtualMillSimulationStep[] = [];
      let stepId = 0;
      let gcodeLineIndex = 0;
      let hasErrors = false;

      // Helper function to clamp position to machine limits
      const clampToMachineLimits = (position: { X: number; Y: number; Z: number }) => {
        const limits = mill.getAxisLimits();
        return {
          X: Math.max(limits.X[0], Math.min(limits.X[1], position.X)),
          Y: Math.max(limits.Y[0], Math.min(limits.Y[1], position.Y)),
          Z: Math.max(limits.Z[0], Math.min(limits.Z[1], position.Z))
        };
      };

      // Helper function to safely execute G-code with error handling
      const safeExecuteGCode = (command: GCodeCommand, operation?: string): boolean => {
        try {
          mill.executeGCodeSync(command);
          return true;
        } catch (error) {
          console.warn(`VirtualMill execution error during ${operation || 'command'}:`, error);
          hasErrors = true;
          
          // Try to recover by clamping to machine limits if it's a position error
          if (error instanceof Error && error.message.includes('exceeds machine limits')) {
            memoizedShowWarning(
              'Position Clamped to Machine Limits',
              `Some probe movements exceeded machine limits and were automatically adjusted to safe positions.`
            );
            
            try {
              // Get the current intended position and clamp it
              const currentPos = mill.getCurrentPosition();
              const targetPos = calculateEndPosition(currentPos, command);
              const clampedPos = clampToMachineLimits(targetPos);
              
              // Create a safe movement command to the clamped position
              const safeCommand: GCodeCommand = {
                ...command,
                X: clampedPos.X,
                Y: clampedPos.Y,
                Z: clampedPos.Z
              };
              
              mill.executeGCodeSync(safeCommand);
              console.log(`Recovered by clamping position to machine limits:`, clampedPos);
              return true;
            } catch (recoveryError) {
              console.error('Failed to recover from machine limits error:', recoveryError);
              memoizedShowError(
                'Simulation Recovery Failed',
                'Could not recover from machine limits error. Simulation may be incomplete.'
              );
              // Reset to a safe position as last resort
              try {
                mill.reset({ X: 0, Y: 0, Z: 0 });
                console.log('Reset mill to origin as emergency fallback');
              } catch (resetError) {
                console.error('Emergency reset failed:', resetError);
              }
              return false;
            }
          }
          return false;
        }
      };

      // Convert probe operations to G-code commands
      probeSequence.operations.forEach((operation) => {
        if (hasErrors) return; // Skip remaining operations if we've encountered critical errors

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
          safeExecuteGCode(command, `pre-move for operation ${operation.id}`);
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
      safeExecuteGCode(probeCommand, `probe operation ${operation.id}`);

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

        safeExecuteGCode(command, `post-move for operation ${operation.id}`);
      });
    });

    setSteps(simulationSteps);
    
    if (hasErrors) {
      memoizedShowWarning(
        'Simulation Generated with Warnings',
        'Some movements were adjusted to stay within machine limits. Check the console for details.'
      );
    }

  } catch (error) {
    console.error('Critical error during simulation generation:', error);
    setSteps([]);
    
    memoizedShowError(
      'Simulation Generation Failed',
      'Failed to generate simulation due to critical errors. The mill has been reset to a safe position.'
    );
    
    // Reset mill to safe position
    if (mill) {
      try {
        mill.reset({ X: 0, Y: 0, Z: 0 });
        console.log('Reset mill to origin due to critical error');
      } catch (resetError) {
        console.error('Failed to reset mill after critical error:', resetError);
      }
    }
  }
  }, [probeSequence, memoizedShowWarning, memoizedShowError]); // Include regeneration trigger in dependencies

  // Animation loop using VirtualMill's real-time movement
  const animate = useCallback(async () => {
    const mill = virtualMillRef.current;
    if (!mill || !simulationState?.isActive || !simulationState?.isPlaying) {
      return;
    }

    const currentStep = steps[simulationState?.currentStepIndex || 0];
    if (!currentStep) {
      pauseSimulation?.();
      return;
    }

    try {
      // Execute the G-code command with VirtualMill's real-time animation
      const result = await mill.executeGCode(currentStep.gCodeCommand);
      
      // Handle collision detection for probe moves
      if (currentStep.type === 'probe' && result.contactPoint) {
        addContactPoint?.({
          position: result.contactPoint,
          probeOperationId: currentStep.operation?.id || '',
          axis: currentStep.gCodeCommand.axis!
        });
      }

      // Move to next step
      const nextIndex = (simulationState?.currentStepIndex || 0) + 1;
      if (nextIndex < steps.length) {
        setSimulationStep?.(nextIndex);
      } else {
        pauseSimulation?.();
      }
    } catch (error) {
      console.error('Simulation error:', error);
      pauseSimulation?.();
    }
  }, [simulationState, steps, pauseSimulation, setSimulationStep, addContactPoint]);

  // Real-time position updates
  useEffect(() => {
    if (!simulationState?.isActive) {
      // When simulation is not active, ensure position matches mill's current position
      const mill = virtualMillRef.current;
      if (mill && probeSequence) {
        const currentPosition = mill.getCurrentPosition();
        setSimulationPosition?.(currentPosition);
      }
      return;
    }

    if (!simulationState?.isPlaying) {
      return;
    }

    const updatePosition = () => {
      const mill = virtualMillRef.current;
      if (mill) {
        const currentPosition = mill.isMoving() 
          ? mill.getInterpolatedPosition()
          : mill.getCurrentPosition();
        
        setSimulationPosition?.(currentPosition);
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
  }, [simulationState?.isActive, simulationState?.isPlaying, setSimulationPosition, probeSequence]);

  // Execute current step when simulation starts or step changes
  useEffect(() => {
    if (simulationState?.isActive && simulationState?.isPlaying) {
      animate();
    }
  }, [simulationState?.currentStepIndex, simulationState?.isPlaying, simulationState?.isActive, animate]);

  // Reset VirtualMill when simulation resets or parameters change
  useEffect(() => {
    const mill = virtualMillRef.current;
    if (!mill || !probeSequence) return;

    if (!simulationState?.isActive) {
      console.log('Resetting VirtualMill simulation to initial state');
      
      // Cancel any pending animations first
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Stop any ongoing movement
      mill.stopMovement();
      
      // Reset to initial position
      mill.reset(probeSequence.initialPosition);
      
      // Clear contact points
      mill.clearContactPoints();
      setContactPoints([]);
      
      // Immediately update position in store to prevent jumps
      setSimulationPosition?.(probeSequence.initialPosition);
      
      console.log('VirtualMill reset complete. Position:', mill.getCurrentPosition());
    }
  }, [simulationState?.isActive, probeSequence, setSimulationPosition]);

  // Force regeneration of simulation steps when key parameters change
  useEffect(() => {
    if (virtualMillRef.current && probeSequence) {
      console.log('Parameter change detected - clearing steps to force regeneration');
      regenerationTrigger.current += 1;
      setSteps([]); // This will trigger step regeneration
      setContactPoints([]); // Clear contact points as they're no longer valid
    }
  }, [
    visualizationSettings?.stockRotation, 
    customModelInfo,
    probeSequence // Include probeSequence to regenerate when sequence changes
    // Note: stockSize and stockPosition are handled separately above to avoid double-regeneration
  ]);

  return {
    steps,
    totalSteps: steps.length,
    isReady: steps.length > 0,
    currentStep: steps[simulationState?.currentStepIndex || 0] || null,
    virtualMill: virtualMillRef.current,
    contactPoints,
    hasCustomModel: Boolean(customModelInfo),
    // Additional methods for debugging/inspection
    getCurrentMovement: () => virtualMillRef.current?.getCurrentMovement() || null,
    isMoving: () => virtualMillRef.current?.isMoving() || false,
    clearContactPoints: () => {
      virtualMillRef.current?.clearContactPoints();
      setContactPoints([]);
    },
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
