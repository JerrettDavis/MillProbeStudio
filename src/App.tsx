import { useState, useEffect, useCallback } from 'react';
import MachineSettingsForm from '@/components/MachineSettings';
import ProbeSequenceEditor from '@/components/ProbeSequence';
import GCodeImport from '@/components/GCodeImport';
import SequenceVisualization from '@/components/SequenceVisualization';
import GCodeOutput from '@/components/GCodeOutput';
import type { MachineSettings, ProbeOperation, ProbeSequenceSettings } from '@/types/machine';
import { generateGCode } from '@/utils/gcodeGenerator';
import { ThemeProvider } from '@/components/theme-provider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Type definitions
interface AxisConfig {
  label: string;
  positiveDirection: string;
  negativeDirection: string;
  polarity: 1 | -1;
  min: number;
  max: number;
}

const defaultMachineSettings: MachineSettings = {
  units: 'mm',
  axes: {
    X: {
      positiveDirection: 'Down',
      negativeDirection: 'Up',
      polarity: 1,
      min: -86,
      max: -0.5
    },
    Y: {
      positiveDirection: 'Right',
      negativeDirection: 'Left',
      polarity: 1,
      min: -0.5,
      max: -241.50
    },
    Z: {
      positiveDirection: 'In',
      negativeDirection: 'Out',
      polarity: -1,
      min: -0.5,
      max: -78.50
    }
  }
};

const App = () => {
  const [machineSettings, setMachineSettings] = useState<MachineSettings>(defaultMachineSettings);
  const [probeSequence, setProbeSequence] = useState<ProbeOperation[]>([]);
  const [probeSequenceSettings, setProbeSequenceSettings] = useState<ProbeSequenceSettings>({
    initialPosition: { X: -78, Y: -100, Z: -41 },
    dwellsBeforeProbe: 15,
    spindleSpeed: 5000,
    units: 'mm',
    endmillSize: {
      input: '1/8',
      unit: 'fraction',
      sizeInMM: 3.175 // 1/8 inch in mm
    },
    operations: []
  });
  const [generatedGCode, setGeneratedGCode] = useState<string>('');
  const [importCounter, setImportCounter] = useState<number>(0);

  // Sync units from machine settings to probe sequence settings
  useEffect(() => {
    setProbeSequenceSettings(prev => ({
      ...prev,
      units: machineSettings.units
    }));
  }, [machineSettings.units]);

  const updateAxisConfig = (axis: 'X' | 'Y' | 'Z', field: keyof AxisConfig, value: any) => {
    setMachineSettings(prev => ({
      ...prev,
      axes: {
        ...prev.axes,
        [axis]: {
          ...prev.axes[axis],
          [field]: value
        }
      }
    }));
  };

  const handleGCodeImport = (parseResult: { probeSequence: ProbeOperation[]; initialPosition?: { X: number; Y: number; Z: number }; dwellsBeforeProbe?: number; spindleSpeed?: number; units?: 'mm' | 'inch' }) => {
    // Update probe sequence
    setProbeSequence(parseResult.probeSequence);

    // Update probe sequence settings if provided
    if (parseResult.initialPosition) {
      setProbeSequenceSettings(prev => ({
        ...prev,
        initialPosition: parseResult.initialPosition!
      }));
    }

    if (parseResult.dwellsBeforeProbe) {
      setProbeSequenceSettings(prev => ({
        ...prev,
        dwellsBeforeProbe: parseResult.dwellsBeforeProbe!
      }));
    }

    // Update spindle speed in probe sequence settings if provided
    if (parseResult.spindleSpeed) {
      setProbeSequenceSettings(prev => ({
        ...prev,
        spindleSpeed: parseResult.spindleSpeed!
      }));
    }

    // Update machine settings if provided
    if (parseResult.units) {
      setMachineSettings(prev => ({
        ...prev,
        units: parseResult.units!
      }));
    }

    // Increment counter to force ProbeSequenceEditor re-mount
    setImportCounter(prev => prev + 1);
  };

  const handleGenerateGCode = () => {
    const gcode = generateGCode(probeSequence, probeSequenceSettings);
    setGeneratedGCode(gcode);
  };

  // Memoize callback functions to prevent infinite loops in ProbeSequenceEditor
  const handleProbeSequenceChange = useCallback((newProbeSequence: ProbeOperation[]) => {
    setProbeSequence(newProbeSequence);
  }, []);

  const handleProbeSequenceSettingsChange = useCallback((newSettings: ProbeSequenceSettings) => {
    setProbeSequenceSettings(newSettings);
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Mill Probe Studio</h1>

          <Tabs defaultValue="machine" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="machine">Machine Settings</TabsTrigger>
              <TabsTrigger value="sequence">Probe Sequence</TabsTrigger>
              <TabsTrigger value="visualize">Visualize</TabsTrigger>
              <TabsTrigger value="gcode">G-Code</TabsTrigger>
            </TabsList>

            <TabsContent value="machine" className="space-y-6">
              <MachineSettingsForm
                machineSettings={machineSettings}
                setMachineSettings={setMachineSettings}
                updateAxisConfig={updateAxisConfig}
              />
            </TabsContent>

            <TabsContent value="sequence" className="space-y-6">
              <GCodeImport
                onImport={handleGCodeImport}
                machineSettings={machineSettings}
              />
              <ProbeSequenceEditor
                key={`probe-sequence-${importCounter}`}
                initialData={{
                  probeSequence: probeSequence,
                  probeSequenceSettings: probeSequenceSettings
                }}
                machineSettingsUnits={probeSequenceSettings.units}
                machineAxes={{
                  X: {
                    positiveDirection: machineSettings.axes.X.positiveDirection,
                    negativeDirection: machineSettings.axes.X.negativeDirection,
                  },
                  Y: {
                    positiveDirection: machineSettings.axes.Y.positiveDirection,
                    negativeDirection: machineSettings.axes.Y.negativeDirection,
                  },
                  Z: {
                    positiveDirection: machineSettings.axes.Z.positiveDirection,
                    negativeDirection: machineSettings.axes.Z.negativeDirection,
                  },
                }}
                onProbeSequenceChange={handleProbeSequenceChange}
                onProbeSequenceSettingsChange={handleProbeSequenceSettingsChange}
              />
            </TabsContent>

            <TabsContent value="visualize" className="space-y-6">
              <SequenceVisualization
                probeSequence={probeSequence}
                machineSettings={machineSettings}
                probeSequenceSettings={probeSequenceSettings}
              />
            </TabsContent>

            <TabsContent value="gcode" className="space-y-6">
              <GCodeOutput
                generatedGCode={generatedGCode}
                generateGCode={handleGenerateGCode}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;