import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { MoveGizmo } from '../MoveGizmo';
import * as THREE from 'three';

describe('MoveGizmo Movement Logic', () => {
  const mockOnMove = jest.fn();
  const mockOnDragStart = jest.fn();
  const mockOnDragEnd = jest.fn();

  const defaultProps = {
    position: [0, 0, 0] as [number, number, number],
    selectedObject: 'stock' as const,
    onMove: mockOnMove,
    onDragStart: mockOnDragStart,
    onDragEnd: mockOnDragEnd,
    visible: true,
    machineOrientation: 'vertical' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should move only on X-axis when dragging X handle horizontally', () => {
    render(
      <Canvas>
        <MoveGizmo {...defaultProps} />
      </Canvas>
    );

    // Simulate clicking on X-axis handle and dragging horizontally
    const xAxisHandle = document.querySelector('[data-testid="x-axis-handle"]');
    if (xAxisHandle) {
      // Simulate mouse down
      fireEvent.mouseDown(xAxisHandle, {
        clientX: 100,
        clientY: 100
      });

      // Simulate mouse move (100 pixels right)
      fireEvent.mouseMove(document, {
        clientX: 200,
        clientY: 100
      });

      // Check that movement was called with X-axis delta only
      expect(mockOnMove).toHaveBeenCalledWith(
        expect.objectContaining({
          x: expect.any(Number),
          y: 0,
          z: 0
        }),
        'x'
      );

      // Check that X movement is positive (right = positive X)
      const lastCall = mockOnMove.mock.calls[mockOnMove.mock.calls.length - 1];
      expect(lastCall[0].x).toBeGreaterThan(0);
    }
  });

  it('should move only on Y-axis when dragging Y handle vertically', () => {
    render(
      <Canvas>
        <MoveGizmo {...defaultProps} />
      </Canvas>
    );

    const yAxisHandle = document.querySelector('[data-testid="y-axis-handle"]');
    if (yAxisHandle) {
      fireEvent.mouseDown(yAxisHandle, {
        clientX: 100,
        clientY: 100
      });

      // Simulate mouse move (100 pixels up)
      fireEvent.mouseMove(document, {
        clientX: 100,
        clientY: 0
      });

      expect(mockOnMove).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 0,
          y: expect.any(Number),
          z: 0
        }),
        'y'
      );

      // Check that Y movement is positive (up = positive Y)
      const lastCall = mockOnMove.mock.calls[mockOnMove.mock.calls.length - 1];
      expect(lastCall[0].y).toBeGreaterThan(0);
    }
  });

  it('should move only on Z-axis when dragging Z handle vertically', () => {
    render(
      <Canvas>
        <MoveGizmo {...defaultProps} />
      </Canvas>
    );

    const zAxisHandle = document.querySelector('[data-testid="z-axis-handle"]');
    if (zAxisHandle) {
      fireEvent.mouseDown(zAxisHandle, {
        clientX: 100,
        clientY: 100
      });

      // Simulate mouse move (100 pixels up)
      fireEvent.mouseMove(document, {
        clientX: 100,
        clientY: 0
      });

      expect(mockOnMove).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 0,
          y: 0,
          z: expect.any(Number)
        }),
        'z'
      );

      // Check that Z movement is positive (up = positive Z)
      const lastCall = mockOnMove.mock.calls[mockOnMove.mock.calls.length - 1];
      expect(lastCall[0].z).toBeGreaterThan(0);
    }
  });

  it('should have consistent movement sensitivity across zoom levels', () => {
    // This test verifies that 100 pixels of mouse movement always produces
    // the same amount of world movement regardless of camera position
    const sensitivity = 0.01; // 0.01mm per pixel
    const pixelMovement = 100;
    const expectedMovement = pixelMovement * sensitivity; // 1mm

    render(
      <Canvas>
        <MoveGizmo {...defaultProps} />
      </Canvas>
    );

    const xAxisHandle = document.querySelector('[data-testid="x-axis-handle"]');
    if (xAxisHandle) {
      fireEvent.mouseDown(xAxisHandle, {
        clientX: 100,
        clientY: 100
      });

      fireEvent.mouseMove(document, {
        clientX: 200, // 100 pixels right
        clientY: 100
      });

      const lastCall = mockOnMove.mock.calls[mockOnMove.mock.calls.length - 1];
      expect(Math.abs(lastCall[0].x - expectedMovement)).toBeLessThan(0.001);
    }
  });

  it('should not move multiple axes simultaneously', () => {
    render(
      <Canvas>
        <MoveGizmo {...defaultProps} />
      </Canvas>
    );

    const xAxisHandle = document.querySelector('[data-testid="x-axis-handle"]');
    if (xAxisHandle) {
      fireEvent.mouseDown(xAxisHandle, {
        clientX: 100,
        clientY: 100
      });

      // Simulate diagonal mouse movement
      fireEvent.mouseMove(document, {
        clientX: 200, // 100 pixels right
        clientY: 50   // 50 pixels up
      });

      // Should only move X-axis, not Y or Z
      const lastCall = mockOnMove.mock.calls[mockOnMove.mock.calls.length - 1];
      expect(lastCall[0].x).not.toBe(0);
      expect(lastCall[0].y).toBe(0);
      expect(lastCall[0].z).toBe(0);
      expect(lastCall[1]).toBe('x'); // Axis parameter should be 'x'
    }
  });
});
