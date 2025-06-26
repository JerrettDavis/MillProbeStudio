// src/components/StoreDemo.tsx
// Demo component showing centralized state management capabilities

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  useMachineSettings,
  useProbeSequence,
  useProbeSequenceSettings,
  useVisualizationSettings,
  useResetActions,
  useMachineSettingsActions,
  useProbeSequenceActions
} from '@/store';

export const StoreDemo: React.FC = () => {
  // Get state from store
  const machineSettings = useMachineSettings();
  const probeSequence = useProbeSequence();
  const probeSequenceSettings = useProbeSequenceSettings();
  const visualizationSettings = useVisualizationSettings();
  
  // Get actions from store
  const { resetToDefaults, resetMachineSettings, resetProbeSettings } = useResetActions();
  const { updateAxisConfig } = useMachineSettingsActions();
  const { addProbeOperation } = useProbeSequenceActions();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Centralized State Management Demo</CardTitle>
        <CardDescription>
          This component demonstrates how state is now centralized and persisted across sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current State Display */}
        <div>
          <h3 className="text-lg font-medium mb-3">Current State</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Machine Units:</strong> <Badge variant="outline">{machineSettings.units}</Badge></p>
              <p><strong>Machine Orientation:</strong> <Badge variant="outline">{machineSettings.machineOrientation}</Badge></p>
              <p><strong>Probe Operations:</strong> <Badge variant="outline">{probeSequence.length}</Badge></p>
            </div>
            <div>
              <p><strong>Spindle Speed:</strong> <Badge variant="outline">{probeSequenceSettings.spindleSpeed} RPM</Badge></p>
              <p><strong>Stock Size:</strong> <Badge variant="outline">{visualizationSettings.stockSize.join(' × ')}</Badge></p>
              <p><strong>Dwells Before Probe:</strong> <Badge variant="outline">{probeSequenceSettings.dwellsBeforeProbe}</Badge></p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div>
          <h3 className="text-lg font-medium mb-3">Test Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateAxisConfig('X', 'min', -100)}
            >
              Change X Min to -100
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addProbeOperation({
                axis: 'Z',
                direction: -1,
                distance: 15,
                feedRate: 50
              })}
            >
              Add Test Probe
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Demonstrate immediate state update
                updateAxisConfig('Y', 'polarity', machineSettings.axes.Y.polarity === 1 ? -1 : 1);
              }}
            >
              Toggle Y Polarity
            </Button>
          </div>
        </div>

        <Separator />

        {/* Reset Actions */}
        <div>
          <h3 className="text-lg font-medium mb-3">Reset Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={resetMachineSettings}
            >
              Reset Machine Settings
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={resetProbeSettings}
            >
              Reset Probe Settings
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={resetToDefaults}
            >
              Reset Everything
            </Button>
          </div>
        </div>

        {/* Persistence Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Persistence Information
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            All changes are automatically saved to localStorage. Try refreshing the page - 
            your settings will be preserved! The following data is persisted:
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 list-disc list-inside">
            <li>Machine settings (units, axes, orientation)</li>
            <li>Probe sequence operations</li>
            <li>Probe sequence settings</li>
            <li>Visualization settings (stock size/position)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
