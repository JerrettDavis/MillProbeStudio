import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SequenceVisualization from '../SequenceVisualization';
import type { ProbeOperation, MachineSettings, ProbeSequenceSettings } from '@/types/machine';

// Mock the 3D visualization component to avoid Three.js in tests
vi.mock('../Machine3DVisualization', () => ({
  default: () => <div data-testid="mock-3d-visualization">3D Visualization Mock</div>
}));

const mockMachineSettings: MachineSettings = {
  units: 'mm',
  axes: {
    X: {
      positiveDirection: '+X',
      negativeDirection: '-X',
      polarity: 1,
      min: -100,
      max: 100
    },
    Y: {
      positiveDirection: '+Y',
      negativeDirection: '-Y',
      polarity: 1,
      min: -100,
      max: 100
    },
    Z: {
      positiveDirection: '+Z',
      negativeDirection: '-Z',
      polarity: 1,
      min: -50,
      max: 50
    }
  }
};

const mockProbeSequenceSettings: ProbeSequenceSettings = {
  initialPosition: { X: 0, Y: 0, Z: 10 },
  dwellsBeforeProbe: 2,
  spindleSpeed: 1000,
  units: 'mm',
  endmillSize: {
    input: '6mm',
    unit: 'mm',
    sizeInMM: 6
  },
  operations: []
};

const mockProbeSequence: ProbeOperation[] = [
  {
    id: 'probe-1',
    axis: 'Z',
    direction: -1,
    distance: 10,
    feedRate: 100,
    backoffDistance: 2,
    wcsOffset: 0,
    preMoves: [],
    postMoves: [
      {
        id: 'move-1',
        type: 'rapid',
        description: 'Move to next position',
        axesValues: { X: 10, Y: 0 },
        positionMode: 'absolute'
      }
    ]
  },
  {
    id: 'probe-2',
    axis: 'X',
    direction: 1,
    distance: 5,
    feedRate: 50,
    backoffDistance: 1,
    wcsOffset: 0,
    preMoves: [],
    postMoves: []
  }
];

