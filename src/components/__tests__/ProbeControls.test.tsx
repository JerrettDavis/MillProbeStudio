import { createMockMachineSettings } from '@/test/mockMachineSettings';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ProbeControls from '../ProbeControls';

describe('ProbeControls', () => {
  const machineSettings = createMockMachineSettings({ machineOrientation: 'vertical' });

  const defaultPosition = { X: 10, Y: 20, Z: 30 };
  it('renders position inputs and updates values', () => {
    const onProbePositionChange = vi.fn();
    const { getByLabelText } = render(
      <ProbeControls
        probePosition={defaultPosition}
        onProbePositionChange={onProbePositionChange}
        units="mm"
        machineSettings={machineSettings}
      />
    );
    const xInput = getByLabelText(/X Position/i) as HTMLInputElement;
    fireEvent.change(xInput, { target: { value: '50' } });
    expect(onProbePositionChange).toHaveBeenCalledWith({ ...defaultPosition, X: 50 });
  });

  it('clamps input values to axis min/max', () => {
    const onProbePositionChange = vi.fn();
    const { getByLabelText } = render(
      <ProbeControls
        probePosition={defaultPosition}
        onProbePositionChange={onProbePositionChange}
        units="mm"
        machineSettings={machineSettings}
      />
    );
    const xInput = getByLabelText(/X Position/i) as HTMLInputElement;
    fireEvent.change(xInput, { target: { value: '-100' } });
    expect(onProbePositionChange).toHaveBeenCalledWith({ ...defaultPosition, X: -100 });
    fireEvent.change(xInput, { target: { value: '200' } });
    expect(onProbePositionChange).toHaveBeenCalledWith({ ...defaultPosition, X: 100 });
  });

  it('calls onProbePositionChange with preset positions', () => {
    const onProbePositionChange = vi.fn();
    const { getByText } = render(
      <ProbeControls
        probePosition={defaultPosition}
        onProbePositionChange={onProbePositionChange}
        units="mm"
        machineSettings={machineSettings}
      />
    );
    fireEvent.click(getByText(/Center in Workspace/i));
    expect(onProbePositionChange).toHaveBeenCalledWith({ X: 0, Y: 0, Z: 0 });
    fireEvent.click(getByText(/Reset to Origin/i));
    expect(onProbePositionChange).toHaveBeenCalledWith({ X: 0, Y: 0, Z: 0 });
  });

  it('ignores non-numeric input and clamps to fallback', () => {
    const onProbePositionChange = vi.fn();
    const { getByLabelText } = render(
      <ProbeControls
        probePosition={defaultPosition}
        onProbePositionChange={onProbePositionChange}
        units="mm"
        machineSettings={machineSettings}
      />
    );
    const xInput = getByLabelText(/X Position/i) as HTMLInputElement;
    fireEvent.change(xInput, { target: { value: 'abc' } });
    // Should fallback to 0 (parseFloat fallback), which is within min/max
    expect(onProbePositionChange).toHaveBeenCalledWith({ ...defaultPosition, X: 0 });
  });

  it('calls onProbePositionChange for all preset buttons', () => {
    const onProbePositionChange = vi.fn();
    const { getByText } = render(
      <ProbeControls
        probePosition={defaultPosition}
        onProbePositionChange={onProbePositionChange}
        units="mm"
        machineSettings={machineSettings}
      />
    );
    [
      /Safe Position/i,
      /Near Corner/i,
      /Above Stock/i
    ].forEach((regex) => {
      fireEvent.click(getByText(regex));
    });
    // Should be called for each preset
    expect(onProbePositionChange).toHaveBeenCalledTimes(3);
  });

  it('renders help text and current position display', () => {
    const { getByText } = render(
      <ProbeControls
        probePosition={defaultPosition}
        onProbePositionChange={vi.fn()}
        units="mm"
        machineSettings={machineSettings}
      />
    );
    expect(getByText(/Current Probe Position/i)).toBeInTheDocument();
    expect(getByText(/The probe position determines/i)).toBeInTheDocument();
  });

  it('renders correctly for horizontal orientation and covers all help text branches', () => {
    const horizontalSettings = createMockMachineSettings({ machineOrientation: 'horizontal' });
    const onProbePositionChange = vi.fn();
    const { getByLabelText, getByText } = render(
      <ProbeControls
        probePosition={defaultPosition}
        onProbePositionChange={onProbePositionChange}
        units="mm"
        machineSettings={horizontalSettings}
      />
    );
    // X label should be 'Stage Position' for horizontal
    expect(getByLabelText(/Stage Position/i)).toBeInTheDocument();
    // Help text for horizontal X
    expect(getByText(/Stage moves from/)).toBeInTheDocument();
    // Help text for Y/Z
    expect(getByText(/Y and Z positions control/)).toBeInTheDocument();
    expect(getByText(/The spindle itself is fixed in X/)).toBeInTheDocument();
    // Test preset button for 'Above Stock' (stockTop)
    fireEvent.click(getByText(/Above Stock/i));
    expect(onProbePositionChange).toHaveBeenCalled();
  });

  it('clamps input for horizontal orientation and covers edge cases', () => {
    const horizontalSettings = createMockMachineSettings({ machineOrientation: 'horizontal' });
    const onProbePositionChange = vi.fn();
    const { getByLabelText } = render(
      <ProbeControls
        probePosition={defaultPosition}
        onProbePositionChange={onProbePositionChange}
        units="mm"
        machineSettings={horizontalSettings}
      />
    );
    const xInput = getByLabelText(/Stage Position/i) as HTMLInputElement;
    // Value below min
    fireEvent.change(xInput, { target: { value: '-200' } });
    expect(onProbePositionChange).toHaveBeenCalledWith({ ...defaultPosition, X: -100 });
    // Value above max
    fireEvent.change(xInput, { target: { value: '200' } });
    expect(onProbePositionChange).toHaveBeenCalledWith({ ...defaultPosition, X: 100 });
  });
});
