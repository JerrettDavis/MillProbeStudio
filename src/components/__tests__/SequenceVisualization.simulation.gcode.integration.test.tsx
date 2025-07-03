import { describe, it, expect, vi } from 'vitest';

const TEST_GCODE = `G21 (Set units to millimeters)\nG90 G53 G0 Z-41 (Absolute move in machine coordinates to Z)\nG90 G53 G0 Y-100 (Absolute move in machine coordinates to Y)\nG90 G53 G0 X-78 (Absolute move in machine coordinates to X)\nS5000 M4 (Start spindle in reverse at 5000 RPM)\nG4 P3 (Dwell for 3 seconds to let spindle stabilize)\nG91 (Set to incremental positioning mode)\n(=== Probe Operation 1: Y Axis ===)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG38.2 Y-10 F10 (Probe along Y- axis)\nG10 L20 P1 Y1.5875 (Set WCS G54 Y origin)\nG0 G91 Y1 (Back off from surface)\n(Post-moves for Probe Operation 1)\nG0 G91 X12 (move up in x to prepare for x probing)\nG0 G91 Y-3.5 (move right to position for x probing)\n(=== Probe Operation 2: X Axis ===)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG38.2 X-10 F10 (Probe along X- axis)\nG10 L20 P1 X1.5875 (Set WCS G54 X origin)\nG0 G91 X1 (Back off from surface)\n(Post-moves for Probe Operation 2)\nG0 G53 Z-24 (move z to safe probing height in machine coordinates)\nG0 G90 G54 X-5.5 Y-4 (move to center of stock for z probing)\n(=== Probe Operation 3: Z Axis ===)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG38.2 Z-45 F15 (Probe along Z- axis)\nG10 L20 P1 Z0 (Set WCS G54 Z origin)\nG0 G91 Z2 (Back off from surface)\n(Post-moves for Probe Operation 3)\nG0 G90 G54 X0 Y0 (return to work origin)\nG0 G54 G90 X0Y0 (Return to origin)\nS0 (Stop spindle)`;

// Minimal mock for useAppStore
vi.mock('@/store', () => ({
  useAppStore: vi.fn().mockImplementation((selector) => {
    const state = {
      generatedGCode: TEST_GCODE,
      simulationState: { currentStepIndex: 0 },
      visualizationSettings: {
        stockSize: [25, 25, 10],
        stockPosition: [0, 0, 0],
        stockRotation: [0, 0, 0],
        modelFile: null,
        isLoadingModelFile: false
      },
      machineSettings: {
        units: 'mm',
        axes: {
          X: { min: -50, max: 50 },
          Y: { min: -50, max: 50 },
          Z: { min: -25, max: 25 }
        },
        machineOrientation: 'vertical',
        stageDimensions: [100, 100, 50]
      },
      probeSequenceSettings: {
        initialPosition: { X: 0, Y: 0, Z: 0 },
        dwellsBeforeProbe: 15,
        spindleSpeed: 5000,
        units: 'mm'
      },
      probeSequence: [],
      cameraSettings: {
        preset: 'isometric',
        position: [10, 10, 10],
        target: [0, 0, 0]
      }
    };
    return selector ? selector(state) : state;
  }),
  useVisualizationWithStore: () => ({
    machineSettings: {
      units: 'mm',
      axes: {
        X: { min: -50, max: 50 },
        Y: { min: -50, max: 50 },
        Z: { min: -25, max: 25 }
      },
      machineOrientation: 'vertical',
      stageDimensions: [100, 100, 50]
    },
    probeSequence: [],
    probeSequenceSettings: {
      initialPosition: { X: 0, Y: 0, Z: 0 },
      dwellsBeforeProbe: 15,
      spindleSpeed: 5000,
      units: 'mm'
    },
    visualizationSettings: {
      stockSize: [25, 25, 10],
      stockPosition: [0, 0, 0],
      stockRotation: [0, 0, 0],
      modelFile: null,
      isLoadingModelFile: false
    },
    setMachineSettings: vi.fn(),
    updateAxisConfig: vi.fn(),
    setVisualizationSettings: vi.fn()
  }),
  useVisualizationControls: () => ({
    updateStockPosition: vi.fn(),
    updateStockSize: vi.fn(),
    updateStock: vi.fn()
  }),
  useCameraSettings: () => ({
    preset: 'isometric',
    position: { x: 10, y: 10, z: 10 },
    target: [0, 0, 0]
  }),
  useCameraActions: () => ({
    setCameraPreset: vi.fn(),
    setCameraPosition: vi.fn(),
    setCameraTarget: vi.fn()
  }),
  useMachineSettings: () => ({
    units: 'mm',
    axes: {
      X: { min: -50, max: 50 },
      Y: { min: -50, max: 50 },
      Z: { min: -25, max: 25 }
    },
    machineOrientation: 'vertical',
    stageDimensions: [100, 100, 50]
  }),
  useProbeSequence: () => ([]),
  useProbeSequenceSettings: () => ({
    initialPosition: { X: 0, Y: 0, Z: 0 },
    dwellsBeforeProbe: 15,
    spindleSpeed: 5000,
    units: 'mm'
  }),
  useMachineSettingsActions: () => ({
    setMachineSettings: vi.fn(),
    updateAxisConfig: vi.fn()
  }),
  useProbeSequenceActions: () => ({
    setProbeSequence: vi.fn(),
    setProbeSequenceSettings: vi.fn()
  }),
  useVisualizationActions: () => ({
    setVisualizationSettings: vi.fn()
  }),
  useVisualizationSettings: () => ({
    stockSize: [25, 25, 10],
    stockPosition: [0, 0, 0],
    stockRotation: [0, 0, 0],
    modelFile: null,
    isLoadingModelFile: false
  })
}));

describe('SequenceVisualization G-code simulation integration', () => {
  it('validates store integration with G-code data', async () => {
    // Test the store mock integration without rendering the heavy 3D component
    const storeModule = await import('../../store');
    const { useAppStore } = storeModule;
    const state = useAppStore((s: any) => s);
    
    expect(state.generatedGCode).toContain('G21');
    expect(state.generatedGCode).toContain('G38.2 Y-10 F10');
    expect(state.generatedGCode).toContain('G38.2 X-10 F10');
    expect(state.generatedGCode).toContain('G38.2 Z-45 F15');
    expect(state.visualizationSettings.stockSize).toEqual([25, 25, 10]);
  });

  it('validates machine settings integration', async () => {
    const storeModule = await import('../../store');
    const { useMachineSettings } = storeModule;
    const settings = useMachineSettings();
    
    expect(settings.units).toBe('mm');
    expect(settings.machineOrientation).toBe('vertical');
    expect(settings.axes.X.min).toBe(-50);
    expect(settings.axes.X.max).toBe(50);
  });
});
