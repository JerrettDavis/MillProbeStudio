import { describe, it, expect, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Scene3D } from '../Scene3D';
import { createMockMachineSettings } from '@/test/mockMachineSettings';
import type { MachineGeometry } from '@/utils/visualization/machineGeometry';
import type { ProbeSequenceSettings } from '@/types/machine';
import * as ProbePathVisualizationModule from '../ProbePathVisualization';

// Mock ProbePathVisualization to capture props
const mockProbePathVisualization = vi.fn(() => null);
vi.spyOn(ProbePathVisualizationModule, 'ProbePathVisualization').mockImplementation(mockProbePathVisualization);

const mockGeometry: MachineGeometry = {
  toolPosition: { x: 0, y: 0, z: 0 },
  stagePosition: { x: 0, y: 0, z: 0 },
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

const mockProbeSequence: ProbeSequenceSettings = {
  initialPosition: { X: 10, Y: 20, Z: 30 },
  dwellsBeforeProbe: 0,
  spindleSpeed: 0,
  units: 'mm',
  endmillSize: { input: '6', unit: 'mm', sizeInMM: 6 },
  operations: [
    {
      id: 'probe-1',
      axis: 'Z',
      direction: -1,
      distance: 10,
      feedRate: 100,
      backoffDistance: 2,
      wcsOffset: 0,
      preMoves: [],
      postMoves: [
        {
          id: 'move-1',
          type: 'rapid',
          description: 'Move to next position',
          axesValues: { X: 10, Y: 0 },
          positionMode: 'absolute',
        },
      ],
    },
    {
      id: 'probe-2',
      axis: 'X',
      direction: 1,
      distance: 5,
      feedRate: 50,
      backoffDistance: 1,
      wcsOffset: 0,
      preMoves: [],
      postMoves: [],
    },
  ],
};

describe('Integration: Scene3D probe sequence visualization', () => {
  it('renders the probe path for the configured probe sequence', async () => {
    await ReactThreeTestRenderer.create(
      <Scene3D
        machineSettings={createMockMachineSettings()}
        geometry={mockGeometry}
        stockSize={[10, 10, 10]}
        stockPosition={[0, 0, 0]}
        probeSequence={mockProbeSequence}
        pivotMode="origin"
      />
    );
    // Instead of checking the scene graph, check that ProbePathVisualization was called with correct props
    expect(mockProbePathVisualization).toHaveBeenCalled();
    const call = mockProbePathVisualization.mock.calls[0]?.[0];
    expect(call).toEqual(
      expect.objectContaining({
        operations: mockProbeSequence.operations,
        initialPosition: mockProbeSequence.initialPosition
      })
    );
  });
});
