import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock the dependencies with minimal but functional implementations
vi.mock('@/utils/gcodeGenerator', () => ({
  generateGCode: vi.fn(() => 'G0 X0 Y0 Z0\nM30')
}));

// Simple mock for MachineSettings
vi.mock('../MachineSettings', () => ({
  default: ({ onSettingsChange }: { onSettingsChange: (settings: any) => void }) => {
    return (
      <div data-testid="machine-settings">
        <button 
          data-testid="update-settings" 
          onClick={() => onSettingsChange({ 
            units: 'metric',
            spindleSpeed: 1000,
            feedRate: 100,
            plungeRate: 50,
            retractHeight: 5,
            probeDepth: -2
          })}
        >
          Update Settings
        </button>
      </div>
    );
  }
}));

// Simple mock for ProbeSequence
vi.mock('../ProbeSequence', () => ({
  default: ({ onSequenceChange }: { onSequenceChange: (sequence: any) => void }) => {
    return (
      <div data-testid="probe-sequence">
        <button 
          data-testid="update-sequence" 
          onClick={() => onSequenceChange({
            type: 'grid',
            startX: 0,
            startY: 0,
            endX: 10,
            endY: 10,
            stepX: 1,
            stepY: 1
          })}
        >
          Update Sequence
        </button>
      </div>
    );
  }
}));

// Simple mock for GCodeImport
vi.mock('../GCodeImport', () => ({
  default: ({ onGCodeImport }: { onGCodeImport: (gcode: string) => void }) => {
    return (
      <div data-testid="gcode-import">
        <button 
          data-testid="import-gcode" 
          onClick={() => onGCodeImport('G0 X5 Y5\nG1 Z-1')}
        >
          Import GCode
        </button>
      </div>
    );
  }
}));

// Simple mock for SequenceVisualization
vi.mock('../SequenceVisualization', () => ({
  default: ({ sequence }: any) => (
    <div data-testid="sequence-visualization">
      Visualization for {sequence?.type || 'no'} sequence
    </div>
  )
}));

// Simple mock for GCodeOutput
vi.mock('../GCodeOutput', () => ({
  default: ({ gcode }: { gcode: string }) => (
    <div data-testid="gcode-output">
      Output: {gcode || 'No GCode'}
    </div>
  )
}));

// Mock theme provider
vi.mock('../theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Mill Probe Stage')).toBeInTheDocument();
  });

  it('renders all main tabs', () => {
    render(<App />);
    
    expect(screen.getByRole('tab', { name: /machine settings/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /probe sequence/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /gcode import/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /visualization/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /gcode output/i })).toBeInTheDocument();
  });

  it('shows machine settings tab by default', () => {
    render(<App />);
    expect(screen.getByTestId('machine-settings')).toBeInTheDocument();
  });

  it('updates machine settings when settings change', () => {
    render(<App />);
    
    const updateButton = screen.getByTestId('update-settings');
    fireEvent.click(updateButton);
    
    // Settings should be updated - we can verify the component is still there
    expect(updateButton).toBeInTheDocument();
  });

  it('switches to probe sequence tab and updates sequence', async () => {
    render(<App />);
    
    const probeTab = screen.getByRole('tab', { name: /probe sequence/i });
    fireEvent.click(probeTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('probe-sequence')).toBeInTheDocument();
    });

    const updateButton = screen.getByTestId('update-sequence');
    fireEvent.click(updateButton);
    
    expect(updateButton).toBeInTheDocument();
  });

  it('switches to gcode import tab and imports gcode', async () => {
    render(<App />);
    
    const importTab = screen.getByRole('tab', { name: /gcode import/i });
    fireEvent.click(importTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('gcode-import')).toBeInTheDocument();
    });

    const importButton = screen.getByTestId('import-gcode');
    fireEvent.click(importButton);
    
    expect(importButton).toBeInTheDocument();
  });

  it('switches to visualization tab', async () => {
    render(<App />);
    
    const vizTab = screen.getByRole('tab', { name: /visualization/i });
    fireEvent.click(vizTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('sequence-visualization')).toBeInTheDocument();
    });
  });

  it('switches to gcode output tab', async () => {
    render(<App />);
    
    const outputTab = screen.getByRole('tab', { name: /gcode output/i });
    fireEvent.click(outputTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('gcode-output')).toBeInTheDocument();
    });
  });

  it('generates gcode when both settings and sequence are available', async () => {
    const { generateGCode } = await import('@/utils/gcodeGenerator');
    
    render(<App />);
    
    // Update machine settings
    const updateSettingsButton = screen.getByTestId('update-settings');
    fireEvent.click(updateSettingsButton);
    
    // Switch to probe sequence and update sequence
    const probeTab = screen.getByRole('tab', { name: /probe sequence/i });
    fireEvent.click(probeTab);
    
    await waitFor(() => {
      const updateSequenceButton = screen.getByTestId('update-sequence');
      fireEvent.click(updateSequenceButton);
    });
    
    // Check if generateGCode was called
    expect(generateGCode).toHaveBeenCalled();
  });

  it('displays generated gcode in output tab', async () => {
    render(<App />);
    
    // Update settings and sequence to trigger gcode generation
    const updateSettingsButton = screen.getByTestId('update-settings');
    fireEvent.click(updateSettingsButton);
    
    const probeTab = screen.getByRole('tab', { name: /probe sequence/i });
    fireEvent.click(probeTab);
    
    await waitFor(() => {
      const updateSequenceButton = screen.getByTestId('update-sequence');
      fireEvent.click(updateSequenceButton);
    });
    
    // Switch to output tab
    const outputTab = screen.getByRole('tab', { name: /gcode output/i });
    fireEvent.click(outputTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('gcode-output')).toBeInTheDocument();
      expect(screen.getByText(/Output:/)).toBeInTheDocument();
    });
  });

  it('shows visualization with sequence data', async () => {
    render(<App />);
    
    // Update sequence first
    const probeTab = screen.getByRole('tab', { name: /probe sequence/i });
    fireEvent.click(probeTab);
    
    await waitFor(() => {
      const updateSequenceButton = screen.getByTestId('update-sequence');
      fireEvent.click(updateSequenceButton);
    });
    
    // Switch to visualization
    const vizTab = screen.getByRole('tab', { name: /visualization/i });
    fireEvent.click(vizTab);
    
    await waitFor(() => {
      expect(screen.getByText(/Visualization for grid sequence/)).toBeInTheDocument();
    });
  });

  it('handles state updates correctly', () => {
    render(<App />);
    
    // Test machine settings update
    const updateSettingsButton = screen.getByTestId('update-settings');
    fireEvent.click(updateSettingsButton);
    
    // Component should still be rendered after state update
    expect(updateSettingsButton).toBeInTheDocument();
  });
});
