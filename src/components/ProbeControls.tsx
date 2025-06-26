import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validators, eventHandlers } from "@/utils/functional";
import type { MachineSettings } from '@/types/machine';

interface ProbeControlsProps {
  probePosition: { X: number; Y: number; Z: number };
  onProbePositionChange: (position: { X: number; Y: number; Z: number }) => void;
  units: string;
  machineSettings: MachineSettings;
  stockSize?: [number, number, number];
  stockPosition?: [number, number, number];
}

const ProbeControls: React.FC<ProbeControlsProps> = ({
  probePosition,
  onProbePositionChange,
  units,
  machineSettings,
  stockSize = [25, 25, 10],
  stockPosition = [0, 0, 0]
}) => {
  // Extract machine orientation and stage dimensions from machine settings
  const machineOrientation = machineSettings.machineOrientation;
  const stageDimensions = machineSettings.stageDimensions;
  // Position change handler with clamping
  const handlePositionChange = (axis: 'X' | 'Y' | 'Z', value: string) => {
    const numValue = validators.parseFloat(value);
    const { axes } = machineSettings;
    const clampedValue = validators.clamp(numValue, axes[axis].min, axes[axis].max);
    
    onProbePositionChange({
      ...probePosition,
      [axis]: clampedValue
    });
  };

  // Preset position calculators
  const calculatePresetPositions = () => {
    const { X, Y, Z } = machineSettings.axes;
    
    return {
      center: {
        X: (X.max + X.min) / 2,
        Y: (Y.max + Y.min) / 2,
        Z: (Z.max + Z.min) / 2
      },
      
      origin: { X: 0, Y: 0, Z: 0 },
      
      safe: {
        X: X.min + (X.max - X.min) * 0.2,
        Y: (Y.max + Y.min) / 2,
        Z: Z.min
      },
      
      corner: {
        X: X.min + (X.max - X.min) * 0.1,
        Y: Y.min + (Y.max - Y.min) * 0.1,
        Z: Z.min
      },
      
      stockTop: machineOrientation === 'horizontal' 
        ? {
            X: validators.clamp(
              X.min + stageDimensions[0] + stockSize[0] + 2,
              X.min,
              X.max
            ),
            Y: (Y.max + Y.min) / 2,
            Z: (Z.max + Z.min) / 2  
          }
        : {
            X: stockPosition[0],
            Y: (Y.max + Y.min) / 2,
            Z: stockPosition[2] + stockSize[2] + 2
          }
    };
  };

  const presetPositions = calculatePresetPositions();

  // Preset action handlers
  const handlePresetPosition = (preset: keyof typeof presetPositions) => {
    onProbePositionChange(presetPositions[preset]);
  };

  // Position input configurations
  const positionInputConfigs = [
    {
      axis: 'X' as const,
      label: machineOrientation === 'horizontal' ? 'Stage Position' : 'X Position',
      color: 'text-red-600',
      helpText: machineOrientation === 'horizontal' 
        ? `Stage moves from ${machineSettings.axes.X.min} to ${machineSettings.axes.X.max}`
        : `Range: ${machineSettings.axes.X.min} to ${machineSettings.axes.X.max}`
    },
    {
      axis: 'Y' as const,
      label: 'Y Position',
      color: 'text-green-600',
      helpText: `Range: ${machineSettings.axes.Y.min} to ${machineSettings.axes.Y.max}`
    },
    {
      axis: 'Z' as const,
      label: 'Z Position',
      color: 'text-blue-600',
      helpText: `Range: ${machineSettings.axes.Z.min} to ${machineSettings.axes.Z.max}`
    }
  ];

  // Preset button configurations
  const presetButtons = [
    { key: 'center' as const, label: 'Center in Workspace' },
    { key: 'origin' as const, label: 'Reset to Origin' },
    { key: 'safe' as const, label: 'Safe Position' },
    { key: 'corner' as const, label: 'Near Corner' },
    { key: 'stockTop' as const, label: 'Above Stock' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Probe Position Controls</CardTitle>
        <CardDescription>
          {machineOrientation === 'horizontal' 
            ? "Set the probe position for your horizontal spindle machine. X position controls the stage position (stage moves to bring stock to the fixed spindle). Y and Z control the spindle position."
            : "Set the initial position of the probe tool. This determines where the spindle starts before executing probe operations."
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Position Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {positionInputConfigs.map(({ axis, label, color, helpText }) => (
            <div key={axis} className="space-y-2">
              <Label htmlFor={`probe-${axis.toLowerCase()}`} className={`text-sm font-medium ${color}`}>
                {label} ({units})
              </Label>
              
              <Input
                id={`probe-${axis.toLowerCase()}`}
                type="number"
                step="0.1"
                value={probePosition[axis]}
                onChange={eventHandlers.inputValue((value) => handlePositionChange(axis, value))}
                className="text-center"
              />
              
              <div className="text-xs text-gray-500 text-center">
                {helpText}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - Split into primary and secondary */}
        <div className="flex flex-wrap gap-2">
          {presetButtons.slice(0, 2).map(({ key, label }) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handlePresetPosition(key)}
              className="flex-1 min-w-[120px]"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Preset Positions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Preset Positions</h3>
          <div className="flex flex-wrap gap-2">
            {presetButtons.slice(2).map(({ key, label }) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handlePresetPosition(key)}
                className="flex-1 min-w-[100px]"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Current Position Display */}
        <div className="rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Current Probe Position</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {positionInputConfigs.map(({ axis, color }) => (
              <div key={axis} className="text-center">
                <div className={`${color} font-mono`}>
                  {axis}: {probePosition[axis].toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-600 space-y-1">
          {machineOrientation === 'horizontal' ? (
            <>
              <p>• X position controls where the stage moves (stage brings stock to the fixed spindle)</p>
              <p>• Y and Z positions control the spindle location in space</p>
              <p>• The spindle itself is fixed in X - only the stage/stock moves along X</p>
            </>
          ) : (
            <>
              <p>• The probe position determines where the spindle moves before starting probe operations</p>
              <p>• Make sure the position is within your machine's work area limits</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProbeControls;
