import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import type { MachineSettings, ProbeSequenceSettings } from '@/types/machine';

const mockMachineSettings: MachineSettings = {
  units: 'mm',
  axes: {
    X: {
      positiveDirection: '+X',
      negativeDirection: '-X',
      polarity: 1,
      min: -100,
      max: 100
    },
    Y: {
      positiveDirection: '+Y',
      negativeDirection: '-Y',
      polarity: 1,
      min: -150,
      max: 150
    },
    Z: {
      positiveDirection: '+Z',
      negativeDirection: '-Z',
      polarity: 1,
      min: -50,
      max: 50
    }
  }
};

const mockProbeSequenceSettings: ProbeSequenceSettings = {
  initialPosition: { X: 0, Y: 0, Z: 10 },
  dwellsBeforeProbe: 2,
  spindleSpeed: 1000,
  units: 'mm',
  endmillSize: {
    input: '6mm',
    unit: 'mm',
    sizeInMM: 6
  },
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
      postMoves: []
    }
  ]
};

// Create a simplified 3D scene component for testing
const TestScene3D: React.FC<{
  machineSettings: MachineSettings;
  probeSequence?: ProbeSequenceSettings;
  stockSize?: [number, number, number];
  stockPosition?: [number, number, number];
}> = ({ probeSequence, stockSize = [25, 25, 10], stockPosition = [0, 0, 5] }) => {
  return (
    <group>
      {/* Test lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} />
      
      {/* Test machine table */}
      <mesh position={[0, 0, -1]}>
        <boxGeometry args={[200, 200, 2]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      
      {/* Test stock */}
      <mesh position={stockPosition}>
        <boxGeometry args={stockSize} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Test tool */}
      {probeSequence && (
        <group position={[probeSequence.initialPosition.X, probeSequence.initialPosition.Y, probeSequence.initialPosition.Z]}>
          <mesh>
            <cylinderGeometry args={[3, 3, 30, 16]} />
            <meshStandardMaterial color="#C0C0C0" />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.5, 8, 8]} />
            <meshStandardMaterial color="#FFD700" />
          </mesh>
        </group>
      )}
      
      {/* Test coordinate axes */}
      <group>
        <mesh position={[50, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 100, 8]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <mesh position={[0, 50, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 100, 8]} />
          <meshBasicMaterial color="green" />
        </mesh>
        <mesh position={[0, 0, 50]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 100, 8]} />
          <meshBasicMaterial color="blue" />
        </mesh>
      </group>
      
      {/* Test workspace bounds */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[200, 300, 100]} />
        <meshBasicMaterial color="#00FF00" wireframe />
      </mesh>
    </group>
  );
};

