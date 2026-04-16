import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger
} from "@/components/ui/drawer";
import { Box, MapPin, Settings } from "lucide-react";
import { useVisualizationWithStore, useVisualizationControls } from '@/store';
import { useAppStore } from '@/store';
import Machine3DVisualization from './Machine3DVisualization';
import StockControls from './StockControls';
import ProbeControls from './ProbeControls';
import MachineSettingsForm from './MachineSettings';
import { SimulationControls } from './visualization/SimulationControls';
import GCodeReadout from './visualization/GCodeReadout';
import { useVirtualMillContext } from './visualization/useVirtualMillContext';
// Use types from src/types/machine
import type { ProbeOperation, ProbeSequenceSettings, MachineSettings, AxisConfig } from '@/types/machine';

interface SequenceVisualizationProps {
  machineSettings?: MachineSettings;
  probeSequenceSettings?: ProbeSequenceSettings;
  setMachineSettings?: React.Dispatch<React.SetStateAction<MachineSettings>>;
  updateAxisConfig?: (axis: 'X' | 'Y' | 'Z', field: keyof AxisConfig, value: number | string) => void;
}

const SequenceVisualization: React.FC<SequenceVisualizationProps> = ({
  machineSettings: propMachineSettings,
  probeSequenceSettings: propProbeSequenceSettings,
  setMachineSettings: propSetMachineSettings,
  updateAxisConfig: propUpdateAxisConfig
}) => {
  // Use store values as fallback
  const storeData = useVisualizationWithStore();
  const visualizationControls = useVisualizationControls();

  // Use props if provided, otherwise fall back to store
  const machineSettings = propMachineSettings ?? storeData.machineSettings;
  const probeSequenceSettings: ProbeSequenceSettings | undefined = propProbeSequenceSettings ?? storeData.probeSequenceSettings;
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

  // Get G-code for display in readout
  const generatedGCode = useAppStore(state => state.generatedGCode) || '';
  const gcodeLines = useMemo(() => generatedGCode.split(/\r?\n/), [generatedGCode]);

  // Get VirtualMill context (provides synchronized simulation state)
  const virtualMillContext = useVirtualMillContext();

  // Get current GCode line from VirtualMill context (synchronized with simulation)
  // Fallback to store's currentStepIndex if VirtualMill context not available
  const storeCurrentStepIndex = useAppStore(state => state.simulationState.currentStepIndex);
  const currentLine = virtualMillContext?.currentGCodeLineIndex ?? storeCurrentStepIndex;

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

            {/* Simulation Controls - Top right corner */}
            <div className="absolute bottom-8 right-6 z-10 max-w-80">
              <SimulationControls />
            </div>

            {/* Floating Control Buttons - Bottom of view */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex flex-row gap-1 sm:gap-2 z-10">


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

              {/* Sequence Details Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="shadow-lg backdrop-blur-sm bg-white/90 text-xs sm:text-sm px-2 sm:px-3">
                    <span className="hidden sm:inline">Sequence Details</span>
                    <span className="sm:hidden">Sequence</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Sequence Details</DrawerTitle>
                    <DrawerDescription>View details of the current probe sequence</DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
                    {probeSequenceSettings && Array.isArray(probeSequenceSettings.operations) && probeSequenceSettings.operations.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {probeSequenceSettings.operations.map((op: ProbeOperation, idx: number) => (
                          <div key={op.id || idx} className="border rounded p-2 bg-muted/10">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground w-6 h-6 text-xs font-bold">{idx + 1}</span>
                              <span className="font-semibold">Probe {op.axis} axis {op.direction > 0 ? 'positive' : 'negative'} direction</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Distance: {op.distance}{machineSettings?.units || 'mm'}<br />
                              Feed: {op.feedRate}{machineSettings?.units || 'mm'}<br />
                              Backoff: {op.backoffDistance}{machineSettings?.units || 'mm'}<br />
                              WCS Offset: {op.wcsOffset}
                            </div>
                            {/* Post-moves badges */}
                            <div className="flex gap-1 mt-2">
                              {op.postMoves && op.postMoves.length > 0 && (
                                <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 border-blue-200">
                                  {op.postMoves.length} post-moves
                                </span>
                              )}
                              {(!op.postMoves || op.postMoves.length === 0) && (
                                <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-600 border-gray-200">
                                  0 post-moves
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No probe sequence defined.</div>
                    )}
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* G-code readout at the bottom */}
      <div className="w-full mt-2">
        <GCodeReadout gcodeLines={gcodeLines} currentLine={currentLine} contextWindow={3} />
      </div>
    </div>
  );
};

export default SequenceVisualization;
