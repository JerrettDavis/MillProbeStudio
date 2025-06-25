import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { MachineSettings, ProbeSequenceSettings, ProbeOperation } from '@/types/machine';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';

interface Machine3DVisualizationProps {
  machineSettings: MachineSettings;
  probeSequence?: ProbeSequenceSettings;
  className?: string;
  height?: string; // Height of the visualization (default: "600px")
  stockSize?: [number, number, number]; // [width, depth, height] - defaults to [25, 25, 10]
  stockPosition?: [number, number, number]; // [x, y, z] - if not provided, will be calculated based on machine limits
  onStockSizeChange?: (size: [number, number, number]) => void;
  onStockPositionChange?: (position: [number, number, number]) => void;
  showAxisLabels?: boolean;
  showCoordinateHover?: boolean;
  machineOrientation?: 'vertical' | 'horizontal'; // 'vertical' = traditional mill, 'horizontal' = horizontal spindle (default)
  stageDimensions?: [number, number, number]; // [height(X), width(Y), depth(Z)] for horizontal machines
}

// Component for enhanced axis labels with min/max values
const EnhancedAxisLabels: React.FC<{ 
  workspaceBounds: {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
    centerX: number; centerY: number; centerZ: number;
  };
  units: string;
}> = ({ workspaceBounds, units }) => {
  return (
    <group>
      {/* X Axis Labels */}
      <Text
        position={[workspaceBounds.minX - 3, workspaceBounds.centerY, 2]}
        fontSize={1.2}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        X Min: {workspaceBounds.minX}{units}
      </Text>
      <Text
        position={[workspaceBounds.maxX + 3, workspaceBounds.centerY, 2]}
        fontSize={1.2}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        X Max: {workspaceBounds.maxX}{units}
      </Text>
      
      {/* Y Axis Labels */}
      <Text
        position={[workspaceBounds.centerX, workspaceBounds.minY - 3, 2]}
        fontSize={1.2}
        color="green"
        anchorX="center"
        anchorY="middle"
      >
        Y Min: {workspaceBounds.minY}{units}
      </Text>
      <Text
        position={[workspaceBounds.centerX, workspaceBounds.maxY + 3, 2]}
        fontSize={1.2}
        color="green"
        anchorX="center"
        anchorY="middle"
      >
        Y Max: {workspaceBounds.maxY}{units}
      </Text>
      
      {/* Z Axis Labels */}
      <Text
        position={[workspaceBounds.centerX - 5, workspaceBounds.centerY - 5, workspaceBounds.minZ]}
        fontSize={1.2}
        color="blue"
        anchorX="center"
        anchorY="middle"
      >
        Z Min: {workspaceBounds.minZ}{units}
      </Text>
      <Text
        position={[workspaceBounds.centerX - 5, workspaceBounds.centerY - 5, workspaceBounds.maxZ + 2]}
        fontSize={1.2}
        color="blue"
        anchorX="center"
        anchorY="middle"
      >
        Z Max: {workspaceBounds.maxZ}{units}
      </Text>
    </group>
  );
};

// Component for coordinate hover display
const CoordinateHover: React.FC<{
  position: [number, number, number] | null;
  units: string;
}> = ({ position, units }) => {
  if (!position) return null;
  
  return (
    <Html position={[position[0], position[1], position[2] + 2]}>
      <div className="bg-gray-900 bg-opacity-95 text-white px-3 py-2 rounded-lg text-sm font-mono whitespace-nowrap pointer-events-none border border-gray-600 shadow-lg">
        <div className="text-xs text-gray-300 mb-1">Coordinates:</div>
        <div className="space-y-1">
          <div>X: <span className="text-red-400">{position[0].toFixed(2)}</span>{units}</div>
          <div>Y: <span className="text-green-400">{position[1].toFixed(2)}</span>{units}</div>
          <div>Z: <span className="text-blue-400">{position[2].toFixed(2)}</span>{units}</div>
        </div>
      </div>
    </Html>
  );
};