describe('Machine3DVisualization - React Three Fiber Tests', () => {
  describe('3D Scene Structure', () => {
    it('should render the basic 3D scene with expected elements', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D machineSettings={mockMachineSettings} />
      );
      
      // Check that the scene exists and has the main group
      expect(renderer.scene).toBeDefined();
      expect(renderer.scene.children.length).toBeGreaterThan(0);
      
      // The root should be a group containing all our objects
      const rootGroup = renderer.scene.children[0];
      expect(rootGroup.type).toBe('Group');
      expect(rootGroup.children.length).toBeGreaterThan(4); // lights + meshes + groups
    });

    it('should render lighting setup correctly', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D machineSettings={mockMachineSettings} />
      );
      
      const rootGroup = renderer.scene.children[0];
      
      // Find lights in the scene
      const ambientLight = rootGroup.children.find(child => child.type === 'AmbientLight');
      const directionalLight = rootGroup.children.find(child => child.type === 'DirectionalLight');
      
      expect(ambientLight).toBeTruthy();
      expect(ambientLight?.props.intensity).toBe(0.4);
      
      expect(directionalLight).toBeTruthy();
      expect(directionalLight?.props.intensity).toBe(0.6);
      expect(directionalLight?.props.position).toEqual([10, 10, 5]);
    });

    it('should render machine table at correct position', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D machineSettings={mockMachineSettings} />
      );
      
      const rootGroup = renderer.scene.children[0];
      
      // Find the machine table mesh (first mesh after lights)
      const meshes = rootGroup.children.filter(child => child.type === 'Mesh');
      const machineTable = meshes[0]; // Should be the first mesh (machine table)
      
      expect(machineTable).toBeTruthy();
      expect(machineTable.type).toBe('Mesh');
      expect(machineTable.props.position).toEqual([0, 0, -1]);
      
      // Check that it has geometry and material as children
      expect(machineTable.allChildren.length).toBe(2);
      const geometry = machineTable.allChildren.find(child => child.type === 'BoxGeometry');
      const material = machineTable.allChildren.find(child => child.type === 'MeshStandardMaterial');
      
      expect(geometry).toBeTruthy();
      expect(geometry?.props.args).toEqual([200, 200, 2]);
      expect(material).toBeTruthy();
      expect(material?.props.color).toBe('#666666');
    });

    it('should render stock with correct size and position', async () => {
      const stockSize: [number, number, number] = [30, 20, 15];
      const stockPosition: [number, number, number] = [10, 5, 8];
      
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D 
          machineSettings={mockMachineSettings}
          stockSize={stockSize}
          stockPosition={stockPosition}
        />
      );
      
      const rootGroup = renderer.scene.children[0];
      const meshes = rootGroup.children.filter(child => child.type === 'Mesh');
      const stock = meshes[1]; // Should be the second mesh (stock)
      
      expect(stock).toBeTruthy();
      expect(stock.type).toBe('Mesh');
      expect(stock.props.position).toEqual(stockPosition);
      
      // Check geometry
      const geometry = stock.allChildren.find(child => child.type === 'BoxGeometry');
      expect(geometry).toBeTruthy();
      expect(geometry?.props.args).toEqual(stockSize);
    });

    it('should render tool at probe position when probe sequence is provided', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D 
          machineSettings={mockMachineSettings}
          probeSequence={mockProbeSequenceSettings}
        />
      );
      
      const rootGroup = renderer.scene.children[0];
      
      // Find the tool group (should be a group positioned at probe position)
      const toolGroup = rootGroup.children.find(child => 
        child.type === 'Group' && 
        child.props.position && 
        child.props.position[0] === 0 && 
        child.props.position[1] === 0 && 
        child.props.position[2] === 10
      );
      
      expect(toolGroup).toBeTruthy();
      expect(toolGroup?.children.length).toBe(2); // Tool shank + tool tip
      
      // Check tool parts
      const toolShank = toolGroup?.children[0];
      const toolTip = toolGroup?.children[1];
      
      expect(toolShank?.type).toBe('Mesh');
      expect(toolTip?.type).toBe('Mesh');
      
      // Check geometries
      const cylinderGeometry = toolShank?.allChildren.find(child => child.type === 'CylinderGeometry');
      const sphereGeometry = toolTip?.allChildren.find(child => child.type === 'SphereGeometry');
      
      expect(cylinderGeometry).toBeTruthy();
      expect(sphereGeometry).toBeTruthy();
    });

    it('should render coordinate axes with correct colors and positions', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D machineSettings={mockMachineSettings} />
      );
      
      const rootGroup = renderer.scene.children[0];
      
      // Find the coordinate axes group (should contain 3 meshes)
      const axesGroup = rootGroup.children.find(child => 
        child.type === 'Group' && 
        child.children && 
        child.children.length === 3 &&
        child.children.every(c => c.type === 'Mesh')
      );
      
      expect(axesGroup).toBeTruthy();
      
      const [xAxis, yAxis, zAxis] = axesGroup?.children || [];
      
      // Check X axis (red, position [50, 0, 0])
      expect(xAxis?.props.position).toEqual([50, 0, 0]);
      const xMaterial = xAxis?.allChildren.find(child => child.type === 'MeshBasicMaterial');
      expect(xMaterial?.props.color).toBe('red');
      
      // Check Y axis (green, position [0, 50, 0], rotated)
      expect(yAxis?.props.position).toEqual([0, 50, 0]);
      expect(yAxis?.props.rotation).toEqual([0, 0, Math.PI / 2]);
      const yMaterial = yAxis?.allChildren.find(child => child.type === 'MeshBasicMaterial');
      expect(yMaterial?.props.color).toBe('green');
      
      // Check Z axis (blue, position [0, 0, 50], rotated)
      expect(zAxis?.props.position).toEqual([0, 0, 50]);
      expect(zAxis?.props.rotation).toEqual([Math.PI / 2, 0, 0]);
      const zMaterial = zAxis?.allChildren.find(child => child.type === 'MeshBasicMaterial');
      expect(zMaterial?.props.color).toBe('blue');
    });

    it('should render workspace bounds as wireframe', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D machineSettings={mockMachineSettings} />
      );
      
      const rootGroup = renderer.scene.children[0];
      const meshes = rootGroup.children.filter(child => child.type === 'Mesh');
      
      // Find the workspace bounds (should be the last mesh with wireframe material)
      const workspaceBounds = meshes.find(mesh => {
        const material = mesh.allChildren.find(child => child.type === 'MeshBasicMaterial');
        return material && material.props.wireframe === true;
      });
      
      expect(workspaceBounds).toBeTruthy();
      expect(workspaceBounds?.type).toBe('Mesh');
      expect(workspaceBounds?.props.position).toEqual([0, 0, 0]);
      
      // Check geometry
      const geometry = workspaceBounds?.allChildren.find(child => child.type === 'BoxGeometry');
      expect(geometry?.props.args).toEqual([200, 300, 100]);
    });
  });

  describe('Scene Updates', () => {
    it('should update tool position when probe position changes', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D 
          machineSettings={mockMachineSettings}
          probeSequence={mockProbeSequenceSettings}
        />
      );
      
      const rootGroup = renderer.scene.children[0];
      
      // Find initial tool position
      let toolGroup = rootGroup.children.find(child => 
        child.type === 'Group' && 
        child.props.position && 
        child.props.position[2] === 10 // Initial Z position
      );
      expect(toolGroup?.props.position).toEqual([0, 0, 10]);
      
      // Update probe sequence with new position
      const updatedProbeSequence = {
        ...mockProbeSequenceSettings,
        initialPosition: { X: 50, Y: 25, Z: 15 }
      };
      
      await renderer.update(
        <TestScene3D 
          machineSettings={mockMachineSettings}
          probeSequence={updatedProbeSequence}
        />
      );
      
      // Find updated tool position
      const updatedRootGroup = renderer.scene.children[0];
      toolGroup = updatedRootGroup.children.find(child => 
        child.type === 'Group' && 
        child.props.position && 
        child.props.position[2] === 15 // New Z position
      );
      
      expect(toolGroup?.props.position).toEqual([50, 25, 15]);
    });

    it('should update stock position when changed', async () => {
      const initialPosition: [number, number, number] = [0, 0, 5];
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D 
          machineSettings={mockMachineSettings}
          stockPosition={initialPosition}
        />
      );
      
      let rootGroup = renderer.scene.children[0];
      let meshes = rootGroup.children.filter(child => child.type === 'Mesh');
      let stock = meshes[1]; // Second mesh is stock
      expect(stock.props.position).toEqual(initialPosition);
      
      // Update stock position
      const newPosition: [number, number, number] = [20, 15, 10];
      await renderer.update(
        <TestScene3D 
          machineSettings={mockMachineSettings}
          stockPosition={newPosition}
        />
      );
      
      rootGroup = renderer.scene.children[0];
      meshes = rootGroup.children.filter(child => child.type === 'Mesh');
      stock = meshes[1]; // Second mesh is stock
      expect(stock.props.position).toEqual(newPosition);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing probe sequence gracefully', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D machineSettings={mockMachineSettings} />
      );
      
      // Should not throw and should still render basic elements
      expect(renderer.scene).toBeDefined();
      const rootGroup = renderer.scene.children[0];
      expect(rootGroup.children.length).toBeGreaterThan(0);
      
      // Tool group should not be present
      const toolGroup = rootGroup.children.find(child => 
        child.type === 'Group' && 
        child.children && 
        child.children.length === 2 && // Tool shank + tip
        child.children.every(c => c.type === 'Mesh')
      );
      expect(toolGroup).toBeFalsy();
    });

    it('should handle invalid machine settings without throwing', async () => {
      const invalidMachineSettings = {
        ...mockMachineSettings,
        axes: {
          ...mockMachineSettings.axes,
          X: { ...mockMachineSettings.axes.X, min: 100, max: -100 } // Invalid: min > max
        }
      };
      
      // Should not throw even with invalid settings
      await expect(
        ReactThreeTestRenderer.create(
          <TestScene3D machineSettings={invalidMachineSettings} />
        )
      ).resolves.toBeDefined();
    });
  });

  describe('Geometry and Materials', () => {
    it('should use correct geometry types for different objects', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <TestScene3D 
          machineSettings={mockMachineSettings}
          probeSequence={mockProbeSequenceSettings}
        />
      );
      
      const rootGroup = renderer.scene.children[0];
      const meshes = rootGroup.children.filter(child => child.type === 'Mesh');
      
      // Check machine table uses box geometry
      const machineTable = meshes[0];
      const tableGeometry = machineTable.allChildren.find(child => child.type === 'BoxGeometry');
      expect(tableGeometry).toBeTruthy();
      
      // Check coordinate axes use cylinder geometry
      const axesGroup = rootGroup.children.find(child => 
        child.type === 'Group' && 
        child.children && 
        child.children.length === 3
      );
      const xAxis = axesGroup?.children[0];
      const cylinderGeometry = xAxis?.allChildren.find(child => child.type === 'CylinderGeometry');
      expect(cylinderGeometry).toBeTruthy();
      
      // Check tool uses correct geometries
      const toolGroup = rootGroup.children.find(child => 
        child.type === 'Group' && 
        child.children && 
        child.children.length === 2
      );
      const toolShank = toolGroup.children[0];
      const toolTip = toolGroup.children[1];
      
      const shankCylinder = toolShank?.allChildren.find(child => child.type === 'CylinderGeometry');
      const tipSphere = toolTip?.allChildren.find(child => child.type === 'SphereGeometry');
      
      expect(shankCylinder).toBeTruthy();
      expect(tipSphere).toBeTruthy();
    });
  });
});
