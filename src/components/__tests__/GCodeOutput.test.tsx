import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GCodeOutput from '../GCodeOutput';

// Get the mock from setupTests
const mockWriteText = (global as any).mockClipboardWriteText;

// Mock URL.createObjectURL and related functions
Object.assign(global, {
  URL: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  }
});

// Mock document.createElement and related DOM methods
const mockAnchor = {
  href: '',
  download: '',
  click: vi.fn(),
  remove: vi.fn()
};

describe('GCodeOutput Component', () => {
  const mockGenerateGCode = vi.fn();
  let container: HTMLElement;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset clipboard mock
    mockWriteText.mockReset();
    
    // Create a proper container
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Mock the original createElement function
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockAnchor as any;
      }
      return originalCreateElement(tagName);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
  });

  afterEach(() => {
    cleanup();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it('renders with empty state', () => {
    render(<GCodeOutput generatedGCode="" generateGCode={mockGenerateGCode} />, { container });
    
    expect(screen.getByText('Generated G-Code')).toBeInTheDocument();
    expect(screen.getByText('Review and export your probing sequence G-code')).toBeInTheDocument();
    expect(screen.getByText('Generate G-Code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Click 'Generate G-Code' to create your probing sequence...")).toBeInTheDocument();
  });

  it('calls generateGCode when generate button is clicked', async () => {
    const user = userEvent.setup();
    render(<GCodeOutput generatedGCode="" generateGCode={mockGenerateGCode} />, { container });
    
    const generateButton = screen.getByText('Generate G-Code');
    await user.click(generateButton);
    
    expect(mockGenerateGCode).toHaveBeenCalledTimes(1);
  });
  it('displays generated G-code in textarea', () => {
    const sampleGCode = 'G90\\nG0 X0 Y0 Z0\\nG38.2 Z-10 F100\\nM30';
    render(<GCodeOutput generatedGCode={sampleGCode} generateGCode={mockGenerateGCode} />, { container });
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(sampleGCode);
  });
  it('shows export buttons when G-code is present', () => {
    const sampleGCode = 'G90\\nG0 X0 Y0 Z0\\nG38.2 Z-10 F100\\nM30';
    render(<GCodeOutput generatedGCode={sampleGCode} generateGCode={mockGenerateGCode} />, { container });
    
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Download G-Code')).toBeInTheDocument();
  });
  it('does not show export buttons when G-code is empty', () => {
    render(<GCodeOutput generatedGCode="" generateGCode={mockGenerateGCode} />, { container });
    
    expect(screen.queryByText('Copy to Clipboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Download G-Code')).not.toBeInTheDocument();
  });  it('copies G-code to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    const sampleGCode = 'G90\\nG0 X0 Y0 Z0\\nG38.2 Z-10 F100\\nM30';
    render(<GCodeOutput generatedGCode={sampleGCode} generateGCode={mockGenerateGCode} />, { container });
    
    // Spy on the actual clipboard writeText method that userEvent creates
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    
    const copyButton = screen.getByText('Copy to Clipboard');
    await user.click(copyButton);
    
    expect(clipboardSpy).toHaveBeenCalledWith(sampleGCode);
    
    // Clean up
    clipboardSpy.mockRestore();
  });
  it('downloads G-code file when download button is clicked', async () => {
    const user = userEvent.setup();
    const sampleGCode = 'G90\\nG0 X0 Y0 Z0\\nG38.2 Z-10 F100\\nM30';
    render(<GCodeOutput generatedGCode={sampleGCode} generateGCode={mockGenerateGCode} />, { container });
    
    const downloadButton = screen.getByText('Download G-Code');
    await user.click(downloadButton);
    
    // Verify blob creation
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text/plain'
      })
    );
    
    // Verify anchor element setup and click
    expect(mockAnchor.href).toBe('blob:mock-url');
    expect(mockAnchor.download).toBe('probe-sequence.gcode');
    expect(mockAnchor.click).toHaveBeenCalled();
    
    // Verify cleanup
    expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
    expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
  it('textarea is read-only', () => {
    const sampleGCode = 'G90\\nG0 X0 Y0 Z0\\nG38.2 Z-10 F100\\nM30';
    render(<GCodeOutput generatedGCode={sampleGCode} generateGCode={mockGenerateGCode} />, { container });
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readonly');
  });
  it('textarea has monospace font styling', () => {
    render(<GCodeOutput generatedGCode="" generateGCode={mockGenerateGCode} />, { container });
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('font-mono');
  });
  it('textarea has appropriate height', () => {
    render(<GCodeOutput generatedGCode="" generateGCode={mockGenerateGCode} />, { container });
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('min-h-96');
  });
});
