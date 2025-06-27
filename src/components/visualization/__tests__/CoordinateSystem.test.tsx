import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { render } from '@testing-library/react';
import { CoordinateAxes, EnhancedAxisLabels, CoordinateHover, WorkspaceBoundsVisualization } from '../CoordinateSystem';

describe('CoordinateSystem components', () => {
  it('renders CoordinateAxes with default origin', async () => {
    const renderer = await ReactThreeTestRenderer.create(<CoordinateAxes size={10} />);
    expect(renderer.scene).toBeTruthy();
  });

  it('renders CoordinateAxes with custom origin', async () => {
    const renderer = await ReactThreeTestRenderer.create(<CoordinateAxes size={5} origin={[1,2,3]} />);
    expect(renderer.scene).toBeTruthy();
  });

  it('renders EnhancedAxisLabels with workspace bounds', async () => {
    const bounds = { minX: 0, maxX: 10, minY: 0, maxY: 10, minZ: 0, maxZ: 10, centerX: 5, centerY: 5, centerZ: 5, width: 10, depth: 10, height: 10 };
    const renderer = await ReactThreeTestRenderer.create(<EnhancedAxisLabels workspaceBounds={bounds} units="mm" />);
    expect(renderer.scene).toBeTruthy();
  });

  it('renders CoordinateHover with position', async () => {
    const renderer = await ReactThreeTestRenderer.create(<CoordinateHover position={[1.234, 5.678, 9.101]} units="mm" />);
    expect(renderer.scene).toBeTruthy();
  });

  it('does not render CoordinateHover when position is null', () => {
    const { container } = render(<CoordinateHover position={null} units="mm" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders WorkspaceBoundsVisualization', async () => {
    const bounds = { minX: 0, maxX: 10, minY: 0, maxY: 10, minZ: 0, maxZ: 10, centerX: 5, centerY: 5, centerZ: 5, width: 10, depth: 10, height: 10 };
    const renderer = await ReactThreeTestRenderer.create(<WorkspaceBoundsVisualization workspaceBounds={bounds} />);
    expect(renderer.scene).toBeTruthy();
  });
});
