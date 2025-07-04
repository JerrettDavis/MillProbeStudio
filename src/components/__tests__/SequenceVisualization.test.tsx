import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SequenceVisualization from '../SequenceVisualization';
import type { ProbeOperation } from '@/types/machine';
import { createMockMachineSettings } from '@/test/mockMachineSettings';

// Mock the 3D visualization component to avoid Three.js in tests
vi.mock('../Machine3DVisualization', () => ({
  default: () => <div data-testid="mock-3d-visualization">3D Visualization Mock</div>
}));

const mockMachineSettings = createMockMachineSettings();
const mockSetMachineSettings = vi.fn();
const mockUpdateAxisConfig = vi.fn();

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
    render(<SequenceVisualization 
      probeSequence={[]} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);
    
    expect(screen.getByText('3D Visualization')).toBeInTheDocument();
    expect(screen.getByText('Interactive 3D view of your machine, stock, and probe sequence')).toBeInTheDocument();
  });

  it('shows 3D visualization component', () => {
    render(<SequenceVisualization 
      probeSequence={[]} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);
    
    expect(screen.getByTestId('mock-3d-visualization')).toBeInTheDocument();
  });

  it('renders drawer buttons for controls and sequence details', () => {
    render(<SequenceVisualization 
      probeSequence={mockProbeSequence} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);

    expect(screen.getByRole('button', { name: /Stock Controls/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Probe Position/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sequence Details/ })).toBeInTheDocument();
  });

  it('opens stock controls drawer when button is clicked', async () => {
    const user = userEvent.setup();
    render(<SequenceVisualization 
      probeSequence={[]} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);

    // Click the Stock Controls button
    await user.click(screen.getByRole('button', { name: /Stock Controls/ }));
    
    // Should show stock controls drawer content - look for drawer-specific content
    expect(screen.getByRole('heading', { name: /Stock Controls/ })).toBeInTheDocument();
  });
  it('displays probe operations details when drawer is opened', async () => {
    const user = userEvent.setup();
    render(<SequenceVisualization 
      probeSequence={mockProbeSequence} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);
    
    // Click on the "Sequence Details" button to open drawer
    await user.click(screen.getByRole('button', { name: /Sequence Details/ }));
    
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
    render(<SequenceVisualization 
      probeSequence={mockProbeSequence} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);
    
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
    render(<SequenceVisualization 
      probeSequence={mockProbeSequence} 
      machineSettings={inchMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);
    
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

    render(<SequenceVisualization 
      probeSequence={singleProbe} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);
    
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

    render(<SequenceVisualization 
      probeSequence={probeWithManyMoves} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);
    
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

    render(<SequenceVisualization 
      probeSequence={bothDirections} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);
    
    // Click on the "Sequence Details" tab
    await user.click(screen.getByText('Sequence Details'));
    
    expect(screen.getByText('Probe X axis positive direction')).toBeInTheDocument();
    expect(screen.getByText('Probe X axis negative direction')).toBeInTheDocument();
  });
  it('renders the main structure with 3D visualization and drawer buttons', () => {
    render(<SequenceVisualization 
      probeSequence={mockProbeSequence} 
      machineSettings={mockMachineSettings} 
      setMachineSettings={mockSetMachineSettings}
      updateAxisConfig={mockUpdateAxisConfig}
    />);
    
    // Check that the 3D visualization card is present
    expect(screen.getByText('3D Visualization')).toBeInTheDocument();
    expect(screen.getByText('Interactive 3D view of your machine, stock, and probe sequence')).toBeInTheDocument();
    
    // Check that the drawer buttons are present
    expect(screen.getByRole('button', { name: /Stock Controls/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sequence Details/ })).toBeInTheDocument();
  });
});