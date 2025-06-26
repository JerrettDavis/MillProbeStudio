import { useCallback } from 'react';
import ProbeSequenceEditor from '@/components/ProbeSequence';
import GCodeImport from '@/components/GCodeImport';
import SequenceVisualization from '@/components/SequenceVisualization';
import GCodeOutput from '@/components/GCodeOutput';
import { generateGCode } from '@/utils/gcodeGenerator';
import { ThemeProvider } from '@/components/theme-provider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  useMachineSettings,
  useProbeSequence,
  useProbeSequenceSettings,
  useGeneratedGCode,
  useMachineSettingsActions,
  useProbeSequenceActions,
  useGCodeActions,
  useImportActions,
  useAppStore
} from '@/store';

const App = () => {
  // Get state from store
  const machineSettings = useMachineSettings();
  const probeSequence = useProbeSequence();
  const probeSequenceSettings = useProbeSequenceSettings();
  const generatedGCode = useGeneratedGCode();
  const importCounter = useAppStore((state) => state.importCounter);
  
  // Get actions from store
  const { setMachineSettings, updateAxisConfig } = useMachineSettingsActions();
  const { setProbeSequence, setProbeSequenceSettings } = useProbeSequenceActions();
  const { setGeneratedGCode } = useGCodeActions();
  const { handleGCodeImport } = useImportActions();

  // Generate G-code callback
  const handleGenerateGCode = useCallback(() => {
    const gcode = generateGCode(probeSequence, probeSequenceSettings);
    setGeneratedGCode(gcode);
  }, [probeSequence, probeSequenceSettings, setGeneratedGCode]);

  // Memoize callback functions to prevent infinite loops in ProbeSequenceEditor
  const handleProbeSequenceChange = useCallback((newProbeSequence: typeof probeSequence) => {
    setProbeSequence(newProbeSequence);
  }, [setProbeSequence]);

  const handleProbeSequenceSettingsChange = useCallback((newSettings: typeof probeSequenceSettings) => {
    setProbeSequenceSettings(newSettings);
  }, [setProbeSequenceSettings]);

  return (
    <ThemeProvider>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">          
          <Tabs defaultValue="sequence" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sequence">Probe Sequence</TabsTrigger>
              <TabsTrigger value="visualize">Visualize</TabsTrigger>
              <TabsTrigger value="gcode">G-Code</TabsTrigger>
            </TabsList>

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
                machineSettings={machineSettings}
                setMachineSettings={setMachineSettings}
                updateAxisConfig={updateAxisConfig}
                onProbeSequenceChange={handleProbeSequenceChange}
                onProbeSequenceSettingsChange={handleProbeSequenceSettingsChange}
              />
            </TabsContent>

            <TabsContent value="visualize" className="space-y-6">
              <SequenceVisualization
                probeSequence={probeSequence}
                machineSettings={machineSettings}
                probeSequenceSettings={probeSequenceSettings}
                setMachineSettings={setMachineSettings}
                updateAxisConfig={updateAxisConfig}
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
