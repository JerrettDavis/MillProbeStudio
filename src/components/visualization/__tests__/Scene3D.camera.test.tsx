import { describe, it, expect, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { Scene3D } from '../Scene3D';
import { createMockMachineSettings } from '@/test/mockMachineSettings';
import type { MachineGeometry } from '@/utils/visualization/machineGeometry';
import { calculateCameraPosition } from '@/utils/visualization/cameraPresets';

// Text glyph generation needs WebGL and can suspend the whole scene in jsdom.
// Keep the actual scene, camera, controls and animation; replace only text rendering.
vi.mock('@react-three/drei', async importOriginal => ({
  ...await importOriginal<typeof import('@react-three/drei')>(),
  Text: () => null,
  Html: () => null,
}));
const mockGeometry: MachineGeometry = {
  toolPosition: { x: 10, y: 20, z: 30 },
  stagePosition: { x: 5, y: 10, z: 15 },
  stockWorldPosition: { x: 0, y: 0, z: 0 },
  cameraDistance: 200,
  workspaceBounds: {
    width: 100,
    depth: 100,
    height: 50,
    centerX: 0,
    centerY: 0,
    centerZ: 25,
    minX: -50,
    maxX: 50,
    minY: -50,
    maxY: 50,
    minZ: 0,
    maxZ: 50,
  },
};

// Use tuple types for stockSize and stockPosition
const mockStockSize: [number, number, number] = [10, 10, 10];
const mockStockPosition: [number, number, number] = [0, 0, 0];

describe('Scene3D camera lifecycle', () => {
  it('finishes preset animation at the configured camera position', async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    let now = 1_000;
    let frameId = 0;
    const frames = new Map<number, FrameRequestCallback>();
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frames.set(++frameId, callback);
      return frameId;
    });
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
      frames.delete(id);
    });
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(300, 300, 300);
    const machineSettings = createMockMachineSettings();
    const onAnimationStateChange = vi.fn();
    const renderer = await ReactThreeTestRenderer.create(
      <Scene3D
        machineSettings={machineSettings}
        geometry={mockGeometry}
        stockSize={mockStockSize}
        stockPosition={mockStockPosition}
        currentPreset="front"
        pivotMode="origin"
        onAnimationStateChange={onAnimationStateChange}
      />,
      { camera }
    );
    try {

      expect(onAnimationStateChange).toHaveBeenLastCalledWith(true);
      expect(frames.size).toBeGreaterThan(0);
      now += 600;
      await ReactThreeTestRenderer.act(async () => {
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach(callback => callback(now));
      });
      const expected = calculateCameraPosition(
        'front', mockGeometry.workspaceBounds, machineSettings,
        { x: 0, y: 0, z: 0 }, machineSettings.machineOrientation
      );
      expect(camera.position.toArray()).toEqual([expected.x, expected.y, expected.z]);
      expect(onAnimationStateChange.mock.calls).toEqual([[true], [false]]);
      expect(frames.size).toBe(0);
    } finally {
      await renderer.unmount();
      requestFrame.mockRestore();
      cancelFrame.mockRestore();
      clock.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
