import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { SceneLighting, SceneGrid, SceneFloor } from '../SceneEnvironment';

const mockWorkspaceBounds = {
  width: 100,
  depth: 100,
  minZ: 0,
  centerX: 0,
  centerY: 0,
};

describe('SceneEnvironment components', () => {
  it('renders SceneLighting with vertical orientation', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <SceneLighting workspaceBounds={mockWorkspaceBounds as any} machineOrientation="vertical" />
    );
    expect(renderer.scene).toBeTruthy();
  });

  it('renders SceneLighting with horizontal orientation', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <SceneLighting workspaceBounds={mockWorkspaceBounds as any} machineOrientation="horizontal" />
    );
    expect(renderer.scene).toBeTruthy();
  });

  it('renders SceneGrid', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <SceneGrid workspaceBounds={mockWorkspaceBounds as any} machineOrientation="vertical" units="mm" />
    );
    expect(renderer.scene).toBeTruthy();
  });

  it('renders SceneFloor for horizontal machines', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <SceneFloor workspaceBounds={mockWorkspaceBounds as any} machineOrientation="horizontal" />
    );
    expect(renderer.scene).toBeTruthy();
  });

  it('returns null for SceneFloor if not horizontal', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <SceneFloor workspaceBounds={mockWorkspaceBounds as any} machineOrientation="vertical" />
    );
    // Should not render a mesh
    expect(renderer.scene.children.length).toBe(0);
  });
});