describe('SequenceVisualization Component', () => {
  it('renders 3D visualization title and description', () => {
    render(<SequenceVisualization probeSequence={[]} machineSettings={mockMachineSettings} />);
    
    expect(screen.getByText('3D Visualization')).toBeInTheDocument();
    expect(screen.getByText('Interactive 3D view of your machine, stock, and probe sequence')).toBeInTheDocument();
  });

  it('shows 3D visualization component', () => {
    render(<SequenceVisualization probeSequence={[]} machineSettings={mockMachineSettings} />);
    
    expect(screen.getByTestId('mock-3d-visualization')).toBeInTheDocument();
  });

  it('renders tabs for controls and sequence details', () => {
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettings={mockMachineSettings} />);

    expect(screen.getByRole('tab', { name: 'Stock Controls' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sequence Details' })).toBeInTheDocument();
  });

  it('displays stock controls by default', () => {
    render(<SequenceVisualization probeSequence={[]} machineSettings={mockMachineSettings} />);

    // Should show stock controls tab is selected
    expect(screen.getByRole('tab', { name: 'Stock Controls' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Adjust the size and position of the stock/workpiece')).toBeInTheDocument();
  });
  it('displays probe operations details', async () => {
    const user = userEvent.setup();
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettings={mockMachineSettings} />);
    
    // Click on the "Sequence Details" tab
    await user.click(screen.getByText('Sequence Details'));
    
    // Check for probe 1 details
    expect(screen.getByText('Probe Z axis negative direction')).toBeInTheDocument();
    expect(screen.getByText(/Distance: 10mm/)).toBeInTheDocument();
    expect(screen.getByText(/Feed: 100mm/)).toBeInTheDocument();
    expect(screen.getByText(/Backoff: 2mm/)).toBeInTheDocument();
    
    // Check for probe 2 details
    expect(screen.getByText('Probe X axis positive direction')).toBeInTheDocument();
    expect(screen.getByText(/Distance: 5mm/)).toBeInTheDocument();
    expect(screen.getByText(/Feed: 50mm/)).toBeInTheDocument();
    expect(screen.getByText(/Backoff: 1mm/)).toBeInTheDocument();
  });

  it('displays probe operations with correct badges', async () => {
    const user = userEvent.setup();
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettings={mockMachineSettings} />);
    
    // Click on the "Sequence Details" tab
    await user.click(screen.getByText('Sequence Details'));
    
    // Check for sequence number badges
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Check for post-moves badges
    expect(screen.getByText('1 post-moves')).toBeInTheDocument();
    expect(screen.getByText('0 post-moves')).toBeInTheDocument();
  });

  it('displays probe operations with inch units', async () => {
    const user = userEvent.setup();
    const inchMachineSettings = { ...mockMachineSettings, units: 'inch' as const };
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettings={inchMachineSettings} />);
    
    // Click on the "Sequence Details" tab
    await user.click(screen.getByText('Sequence Details'));
    
    // Check for inch units in the display
    expect(screen.getByText(/Distance: 10inch/)).toBeInTheDocument();
    expect(screen.getByText(/Feed: 100inch/)).toBeInTheDocument();
    expect(screen.getByText(/Backoff: 2inch/)).toBeInTheDocument();
  });
  it('renders correctly for single probe operation', async () => {
    const user = userEvent.setup();
    const singleProbe: ProbeOperation[] = [
      {
        id: 'single-probe',
        axis: 'Y',
        direction: 1,
        distance: 15,
        feedRate: 80,
        backoffDistance: 3,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      }
    ];

    render(<SequenceVisualization probeSequence={singleProbe} machineSettings={mockMachineSettings} />);
    
    // Click on the "Sequence Details" tab
    await user.click(screen.getByText('Sequence Details'));
    
    expect(screen.getByText('Probe Y axis positive direction')).toBeInTheDocument();
    expect(screen.getByText(/Distance: 15mm/)).toBeInTheDocument();
    expect(screen.getByText(/Feed: 80mm/)).toBeInTheDocument();
    expect(screen.getByText(/Backoff: 3mm/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Badge for first probe
    expect(screen.getByText('0 post-moves')).toBeInTheDocument();
  });

  it('renders correctly for probe operation with many post-moves', async () => {
    const user = userEvent.setup();
    const probeWithManyMoves: ProbeOperation[] = [
      {
        id: 'probe-many-moves',
        axis: 'Z',
        direction: -1,
        distance: 25,
        feedRate: 120,
        backoffDistance: 5,
        wcsOffset: 0,
        preMoves: [],
        postMoves: [
          {
            id: 'move-1',
            type: 'rapid',
            description: 'Move 1',
            axesValues: { X: 1 },
            positionMode: 'relative'
          },
          {
            id: 'move-2',
            type: 'rapid',
            description: 'Move 2',
            axesValues: { Y: 2 },
            positionMode: 'relative'
          },
          {
            id: 'move-3',
            type: 'dwell',
            description: 'Dwell',
            dwellTime: 1000
          }
        ]
      }
    ];

    render(<SequenceVisualization probeSequence={probeWithManyMoves} machineSettings={mockMachineSettings} />);
    
    // Click on the "Sequence Details" tab
    await user.click(screen.getByText('Sequence Details'));
    
    expect(screen.getByText('Probe Z axis negative direction')).toBeInTheDocument();
    expect(screen.getByText(/Distance: 25mm/)).toBeInTheDocument();
    expect(screen.getByText(/Feed: 120mm/)).toBeInTheDocument();
    expect(screen.getByText(/Backoff: 5mm/)).toBeInTheDocument();
    expect(screen.getByText('3 post-moves')).toBeInTheDocument();
  });

  it('handles both positive and negative directions correctly', async () => {
    const user = userEvent.setup();
    const bothDirections: ProbeOperation[] = [
      {
        id: 'positive-probe',
        axis: 'X',
        direction: 1,
        distance: 10,
        feedRate: 100,
        backoffDistance: 2,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      },
      {
        id: 'negative-probe',
        axis: 'X',
        direction: -1,
        distance: 8,
        feedRate: 90,
        backoffDistance: 1.5,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      }
    ];

    render(<SequenceVisualization probeSequence={bothDirections} machineSettings={mockMachineSettings} />);
    
    // Click on the "Sequence Details" tab
    await user.click(screen.getByText('Sequence Details'));
    
    expect(screen.getByText('Probe X axis positive direction')).toBeInTheDocument();
    expect(screen.getByText('Probe X axis negative direction')).toBeInTheDocument();
  });
  it('renders the main structure with 3D visualization and tabs', () => {
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettings={mockMachineSettings} />);
    
    // Check that the 3D visualization card is present
    expect(screen.getByText('3D Visualization')).toBeInTheDocument();
    expect(screen.getByText('Interactive 3D view of your machine, stock, and probe sequence')).toBeInTheDocument();
    
    // Check that the tabs are present by role
    expect(screen.getByRole('tab', { name: 'Stock Controls' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sequence Details' })).toBeInTheDocument();
  });
});
