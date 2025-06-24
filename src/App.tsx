import { useState, useEffect } from 'react';
import MachineSettingsForm from '@/components/MachineSettings';
import ProbeSequenceEditor from '@/components/ProbeSequence';
import GCodeImport from '@/components/GCodeImport';
import SequenceVisualization from '@/components/SequenceVisualization';
import GCodeOutput from '@/components/GCodeOutput';
import type { MachineSettings, ProbeOperation, MovementStep, ProbeSequenceSettings } from './types/machine';
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
      label: 'Down/Up', // Will be replaced dynamically
      positiveDirection: 'Down',
      negativeDirection: 'Up',
      polarity: 1,
      min: -86,
      max: -0.5
    },
    Y: {
      label: 'Right/Left', // Will be replaced dynamically
      positiveDirection: 'Right',
      negativeDirection: 'Left',
      polarity: 1,
      min: -0.5,
      max: -241.50
    },
    Z: {
      label: 'In/Out', // Will be replaced dynamically
      positiveDirection: 'In',
      negativeDirection: 'Out',
      polarity: -1,
      min: -0.5,
      max: -78.50
    }
  },
  spindleSpeed: 5000
};

const App = () => {
  const [machineSettings, setMachineSettings] = useState<MachineSettings>(defaultMachineSettings);
  const [probeSequence, setProbeSequence] = useState<ProbeOperation[]>([]);
  const [probeSequenceSettings, setProbeSequenceSettings] = useState({
    initialPosition: { X: -78, Y: -100, Z: -41 },
    dwellsBeforeProbe: 15
  });
  const [generatedGCode, setGeneratedGCode] = useState<string>('');
  const [toolSizeInput, setToolSizeInput] = useState<string>('1/8');
  const [toolSizeUnit, setToolSizeUnit] = useState<'fraction' | 'inch' | 'mm'>('fraction');

  // Helper to parse tool size input
  const parseToolSize = (input: string, unit: 'fraction' | 'inch' | 'mm'): number => {
    if (unit === 'mm') {
      return parseFloat(input);
    } else if (unit === 'inch') {
      return parseFloat(input) * 25.4;
    } else if (unit === 'fraction') {
      // e.g. "1/8"
      const [num, denom] = input.split('/').map(Number);
      if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
        return (num / denom) * 25.4;
      }
      return 0;
    }
    return 0;
  };

  // Calculate tool size in mm
  const toolSizeMM = parseToolSize(toolSizeInput, toolSizeUnit);

  // When probeSequence changes, update WCS Offset for each probe
  useEffect(() => {
    setProbeSequence(prev => prev.map(probe => ({
      ...probe,
      wcsOffset: toolSizeMM / 2,
    })));
  }, [toolSizeMM]);

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

  const updateInitialPosition = (axis: 'X' | 'Y' | 'Z', value: number) => {
    setProbeSequenceSettings(prev => ({
      ...prev,
      initialPosition: {
        ...prev.initialPosition,
        [axis]: value
      }
    }));
  };

  const updateDwellsBeforeProbe = (value: number) => {
    setProbeSequenceSettings(prev => ({
      ...prev,
      dwellsBeforeProbe: value
    }));
  };

  const addProbeOperation = () => {
    const newProbe: ProbeOperation = {
      id: `probe-${Date.now()}`,
      axis: 'Y',
      direction: -1,
      distance: 25,
      feedRate: 10,
      backoffDistance: 1,
      wcsOffset: toolSizeMM / 2, // Use generated WCS offset
      preMoves: [],
      postMoves: []
    };
    setProbeSequence(prev => [...prev, newProbe]);
  };

  const updateProbeOperation = (id: string, field: keyof ProbeOperation, value: any) => {
    setProbeSequence(prev => prev.map(probe =>
      probe.id === id ? { ...probe, [field]: value } : probe
    ));
  };

  const deleteProbeOperation = (id: string) => {
    setProbeSequence(prev => prev.filter(probe => probe.id !== id));
  };

  const addMovementStep = (probeId: string, moveType: 'pre' | 'post' = 'post') => {
    const newStep: MovementStep = {
      id: `step-${Date.now()}`,
      type: 'rapid',
      description: moveType === 'pre' ? 'Position for probe' : 'Move away from surface',
      axesValues: {},
      positionMode: 'relative',
      coordinateSystem: 'none'
    };

    setProbeSequence(prev => prev.map(probe =>
      probe.id === probeId ? {
        ...probe,
        [moveType === 'pre' ? 'preMoves' : 'postMoves']: [
          ...(moveType === 'pre' ? probe.preMoves : probe.postMoves), 
          newStep
        ]
      } : probe
    ));
  };

  const updateMovementStep = (probeId: string, stepId: string, field: keyof MovementStep, value: any, moveType: 'pre' | 'post' = 'post') => {
    setProbeSequence(prev => prev.map(probe =>
      probe.id === probeId ? {
        ...probe,
        [moveType === 'pre' ? 'preMoves' : 'postMoves']: (moveType === 'pre' ? probe.preMoves : probe.postMoves).map(step =>
          step.id === stepId ? { ...step, [field]: value } : step
        )
      } : probe
    ));
  };

  const deleteMovementStep = (probeId: string, stepId: string, moveType: 'pre' | 'post' = 'post') => {
    setProbeSequence(prev => prev.map(probe =>
      probe.id === probeId ? {
        ...probe,
        [moveType === 'pre' ? 'preMoves' : 'postMoves']: (moveType === 'pre' ? probe.preMoves : probe.postMoves).filter(step => step.id !== stepId)
      } : probe
    ));
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
    
    // Update machine settings if provided
    if (parseResult.spindleSpeed) {
      setMachineSettings(prev => ({
        ...prev,
        spindleSpeed: parseResult.spindleSpeed!
      }));
    }
    
    if (parseResult.units) {
      setMachineSettings(prev => ({
        ...prev,
        units: parseResult.units!
      }));
    }
  };

  const generateGCode = () => {
    let gcode = '';
    const isMM = machineSettings.units === 'mm';
    // Helper for aligned comments
    const padLine = (code: string, comment: string, padTo = 40) => {
      const codeStr = code.trimEnd();
      const padLength = Math.max(padTo - codeStr.length, 2);
      return codeStr + ' '.repeat(padLength) + (comment ? `(${comment})` : '');
    };
    // Header
    gcode += padLine(`G2${isMM ? 1 : 0}`, `Set units to ${isMM ? 'millimeters' : 'inches'}`) + '\n';

    // Initial positioning
    gcode += padLine(`G90 G53 G0 Z${probeSequenceSettings.initialPosition.Z}`, 'Absolute move in machine coordinates to Z') + '\n';
    gcode += padLine(`G90 G53 G0 Y${probeSequenceSettings.initialPosition.Y}`, 'Absolute move in machine coordinates to Y') + '\n';
    gcode += padLine(`G90 G53 G0 X${probeSequenceSettings.initialPosition.X}`, 'Absolute move in machine coordinates to X') + '\n\n';

    // Spindle start
    gcode += padLine(`S${machineSettings.spindleSpeed} M4`, `Start spindle in reverse at ${machineSettings.spindleSpeed} RPM`) + '\n';
    gcode += padLine('G4 P3', 'Dwell for 3 seconds to let spindle stabilize') + '\n\n';

    gcode += padLine('G91', 'Set to incremental positioning mode') + '\n\n';

    // Process each probe operation
    probeSequence.forEach((probe, index) => {
      gcode += `(=== Probe Operation ${index + 1}: ${probe.axis} Axis ===)\n`;

      // Pre-probe movements
      if (probe.preMoves.length > 0) {
        gcode += `(Pre-moves for Probe Operation ${index + 1})\n`;
        probe.preMoves.forEach((move) => {
          if (move.type === 'rapid' && move.axesValues) {
            // Build axes string
            let axesStr = '';
            if (typeof move.axesValues.X === 'number') axesStr += `X${move.axesValues.X} `;
            if (typeof move.axesValues.Y === 'number') axesStr += `Y${move.axesValues.Y} `;
            if (typeof move.axesValues.Z === 'number') axesStr += `Z${move.axesValues.Z} `;
            
            // Build G-code command for rapid moves (G0)
            let command = 'G0 ';
            
            // Add position mode (G90/G91)
            if (move.positionMode === 'absolute') {
              command += 'G90 ';
            } else if (move.positionMode === 'relative') {
              command += 'G91 ';
            }
            
            // Add coordinate system (G53/G54 or none)
            if (move.coordinateSystem === 'machine') {
              command += 'G53 ';
            } else if (move.coordinateSystem === 'wcs') {
              command += 'G54 ';
            }
            
            gcode += padLine(`${command}${axesStr.trim()}`, move.description) + '\n';
          } else if (move.type === 'dwell' && move.dwellTime) {
            gcode += padLine(`G4 P${move.dwellTime}`, move.description) + '\n';
          }
        });
        gcode += '\n';
      }

      // Buffer clearing
      for (let i = 0; i < probeSequenceSettings.dwellsBeforeProbe; i++) {
        gcode += padLine('G4 P0.01', 'Empty Buffer') + '\n';
      }
      gcode += '\n';

      // Probe operation
      const probeDir = probe.direction > 0 ? '' : '-';
      gcode += padLine(`G38.2 ${probe.axis}${probeDir}${probe.distance} F${probe.feedRate}`, `Probe along ${probe.axis}${probeDir} axis`) + '\n';
      gcode += padLine(`G10 L20 P1 ${probe.axis}${probe.wcsOffset}`, `Set WCS G54 ${probe.axis} origin`) + '\n';
      gcode += padLine(`G0 G91 ${probe.axis}${probe.backoffDistance}`, 'Back off from surface') + '\n\n';

      // Post-probe movements
      if (probe.postMoves.length > 0) {
        gcode += `(Post-moves for Probe Operation ${index + 1})\n`;
        probe.postMoves.forEach((move) => {
          if (move.type === 'rapid' && move.axesValues) {
            // Build axes string
            let axesStr = '';
            if (typeof move.axesValues.X === 'number') axesStr += `X${move.axesValues.X} `;
            if (typeof move.axesValues.Y === 'number') axesStr += `Y${move.axesValues.Y} `;
            if (typeof move.axesValues.Z === 'number') axesStr += `Z${move.axesValues.Z} `;
            
            // Build G-code command for rapid moves (G0)
            let command = 'G0 ';
            
            // Add position mode (G90/G91)
            if (move.positionMode === 'absolute') {
              command += 'G90 ';
            } else if (move.positionMode === 'relative') {
              command += 'G91 ';
            }
            
            // Add coordinate system (G53/G54 or none)
            if (move.coordinateSystem === 'machine') {
              command += 'G53 ';
            } else if (move.coordinateSystem === 'wcs') {
              command += 'G54 ';
            }
            
            gcode += padLine(`${command}${axesStr.trim()}`, move.description) + '\n';
          } else if (move.type === 'dwell' && move.dwellTime) {
            gcode += padLine(`G4 P${move.dwellTime}`, move.description) + '\n';
          }
        });
      }
      gcode += '\n';
    });

    // Final positioning and cleanup
    gcode += padLine('G0 G54 G90 X0Y0', 'Return to origin') + '\n';
    gcode += padLine('S0', 'Stop spindle') + '\n';

    setGeneratedGCode(gcode);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Mill Probing Sequence Generator</h1>

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
                toolSizeInput={toolSizeInput}
                setToolSizeInput={setToolSizeInput}
                toolSizeUnit={toolSizeUnit}
                setToolSizeUnit={setToolSizeUnit}
                toolSizeMM={toolSizeMM}
              />
            </TabsContent>

            <TabsContent value="sequence" className="space-y-6">
              <GCodeImport
                onImport={handleGCodeImport}
                machineSettings={machineSettings}
              />
              <ProbeSequenceEditor
                probeSequence={probeSequence}
                initialPosition={probeSequenceSettings.initialPosition}
                updateInitialPosition={updateInitialPosition}
                dwellsBeforeProbe={probeSequenceSettings.dwellsBeforeProbe}
                updateDwellsBeforeProbe={updateDwellsBeforeProbe}
                addProbeOperation={addProbeOperation}
                updateProbeOperation={updateProbeOperation}
                deleteProbeOperation={deleteProbeOperation}
                addMovementStep={addMovementStep}
                updateMovementStep={updateMovementStep}
                deleteMovementStep={deleteMovementStep}
                machineSettingsUnits={machineSettings.units}
                defaultWcsOffset={toolSizeMM / 2}
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
              />
            </TabsContent>

            <TabsContent value="visualize" className="space-y-6">
              <SequenceVisualization
                probeSequence={probeSequence}
                machineSettingsUnits={machineSettings.units}
              />
            </TabsContent>

            <TabsContent value="gcode" className="space-y-6">
              <GCodeOutput
                generatedGCode={generatedGCode}
                generateGCode={generateGCode}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;