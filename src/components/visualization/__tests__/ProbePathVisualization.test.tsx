import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { ProbePathVisualization } from '../ProbePathVisualization';

describe('ProbePathVisualization', () => {
  it('renders null if less than 2 points', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <ProbePathVisualization operations={[]} initialPosition={{ X: 0, Y: 0, Z: 0 }} />
    );
    expect(renderer.scene.children.length).toBe(0);
  });

  it('renders a line for a single probe operation', async () => {
    const operations = [
      {
        axis: 'X',
        distance: 10,
        direction: 1,
        preMoves: [],
        postMoves: [],
      }
    ];
    const renderer = await ReactThreeTestRenderer.create(
      <ProbePathVisualization operations={operations as any} initialPosition={{ X: 0, Y: 0, Z: 0 }} />
    );
    // Should render a line
    const line = renderer.scene.children[0];
    expect(line.type).toBe('Line');
  });

  it('renders a line for multiple operations', async () => {
    const operations = [
      {
        axis: 'X',
        distance: 10,
        direction: 1,
        preMoves: [
          { type: 'rapid', axesValues: { X: 5, Y: 0, Z: 0 }, positionMode: 'absolute' }
        ],
        postMoves: [
          { type: 'rapid', axesValues: { X: 10, Y: 0, Z: 0 }, positionMode: 'relative' }
        ],
      },
      {
        axis: 'Y',
        distance: 5,
        direction: -1,
        preMoves: [],
        postMoves: [],
      }
    ];
    const renderer = await ReactThreeTestRenderer.create(
      <ProbePathVisualization operations={operations as any} initialPosition={{ X: 0, Y: 0, Z: 0 }} />
    );
    const line = renderer.scene.children[0];
    expect(line.type).toBe('Line');
  });
});
