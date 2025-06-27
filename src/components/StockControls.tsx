import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dimensional3DInput } from "@/components/ui/DimensionalInput";
import { ModelFileUpload } from "@/components/ui/ModelFileUpload";
import type { MachineSettings } from '@/types/machine';

interface StockControlsProps {
  stockSize: [number, number, number];
  stockPosition: [number, number, number];
  stockRotation?: [number, number, number];
  onStockSizeChange: (size: [number, number, number]) => void;
  onStockPositionChange: (position: [number, number, number]) => void;
  onStockRotationChange?: (rotation: [number, number, number]) => void;
  units: string;
  machineSettings: MachineSettings;
  modelFile?: File | null;
  onModelFileChange?: (file: File | null) => void;
  isLoadingModelFile?: boolean;
}

const StockControls: React.FC<StockControlsProps> = ({
  stockSize,
  stockPosition,
  stockRotation = [0, 0, 0],
  onStockSizeChange,
  onStockPositionChange,
  onStockRotationChange,
  units,
  machineSettings,
  modelFile,
  onModelFileChange,
  isLoadingModelFile = false
}) => {
  // Debug log position changes
  React.useEffect(() => {
    console.log('[StockControls] Position updated:', stockPosition);
  }, [stockPosition]);

  // Extract machine orientation and stage dimensions from machine settings
  const machineOrientation = machineSettings.machineOrientation;
  const stageDimensions = machineSettings.stageDimensions;
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

  const  groundStock = () => {
    if (machineOrientation === 'horizontal') {
      onStockPositionChange([0, stockPosition[1], stockPosition[2]]);
    } else {
      const { Z } = machineSettings.axes;
      const groundZ = Z.min + (Math.abs(Z.max - Z.min) * 0.1);
      onStockPositionChange([stockPosition[0], stockPosition[1], groundZ]);
    }
  };

  // Position handler for individual inputs
  const handlePositionChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newPosition = [...stockPosition] as [number, number, number];
    newPosition[index] = numValue;
    onStockPositionChange(newPosition);
  };

  // Rotation handler for individual inputs
  const handleRotationChange = (index: number, value: string) => {
    if (!onStockRotationChange) return;
    const degrees = parseFloat(value) || 0;
    const radians = degrees * Math.PI / 180;
    const newRotation = [...stockRotation] as [number, number, number];
    newRotation[index] = radians;
    onStockRotationChange(newRotation);
  };

  const resetRotation = () => {
    if (onStockRotationChange) {
      onStockRotationChange([0, 0, 0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Controls</CardTitle>
        <CardDescription>Adjust the size and position of the stock/workpiece</CardDescription>
      </CardHeader>      <CardContent className="space-y-6">
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

        <Separator />

        {/* Stock Rotation Controls */}
        {onStockRotationChange && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Stock Rotation</h4>
              <Button variant="ghost" size="sm" onClick={resetRotation} className="h-auto p-1 text-xs">
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['X', 'Y', 'Z'].map((axis, index) => (
                <div key={axis}>
                  <Label htmlFor={`stock-rotation-${axis.toLowerCase()}`} className="text-xs">
                    {axis} Rotation (°)
                  </Label>
                  <input
                    id={`stock-rotation-${axis.toLowerCase()}`}
                    type="number"
                    step="1"
                    value={Math.round((stockRotation[index] * 180 / Math.PI) * 10) / 10}
                    onChange={(e) => handleRotationChange(index, e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Rotation around {axis.toLowerCase()}-axis
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Custom 3D Model Upload */}
        {onModelFileChange && (
          <>
            <div>
              <ModelFileUpload
                currentFile={modelFile || null}
                onFileSelected={onModelFileChange}
                isProcessing={isLoadingModelFile}
              />
            </div>
            <Separator />
          </>
        )}

        {/* Quick Actions */}
        <div>
          <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={centerStock}>
              Center Stock
            </Button>
            <Button variant="outline" size="sm" onClick={groundStock}>
              Ground Stock
            </Button>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              Reset to Default
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default StockControls;
