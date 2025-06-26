import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dimensional3DInput } from "@/components/ui/DimensionalInput";

interface StockControlsProps {
  stockSize: [number, number, number];
  stockPosition: [number, number, number];
  onStockSizeChange: (size: [number, number, number]) => void;
  onStockPositionChange: (position: [number, number, number]) => void;
  units: string;
  machineSettings: {
    axes: {
      X: { min: number; max: number };
      Y: { min: number; max: number };
      Z: { min: number; max: number };
    };
  };
  machineOrientation?: 'vertical' | 'horizontal';
  onMachineOrientationChange?: (orientation: 'vertical' | 'horizontal') => void;
  stageDimensions?: [number, number, number];
  onStageDimensionsChange?: (dimensions: [number, number, number]) => void;
}

const StockControls: React.FC<StockControlsProps> = ({
  stockSize,
  stockPosition,
  onStockSizeChange,
  onStockPositionChange,
  units,
  machineSettings,
  machineOrientation = 'vertical',
  onMachineOrientationChange,
  stageDimensions = [12.7, 304.8, 63.5],
  onStageDimensionsChange
}) => {
  // Helper functions for preset actions
  const resetToDefault = () => {
    onStockSizeChange([25, 25, 10]);

    if (machineOrientation === 'horizontal') {
      onStockPositionChange([0, 0, 0]);
    } else {
      const { X, Y } = machineSettings.axes;
      const defaultX = X.min + (Math.abs(X.max - X.min) * 0.3);
      const defaultY = (Y.max + Y.min) / 2;
      const defaultZ = 5;
      onStockPositionChange([defaultX, defaultY, defaultZ]);
    }
  };

  const centerStock = () => {
    if (machineOrientation === 'horizontal') {
      const stockOffsetY = 0;
      const stageDepth = stageDimensions?.[2] || 63.5;
      const stockOffsetZ = -stageDepth / 2 - stockSize[2] / 2;
      const newPosition: [number, number, number] = [stockPosition[0], stockOffsetY, stockOffsetZ];
      onStockPositionChange(newPosition);
    } else {
      const { X, Y } = machineSettings.axes;
      const centerX = (X.max + X.min) / 2;
      const centerY = (Y.max + Y.min) / 2;
      onStockPositionChange([centerX, centerY, stockPosition[2]]);
    }
  };

  // Position handler for individual inputs
  const handlePositionChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newPosition = [...stockPosition] as [number, number, number];
    newPosition[index] = numValue;
    onStockPositionChange(newPosition);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Controls</CardTitle>
        <CardDescription>Adjust the size and position of the stock/workpiece</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Machine Orientation Controls */}
        <div>
          <h4 className="text-sm font-medium mb-3">Machine Configuration</h4>
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">
              Machine Orientation
            </Label>
            <RadioGroup
              value={machineOrientation}
              onValueChange={(value) => onMachineOrientationChange?.(value as 'vertical' | 'horizontal')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vertical" id="vertical" />
                <Label htmlFor="vertical" className="text-sm">
                  Vertical Spindle (Traditional Mill)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="horizontal" id="horizontal" />
                <Label htmlFor="horizontal" className="text-sm">
                  Horizontal Spindle (Rotated Stage)
                </Label>
              </div>
            </RadioGroup>

            {machineOrientation === 'horizontal' && (
              <p className="text-xs text-muted-foreground mt-2">
                X+ face attached to stage, spindle faces Z+ direction
              </p>
            )}
          </div>

          {/* Stage Dimensions for Horizontal Machines */}
          {machineOrientation === 'horizontal' && (
            <div className="space-y-3 mt-4">
              <Label className="text-sm text-muted-foreground">
                Stage Dimensions
              </Label>
              <Dimensional3DInput
                values={stageDimensions}
                onChange={onStageDimensionsChange || (() => { })}
                labels={['Height (X)', 'Width (Y)', 'Depth (Z)']}
                units={units}
                min={0.1}
                step={0.1}
                className="h-8"
              />
              <p className="text-xs text-muted-foreground">
                Stage is positioned perpendicular to XY plane, affixed to bottom of stock
              </p>
            </div>
          )}
        </div>

        <Separator />



        {/* Quick Actions */}
        <div>
          <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={centerStock}>
              Center Stock
            </Button>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              Reset to Default
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stock Size Controls */}
        <div>
          <h4 className="text-sm font-medium mb-3">Stock Size</h4>
          <Dimensional3DInput
            values={stockSize}
            onChange={onStockSizeChange}
            labels={['Width', 'Depth', 'Height']}
            units={units}
            min={0.1}
            step={0.1}
            className="mt-1"
          />
        </div>

        <Separator />

        {/* Stock Position Controls - using custom implementation for now due to complexity */}
        <div>
          <h4 className="text-sm font-medium mb-3">Stock Position</h4>
          {machineOrientation === 'horizontal' && (
            <p className="text-xs text-muted-foreground mb-3">
              Position is relative to stage X+ face (spindle side). Stock is attached to the face closest to the spindle.
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis}>
                <Label htmlFor={`stock-${axis.toLowerCase()}`} className="text-xs">
                  {axis} Position ({units})
                </Label>
                <input
                  id={`stock-${axis.toLowerCase()}`}
                  type="number"
                  step="0.1"
                  value={stockPosition[index].toFixed(1)}
                  onChange={(e) => handlePositionChange(index, e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {machineOrientation === 'horizontal'
                    ? axis === 'X' ? 'Offset from stage X+ face (spindle side)'
                      : axis === 'Y' ? 'Offset from stage Y center'
                        : 'Offset from stage top'
                    : `Range: ${machineSettings.axes[axis as 'X' | 'Y' | 'Z'].min} to ${machineSettings.axes[axis as 'X' | 'Y' | 'Z'].max}`
                  }
                </div>
              </div>
            ))}
          </div>
        </div>


      </CardContent>
    </Card>
  );
};

export default StockControls;
