import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const handleSizeChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newSize = [...stockSize] as [number, number, number];
    newSize[index] = numValue;
    onStockSizeChange(newSize);
  };

  const handlePositionChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newPosition = [...stockPosition] as [number, number, number];
    newPosition[index] = numValue;
    onStockPositionChange(newPosition);
  };  const resetToDefault = () => {
    // Reset to default size
    onStockSizeChange([25, 25, 10]);
    
    // Reset to default position based on machine orientation
    if (machineOrientation === 'horizontal') {
      // For horizontal machines, position relative to stage (attached to X- face)
      onStockPositionChange([0, 0, 0]); // Centered on stage X- face
    } else {
      // For vertical machines, position in workspace
      const { X, Y } = machineSettings.axes;
      const defaultX = X.min + (Math.abs(X.max - X.min) * 0.3);
      const defaultY = (Y.max + Y.min) / 2;
      const defaultZ = 5;
      onStockPositionChange([defaultX, defaultY, defaultZ]);
    }
  };  const centerStock = () => {
    console.log('centerStock called, machineOrientation:', machineOrientation);
    console.log('current stockPosition:', stockPosition);
    
    if (machineOrientation === 'horizontal') {
      // For horizontal machines, center the stock in the YZ plane of the stage
      // Keep X position unchanged (offset from stage X+ face)
      
      // Y centering: stock should be centered relative to stage center
      // Since stockWorldY = stageY + stockPosition[1], and we want stockWorldY = stageY,
      // we need stockPosition[1] = 0
      const stockOffsetY = 0; // Center relative to stage Y center
      
      // Z centering: stock should be centered within the stage's Z depth
      // The stage extends from (stageZ - stageDimensions[2]/2) to (stageZ + stageDimensions[2]/2)
      // We want the stock center to be at stageZ (center of stage in Z)
      // Since stockWorldZ = stageTop + stockSize[2]/2 + stockPosition[2]
      // And stageTop = stageZ + stageDimensions[2]/2
      // We want stockWorldZ = stageZ, so:
      // stageZ = (stageZ + stageDimensions[2]/2) + stockSize[2]/2 + stockPosition[2]
      // Solving: stockPosition[2] = stageZ - stageTop - stockSize[2]/2
      // stockPosition[2] = stageZ - (stageZ + stageDimensions[2]/2) - stockSize[2]/2
      // stockPosition[2] = -stageDimensions[2]/2 - stockSize[2]/2
      const stageDepth = stageDimensions?.[2] || 63.5;
      const stockOffsetZ = -stageDepth/2 - stockSize[2]/2; // Center stock within stage Z bounds
      
      const newPosition: [number, number, number] = [stockPosition[0], stockOffsetY, stockOffsetZ];
      console.log('setting new stock position:', newPosition);
      onStockPositionChange(newPosition);
    } else {
      // For vertical machines, center in workspace
      const { X, Y } = machineSettings.axes;
      const centerX = (X.max + X.min) / 2;
      const centerY = (Y.max + Y.min) / 2;
      onStockPositionChange([centerX, centerY, stockPosition[2]]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Controls</CardTitle>
        <CardDescription>Adjust the size and position of the stock/workpiece</CardDescription>
      </CardHeader>      <CardContent className="space-y-6">
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
            </RadioGroup>            {machineOrientation === 'horizontal' && (
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="stage-height" className="text-xs">Height (X) {units}</Label>
                  <Input
                    id="stage-height"
                    type="number"
                    value={stageDimensions[0]}
                    onChange={(e) => {
                      const newHeight = parseFloat(e.target.value) || 0;
                      onStageDimensionsChange?.([newHeight, stageDimensions[1], stageDimensions[2]]);
                    }}
                    step={0.1}
                    min={0.1}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="stage-width" className="text-xs">Width (Y) {units}</Label>
                  <Input
                    id="stage-width"
                    type="number"
                    value={stageDimensions[1]}
                    onChange={(e) => {
                      const newWidth = parseFloat(e.target.value) || 0;
                      onStageDimensionsChange?.([stageDimensions[0], newWidth, stageDimensions[2]]);
                    }}
                    step={0.1}
                    min={0.1}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="stage-depth" className="text-xs">Depth (Z) {units}</Label>
                  <Input
                    id="stage-depth"
                    type="number"
                    value={stageDimensions[2]}
                    onChange={(e) => {
                      const newDepth = parseFloat(e.target.value) || 0;
                      onStageDimensionsChange?.([stageDimensions[0], stageDimensions[1], newDepth]);
                    }}
                    step={0.1}
                    min={0.1}
                    className="h-8"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Stage is positioned perpendicular to XY plane, affixed to bottom of stock
              </p>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Stock Size Controls */}
        <div>
          <h4 className="text-sm font-medium mb-3">Stock Size</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="stock-width" className="text-xs">Width ({units})</Label>
              <Input
                id="stock-width"
                type="number"
                step="0.1"
                value={stockSize[0]}
                onChange={(e) => handleSizeChange(0, e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="stock-depth" className="text-xs">Depth ({units})</Label>
              <Input
                id="stock-depth"
                type="number"
                step="0.1"
                value={stockSize[1]}
                onChange={(e) => handleSizeChange(1, e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="stock-height" className="text-xs">Height ({units})</Label>
              <Input
                id="stock-height"
                type="number"
                step="0.1"
                value={stockSize[2]}
                onChange={(e) => handleSizeChange(2, e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />        {/* Stock Position Controls */}
        <div>          <h4 className="text-sm font-medium mb-3">Stock Position</h4>          {machineOrientation === 'horizontal' && (
            <p className="text-xs text-muted-foreground mb-3">
              Position is relative to stage X+ face (spindle side). Stock is attached to the face closest to the spindle.
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="stock-x" className="text-xs">X Position ({units})</Label>
              <Input
                id="stock-x"
                type="number"
                step="0.1"
                value={stockPosition[0].toFixed(1)}
                onChange={(e) => handlePositionChange(0, e.target.value)}
                className="mt-1"
              />              <div className="text-xs text-gray-500 mt-1">
                {machineOrientation === 'horizontal' 
                  ? 'Offset from stage X+ face (spindle side)' 
                  : `Range: ${machineSettings.axes.X.min} to ${machineSettings.axes.X.max}`
                }
              </div>
            </div>
            <div>
              <Label htmlFor="stock-y" className="text-xs">Y Position ({units})</Label>
              <Input
                id="stock-y"
                type="number"
                step="0.1"
                value={stockPosition[1].toFixed(1)}
                onChange={(e) => handlePositionChange(1, e.target.value)}
                className="mt-1"
              />              <div className="text-xs text-gray-500 mt-1">
                {machineOrientation === 'horizontal' 
                  ? 'Offset from stage Y center' 
                  : `Range: ${machineSettings.axes.Y.min} to ${machineSettings.axes.Y.max}`
                }
              </div>
            </div>
            <div>
              <Label htmlFor="stock-z" className="text-xs">Z Position ({units})</Label>
              <Input
                id="stock-z"
                type="number"
                step="0.1"
                value={stockPosition[2].toFixed(1)}
                onChange={(e) => handlePositionChange(2, e.target.value)}
                className="mt-1"
              />              <div className="text-xs text-gray-500 mt-1">
                {machineOrientation === 'horizontal' 
                  ? 'Offset from stage top' 
                  : `Range: ${machineSettings.axes.Z.min} to ${machineSettings.axes.Z.max}`
                }
              </div>
            </div>
          </div>
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
      </CardContent>
    </Card>
  );
};

export default StockControls;
