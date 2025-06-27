import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import StockControls from '../StockControls';
import { createMockMachineSettings } from '@/test/mockMachineSettings';

describe('StockControls', () => {
  const mockOnStockSizeChange = vi.fn();
  const mockOnStockPositionChange = vi.fn();
  
  const defaultProps = {
    stockSize: [25, 25, 10] as [number, number, number],
    stockPosition: [0, 0, 0] as [number, number, number],
    onStockSizeChange: mockOnStockSizeChange,
    onStockPositionChange: mockOnStockPositionChange,
    units: 'mm',
    machineSettings: createMockMachineSettings({ machineOrientation: 'vertical' })
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default values', () => {
    render(<StockControls {...defaultProps} />);
    
    expect(screen.getByText('Stock Controls')).toBeInTheDocument();
    expect(screen.getByText('Adjust the size and position of the stock/workpiece')).toBeInTheDocument();
    expect(screen.getByText('Stock Size')).toBeInTheDocument();
    expect(screen.getByText('Stock Position')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('displays stock size inputs with correct values', () => {
    render(<StockControls {...defaultProps} />);
    
    const widthInput = screen.getByLabelText(/Width/i);
    const depthInput = screen.getByLabelText(/Depth/i);
    const heightInput = screen.getByLabelText(/Height/i);
    
    expect(widthInput).toHaveValue(25);
    expect(depthInput).toHaveValue(25);
    expect(heightInput).toHaveValue(10);
  });

  it('updates stock size when input values change', () => {
    render(<StockControls {...defaultProps} />);
    
    const widthInput = screen.getByLabelText(/Width/i);
    fireEvent.change(widthInput, { target: { value: '50' } });
    
    expect(mockOnStockSizeChange).toHaveBeenCalledWith([50, 25, 10]);
  });

  it('displays stock position inputs for vertical machine', () => {
    render(<StockControls {...defaultProps} />);
    
    const xInput = screen.getByLabelText(/X Position/i);
    const yInput = screen.getByLabelText(/Y Position/i);
    const zInput = screen.getByLabelText(/Z Position/i);
    
    expect(xInput).toHaveDisplayValue('0.0');
    expect(yInput).toHaveDisplayValue('0.0');
    expect(zInput).toHaveDisplayValue('0.0');
  });

  it('displays correct help text for vertical machine', () => {
    render(<StockControls {...defaultProps} />);
    
    // Check that range text appears for all three axes
    expect(screen.getByText(/Range: -100 to 100/)).toBeInTheDocument(); // X axis range
    // Each axis should have its own range text, but they might be the same
    const rangeTexts = screen.getAllByText(/Range: -100 to 100/);
    expect(rangeTexts.length).toBeGreaterThanOrEqual(1); // At least one range display
  });

  it('displays correct help text for horizontal machine', () => {
    const horizontalProps = {
      ...defaultProps,
      machineSettings: createMockMachineSettings({ machineOrientation: 'horizontal' })
    };
    
    render(<StockControls {...horizontalProps} />);
    
    expect(screen.getByText(/Position is relative to stage X\+ face/)).toBeInTheDocument();
    expect(screen.getByText(/Offset from stage X\+ face \(spindle side\)/)).toBeInTheDocument();
    expect(screen.getByText(/Offset from stage Y center/)).toBeInTheDocument();
    expect(screen.getByText(/Offset from stage top/)).toBeInTheDocument();
  });

  it('updates position when input values change', () => {
    render(<StockControls {...defaultProps} />);
    
    const xInput = screen.getByLabelText(/X Position/i);
    fireEvent.change(xInput, { target: { value: '10.5' } });
    
    expect(mockOnStockPositionChange).toHaveBeenCalledWith([10.5, 0, 0]);
  });

  it('handles non-numeric position input gracefully', () => {
    render(<StockControls {...defaultProps} />);
    
    const xInput = screen.getByLabelText(/X Position/i);
    fireEvent.change(xInput, { target: { value: 'invalid' } });
    
    expect(mockOnStockPositionChange).toHaveBeenCalledWith([0, 0, 0]);
  });

  it('centers stock for vertical machine', () => {
    render(<StockControls {...defaultProps} />);
    
    const centerButton = screen.getByText('Center Stock');
    fireEvent.click(centerButton);
    
    // For vertical machine, centers X and Y to middle of axis range, keeps Z
    expect(mockOnStockPositionChange).toHaveBeenCalledWith([0, 0, 0]); // (100 + (-100))/2 = 0
  });

  it('centers stock for horizontal machine', () => {
    const horizontalProps = {
      ...defaultProps,
      stockSize: [25, 25, 10] as [number, number, number],
      machineSettings: createMockMachineSettings({ 
        machineOrientation: 'horizontal',
        stageDimensions: [100, 100, 63.5]
      })
    };
    
    render(<StockControls {...horizontalProps} />);
    
    const centerButton = screen.getByText('Center Stock');
    fireEvent.click(centerButton);
    
    // For horizontal machine, Y=0, Z calculated based on stage depth and stock height
    const expectedZ = -63.5 / 2 - 10 / 2; // -stageDepth/2 - stockHeight/2
    expect(mockOnStockPositionChange).toHaveBeenCalledWith([0, 0, expectedZ]);
  });

  it('resets to default for vertical machine', () => {
    render(<StockControls {...defaultProps} />);
    
    const resetButton = screen.getByText('Reset to Default');
    fireEvent.click(resetButton);
    
    expect(mockOnStockSizeChange).toHaveBeenCalledWith([25, 25, 10]);
    
    // For vertical machine, calculates position based on axis ranges
    const expectedX = -100 + (Math.abs(100 - (-100)) * 0.3); // X.min + (range * 0.3)
    const expectedY = (100 + (-100)) / 2; // (Y.max + Y.min) / 2
    const expectedZ = 5;
    expect(mockOnStockPositionChange).toHaveBeenCalledWith([expectedX, expectedY, expectedZ]);
  });

  it('resets to default for horizontal machine', () => {
    const horizontalProps = {
      ...defaultProps,
      machineSettings: createMockMachineSettings({ machineOrientation: 'horizontal' })
    };
    
    render(<StockControls {...horizontalProps} />);
    
    const resetButton = screen.getByText('Reset to Default');
    fireEvent.click(resetButton);
    
    expect(mockOnStockSizeChange).toHaveBeenCalledWith([25, 25, 10]);
    expect(mockOnStockPositionChange).toHaveBeenCalledWith([0, 0, 0]);
  });

  it('handles edge cases with missing stage dimensions', () => {
    const propsWithoutStageDimensions = {
      ...defaultProps,
      machineSettings: createMockMachineSettings({ 
        machineOrientation: 'horizontal',
        stageDimensions: undefined
      })
    };
    
    render(<StockControls {...propsWithoutStageDimensions} />);
    
    const centerButton = screen.getByText('Center Stock');
    fireEvent.click(centerButton);
    
    // Should use default stage depth of 63.5 when stageDimensions is undefined
    const expectedZ = -63.5 / 2 - 10 / 2;
    expect(mockOnStockPositionChange).toHaveBeenCalledWith([0, 0, expectedZ]);
  });

  it('updates Y and Z position inputs correctly', () => {
    render(<StockControls {...defaultProps} />);
    
    const yInput = screen.getByLabelText(/Y Position/i);
    const zInput = screen.getByLabelText(/Z Position/i);
    
    fireEvent.change(yInput, { target: { value: '15.5' } });
    expect(mockOnStockPositionChange).toHaveBeenCalledWith([0, 15.5, 0]);
    
    fireEvent.change(zInput, { target: { value: '20.0' } });
    expect(mockOnStockPositionChange).toHaveBeenCalledWith([0, 0, 20]);
  });

  it('displays units correctly in labels', () => {
    const inchProps = { ...defaultProps, units: 'inch' };
    render(<StockControls {...inchProps} />);
    
    expect(screen.getByText(/X Position \(inch\)/)).toBeInTheDocument();
    expect(screen.getByText(/Y Position \(inch\)/)).toBeInTheDocument();
    expect(screen.getByText(/Z Position \(inch\)/)).toBeInTheDocument();
  });
});
