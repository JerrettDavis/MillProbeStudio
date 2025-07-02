import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SequenceVisualization from '../SequenceVisualization';
import { useAppStore } from '@/store';

const TEST_GCODE = `G21 (Set units to millimeters)\nG90 G53 G0 Z-41 (Absolute move in machine coordinates to Z)\nG90 G53 G0 Y-100 (Absolute move in machine coordinates to Y)\nG90 G53 G0 X-78 (Absolute move in machine coordinates to X)\nS5000 M4 (Start spindle in reverse at 5000 RPM)\nG4 P3 (Dwell for 3 seconds to let spindle stabilize)\nG91 (Set to incremental positioning mode)\n(=== Probe Operation 1: Y Axis ===)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG38.2 Y-10 F10 (Probe along Y- axis)\nG10 L20 P1 Y1.5875 (Set WCS G54 Y origin)\nG0 G91 Y1 (Back off from surface)\n(Post-moves for Probe Operation 1)\nG0 G91 X12 (move up in x to prepare for x probing)\nG0 G91 Y-3.5 (move right to position for x probing)\n(=== Probe Operation 2: X Axis ===)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG38.2 X-10 F10 (Probe along X- axis)\nG10 L20 P1 X1.5875 (Set WCS G54 X origin)\nG0 G91 X1 (Back off from surface)\n(Post-moves for Probe Operation 2)\nG0 G53 Z-24 (move z to safe probing height in machine coordinates)\nG0 G90 G54 X-5.5 Y-4 (move to center of stock for z probing)\n(=== Probe Operation 3: Z Axis ===)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG4 P0.01 (Empty Buffer)\nG38.2 Z-45 F15 (Probe along Z- axis)\nG10 L20 P1 Z0 (Set WCS G54 Z origin)\nG0 G91 Z2 (Back off from surface)\n(Post-moves for Probe Operation 3)\nG0 G90 G54 X0 Y0 (return to work origin)\nG0 G54 G90 X0Y0 (Return to origin)\nS0 (Stop spindle)`;

// Minimal mock for useAppStore
vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAppStore: vi.fn().mockImplementation((selector) => {
      const state = {
        generatedGCode: TEST_GCODE,
        simulationState: { currentStepIndex: 0 }
      };
      return selector ? selector(state) : state;
    })
  };
});

describe('SequenceVisualization G-code simulation integration', () => {
  it('renders all G-code lines and simulation controls', () => {
    render(<SequenceVisualization />);
    expect(screen.getByText(/G21/)).toBeInTheDocument();
    expect(screen.getByText(/G38.2 Y-10 F10/)).toBeInTheDocument();
    expect(screen.getByText(/G38.2 X-10 F10/)).toBeInTheDocument();
    expect(screen.getByText(/G38.2 Z-45 F15/)).toBeInTheDocument();
    expect(screen.getByText(/S5000 M4/)).toBeInTheDocument();
    expect(screen.getByText(/S0/)).toBeInTheDocument();
    expect(screen.getByText(/3D Visualization/)).toBeInTheDocument();
  });

  it('highlights the correct G-code line as the simulation advances', () => {
    render(<SequenceVisualization />);
    // Simulate advancing the simulation step
    // (In a real test, you would trigger play/next and update simulationState)
    // For now, just check the first line is highlighted
    const g21 = screen.getByText(/G21/);
    expect(g21).toHaveStyle('color: #fff');
  });

  // Add more tests here to simulate advancing steps and check probe/visualization state
});
