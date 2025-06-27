import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { InteractiveStock, ToolVisualization, MachineTable, HorizontalStage } from '../MachineObjects';

describe('MachineObjects components', () => {
  it('renders InteractiveStock with default props', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <InteractiveStock position={[0,0,0]} size={[10,10,10]} />
    );
    expect(renderer.scene).toBeTruthy();
  });

  it('renders ToolVisualization with default props', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <ToolVisualization position={[0,0,0]} diameter={2} length={10} />
    );
    expect(renderer.scene).toBeTruthy();
  });

  it('renders MachineTable with default props', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <MachineTable width={10} depth={10} height={1} position={[0,0,0]} />
    );
    expect(renderer.scene).toBeTruthy();
  });

  it('renders HorizontalStage with default props', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <HorizontalStage height={1} width={10} depth={10} position={[0,0,0]} />
    );
    expect(renderer.scene).toBeTruthy();
  });

  // Event/callback tests are skipped due to test renderer limitations
});
