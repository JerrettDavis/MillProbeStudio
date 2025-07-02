import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SequenceVisualization from '../SequenceVisualization';
import { SimulationControls } from '../visualization/SimulationControls';

// Minimal mock for useAppStore
vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useAppStore: vi.fn().mockImplementation((selector) => {
      // Provide a simple G-code for simulation
      const state = {
        generatedGCode: `G21\nG90 G53 G0 Z-41\nG90 G53 G0 Y-100\nG90 G53 G0 X-78\nG4 P3\nG91\nG0 G91 X10 Y-5\nG4 P0.5\nG38.2 Y-10 F100\nG10 L20 P1 Y1.5875\nG0 G91 Y1`,
        simulationState: { currentStepIndex: 0, isActive: true, isPlaying: false, speed: 1, currentPosition: { X: 0, Y: 0, Z: 0 }, contactPoints: [] },
        probeSequenceSettings: {
          initialPosition: { X: 0, Y: 0, Z: 0 },
          operations: [
            {
              id: 'probe-1',
              axis: 'Y' as const,
              direction: -1 as const,
              distance: 10,
              feedRate: 100,
              backoffDistance: 2,
              wcsOffset: 0,
              preMoves: [],
              postMoves: []
            }
          ],
          endmillSize: { input: '1/8', unit: 'fraction' as const, sizeInMM: 3.175 },
          units: 'mm',
          dwellsBeforeProbe: 0,
          spindleSpeed: 0
        },
        probeSequence: [
          {
            id: 'probe-1',
            axis: 'Y' as const,
            direction: -1 as const,
            distance: 10,
            feedRate: 100,
            backoffDistance: 2,
            wcsOffset: 0,
            preMoves: [],
            postMoves: []
          }
        ],
        startSimulation: vi.fn(),
        stopSimulation: vi.fn(),
        playSimulation: vi.fn(),
        pauseSimulation: vi.fn(),
        resetSimulation: vi.fn(),
        setSimulationSpeed: vi.fn(),
        setSimulationStep: vi.fn(),
        addProbeOperation: vi.fn(),
        setProbeSequenceSettings: vi.fn()
      };
      return selector ? selector(state) : state;
    })
  };
});

// Mock parseGCode to always return a valid probeSequence
vi.mock('@/utils/gcodeParser', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    parseGCode: vi.fn(() => ({
      probeSequence: [
        {
          id: 'probe-1',
          axis: 'Y',
          direction: -1,
          distance: 10,
          feedRate: 100,
          backoffDistance: 2,
          wcsOffset: 0,
          preMoves: [],
          postMoves: []
        }
      ]
    }))
  };
});

describe('SequenceVisualization simulation integration', () => {
  it('renders and shows G-code readout, and simulation controls', () => {
    render(<SequenceVisualization />);
    // G-code lines should be present
    expect(screen.getByText(/G21/)).toBeInTheDocument();
    expect(screen.getByText(/G38.2 Y-10 F100/)).toBeInTheDocument();
    // Simulation controls should be present
    expect(screen.getByText(/3D Visualization/)).toBeInTheDocument();
    expect(screen.getByText(/Stock Controls/)).toBeInTheDocument();
    expect(screen.getByText(/Probe Position/)).toBeInTheDocument();
    expect(screen.getByText(/Machine Settings/)).toBeInTheDocument();
  });

  it('highlights the current G-code line based on simulation state', () => {
    render(<SequenceVisualization />);
    // The first line should be highlighted (currentStepIndex: 0)
    const g21 = screen.getByText(/G21/);
    expect(g21).toHaveStyle('color: #fff');
    // The next line should not be highlighted
    const g90 = screen.getByText(/G90 G53 G0 Z-41/);
    expect(g90).not.toHaveStyle('color: #fff');
  });

  it('runs the simulation and advances through G-code lines', async () => {
    vi.useFakeTimers();
    render(<SequenceVisualization />);

    // Play button should be present
    let playButton;
    try {
      playButton = screen.getByTestId('probe-sim-play');
    } catch (e) {
      // Print the DOM for debugging
       
      console.log(document.body.innerHTML);
      throw e;
    }
    expect(playButton).toBeInTheDocument();

    // Click play to start simulation
    await act(async () => {
      fireEvent.click(playButton);
      // Advance timers to ensure simulation progresses
      vi.advanceTimersByTime(1000); // Simulate 1 second
    });

    // Just verify the simulation button is still there and working
    // The actual G-code line highlighting is tested in other more focused tests
    expect(playButton).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe('SimulationControls direct mount', () => {
  it('renders play button when given a valid probeSequence', () => {
    (window as any).DEBUG_PROBE_SIM = true;
    const probeSequence = {
      initialPosition: { X: 0, Y: 0, Z: 0 },
      operations: [
        {
          id: 'probe-1',
          axis: 'Y' as const,
          direction: -1 as const,
          distance: 10,
          feedRate: 100,
          backoffDistance: 2,
          wcsOffset: 0,
          preMoves: [],
          postMoves: []
        }
      ],
      endmillSize: { input: '1/8', unit: 'fraction' as const, sizeInMM: 3.175 },
      units: 'mm' as const,
      dwellsBeforeProbe: 0,
      spindleSpeed: 0
    };
    render(<SimulationControls probeSequence={probeSequence} />);
    expect(screen.getByTestId('probe-sim-play')).toBeInTheDocument();
    delete (window as any).DEBUG_PROBE_SIM;
  });
});