// Interactive stock component with improved hover detection
const InteractiveStock: React.FC<{ 
  position: [number, number, number];
  size: [number, number, number];
  onPositionChange?: (position: [number, number, number]) => void;
  onHover?: (position: [number, number, number] | null) => void;
}> = ({ position, size, onPositionChange, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerMove = useCallback((event: any) => {
    if (onHover && isHovered) {
      const point = event.point;
      onHover([point.x, point.y, point.z]);
    }
  }, [onHover, isHovered]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  return (
    <mesh 
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial 
        color={isDragging ? "#CD853F" : isHovered ? "#DEB887" : "#8B4513"} 
        transparent 
        opacity={0.7} 
      />
    </mesh>
  );
};
// Component for the coordinate system axes
const CoordinateAxes: React.FC<{ 
  size: number;
  origin?: [number, number, number];
}> = ({ size, origin = [0, 0, 0] }) => {
  return (
    <group position={origin}>
      {/* X Axis - Red */}
      <mesh position={[size / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, size, 8]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <Text
        position={[size + 0.5, 0, 0]}
        fontSize={0.5}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        X+
      </Text>
      
      {/* Y Axis - Green */}
      <mesh position={[0, size / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, size, 8]} />
        <meshBasicMaterial color="green" />
      </mesh>
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.5}
        color="green"
        anchorX="center"
        anchorY="middle"
      >
        Y+
      </Text>
      
      {/* Z Axis - Blue */}
      <mesh position={[0, 0, size / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, size, 8]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      <Text
        position={[0, 0, size + 0.5]}
        fontSize={0.5}
        color="blue"
        anchorX="center"
        anchorY="middle"
      >
        Z+
      </Text>
    </group>
  );
};

// Component for the horizontal machine stage
const HorizontalStage: React.FC<{
  height: number; // X dimension
  width: number;  // Y dimension  
  depth: number;  // Z dimension
  position: [number, number, number]; // Stage position in world coordinates
}> = ({ height, width, depth, position }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[height, width, depth]} />
      <meshStandardMaterial color="#444444" transparent opacity={0.9} />
    </mesh>
  );
};

// Component for the machine table/bed
const MachineTable: React.FC<{ 
  width: number; 
  depth: number; 
  height: number;
  centerX?: number;
  centerY?: number;
  machineOrientation?: 'vertical' | 'horizontal';
  stageDimensions?: [number, number, number];
  machineSettings: MachineSettings;
  probeSequence?: ProbeSequenceSettings; // Add probe sequence for tool tip Z
}> = ({
  width, 
  depth, 
  height, 
  centerX = 0, 
  centerY = 0, 
  machineOrientation = 'vertical',
  stageDimensions = [12.7, 304.8, 63.5],
  machineSettings,
  probeSequence
}) => {if (machineOrientation === 'horizontal') {
    // For horizontal machines, show the main table and separate stage
    // Calculate stage position based on work area bounds
    const { X, Y, Z } = machineSettings.axes;
    
    // Position stage based on physical relationship to spindle
    // For horizontal machines, when probe X = X.min, stage should be at top of range (away from spindle)
    // When probe X = X.max, stage should be at bottom of range (close to spindle)
    const probeX = probeSequence?.initialPosition.X || X.min;
    // Invert the relationship: probe X.min → stage at X.max, probe X.max → stage at X.min
    const stageX = X.max - (probeX - X.min); // Inverted mapping
    const stageY = (Y.max + Y.min) / 2; // Stage Y position (centered in Y range, fixed)
    const stageZ = (Z.max + Z.min) / 2; // Stage centered within Z bounds of work area
    
    const stagePosition: [number, number, number] = [stageX, stageY, stageZ];
      return (
      <group>
        {/* Configurable horizontal stage - no base plane for horizontal machines */}
        <HorizontalStage 
          height={stageDimensions[0]} 
          width={stageDimensions[1]} 
          depth={stageDimensions[2]}
          position={stagePosition}
        />
      </group>
    );
  }
  
  // Traditional vertical machine
  return (
    <mesh position={[centerX, centerY, -height / 2]}>
      <boxGeometry args={[width, depth, height]} />
      <meshStandardMaterial color="#666666" transparent opacity={0.8} />
    </mesh>
  );
};

// Component for the tool with hover support
const ToolVisualization: React.FC<{ 
  position: [number, number, number];
  diameter: number;
  length: number;
  onHover?: (position: [number, number, number] | null) => void;
  machineOrientation?: 'vertical' | 'horizontal';
}> = ({ position, diameter, length, onHover, machineOrientation = 'vertical' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerMove = useCallback((event: any) => {
    if (onHover && isHovered) {
      const point = event.point;
      onHover([point.x, point.y, point.z]);
    }
  }, [onHover, isHovered]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);  if (machineOrientation === 'horizontal') {
    // For horizontal machines, spindle still comes from above (perpendicular to XY plane)
    // Position group at tool tip, with shank extending upward
    return (
      <group position={position}>
        {/* Tool shank - extends upward from tip */}
        <mesh 
          position={[0, 0, length / 2]}
          rotation={[Math.PI / 2, 0, 0]}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <cylinderGeometry args={[diameter / 2, diameter / 2, length, 16]} />
          <meshStandardMaterial color={isHovered ? "#E5E5E5" : "#C0C0C0"} />
        </mesh>
        {/* Tool tip indicator - at group position */}
        <mesh 
          position={[0, 0, 0]}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <sphereGeometry args={[diameter / 4, 8, 8]} />
          <meshStandardMaterial color={isHovered ? "#FFED4A" : "#FFD700"} />
        </mesh>
      </group>
    );
  }

  // Traditional vertical machine - same positioning
  return (
    <group position={position}>
      {/* Tool shank - extends upward from tip */}
      <mesh 
        position={[0, 0, length / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <cylinderGeometry args={[diameter / 2, diameter / 2, length, 16]} />
        <meshStandardMaterial color={isHovered ? "#E5E5E5" : "#C0C0C0"} />
      </mesh>
      {/* Tool tip indicator - at group position */}
      <mesh 
        position={[0, 0, 0]}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <sphereGeometry args={[diameter / 4, 8, 8]} />
        <meshStandardMaterial color={isHovered ? "#FFED4A" : "#FFD700"} />
      </mesh>
    </group>
  );
};

// Component for probe path visualization
const ProbePathVisualization: React.FC<{ 
  operations: ProbeOperation[];
  initialPosition: { X: number; Y: number; Z: number };
}> = ({ operations, initialPosition }) => {
  const pathPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    let currentPos = { ...initialPosition };
    
    // Add initial position
    points.push(new THREE.Vector3(currentPos.X, currentPos.Y, currentPos.Z));
    
    operations.forEach((operation) => {
      // Add pre-moves
      operation.preMoves.forEach((move) => {
        if (move.type === 'rapid' && move.axesValues) {
          if (move.positionMode === 'relative') {
            currentPos.X += move.axesValues.X || 0;
            currentPos.Y += move.axesValues.Y || 0;
            currentPos.Z += move.axesValues.Z || 0;
          } else {
            currentPos.X = move.axesValues.X ?? currentPos.X;
            currentPos.Y = move.axesValues.Y ?? currentPos.Y;
            currentPos.Z = move.axesValues.Z ?? currentPos.Z;
          }
          points.push(new THREE.Vector3(currentPos.X, currentPos.Y, currentPos.Z));
        }
      });
      
      // Add probe move
      const probeEndPos = { ...currentPos };
      if (operation.axis === 'X') {
        probeEndPos.X += operation.distance * operation.direction;
      } else if (operation.axis === 'Y') {
        probeEndPos.Y += operation.distance * operation.direction;
      } else if (operation.axis === 'Z') {
        probeEndPos.Z += operation.distance * operation.direction;
      }
      points.push(new THREE.Vector3(probeEndPos.X, probeEndPos.Y, probeEndPos.Z));
      
      // Update current position after probe
      currentPos = probeEndPos;
      
      // Add post-moves
      operation.postMoves.forEach((move) => {
        if (move.type === 'rapid' && move.axesValues) {
          if (move.positionMode === 'relative') {
            currentPos.X += move.axesValues.X || 0;
            currentPos.Y += move.axesValues.Y || 0;
            currentPos.Z += move.axesValues.Z || 0;
          } else {
            currentPos.X = move.axesValues.X ?? currentPos.X;
            currentPos.Y = move.axesValues.Y ?? currentPos.Y;
            currentPos.Z = move.axesValues.Z ?? currentPos.Z;
          }
          points.push(new THREE.Vector3(currentPos.X, currentPos.Y, currentPos.Z));
        }
      });
    });
    
    return points;
  }, [operations, initialPosition]);
  
  if (pathPoints.length < 2) return null;
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(pathPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#FF6B6B" linewidth={3} />
    </line>
  );
};

// Main 3D scene component
const Scene3D: React.FC<{
  machineSettings: MachineSettings;
  probeSequence?: ProbeSequenceSettings;
  stockSize: [number, number, number];
  stockPosition: [number, number, number];
  onStockPositionChange?: (position: [number, number, number]) => void;
  showAxisLabels?: boolean;
  showCoordinateHover?: boolean;
  machineOrientation?: 'vertical' | 'horizontal';
  stageDimensions?: [number, number, number];
  currentPreset?: CameraPreset;
  onPresetChange?: (preset: CameraPreset) => void;
  onCameraUpdate?: (position: { x: number; y: number; z: number }) => void;
  onControlsReady?: () => void;
  pivotMode?: 'tool' | 'origin';
}> = ({ 
  machineSettings, 
  probeSequence, 
  stockSize, 
  stockPosition, 
  onStockPositionChange,  showAxisLabels = true,
  showCoordinateHover = true,
  machineOrientation = 'horizontal',
  stageDimensions = [12.7, 304.8, 63.5],
  currentPreset = 'home',
  onPresetChange,
  onCameraUpdate,
  onControlsReady,
  pivotMode = 'tool'
}) => {
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);
  const [cameraPresetFunction, setCameraPresetFunction] = useState<((preset: CameraPreset) => void) | null>(null);
  // Calculate machine workspace bounds
  const workspaceBounds = useMemo(() => {
    const { X, Y, Z } = machineSettings.axes;
    return {
      width: Math.abs(X.max - X.min),
      depth: Math.abs(Y.max - Y.min),
      height: Math.abs(Z.max - Z.min),
      centerX: (X.max + X.min) / 2,
      centerY: (Y.max + Y.min) / 2,
      centerZ: (Z.max + Z.min) / 2,
      minX: X.min,
      maxX: X.max,
      minY: Y.min,
      maxY: Y.max,
      minZ: Z.min,
      maxZ: Z.max,
    };
  }, [machineSettings.axes]);
    // Tool properties
  const toolDiameter = probeSequence?.endmillSize.sizeInMM || 6;
  const toolLength = 30;  // Calculate tool position based on machine orientation
  const toolPosition: [number, number, number] = useMemo(() => {
    const baseX = probeSequence?.initialPosition.X || 0;
    const baseY = probeSequence?.initialPosition.Y || 0;
    const baseZ = probeSequence?.initialPosition.Z || 0;
    
    if (machineOrientation === 'horizontal') {
      // For horizontal machines, spindle is fixed in space, X represents stage position
      // Spindle is always at a fixed X position (e.g., at the machine column)
      const spindleFixedX = machineSettings.axes.X.max; // Spindle at the far end of work area
      return [spindleFixedX, baseY, baseZ];
    } else {
      // For vertical machines, tool tip follows the probe position
      return [baseX, baseY, baseZ];
    }
  }, [probeSequence?.initialPosition, machineOrientation, machineSettings.axes.X.max]);
  
  // Calculate camera target based on pivot mode
  const cameraTarget: [number, number, number] = useMemo(() => {
    switch (pivotMode) {
      case 'origin':
        return [0, 0, 0]; // Camera pivots around the XYZ origin
      case 'tool':
      default:
        return toolPosition; // Camera pivots around the probe tip
    }
  }, [toolPosition, pivotMode]);
  
  // Handle camera preset changes
  const handleCameraPresetChange = useCallback((preset: CameraPreset) => {
    onPresetChange?.(preset);
  }, [onPresetChange]);
  
  // Handle when camera controls are ready
  const handleControlsReady = useCallback((
    setCameraPreset: (preset: CameraPreset) => void
  ) => {
    setCameraPresetFunction(() => setCameraPreset);
    // Forward to parent component
    onControlsReady?.();
  }, [onControlsReady]);
  
  // Expose preset selection to parent
  useEffect(() => {
    if (cameraPresetFunction && currentPreset) {
      cameraPresetFunction(currentPreset);
    }
  }, [currentPreset, cameraPresetFunction]);
  
  return (
    <>
      {/* Workspace group - apply rotation for horizontal machines to fix 2D orientation */}
      <group rotation={machineOrientation === 'horizontal' ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
        {/* Lighting - positioned to illuminate the negative workspace */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />
        <directionalLight position={[-10, -10, -30]} intensity={0.8} />
        <pointLight position={[workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.minZ - 20]} intensity={0.5} />
        <pointLight position={[workspaceBounds.maxX, workspaceBounds.maxY, workspaceBounds.centerZ]} intensity={0.3} />      {/* Machine table - positioned below the workspace */}
      <MachineTable 
        width={workspaceBounds.width * 1.2}
        depth={workspaceBounds.depth * 1.2}
        height={2}
        centerX={workspaceBounds.centerX}
        centerY={workspaceBounds.centerY}
        machineOrientation={machineOrientation}
        stageDimensions={stageDimensions}
        machineSettings={machineSettings}
        probeSequence={probeSequence}
      />
        {/* Coordinate system - positioned at machine origin */}
      <CoordinateAxes 
        size={Math.max(workspaceBounds.width, workspaceBounds.depth) * 0.4}
        origin={[0, 0, 0]}
      />      {/* Grid on the work plane - positioned based on machine orientation */}
      {machineOrientation === 'horizontal' ? (
        // For horizontal machines: XY plane grid at Z.min (flush with workspace min face)
        <Grid
          args={[workspaceBounds.width, workspaceBounds.depth]} // X and Y dimensions
          cellSize={machineSettings.units === 'mm' ? 10 : 0.5}
          position={[workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.minZ - 0.1]} // At Z.min face
          rotation={[Math.PI / 2, 0, 0]} // Rotate to XY plane (horizontal)
          infiniteGrid={false}
          fadeDistance={workspaceBounds.width * 2}
          fadeStrength={1}
          side={THREE.DoubleSide}
        />
      ) : (
        // For vertical machines: XY plane as the table
        <Grid
          args={[workspaceBounds.width, workspaceBounds.depth]}
          cellSize={machineSettings.units === 'mm' ? 10 : 0.5}
          position={[workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.minZ - 0.1]}
          rotation={[Math.PI / 2, 0, 0]}
          infiniteGrid={false}
          fadeDistance={workspaceBounds.width * 2}
          fadeStrength={1}
          side={THREE.DoubleSide}
        />
      )}

      {/* Solid floor for horizontal machines - XY plane at Z.min */}
      {machineOrientation === 'horizontal' && (
        <mesh position={[workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.minZ - 0.1]}>
          <planeGeometry args={[workspaceBounds.width * 1.2, workspaceBounds.depth * 1.2]} />
          <meshStandardMaterial 
            color="#2D5016" 
            transparent 
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}{/* Stock visualization - position relative to stage in horizontal mode */}
      {machineOrientation === 'horizontal' ? (
        <group>
          {/* In horizontal mode, position stock relative to stage */}          {(() => {
            const { X, Y, Z } = machineSettings.axes;
              // Calculate stage position - stage should be independent of probe position
            // For horizontal machines, when probe X = X.min, stage should be at top of range (away from spindle)
            // When probe X = X.max, stage should be at bottom of range (close to spindle)
            const probeX = probeSequence?.initialPosition.X || X.min;
            // Invert the relationship: probe X.min → stage at X.max, probe X.max → stage at X.min
            const stageX = X.max - (probeX - X.min); // Inverted mapping
            const stageY = (Y.max + Y.min) / 2; // Stage Y position (centered in Y range, fixed)
            const stageZ = (Z.max + Z.min) / 2; // Stage centered within Z bounds of work area (independent of probe Z)            // Calculate stock position - stock is attached to the X+ face of the stage (spindle side)
            // Stock position is relative to stage, so it moves when stage moves (controlled by probe X)
            const stageXPlusFace = stageX + stockSize[0]/2; // X+ face of stage (closest to spindle)
            const stockWorldX = stageXPlusFace + stockSize[0]/2 + stockPosition[0]; // Stock attached to X+ face
            const stockWorldY = stageY + stockPosition[1]; // Stock Y relative to stage center
            
            // Stock Z positioning: stockPosition[2] = 0 means stock bottom sits on stage top
            // When stockPosition[2] = 0, stock bottom should be at stage top surface
            const stageTop = stageZ + stageDimensions[2]/2; // Top surface of stage
            const stockWorldZ = stageTop + stockSize[2]/2 + stockPosition[2]; // Stock center = stage top + half stock height + offset
            
            return (
              <InteractiveStock 
                position={[stockWorldX, stockWorldY, stockWorldZ]} 
                size={stockSize}
                onPositionChange={(newPos) => {                  // Convert world position back to stage-relative position
                  if (onStockPositionChange) {
                    const stageXPlusFace = stageX + stockSize[0]/2; // Use stageDimensions consistently
                    const stageTop = stageZ + stageDimensions[2]/2;
                    const relativePos: [number, number, number] = [
                      newPos[0] - (stageXPlusFace + stockSize[0]/2), // Stock X relative to X+ face attachment
                      newPos[1] - stageY, // Stock Y relative to stage center  
                      newPos[2] - (stageTop + stockSize[2]/2) // Stock Z relative to sitting on stage top
                    ];
                    onStockPositionChange(relativePos);
                  }
                }}
                onHover={showCoordinateHover ? setHoverPosition : undefined}
              />
            );
          })()}
        </group>
      ) : (
        <InteractiveStock 
          position={stockPosition} 
          size={stockSize}
          onPositionChange={onStockPositionChange}
          onHover={showCoordinateHover ? setHoverPosition : undefined}
        />
      )}
      
      {/* Coordinate hover display */}
      {showCoordinateHover && hoverPosition && (
        <CoordinateHover position={hoverPosition} units={machineSettings.units} />
      )}
      
      {/* Enhanced axis labels */}
      {showAxisLabels && (
        <EnhancedAxisLabels workspaceBounds={workspaceBounds} units={machineSettings.units} />
      )}      {/* Tool visualization */}
      <ToolVisualization 
        position={toolPosition}
        diameter={toolDiameter}
        length={toolLength}
        onHover={showCoordinateHover ? setHoverPosition : undefined}
        machineOrientation={machineOrientation}
      />
      
      {/* Probe path visualization */}
      {probeSequence && (
        <ProbePathVisualization 
          operations={probeSequence.operations}
          initialPosition={probeSequence.initialPosition}
        />
      )}      {/* Machine workspace bounds visualization (wireframe) */}
      <mesh position={[workspaceBounds.centerX, workspaceBounds.centerY, workspaceBounds.centerZ]}>
        <boxGeometry args={[workspaceBounds.width, workspaceBounds.depth, workspaceBounds.height]} />
        <meshBasicMaterial 
          color="#00FF00" 
          wireframe 
          opacity={0.3} 
          transparent 
        />
      </mesh>
      
      {/* Camera tracker for position updates */}
      {onCameraUpdate && <CameraTracker onCameraUpdate={onCameraUpdate} />}
      </group>
      
      {/* Enhanced Controls with camera presets - outside the rotated workspace group */}
      <EnhancedOrbitControls 
        target={cameraTarget}
        machineSettings={machineSettings}
        machineOrientation={machineOrientation}
        onPresetChange={handleCameraPresetChange}
        onControlsReady={handleControlsReady}
      />
    </>
  );
};

// Camera preset types
type CameraPreset = 'home' | 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom' | 'iso1' | 'iso2';

// Enhanced OrbitControls component with camera presets
const EnhancedOrbitControls: React.FC<{
  target: [number, number, number];
  machineSettings: MachineSettings;
  machineOrientation?: 'vertical' | 'horizontal';
  onPresetChange?: (preset: CameraPreset) => void;
  onControlsReady?: (setCameraPreset: (preset: CameraPreset) => void) => void;
}> = ({ target, machineSettings, machineOrientation = 'horizontal', onPresetChange, onControlsReady }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  const setCameraPreset = useCallback((preset: CameraPreset) => {
    if (!controlsRef.current) return;
    
    const { X, Y, Z } = machineSettings.axes;
    const workspaceBounds = {
      width: Math.abs(X.max - X.min),
      depth: Math.abs(Y.max - Y.min),
      height: Math.abs(Z.max - Z.min),
      centerX: (X.max + X.min) / 2,
      centerY: (Y.max + Y.min) / 2,
      centerZ: (Z.max + Z.min) / 2,
    };
    
    // Calculate appropriate distance based on workspace size
    const maxDimension = Math.max(workspaceBounds.width, workspaceBounds.depth, workspaceBounds.height);
    const distance = maxDimension * 1.5; // Dynamic distance based on workspace size
    
    const targetVec = new THREE.Vector3(...target);
    let newPosition = new THREE.Vector3();
    
    switch (preset) {
      case 'home':
        if (machineOrientation === 'horizontal') {
          // For horizontal machines, position camera at the front of the machine looking down at the stage
          // Y is vertical axis, position camera well above the workspace for natural top-down view
          newPosition.set(
            workspaceBounds.centerX - distance * 0.7,  // From negative X side (front of machine, looking toward spindle)
            Y.max + distance * 0.8,                    // Well above the workspace for top-down view
            workspaceBounds.centerZ - distance * 0.3   // Slightly toward negative Z to look down at the stage
          );
        } else {
          // For vertical machines, standard isometric view
          newPosition.set(
            workspaceBounds.centerX + distance * 0.7,
            workspaceBounds.centerY - distance * 0.7,
            workspaceBounds.centerZ + distance * 0.7
          );
        }
        break;
      case 'front':
        // Look from the front
        if (machineOrientation === 'horizontal') {
          // For horizontal: front means looking along +Z direction from negative Z
          newPosition.set(workspaceBounds.centerX, Y.min - distance * 0.3, Z.min - distance);
        } else {
          // For vertical: front means looking along -Y direction
          newPosition.set(workspaceBounds.centerX, Y.min - distance, workspaceBounds.centerZ);
        }
        break;
      case 'back':
        // Look from the back
        if (machineOrientation === 'horizontal') {
          // For horizontal: back means looking along -Z direction from positive Z
          newPosition.set(workspaceBounds.centerX, Y.min - distance * 0.3, Z.max + distance);
        } else {
          // For vertical: back means looking along +Y direction
          newPosition.set(workspaceBounds.centerX, Y.max + distance, workspaceBounds.centerZ);
        }
        break;
      case 'right':
        // Look from the right
        if (machineOrientation === 'horizontal') {
          // For horizontal: right means looking along -X direction from positive X
          newPosition.set(X.max + distance, Y.min - distance * 0.8, workspaceBounds.centerZ);
        } else {
          // For vertical: right means looking along +X direction
          newPosition.set(X.max + distance, workspaceBounds.centerY, workspaceBounds.centerZ);
        }
        break;
      case 'left':
        // Look from the left
        if (machineOrientation === 'horizontal') {
          // For horizontal: left means looking along +X direction from negative X
          newPosition.set(X.min - distance, Y.min - distance * 0.8, workspaceBounds.centerZ);
        } else {
          // For vertical: left means looking along -X direction
          newPosition.set(X.min - distance, workspaceBounds.centerY, workspaceBounds.centerZ);
        }
        break;
      case 'top':
        // Look from above
        if (machineOrientation === 'horizontal') {
          // For horizontal: top means looking down at XZ plane from +Y direction
          newPosition.set(workspaceBounds.centerX, Y.max + distance, workspaceBounds.centerZ);
        } else {
          // For vertical: top means looking down from +Z direction
          newPosition.set(workspaceBounds.centerX, workspaceBounds.centerY, Z.max + distance);
        }
        break;
      case 'bottom':
        // Look from below
        if (machineOrientation === 'horizontal') {
          // For horizontal: bottom means looking up at XZ plane from -Y direction
          newPosition.set(workspaceBounds.centerX, Y.min - distance, workspaceBounds.centerZ);
        } else {
          // For vertical: bottom means looking up from -Z direction
          newPosition.set(workspaceBounds.centerX, workspaceBounds.centerY, Z.min - distance);
        }
        break;
      case 'iso1':
        // Isometric view 1
        if (machineOrientation === 'horizontal') {
          // For horizontal: isometric view of XZ plane from above and to the side
          newPosition.set(
            X.max + distance * 0.7,   // From positive X side
            Y.max + distance * 0.7,   // From above (positive Y)
            Z.min - distance * 0.7    // From negative Z side
          );
        } else {
          // For vertical: traditional isometric view
          newPosition.set(
            X.max + distance * 0.7,
            Y.min - distance * 0.7,
            Z.max + distance * 0.7
          );
        }
        break;
      case 'iso2':
        // Isometric view 2
        if (machineOrientation === 'horizontal') {
          // For horizontal: alternate isometric view of XZ plane
          newPosition.set(
            X.min - distance * 0.7,   // From negative X side
            Y.max + distance * 0.7,   // From above (positive Y)
            Z.max + distance * 0.7    // From positive Z side
          );
        } else {
          // For vertical: alternate traditional isometric view
          newPosition.set(
            X.min - distance * 0.7,
            Y.max + distance * 0.7,
            Z.max + distance * 0.7
          );
        }
        break;
    }
    
    // Smooth camera transition
    const startPosition = camera.position.clone();
    const startTime = Date.now();
    const duration = 1000; // 1 second transition
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      camera.position.lerpVectors(startPosition, newPosition, easedProgress);
      camera.lookAt(targetVec);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        controlsRef.current.target.copy(targetVec);
        controlsRef.current.update();
      }
    };
    
    animate();
    onPresetChange?.(preset);
  }, [camera, target, onPresetChange, machineSettings, machineOrientation]);
  
  // Calculate dynamic max distance based on machine workspace
  const maxDistance = useMemo(() => {
    const { X, Y, Z } = machineSettings.axes;
    const maxDimension = Math.max(
      Math.abs(X.max - X.min),
      Math.abs(Y.max - Y.min),
      Math.abs(Z.max - Z.min)
    );
    return maxDimension * 1.25;
  }, [machineSettings.axes]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...target);
      
      // For horizontal machines, change the camera's up vector to make Y the vertical axis
      // This makes horizontal mouse movement rotate around Y axis naturally
      if (machineOrientation === 'horizontal') {
        camera.up.set(0, 0, -1); // z- is up for horizontal machines
      } else {
        camera.up.set(0, 0, 1); // Z is up for vertical machines (default)
      }
      
      controlsRef.current.update();
    }
    // Notify parent that controls are ready
    if (onControlsReady) {
      onControlsReady(setCameraPreset);
    }
  }, [target, onControlsReady, machineOrientation, camera]);
  
  return (
    <OrbitControls 
      ref={controlsRef}
      target={target}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.05}
      maxPolarAngle={Math.PI}
      minDistance={5}
      maxDistance={maxDistance}
      zoomSpeed={0.8}
      rotateSpeed={0.5}
      panSpeed={0.8}
    />
  );
};

