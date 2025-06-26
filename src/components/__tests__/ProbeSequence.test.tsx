import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import ProbeSequenceEditor from '../ProbeSequence';
import type { ProbeSequenceSettings } from '@/types/machine';
import { createMockMachineSettings } from '@/test/mockMachineSettings';

describe('ProbeSequenceEditor Component', () => {
  const mockMachineSettings = createMockMachineSettings();
  const mockSetMachineSettings = vi.fn();
  const mockUpdateAxisConfig = vi.fn();
  const baseProbe = {
    id: 'probe-1',
    axis: 'X' as const,
    direction: 1 as const,
    distance: 10,
    feedRate: 100,
    backoffDistance: 2,
    wcsOffset: 0.25,
    preMoves: [],
    postMoves: [],
  };

  const baseProbeSequenceSettings: ProbeSequenceSettings = {
    initialPosition: { X: -78, Y: -100, Z: -41 },
    dwellsBeforeProbe: 15,
    spindleSpeed: 5000,
    units: 'mm',
    endmillSize: { input: '1/8', unit: 'fraction', sizeInMM: 3.175 },
    operations: []
  };

  const machineAxes = {
    X: { positiveDirection: 'Right', negativeDirection: 'Left' },
    Y: { positiveDirection: 'Forward', negativeDirection: 'Back' },
    Z: { positiveDirection: 'Up', negativeDirection: 'Down' },
  };
  it('should render with initial data and allow WCS Offset editing', async () => {
    const onProbeSequenceChangeMock = vi.fn();
    
    render(
      <ProbeSequenceEditor
        initialData={{
          probeSequence: [{ ...baseProbe }],
          probeSequenceSettings: baseProbeSequenceSettings
        }}
        machineSettingsUnits="mm"
        machineAxes={machineAxes}
        machineSettings={mockMachineSettings}
        setMachineSettings={mockSetMachineSettings}
        updateAxisConfig={mockUpdateAxisConfig}
        onProbeSequenceChange={onProbeSequenceChangeMock}
        onProbeSequenceSettingsChange={vi.fn()}
      />
    );

    // Find the WCS Offset input
    const wcsInput = screen.getByLabelText(/WCS Offset/i);
    expect(wcsInput).toBeInTheDocument();
    // The value should be the actual probe's wcsOffset, which is 0.25
    expect(wcsInput).toHaveValue(0.25);

    // Clear the input and type a new value
    await userEvent.clear(wcsInput);
    await userEvent.type(wcsInput, '1.5');
    
    expect(wcsInput).toHaveValue(1.5);
  });

  it('should allow adding probe operations', async () => {
    const onProbeSequenceChangeMock = vi.fn();
    
    render(
      <ProbeSequenceEditor
        initialData={{
          probeSequence: [],
          probeSequenceSettings: baseProbeSequenceSettings
        }}
        machineSettingsUnits="mm"
        machineAxes={machineAxes}
        machineSettings={mockMachineSettings}
        setMachineSettings={mockSetMachineSettings}
        updateAxisConfig={mockUpdateAxisConfig}
        onProbeSequenceChange={onProbeSequenceChangeMock}
        onProbeSequenceSettingsChange={vi.fn()}
      />
    );

    // Initially no probe operations should exist
    expect(screen.queryByLabelText(/WCS Offset/i)).not.toBeInTheDocument();

    // Add a probe operation
    const addButton = screen.getByText('Add Probe Operation');
    await userEvent.click(addButton);

    // Now WCS Offset input should be available
    expect(screen.getByLabelText(/WCS Offset/i)).toBeInTheDocument();
  });  it('should manage initial position settings', async () => {
    const onProbeSequenceSettingsChangeMock = vi.fn();
    
    render(
      <ProbeSequenceEditor
        initialData={{
          probeSequence: [],
          probeSequenceSettings: baseProbeSequenceSettings
        }}
        machineSettingsUnits="mm"
        machineAxes={machineAxes}
        machineSettings={mockMachineSettings}
        setMachineSettings={mockSetMachineSettings}
        updateAxisConfig={mockUpdateAxisConfig}
        onProbeSequenceChange={vi.fn()}
        onProbeSequenceSettingsChange={onProbeSequenceSettingsChangeMock}
      />
    );

    // Find X position input using a more specific selector
    const xPositionInput = screen.getByDisplayValue('-78');
    expect(xPositionInput).toHaveValue(-78);

    // Change the X position to a positive number first to test basic functionality
    await userEvent.clear(xPositionInput);
    await userEvent.type(xPositionInput, '50');
    
    expect(xPositionInput).toHaveValue(50);
  });
  it('should manage spindle and dwell settings', async () => {
    const onProbeSequenceSettingsChangeMock = vi.fn();
    
    render(
      <ProbeSequenceEditor
        initialData={{
          probeSequence: [],
          probeSequenceSettings: baseProbeSequenceSettings
        }}
        machineSettingsUnits="mm"
        machineAxes={machineAxes}
        machineSettings={mockMachineSettings}
        setMachineSettings={mockSetMachineSettings}
        updateAxisConfig={mockUpdateAxisConfig}
        onProbeSequenceChange={vi.fn()}
        onProbeSequenceSettingsChange={onProbeSequenceSettingsChangeMock}
      />
    );

    // Find spindle speed input by value
    const spindleInput = screen.getByDisplayValue('5000');
    expect(spindleInput).toHaveValue(5000);

    // Find dwells input by value
    const dwellsInput = screen.getByDisplayValue('15');
    expect(dwellsInput).toHaveValue(15);

    // Change spindle speed
    await userEvent.clear(spindleInput);
    await userEvent.type(spindleInput, '3000');
    
    expect(spindleInput).toHaveValue(3000);

    // Change dwells
    await userEvent.clear(dwellsInput);
    await userEvent.type(dwellsInput, '10');
    
    expect(dwellsInput).toHaveValue(10);
  });
});