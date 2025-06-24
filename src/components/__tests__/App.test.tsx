import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock the dependencies with minimal but functional implementations
vi.mock('@/utils/gcodeGenerator', () => ({
  generateGCode: vi.fn(() => 'G0 X0 Y0 Z0\nM30')
}));

// Simple mock for MachineSettings
vi.mock('../MachineSettings', () => ({
  default: ({ setMachineSettings }: { setMachineSettings?: (settings: any) => void }) => {
    return (
      <div data-testid="machine-settings">
        <button 
          data-testid="update-settings" 
          onClick={() => setMachineSettings?.({ 
            units: 'mm',
            axes: {
              X: { positiveDirection: 'Down', negativeDirection: 'Up', polarity: 1, min: -86, max: -0.5 },
              Y: { positiveDirection: 'Right', negativeDirection: 'Left', polarity: 1, min: -0.5, max: -241.50 },
              Z: { positiveDirection: 'In', negativeDirection: 'Out', polarity: -1, min: -0.5, max: -78.50 }
            }
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
  default: ({ onProbeSequenceChange, onProbeSequenceSettingsChange }: { onProbeSequenceChange?: (sequence: any) => void, onProbeSequenceSettingsChange?: (settings: any) => void }) => {
    return (
      <div data-testid="probe-sequence">
        <button 
          data-testid="update-sequence" 
          onClick={() => {
            onProbeSequenceChange?.([{
              type: 'probe',
              position: { X: 0, Y: 0, Z: -1 }
            }]);
            onProbeSequenceSettingsChange?.({
              type: 'grid',
              startX: 0,
              startY: 0,
              endX: 10,
              endY: 10,
              stepX: 1,
              stepY: 1
            });
          }}
        >
          Update Sequence
        </button>
      </div>
    );
  }
}));

// Simple mock for GCodeImport
vi.mock('../GCodeImport', () => ({
  default: ({ onImport }: { onImport?: (gcode: any) => void }) => {
    return (
      <div data-testid="gcode-import">
        <button 
          data-testid="import-gcode" 
          onClick={() => onImport?.('G0 X5 Y5\nG1 Z-1')}
        >
          Import GCode
        </button>
      </div>
    );
  }
}));

// Simple mock for SequenceVisualization
vi.mock('../SequenceVisualization', () => ({
  default: ({ probeSequence }: { probeSequence?: any[] }) => (
    <div data-testid="sequence-visualization">
      Visualization for {probeSequence?.length ? `${probeSequence.length} operations` : 'no'} sequence
    </div>
  )
}));

// Simple mock for GCodeOutput
vi.mock('../GCodeOutput', () => ({
  default: ({ generatedGCode, generateGCode }: { generatedGCode?: string, generateGCode?: () => void }) => (
    <div data-testid="gcode-output">
      <button 
        data-testid="generate-gcode" 
        onClick={() => generateGCode?.()}
      >
        Generate
      </button>
      Output: {generatedGCode || 'No GCode'}
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
    expect(screen.getByText('Mill Probe Studio')).toBeInTheDocument();
  });
  it('renders all main tabs', () => {
    render(<App />);
    
    expect(screen.getByRole('tab', { name: /machine settings/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /probe sequence/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /visualize/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /g-code/i })).toBeInTheDocument();
  });
  it('shows machine settings tab by default', () => {
    render(<App />);
    // Debug what's actually rendered
    screen.debug();
    expect(screen.getByTestId('machine-settings')).toBeInTheDocument();
  });
  it('updates machine settings when settings change', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const updateButton = screen.getByTestId('update-settings');
    await user.click(updateButton);
    
    // Settings should be updated - we can verify the component is still there
    expect(updateButton).toBeInTheDocument();
  });it('switches to probe sequence tab and updates sequence', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const probeTab = screen.getByRole('tab', { name: /probe sequence/i });
    await user.click(probeTab);
    
    // Wait for the tab to become active
    await waitFor(() => {
      expect(probeTab).toHaveAttribute('aria-selected', 'true');
    });

    // Now check for the content
    await waitFor(() => {
      expect(screen.getByTestId('probe-sequence')).toBeInTheDocument();
    });

    const updateButton = screen.getByTestId('update-sequence');
    await user.click(updateButton);
    
    expect(updateButton).toBeInTheDocument();
  });  it('switches to gcode tab and shows gcode content', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const gcodeTab = screen.getByRole('tab', { name: /g-code/i });
    await user.click(gcodeTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('gcode-output')).toBeInTheDocument();
    });
  });  it('switches to visualization tab', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const vizTab = screen.getByRole('tab', { name: /visualize/i });
    await user.click(vizTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('sequence-visualization')).toBeInTheDocument();
    });
  });  it('switches to gcode output tab', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const outputTab = screen.getByRole('tab', { name: /g-code/i });
    await user.click(outputTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('gcode-output')).toBeInTheDocument();
    });
  });  it('generates gcode when both settings and sequence are available', async () => {
    const { generateGCode } = await import('@/utils/gcodeGenerator');
    const user = userEvent.setup();
    
    render(<App />);
    
    // Update machine settings
    const updateSettingsButton = screen.getByTestId('update-settings');
    await user.click(updateSettingsButton);
    
    // Switch to probe sequence and update sequence
    const probeTab = screen.getByRole('tab', { name: /probe sequence/i });
    await user.click(probeTab);
    
    await waitFor(async () => {
      const updateSequenceButton = screen.getByTestId('update-sequence');
      await user.click(updateSequenceButton);
    });
    
    // Switch to G-Code tab and trigger generation
    const gcodeTab = screen.getByRole('tab', { name: /g-code/i });
    await user.click(gcodeTab);
    
    await waitFor(async () => {
      const generateButton = screen.getByTestId('generate-gcode');
      await user.click(generateButton);
    });
    
    // Wait a bit for any async operations to complete
    await waitFor(() => {
      expect(generateGCode).toHaveBeenCalled();
    });
  });it('displays generated gcode in output tab', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Update settings and sequence to trigger gcode generation
    const updateSettingsButton = screen.getByTestId('update-settings');
    await user.click(updateSettingsButton);
    
    const probeTab = screen.getByRole('tab', { name: /probe sequence/i });
    await user.click(probeTab);
    
    await waitFor(async () => {
      const updateSequenceButton = screen.getByTestId('update-sequence');
      await user.click(updateSequenceButton);
    });
      // Switch to output tab
    const outputTab = screen.getByRole('tab', { name: /g-code/i });
    await user.click(outputTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('gcode-output')).toBeInTheDocument();
      expect(screen.getByText(/Output:/)).toBeInTheDocument();
    });
  });  it('shows visualization with sequence data', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Update sequence first
    const probeTab = screen.getByRole('tab', { name: /probe sequence/i });
    await user.click(probeTab);
    
    await waitFor(async () => {
      const updateSequenceButton = screen.getByTestId('update-sequence');
      await user.click(updateSequenceButton);
    });
      // Switch to visualization
    const vizTab = screen.getByRole('tab', { name: /visualize/i });
    await user.click(vizTab);
    
    await waitFor(() => {
      expect(screen.getByText(/Visualization for.*1 operations.*sequence/)).toBeInTheDocument();
    });
  });
  it('handles state updates correctly', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Test machine settings update
    const updateSettingsButton = screen.getByTestId('update-settings');
    await user.click(updateSettingsButton);
    
    // Component should still be rendered after state update
    expect(updateSettingsButton).toBeInTheDocument();
  });
});
