import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GCodeImport from '../GCodeImport';
import { parseGCode } from '@/utils/gcodeParser';
import { createMockMachineSettings } from '@/test/mockMachineSettings';

// Mock the gcode parser
vi.mock('@/utils/gcodeParser', () => ({
  parseGCode: vi.fn()
}));

const mockMachineSettings = createMockMachineSettings();

const mockParseResult = {
  probeSequence: [
    {
      id: 'probe-1',
      axis: 'Z' as const,
      direction: -1 as const,
      distance: 10,
      feedRate: 100,
      backoffDistance: 2,
      wcsOffset: 0,
      preMoves: [],
      postMoves: []
    }
  ],
  initialPosition: { X: 0, Y: 0, Z: 0 },
  dwellsBeforeProbe: 15,
  spindleSpeed: 5000,
  units: 'mm' as const,
  errors: []
};

describe('GCodeImport Component', () => {
  const mockOnImport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with collapsed state by default', () => {
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    expect(screen.getByText('Import from G-Code')).toBeInTheDocument();
    expect(screen.getByText('Parse existing G-code to automatically configure probe sequences')).toBeInTheDocument();
    expect(screen.getByText('Show G-Code Import')).toBeInTheDocument();
    expect(screen.queryByLabelText('G-Code Input')).not.toBeInTheDocument();
  });

  it('expands and shows input area when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    const toggleButton = screen.getByText('Show G-Code Import');
    await user.click(toggleButton);
    
    expect(screen.getByText('Hide G-Code Import')).toBeInTheDocument();
    expect(screen.getByLabelText('G-Code Input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your G-code here...')).toBeInTheDocument();
  });

  it('collapses when toggle button is clicked again', async () => {
    const user = userEvent.setup();
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    // Expand first
    await user.click(screen.getByText('Show G-Code Import'));
    expect(screen.getByLabelText('G-Code Input')).toBeInTheDocument();
    
    // Then collapse
    await user.click(screen.getByText('Hide G-Code Import'));
    expect(screen.queryByLabelText('G-Code Input')).not.toBeInTheDocument();
  });

  it('allows typing in the textarea', async () => {
    const user = userEvent.setup();
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    
    await user.type(textarea, 'G0 X10 Y10');
    expect(textarea).toHaveValue('G0 X10 Y10');
  });

  it('disables parse button when input is empty', async () => {
    const user = userEvent.setup();
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const parseButton = screen.getByText('Parse G-Code');
    
    expect(parseButton).toBeDisabled();
  });

  it('enables parse button when input has content', async () => {
    const user = userEvent.setup();
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'G0 X10 Y10');
    expect(parseButton).toBeEnabled();
  });

  it('calls parseGCode when parse button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(parseGCode).mockReturnValue(mockParseResult);
    
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'G38.2 Z-10 F100');
    await user.click(parseButton);
    
    expect(parseGCode).toHaveBeenCalledWith('G38.2 Z-10 F100');
  });

  it('displays parse results after successful parsing', async () => {
    const user = userEvent.setup();
    vi.mocked(parseGCode).mockReturnValue(mockParseResult);
    
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'G38.2 Z-10 F100');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Parse Results')).toBeInTheDocument();
      expect(screen.getByText('1 operations')).toBeInTheDocument();
      expect(screen.getByText('5000 RPM')).toBeInTheDocument();
      expect(screen.getByText('Millimeters')).toBeInTheDocument();
    });
  });

  it('displays probe operations details', async () => {
    const user = userEvent.setup();
    vi.mocked(parseGCode).mockReturnValue(mockParseResult);
    
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'G38.2 Z-10 F100');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Operation 1: Z Axis')).toBeInTheDocument();
      expect(screen.getByText(/Direction: -, Distance: 10mm, Feed: 100mm\/min/)).toBeInTheDocument();
    });
  });

  it('displays errors when parsing fails', async () => {
    const user = userEvent.setup();
    const parseResultWithErrors = {
      ...mockParseResult,
      probeSequence: [],
      errors: ['Invalid G-code command', 'Missing feed rate']
    };
    vi.mocked(parseGCode).mockReturnValue(parseResultWithErrors);
    
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'INVALID');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Parsing Errors (2):')).toBeInTheDocument();
      expect(screen.getByText('Invalid G-code command')).toBeInTheDocument();
      expect(screen.getByText('Missing feed rate')).toBeInTheDocument();
    });
  });

  it('calls onImport when import button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(parseGCode).mockReturnValue(mockParseResult);
    
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'G38.2 Z-10 F100');
    await user.click(parseButton);
    
    await waitFor(() => {
      const importButton = screen.getByText('Import 1 Probe Operation(s)');
      expect(importButton).toBeInTheDocument();
    });
    
    const importButton = screen.getByText('Import 1 Probe Operation(s)');
    await user.click(importButton);
    
    expect(mockOnImport).toHaveBeenCalledWith(mockParseResult);
  });

  it('clears input and results after successful import', async () => {
    const user = userEvent.setup();
    vi.mocked(parseGCode).mockReturnValue(mockParseResult);
    
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'G38.2 Z-10 F100');
    await user.click(parseButton);
      await waitFor(() => {
      const importButton = screen.getByText('Import 1 Probe Operation(s)');
      expect(importButton).toBeInTheDocument();
    });
    
    const importButton = screen.getByText('Import 1 Probe Operation(s)');
    await user.click(importButton);
    
    // Wait for the component to collapse first (which means the import was successful)
    await waitFor(() => {
      expect(screen.queryByText('Parse Results')).not.toBeInTheDocument();
      expect(screen.getByText('Show G-Code Import')).toBeInTheDocument(); // Should be collapsed
    });
    
    // If we expand it again, the textarea should be empty
    await user.click(screen.getByText('Show G-Code Import'));
    const newTextarea = screen.getByLabelText('G-Code Input');
    expect(newTextarea).toHaveValue('');
  });

  it('clears input and results when clear button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(parseGCode).mockReturnValue(mockParseResult);
    
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'G38.2 Z-10 F100');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Parse Results')).toBeInTheDocument();
    });
    
    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);
    
    expect(textarea).toHaveValue('');
    expect(screen.queryByText('Parse Results')).not.toBeInTheDocument();
  });

  it('disables import button when no probe operations found', async () => {
    const user = userEvent.setup();
    const emptyParseResult = {
      ...mockParseResult,
      probeSequence: []
    };
    vi.mocked(parseGCode).mockReturnValue(emptyParseResult);
    
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'G0 X10 Y10');
    await user.click(parseButton);
    
    await waitFor(() => {
      const importButton = screen.getByText('Import 0 Probe Operation(s)');
      expect(importButton).toBeDisabled();
      expect(screen.getByText('No valid probe operations found in the G-code')).toBeInTheDocument();
    });
  });
  it('handles parse results without optional fields', async () => {
    const user = userEvent.setup();
    const minimalParseResult = {
      probeSequence: [{
        id: 'probe-1',
        axis: 'Z' as const,
        direction: -1 as const,
        distance: 10,
        feedRate: 100,
        backoffDistance: 2,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      }],
      errors: []
    };
    vi.mocked(parseGCode).mockReturnValue(minimalParseResult);
    
    render(<GCodeImport onImport={mockOnImport} machineSettings={mockMachineSettings} />);
    
    await user.click(screen.getByText('Show G-Code Import'));
    const textarea = screen.getByLabelText('G-Code Input');
    const parseButton = screen.getByText('Parse G-Code');
    
    await user.type(textarea, 'G38.2 Z-10 F100');
    await user.click(parseButton);
    
    await waitFor(() => {
      expect(screen.getByText('Parse Results')).toBeInTheDocument();
      expect(screen.getByText('1 operations')).toBeInTheDocument();
      // Should not show spindle speed or units badges
      expect(screen.queryByText(/RPM/)).not.toBeInTheDocument();
      expect(screen.queryByText('Millimeters')).not.toBeInTheDocument();
    });
  });
});
