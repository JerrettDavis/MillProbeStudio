import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MachineSettings } from '@/types/machine';

interface ProbeControlsProps {
  probePosition: { X: number; Y: number; Z: number };
  onProbePositionChange: (position: { X: number; Y: number; Z: number }) => void;
  units: string;
  machineSettings: MachineSettings;
  machineOrientation?: 'vertical' | 'horizontal';
  stockSize?: [number, number, number];
  stockPosition?: [number, number, number];
  stageDimensions?: [number, number, number];
}

const ProbeControls: React.FC<ProbeControlsProps> = ({
  probePosition,
  onProbePositionChange,
  units,
  machineSettings,
  machineOrientation = 'vertical',
  stockSize = [25, 25, 10],
  stockPosition = [0, 0, 0],
  stageDimensions = [12.7, 304.8, 63.5]
}) => {const handlePositionChange = (axis: 'X' | 'Y' | 'Z', value: string) => {
    const numValue = parseFloat(value) || 0;
    const { axes } = machineSettings;
    
    // Clamp the value to machine limits
    let clampedValue = numValue;
    if (axis === 'X') {
      clampedValue = Math.max(axes.X.min, Math.min(axes.X.max, numValue));
    } else if (axis === 'Y') {
      clampedValue = Math.max(axes.Y.min, Math.min(axes.Y.max, numValue));
    } else if (axis === 'Z') {
      clampedValue = Math.max(axes.Z.min, Math.min(axes.Z.max, numValue));
    }
    
    onProbePositionChange({
      ...probePosition,
      [axis]: clampedValue
    });
  };

  const handleCenterPosition = () => {
    const { X, Y, Z } = machineSettings.axes;
    onProbePositionChange({
      X: (X.max + X.min) / 2,
      Y: (Y.max + Y.min) / 2,
      Z: (Z.max + Z.min) / 2
    });
  };
  const handleResetToDefault = () => {
    onProbePositionChange({ X: 0, Y: 0, Z: 0 });
  };
  const handlePresetPosition = (preset: 'safe' | 'corner' | 'stockTop') => {
    const { X, Y, Z } = machineSettings.axes;
    
    switch (preset) {
      case 'safe':
        // Safe position: 20% from X.min, centered Y, at Z minimum
        onProbePositionChange({
          X: X.min + (X.max - X.min) * 0.2,
          Y: (Y.max + Y.min) / 2,
          Z: Z.min
        });
        break;
      case 'corner':
        // Near stock corner: close to X.min and Y.min, at Z minimum
        onProbePositionChange({
          X: X.min + (X.max - X.min) * 0.1,
          Y: Y.min + (Y.max - Y.min) * 0.1,
          Z: Z.min
        });
        break;      case 'stockTop':
        // Above stock with proper clearance for Z probing
        if (machineOrientation === 'horizontal') {
          // For horizontal machines, probe is fixed at spindle location
          // We want the stock surface to be 2mm below the probe
          const { X, Y, Z } = machineSettings.axes;
          
          // Calculate the probe X position needed so that stock surface is 2mm below probe
          const clearance = 2; // 2mm clearance between probe and stock top surface
          
          // The probe should be positioned at: stock top surface + clearance
          // Stock top surface is at: stage X + stage height + stock height
          // We want: probe X = stock top surface + clearance
          // So: probe X = (stage X + stage height + stock height) + clearance
          
          // For horizontal machines, stage X should be at a reasonable position
          // Let's position stage near the middle of work area, but ensure clearance
          const midStageX = (X.max + X.min) / 2;
          const stockTopSurface = X.min + stageDimensions[0] + stockSize[0];
          const targetProbeX = stockTopSurface + clearance;
          
          onProbePositionChange({
            X: Math.max(X.min, Math.min(X.max, targetProbeX)), // Clamp to machine limits
            Y: (Y.max + Y.min) / 2, // Centered in work area Y
            Z: (Z.max + Z.min) / 2  // Centered in work area Z
          });
        } else {
          // For vertical machines, position above stock center
          onProbePositionChange({
            X: stockPosition[0],
            Y: (Y.max + Y.min) / 2,
            Z: stockPosition[2] + stockSize[2] + 2 // 2mm above stock
          });
        }
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Probe Position Controls</CardTitle>        <CardDescription>
          {machineOrientation === 'horizontal' 
            ? "Set the probe position for your horizontal spindle machine. X position controls the stage position (stage moves to bring stock to the fixed spindle). Y and Z control the spindle position."
            : "Set the initial position of the probe tool. This determines where the spindle starts before executing probe operations."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">            <Label htmlFor="probe-x" className="text-sm font-medium text-red-600">
              {machineOrientation === 'horizontal' ? 'Stage Position' : 'X Position'} ({units})
            </Label><Input
              id="probe-x"
              type="number"
              step="0.1"
              min={machineSettings.axes.X.min}
              max={machineSettings.axes.X.max}
              value={probePosition.X}
              onChange={(e) => handlePositionChange('X', e.target.value)}
              className="text-center"
            />            <div className="text-xs text-gray-500 text-center">
              {machineOrientation === 'horizontal' 
                ? `Stage moves from ${machineSettings.axes.X.min} to ${machineSettings.axes.X.max}`
                : `Range: ${machineSettings.axes.X.min} to ${machineSettings.axes.X.max}`
              }
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="probe-y" className="text-sm font-medium text-green-600">
              Y Position ({units})
            </Label>            <Input
              id="probe-y"
              type="number"
              step="0.1"
              min={machineSettings.axes.Y.min}
              max={machineSettings.axes.Y.max}
              value={probePosition.Y}
              onChange={(e) => handlePositionChange('Y', e.target.value)}
              className="text-center"
            />
            <div className="text-xs text-gray-500 text-center">
              Range: {machineSettings.axes.Y.min} to {machineSettings.axes.Y.max}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="probe-z" className="text-sm font-medium text-blue-600">
              Z Position ({units})
            </Label>            <Input
              id="probe-z"
              type="number"
              step="0.1"
              min={machineSettings.axes.Z.min}
              max={machineSettings.axes.Z.max}
              value={probePosition.Z}
              onChange={(e) => handlePositionChange('Z', e.target.value)}
              className="text-center"
            />
            <div className="text-xs text-gray-500 text-center">
              Range: {machineSettings.axes.Z.min} to {machineSettings.axes.Z.max}
            </div>
          </div>
        </div>        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCenterPosition}
            className="flex-1 min-w-[120px]"
          >
            Center in Workspace
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="flex-1 min-w-[120px]"
          >
            Reset to Origin
          </Button>
        </div>

        {/* Preset Positions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Preset Positions</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetPosition('safe')}
              className="flex-1 min-w-[100px]"
            >
              Safe Position
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetPosition('corner')}
              className="flex-1 min-w-[100px]"
            >
              Near Corner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetPosition('stockTop')}
              className="flex-1 min-w-[100px]"
            >
              Above Stock
            </Button>
          </div>
        </div>

        {/* Current Position Display */}
        <div className="rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Current Probe Position</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-red-600 font-mono">X: {probePosition.X.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-mono">Y: {probePosition.Y.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-mono">Z: {probePosition.Z.toFixed(2)}</div>
            </div>
          </div>
        </div>        {/* Help Text */}
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
