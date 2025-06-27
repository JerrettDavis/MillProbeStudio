import React from 'react';
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
import { Box, MapPin, List, Settings } from "lucide-react";
import type { ProbeOperation, MachineSettings, ProbeSequenceSettings, AxisConfig } from '@/types/machine';
import { useVisualizationWithStore, useVisualizationControls } from '@/store';
import Machine3DVisualization from './Machine3DVisualization';
import StockControls from './StockControls';
import ProbeControls from './ProbeControls';
import MachineSettingsForm from './MachineSettings';

interface SequenceVisualizationProps {
  // These props are now optional - component will use store if not provided
  probeSequence?: ProbeOperation[];
  machineSettings?: MachineSettings;
  probeSequenceSettings?: ProbeSequenceSettings;
  setMachineSettings?: React.Dispatch<React.SetStateAction<MachineSettings>>;
  updateAxisConfig?: (axis: 'X' | 'Y' | 'Z', field: keyof AxisConfig, value: AxisConfig[keyof AxisConfig]) => void;
}

const SequenceVisualization: React.FC<SequenceVisualizationProps> = ({ 
  probeSequence: propProbeSequence, 
  machineSettings: propMachineSettings, 
  probeSequenceSettings: propProbeSequenceSettings,
  setMachineSettings: propSetMachineSettings,
  updateAxisConfig: propUpdateAxisConfig
}) => {
  // Use store values as fallback
  const storeData = useVisualizationWithStore();
  const visualizationControls = useVisualizationControls();

  // Use props if provided, otherwise fall back to store
  const probeSequence = propProbeSequence ?? storeData.probeSequence;
  const machineSettings = propMachineSettings ?? storeData.machineSettings;
  const probeSequenceSettings = propProbeSequenceSettings ?? storeData.probeSequenceSettings;
  const setMachineSettings = propSetMachineSettings ?? storeData.setMachineSettings;
  const updateAxisConfig = propUpdateAxisConfig ?? storeData.updateAxisConfig;

  // Use store for visualization controls
  const {
    stockSize,
    stockPosition,
    stockRotation,
    probePosition,
    modelFile,
    isLoadingModelFile,
    updateStockSize,
    updateStockPosition,
    updateStockRotation,
    updateProbePosition,
    updateModelFile
  } = visualizationControls;

  // Use probe position directly from store - no need for additional variable
  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* 3D Visualization with floating controls - fills remaining height */}
      <div className="flex-1 relative">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>3D Visualization</CardTitle>
            <CardDescription>Interactive 3D view of your machine, stock, and probe sequence</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 relative p-4 pb-6 pt-0">
            <div className="h-full">
              <Machine3DVisualization 
                machineSettings={machineSettings}
                probeSequence={probeSequenceSettings}
                stockSize={stockSize}
                stockPosition={stockPosition}
                stockRotation={stockRotation}
                onStockSizeChange={updateStockSize}
                onStockPositionChange={updateStockPosition}
                onStockRotationChange={updateStockRotation}
                showAxisLabels={true}
                showCoordinateHover={true}
                height="100%"
                modelFile={modelFile}
              />
            </div>
            
            {/* Floating Control Buttons - Bottom of view */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex flex-row gap-1 sm:gap-2 z-10">
              {/* Machine Settings Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="shadow-lg backdrop-blur-sm bg-white/90 text-xs sm:text-sm px-2 sm:px-3">
                    <Settings className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Machine Settings</span>
                    <span className="sm:hidden">Machine</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Machine Settings</DrawerTitle>
                    <DrawerDescription>Configure your CNC machine parameters and axis settings</DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
                    <MachineSettingsForm
                      machineSettings={machineSettings}
                      setMachineSettings={setMachineSettings}
                      updateAxisConfig={updateAxisConfig}
                    />
                  </div>
                </DrawerContent>
              </Drawer>

              {/* Stock Controls Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="shadow-lg backdrop-blur-sm bg-white/90 text-xs sm:text-sm px-2 sm:px-3">
                    <Box className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Stock Controls</span>
                    <span className="sm:hidden">Stock</span>
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
                      stockRotation={stockRotation}
                      onStockSizeChange={updateStockSize}
                      onStockPositionChange={updateStockPosition}
                      onStockRotationChange={updateStockRotation}
                      units={machineSettings.units}
                      machineSettings={machineSettings}
                      modelFile={modelFile}
                      onModelFileChange={updateModelFile}
                      isLoadingModelFile={isLoadingModelFile}
                    />
                  </div>
                </DrawerContent>
              </Drawer>

              {/* Probe Position Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="shadow-lg backdrop-blur-sm bg-white/90 text-xs sm:text-sm px-2 sm:px-3">
                    <MapPin className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Probe Position</span>
                    <span className="sm:hidden">Probe</span>
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
                      onProbePositionChange={updateProbePosition}
                      units={machineSettings.units}
                      machineSettings={machineSettings}
                      stockSize={stockSize}
                      stockPosition={stockPosition}
                    />
                  </div>
                </DrawerContent>
              </Drawer>

              {/* Sequence Details Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="shadow-lg backdrop-blur-sm bg-white/90 text-xs sm:text-sm px-2 sm:px-3">
                    <List className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sequence Details</span>
                    <span className="sm:hidden">Sequence</span>
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