// Camera preset buttons component
const CameraPresets: React.FC<{
  onPresetSelect: (preset: CameraPreset) => void;
  currentPreset?: CameraPreset;
  pivotMode: 'tool' | 'origin';
  onPivotModeChange: (mode: 'tool' | 'origin') => void;
}> = ({ onPresetSelect, currentPreset, pivotMode, onPivotModeChange }) => {
  const presets = [
    { key: 'home' as const, label: 'Home', icon: '🏠' },
    { key: 'front' as const, label: 'Front', icon: '⬇️' },
    { key: 'back' as const, label: 'Back', icon: '⬆️' },
    { key: 'right' as const, label: 'Right', icon: '➡️' },
    { key: 'left' as const, label: 'Left', icon: '⬅️' },
    { key: 'top' as const, label: 'Top', icon: '⬆️' },
    { key: 'bottom' as const, label: 'Bottom', icon: '⬇️' },
    { key: 'iso1' as const, label: 'ISO 1', icon: '📐' },
    { key: 'iso2' as const, label: 'ISO 2', icon: '📏' }
  ];
  
  return (
    <div className="absolute top-4 right-4 z-10 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
      <div className="text-xs text-gray-300 mb-2 font-semibold">Camera Views</div>
      <div className="grid grid-cols-3 gap-1">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => onPresetSelect(preset.key)}
            className={`px-2 py-1 text-xs rounded transition-all duration-200 flex flex-col items-center gap-1 min-w-[60px] ${
              currentPreset === preset.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
            title={preset.label}
          >
            <span className="text-sm">{preset.icon}</span>
            <span className="text-[10px] font-mono">{preset.label}</span>
          </button>
        ))}
      </div>
      

      
      {/* Pivot Point Controls */}
      <div className="mt-3 pt-3 border-t border-gray-600">
        <div className="text-xs text-gray-300 mb-2 font-semibold">Camera Pivot</div>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => onPivotModeChange('tool')}
            className={`px-2 py-1 text-xs rounded transition-all duration-200 flex flex-col items-center gap-0.5 ${
              pivotMode === 'tool'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
            title="Pivot around probe tool tip"
          >
            <span className="text-sm">🔧</span>
            <span className="text-[10px] font-mono">Tool Tip</span>
          </button>
          <button
            onClick={() => onPivotModeChange('origin')}
            className={`px-2 py-1 text-xs rounded transition-all duration-200 flex flex-col items-center gap-0.5 ${
              pivotMode === 'origin'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
            title="Pivot around XYZ origin (0,0,0)"
          >
            <span className="text-sm">⊕</span>
            <span className="text-[10px] font-mono">Origin</span>
          </button>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-[10px] text-gray-400 text-center">
          Scroll: Zoom • Drag: Rotate • Shift+Drag: Pan
        </div>
      </div>
    </div>
  );
};
// Camera coordinate display component (renders outside Canvas)
const CameraCoordinateDisplay: React.FC<{
  units: string;
  cameraPosition: { x: number; y: number; z: number };
}> = ({ units, cameraPosition }) => {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      <div className="text-xs text-gray-300 mb-2 font-semibold">Camera Position</div>
      <div className="space-y-1 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-medium">X:</span>
          <span className="text-white min-w-[60px] text-right">{cameraPosition.x.toFixed(1)}</span>
          <span className="text-gray-400">{units}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-medium">Y:</span>
          <span className="text-white min-w-[60px] text-right">{cameraPosition.y.toFixed(1)}</span>
          <span className="text-gray-400">{units}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-medium">Z:</span>
          <span className="text-white min-w-[60px] text-right">{cameraPosition.z.toFixed(1)}</span>
          <span className="text-gray-400">{units}</span>
        </div>
      </div>
    </div>
  );
};

// Camera tracker component (renders inside Canvas to access camera)
const CameraTracker: React.FC<{
  onCameraUpdate: (position: { x: number; y: number; z: number }) => void;
}> = ({ onCameraUpdate }) => {
  const { camera } = useThree();
  
  useFrame(() => {
    // Update camera position every frame
    onCameraUpdate({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });
  });
  
  return null; // This component doesn't render anything
};
// Main component
const Machine3DVisualization: React.FC<Machine3DVisualizationProps> = ({
  machineSettings,
  probeSequence,
  className = "",
  height = "600px",
  stockSize: providedStockSize,
  stockPosition: providedStockPosition,
  onStockPositionChange,
  showAxisLabels = true,
  showCoordinateHover = true,
  machineOrientation = 'horizontal',
  stageDimensions = [12.7, 304.8, 63.5]
}) => {
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>('home');
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  
  // Camera pivot mode state
  const [pivotMode, setPivotMode] = useState<'tool' | 'origin'>('tool');
  
  // Handle pivot mode changes
  const handlePivotModeChange = useCallback((mode: 'tool' | 'origin') => {
    setPivotMode(mode);
  }, []);
  
  // Handle camera position updates from inside the Canvas
  const handleCameraUpdate = useCallback((position: { x: number; y: number; z: number }) => {
    setCameraPosition(position);
  }, []);
  
  // Handle camera controls ready callback - simplified since we removed rotation controls
  const handleControlsReady = useCallback(() => {
    // Camera controls are ready
  }, []);
  
  // Calculate default stock size and position based on machine settings
  const { stockSize, stockPosition } = useMemo(() => {
    const { X, Y, Z } = machineSettings.axes;
    
    // Default stock size if not provided
    const defaultStockSize: [number, number, number] = providedStockSize || [25, 25, 10];
      // Calculate stock position if not provided
    let calculatedStockPosition: [number, number, number];
    
    if (providedStockPosition) {
      calculatedStockPosition = providedStockPosition;
    } else {
      if (machineOrientation === 'horizontal') {
        // For horizontal machines: stock position is relative to stage
        // Default: stock sitting on stage top, centered in Y, at Z.min in world coordinates
        const stockX = 0; // Relative to stage X+ face (attachment point)
        const stockY = 0; // Relative to stage center in Y
        const stockZ = 0; // Relative to stage top surface (stock bottom sits on stage)
        
        calculatedStockPosition = [stockX, stockY, stockZ];
      } else {
        // Traditional vertical machine positioning
        const stockX = X.min + (Math.abs(X.max - X.min) * 0.3); // 30% from min X
        const stockY = (Y.max + Y.min) / 2; // Center on Y axis
        const stockZ = Z.min + defaultStockSize[2] / 2; // Stock bottom at Z.min, center at half height
        
        calculatedStockPosition = [stockX, stockY, stockZ];
      }
    }
    
    return {
      stockSize: defaultStockSize,
      stockPosition: calculatedStockPosition
    };
  }, [machineSettings.axes, providedStockSize, providedStockPosition, machineOrientation]);
  
  // Calculate initial camera position based on machine coordinates
  const initialCameraPosition = useMemo(() => {
    const { X, Y, Z } = machineSettings.axes;
    const maxDimension = Math.max(
      Math.abs(X.max - X.min),
      Math.abs(Y.max - Y.min),
      Math.abs(Z.max - Z.min)
    );
    const distance = maxDimension * 1.5;
    
    if (machineOrientation === 'horizontal') {
      // For horizontal machines, position camera at the front looking toward the spindle
      // Match the "home" preset positioning for consistency
      const centerX = (X.max + X.min) / 2;
      const centerZ = (Z.max + Z.min) / 2;
      return [
        centerX - distance * 0.7,  // From negative X side (front of machine, looking toward spindle)
        Y.max + distance * 0.8,    // Above in Y (vertical for horizontal machines)
        centerZ - distance * 0.3   // Slightly toward negative Z to match home preset
      ] as [number, number, number];
    } else {
      // For vertical machines, standard isometric view
      const centerX = (X.max + X.min) / 2;
      const centerY = (Y.max + Y.min) / 2;
      const centerZ = (Z.max + Z.min) / 2;
      return [
        centerX + distance * 0.7,
        centerY - distance * 0.7,
        centerZ + distance * 0.7
      ] as [number, number, number];
    }
  }, [machineSettings.axes, machineOrientation]);  return (
    <ResizablePanelGroup 
      direction="vertical" 
      className={`w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      <ResizablePanel defaultSize={100} minSize={30}>
        <div className="w-full h-full relative">
          <CameraPresets 
            onPresetSelect={setCurrentPreset}
            currentPreset={currentPreset}
            pivotMode={pivotMode}
            onPivotModeChange={handlePivotModeChange}
          />
          <Canvas
            camera={{ 
              position: initialCameraPosition,
              fov: 60,
              near: 0.1,
              far: 1000
            }}
            style={{ background: '#1a1a1a', width: '100%', height: '100%' }}
          >
            <Scene3D 
              machineSettings={machineSettings} 
              probeSequence={probeSequence}
              stockSize={stockSize}
              stockPosition={stockPosition}
              onStockPositionChange={onStockPositionChange}
              showAxisLabels={showAxisLabels}
              showCoordinateHover={showCoordinateHover}
              machineOrientation={machineOrientation}
              stageDimensions={stageDimensions}
              currentPreset={currentPreset}
              onPresetChange={setCurrentPreset}
              onCameraUpdate={handleCameraUpdate}
              onControlsReady={handleControlsReady}
              pivotMode={pivotMode}
            />
          </Canvas>
          <CameraCoordinateDisplay 
            units={machineSettings.units} 
            cameraPosition={cameraPosition}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Machine3DVisualization;
