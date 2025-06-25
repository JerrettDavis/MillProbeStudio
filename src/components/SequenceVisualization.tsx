import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerTrigger
} from "@/components/ui/drawer";
import { Box, MapPin, List } from "lucide-react";
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
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* 3D Visualization with floating controls - fills remaining height */}
      <div className="flex-1 relative">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>3D Visualization</CardTitle>
            <CardDescription>Interactive 3D view of your machine, stock, and probe sequence</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 relative p-6">
            <div className="h-full">
              <Machine3DVisualization 
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
                height="100%"
              />
            </div>
            
            {/* Floating Control Buttons - Bottom of view */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-row gap-2">
              {/* Stock Controls Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="shadow-lg backdrop-blur-sm bg-white/90">
                    <Box className="w-4 h-4 mr-2" />
                    Stock Controls
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Stock Controls</DrawerTitle>
                    <DrawerDescription>Adjust the size and position of the stock/workpiece</DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
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
                  </div>
                </DrawerContent>
              </Drawer>

              {/* Probe Position Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="shadow-lg backdrop-blur-sm bg-white/90">
                    <MapPin className="w-4 h-4 mr-2" />
                    Probe Position
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Probe Position Controls</DrawerTitle>
                    <DrawerDescription>Set the initial position for the probe sequence</DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
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
                  </div>
                </DrawerContent>
              </Drawer>

              {/* Sequence Details Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="shadow-lg backdrop-blur-sm bg-white/90">
                    <List className="w-4 h-4 mr-2" />
                    Sequence Details
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Sequence Summary</DrawerTitle>
                    <DrawerDescription>Details of each probe operation in your sequence</DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
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
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SequenceVisualization;
