import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProbeOperation, MachineSettings, ProbeSequenceSettings } from '@/types/machine';
import Machine3DVisualization from './Machine3DVisualization';
import StockControls from './StockControls';
import ProbeControls from './ProbeControls';

interface SequenceVisualizationProps {
  probeSequence: ProbeOperation[];
  machineSettings: MachineSettings;
  probeSequenceSettings?: ProbeSequenceSettings;
}

const SequenceVisualization: React.FC<SequenceVisualizationProps> = ({ 
  probeSequence, 
  machineSettings, 
  probeSequenceSettings 
}) => {
  // State for stock controls and machine orientation
  const [stockSize, setStockSize] = useState<[number, number, number]>([25, 25, 10]);
  const [machineOrientation, setMachineOrientation] = useState<'vertical' | 'horizontal'>('horizontal');
  const [stageDimensions, setStageDimensions] = useState<[number, number, number]>([12.7, 304.8, 63.5]);
    // State for probe position controls
  const [probePosition, setProbePosition] = useState<{X: number, Y: number, Z: number}>(() => {
    return probeSequenceSettings?.initialPosition || { X: 0, Y: 0, Z: 0 };
  });
  
  const [stockPosition, setStockPosition] = useState<[number, number, number]>(() => {
    // Start with a default position that works for both orientations
    // For vertical: absolute world coordinates
    // For horizontal: relative to stage position (will be offset in 3D view)
    return [0, 0, 5]; // Simple centered position relative to reference point
  });

  const handleStockSizeChange = useCallback((size: [number, number, number]) => {
    setStockSize(size);
  }, []);
  const handleStockPositionChange = useCallback((position: [number, number, number]) => {
    setStockPosition(position);
  }, []);
  const handleStageDimensionsChange = useCallback((dimensions: [number, number, number]) => {
    setStageDimensions(dimensions);
  }, []);
  
  const handleProbePositionChange = useCallback((position: {X: number, Y: number, Z: number}) => {
    setProbePosition(position);
  }, []);
  
  // Sync probe position when probeSequenceSettings changes (e.g., from imports)
  useEffect(() => {
    if (probeSequenceSettings?.initialPosition) {
      setProbePosition(probeSequenceSettings.initialPosition);
    }
  }, [probeSequenceSettings?.initialPosition]);

  // Create modified probe sequence settings with updated position using useMemo
  const modifiedProbeSequenceSettings = useMemo(() => {
    if (!probeSequenceSettings) return undefined;
    
    return {
      ...probeSequenceSettings,
      initialPosition: probePosition
    };
  }, [probeSequenceSettings, probePosition]);
  return (
    <div className="space-y-6">
      {/* 3D Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>3D Visualization</CardTitle>
          <CardDescription>Interactive 3D view of your machine, stock, and probe sequence</CardDescription>
        </CardHeader>
        <CardContent>          <Machine3DVisualization 
            machineSettings={machineSettings}
            probeSequence={modifiedProbeSequenceSettings}
            stockSize={stockSize}
            stockPosition={stockPosition}
            onStockSizeChange={handleStockSizeChange}
            onStockPositionChange={handleStockPositionChange}
            showAxisLabels={true}
            showCoordinateHover={true}
            machineOrientation={machineOrientation}
            stageDimensions={stageDimensions}
          />
        </CardContent>
      </Card>      {/* Tabs for Controls and Sequence Details */}
      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="controls">Stock Controls</TabsTrigger>
          <TabsTrigger value="probe">Probe Position</TabsTrigger>
          <TabsTrigger value="sequence">Sequence Details</TabsTrigger>
        </TabsList>        <TabsContent value="controls">
          <StockControls
            stockSize={stockSize}
            stockPosition={stockPosition}
            onStockSizeChange={handleStockSizeChange}
            onStockPositionChange={handleStockPositionChange}
            units={machineSettings.units}
            machineSettings={machineSettings}
            machineOrientation={machineOrientation}
            onMachineOrientationChange={setMachineOrientation}
            stageDimensions={stageDimensions}
            onStageDimensionsChange={handleStageDimensionsChange}
          />
        </TabsContent>          <TabsContent value="probe">
          <ProbeControls
            probePosition={probePosition}
            onProbePositionChange={handleProbePositionChange}
            units={machineSettings.units}
            machineSettings={machineSettings}
            machineOrientation={machineOrientation}
            stockSize={stockSize}
            stockPosition={stockPosition}
            stageDimensions={stageDimensions}
          />
        </TabsContent>
        
        <TabsContent value="sequence">
          <Card>
            <CardHeader>
              <CardTitle>Sequence Summary</CardTitle>
              <CardDescription>Details of each probe operation in your sequence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {probeSequence.map((probe, index) => (
                  <div key={probe.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <Badge>{index + 1}</Badge>
                    <div className="flex-1">
                      <span className="font-medium">
                        Probe {probe.axis} axis {probe.direction > 0 ? 'positive' : 'negative'} direction
                      </span>
                      <div className="text-sm text-gray-600">
                        Distance: {probe.distance}{machineSettings.units},
                        Feed: {probe.feedRate}{machineSettings.units}/min,
                        Backoff: {probe.backoffDistance}{machineSettings.units}
                      </div>
                    </div>
                    <Badge variant="outline">{probe.postMoves.length} post-moves</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>    </div>
  );
};

export default SequenceVisualization;
