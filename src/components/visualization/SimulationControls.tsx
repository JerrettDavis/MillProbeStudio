// src/components/visualization/SimulationControls.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  SkipBack,
  SkipForward,
  Zap
} from 'lucide-react';
import { useAppStore } from '@/store';
import useProbeSimulation from '@/hooks/visualization/useProbeSimulation';
import type { ProbeSequenceSettings } from '@/types/machine';

interface SimulationControlsProps {
  className?: string;
  probeSequence?: ProbeSequenceSettings;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({ className = '', probeSequence }) => {
  const {
    simulationState,
    startSimulation,
    stopSimulation,
    playSimulation,
    pauseSimulation,
    resetSimulation,
    setSimulationSpeed,
    setSimulationStep,
    addProbeOperation
  } = useAppStore();

  const probeOps = probeSequence?.operations || [];
  const initialPosition = probeSequence?.initialPosition || { X: 0, Y: 0, Z: 0 };
  const simulation = useProbeSimulation(probeOps, initialPosition);

  const handlePlayPause = () => {
    if (!simulationState.isActive) {
      // Only set isActive, let useProbeSimulation handle animation
      startSimulation();
      playSimulation();
      return;
    }

    if (simulationState.isPlaying) {
      pauseSimulation();
    } else {
      playSimulation();
    }
  };

  const handleStop = () => {
    stopSimulation();
  };

  const handleReset = () => {
    resetSimulation();
  };

  const handleStepForward = () => {
    if (simulationState.currentStepIndex < simulation.totalSteps - 1) {
      setSimulationStep(simulationState.currentStepIndex + 1);
    }
  };

  const handleStepBackward = () => {
    if (simulationState.currentStepIndex > 0) {
      setSimulationStep(simulationState.currentStepIndex - 1);
    }
  };

  const handleSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationSpeed(parseFloat(event.target.value));
  };

  const handleStepSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationStep(parseInt(event.target.value));
  };

  const formatPosition = (pos: { X: number; Y: number; Z: number }) => {
    return `X:${pos.X.toFixed(2)} Y:${pos.Y.toFixed(2)} Z:${pos.Z.toFixed(2)}`;
  };

  const createTestSequence = () => {
    // Add a simple 3-probe test sequence
    addProbeOperation({
      axis: 'Y',
      direction: -1,
      distance: 15,
      feedRate: 50,
      backoffDistance: 2,
      wcsOffset: 0,
      preMoves: [],
      postMoves: []
    });
    
    addProbeOperation({
      axis: 'X',
      direction: -1,
      distance: 12,
      feedRate: 50,
      backoffDistance: 2,
      wcsOffset: 0,
      preMoves: [],
      postMoves: []
    });
    
    addProbeOperation({
      axis: 'Z',
      direction: -1,
      distance: 8,
      feedRate: 30,
      backoffDistance: 1,
      wcsOffset: 0,
      preMoves: [],
      postMoves: []
    });
  };

  // Don't render if no probe sequence
  if (!simulation.isReady) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Probe Simulation</h3>
            <Badge variant="secondary">No Sequence</Badge>
          </div>
          <div className="text-sm text-gray-600">
            No probe sequence available for simulation.
          </div>
          <Button onClick={createTestSequence} size="sm" className="w-full">
            Create Test Sequence
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Probe Simulation</h3>
          <Badge variant={simulationState.isActive ? "default" : "secondary"}>
            {simulationState.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Main Control Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePlayPause}
            size="sm"
            variant={simulationState.isPlaying ? "secondary" : "default"}
          >
            {simulationState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button onClick={handleStop} size="sm" variant="outline">
            <Square className="h-4 w-4" />
          </Button>
          
          <Button onClick={handleReset} size="sm" variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <Button 
            onClick={handleStepBackward} 
            size="sm" 
            variant="outline"
            disabled={simulationState.currentStepIndex <= 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button 
            onClick={handleStepForward} 
            size="sm" 
            variant="outline"
            disabled={simulationState.currentStepIndex >= simulation.totalSteps - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Step {simulationState.currentStepIndex + 1} of {simulation.totalSteps}</span>
            <span>Speed: {simulationState.speed.toFixed(1)}x</span>
          </div>
          
          {/* Step Progress Slider */}
          <input
            type="range"
            value={simulationState.currentStepIndex}
            onChange={handleStepSliderChange}
            max={Math.max(0, simulation.totalSteps - 1)}
            min={0}
            step={1}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={simulationState.isPlaying}
          />
        </div>

        {/* Speed Control */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Speed</span>
          </div>
          <input
            type="range"
            value={simulationState.speed}
            onChange={handleSpeedChange}
            max={3.0}
            min={0.1}
            step={0.1}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Current Position Display */}
        <div className="space-y-1">
          <div className="text-xs font-medium">Current Position</div>
          <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {formatPosition(simulationState.currentPosition)}
          </div>
        </div>

        {/* Contact Points */}
        {simulationState.contactPoints.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium">Contact Points ({simulationState.contactPoints.length})</div>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {simulationState.contactPoints.map((contact, index) => (
                <div key={contact.id} className="text-xs font-mono bg-red-50 p-2 rounded text-red-800">
                  #{index + 1}: {contact.axis} axis - {formatPosition(contact.position)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Step Info */}
        {simulation.currentStep && (
          <div className="space-y-1">
            <div className="text-xs font-medium">Current Step</div>
            <div className="text-xs bg-blue-50 dark:bg-gray-800 p-2 rounded">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{simulation.currentStep.type}</span>
                <Badge variant="outline" className="text-xs">
                  {simulation.currentStep.axis || 'All Axes'}
                </Badge>
              </div>
              {simulation.currentStep.operation && (
                <div className="mt-1 text-gray-600">
                  Operation: {simulation.currentStep.operation.id}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
