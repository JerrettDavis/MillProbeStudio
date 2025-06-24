import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SequenceVisualization from '../SequenceVisualization';
import type { ProbeOperation } from '@/types/machine';

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
  it('renders title and description', () => {
    render(<SequenceVisualization probeSequence={[]} machineSettingsUnits="mm" />);
    
    expect(screen.getByText('Sequence Visualization')).toBeInTheDocument();
    expect(screen.getByText('Visual representation of your probing sequence')).toBeInTheDocument();
  });

  it('shows 3D visualization placeholder', () => {
    render(<SequenceVisualization probeSequence={[]} machineSettingsUnits="mm" />);
    
    expect(screen.getByText('3D visualization coming soon!')).toBeInTheDocument();
    expect(screen.getByText("This will show a 3D representation of your mill's workspace and probe sequence")).toBeInTheDocument();
  });

  it('renders sequence summary section', () => {
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettingsUnits="mm" />);
    
    expect(screen.getByText('Sequence Summary')).toBeInTheDocument();
  });

  it('displays empty state when no probe operations', () => {
    render(<SequenceVisualization probeSequence={[]} machineSettingsUnits="mm" />);
    
    expect(screen.getByText('Sequence Summary')).toBeInTheDocument();
    // Should not have any probe operation cards
    expect(screen.queryByText(/Probe.*axis/)).not.toBeInTheDocument();
  });

  it('displays probe operations with correct information', () => {
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettingsUnits="mm" />);
    
    // First probe operation
    expect(screen.getByText('Probe Z axis negative direction')).toBeInTheDocument();
    expect(screen.getByText('Distance: 10mm, Feed: 100mm/min, Backoff: 2mm')).toBeInTheDocument();
    expect(screen.getByText('1 post-moves')).toBeInTheDocument();

    // Second probe operation
    expect(screen.getByText('Probe X axis positive direction')).toBeInTheDocument();
    expect(screen.getByText('Distance: 5mm, Feed: 50mm/min, Backoff: 1mm')).toBeInTheDocument();
    expect(screen.getByText('0 post-moves')).toBeInTheDocument();
  });

  it('displays probe operations with correct sequence numbers', () => {
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettingsUnits="mm" />);
    
    const badges = screen.getAllByText(/^[12]$/);
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveTextContent('1');
    expect(badges[1]).toHaveTextContent('2');
  });

  it('uses correct units in display', () => {
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettingsUnits="inch" />);
    
    expect(screen.getByText('Distance: 10inch, Feed: 100inch/min, Backoff: 2inch')).toBeInTheDocument();
    expect(screen.getByText('Distance: 5inch, Feed: 50inch/min, Backoff: 1inch')).toBeInTheDocument();
  });

  it('handles probe operation with no post-moves correctly', () => {
    const singleProbe: ProbeOperation[] = [{
      id: 'probe-1',
      axis: 'Y',
      direction: 1,
      distance: 15,
      feedRate: 75,
      backoffDistance: 3,
      wcsOffset: 0,
      preMoves: [],
      postMoves: []
    }];

    render(<SequenceVisualization probeSequence={singleProbe} machineSettingsUnits="mm" />);
    
    expect(screen.getByText('Probe Y axis positive direction')).toBeInTheDocument();
    expect(screen.getByText('0 post-moves')).toBeInTheDocument();
  });

  it('handles probe operation with multiple post-moves correctly', () => {
    const probeWithManyMoves: ProbeOperation[] = [{
      id: 'probe-1',
      axis: 'Z',
      direction: -1,
      distance: 20,
      feedRate: 80,
      backoffDistance: 4,
      wcsOffset: 0,
      preMoves: [],
      postMoves: [
        {
          id: 'move-1',
          type: 'rapid',
          description: 'Move 1',
          axesValues: { X: 5 }
        },
        {
          id: 'move-2',
          type: 'dwell',
          description: 'Dwell 1',
          dwellTime: 1000
        },
        {
          id: 'move-3',
          type: 'rapid',
          description: 'Move 2',
          axesValues: { Y: 10 }
        }
      ]
    }];

    render(<SequenceVisualization probeSequence={probeWithManyMoves} machineSettingsUnits="mm" />);
    
    expect(screen.getByText('3 post-moves')).toBeInTheDocument();
  });

  it('displays correct direction text for positive and negative directions', () => {
    const bothDirections: ProbeOperation[] = [
      {
        id: 'probe-pos',
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
        id: 'probe-neg',
        axis: 'Y',
        direction: -1,
        distance: 10,
        feedRate: 100,
        backoffDistance: 2,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      }
    ];

    render(<SequenceVisualization probeSequence={bothDirections} machineSettingsUnits="mm" />);
    
    expect(screen.getByText('Probe X axis positive direction')).toBeInTheDocument();
    expect(screen.getByText('Probe Y axis negative direction')).toBeInTheDocument();
  });  it('renders proper card structure', () => {
    render(<SequenceVisualization probeSequence={mockProbeSequence} machineSettingsUnits="mm" />);
    
    // Check that probe operations are in bordered containers
    // The text is nested inside a div.flex-1, which is inside a div with classes including 'border'
    const probeText = screen.getByText('Probe Z axis negative direction');
    const flexDiv = probeText.closest('.flex-1');
    expect(flexDiv).toBeInTheDocument();
    
    // Get the parent container which should have the border class
    const borderContainer = flexDiv?.parentElement;
    expect(borderContainer).toHaveClass('border');
    expect(borderContainer).toHaveClass('rounded-lg');
  });
});
