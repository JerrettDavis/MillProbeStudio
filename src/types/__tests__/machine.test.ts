import { describe, it, expect } from 'vitest';
import type {
  AxisConfig,
  MachineSettings,
  ProbeSequenceSettings,
  ProbeOperation,
  MovementStep
} from '../machine';

describe('Machine Types', () => {
  describe('AxisConfig interface', () => {
    it('should define proper AxisConfig structure', () => {
      const axisConfig: AxisConfig = {
        positiveDirection: '+X',
        negativeDirection: '-X',
        polarity: 1,
        min: -100,
        max: 100
      };

      expect(axisConfig.positiveDirection).toBe('+X');
      expect(axisConfig.negativeDirection).toBe('-X');
      expect(axisConfig.polarity).toBe(1);
      expect(axisConfig.min).toBe(-100);
      expect(axisConfig.max).toBe(100);
    });

    it('should allow negative polarity', () => {
      const axisConfig: AxisConfig = {
        positiveDirection: '+Y',
        negativeDirection: '-Y',
        polarity: -1,
        min: 0,
        max: 200
      };

      expect(axisConfig.polarity).toBe(-1);
    });
  });

  describe('MachineSettings interface', () => {
    it('should define proper MachineSettings structure', () => {
      const machineSettings: MachineSettings = {
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
            min: -50,
            max: 150
          },
          Z: {
            positiveDirection: '+Z',
            negativeDirection: '-Z',
            polarity: -1,
            min: 0,
            max: 75
          }
        },
        machineOrientation: 'horizontal',
        stageDimensions: [12.7, 304.8, 63.5]
      };

      expect(machineSettings.units).toBe('mm');
      expect(machineSettings.machineOrientation).toBe('horizontal');
      expect(machineSettings.stageDimensions).toEqual([12.7, 304.8, 63.5]);
      expect(machineSettings.axes.X.polarity).toBe(1);
      expect(machineSettings.axes.Z.polarity).toBe(-1);
    });

    it('should allow inch units', () => {
      const machineSettings: MachineSettings = {
        units: 'inch',
        axes: {
          X: { positiveDirection: '+X', negativeDirection: '-X', polarity: 1, min: 0, max: 10 },
          Y: { positiveDirection: '+Y', negativeDirection: '-Y', polarity: 1, min: 0, max: 10 },
          Z: { positiveDirection: '+Z', negativeDirection: '-Z', polarity: 1, min: 0, max: 10 }
        },
        machineOrientation: 'vertical',
        stageDimensions: [1, 2, 3]
      };

      expect(machineSettings.units).toBe('inch');
      expect(machineSettings.machineOrientation).toBe('vertical');
    });
  });

  describe('ProbeSequenceSettings interface', () => {
    it('should define proper ProbeSequenceSettings structure', () => {
      const probeSettings: ProbeSequenceSettings = {
        initialPosition: { X: 10, Y: 20, Z: 5 },
        dwellsBeforeProbe: 2,
        spindleSpeed: 1000,
        units: 'mm',
        endmillSize: {
          input: '1/4',
          unit: 'fraction',
          sizeInMM: 6.35
        },
        operations: []
      };

      expect(probeSettings.initialPosition).toEqual({ X: 10, Y: 20, Z: 5 });
      expect(probeSettings.dwellsBeforeProbe).toBe(2);
      expect(probeSettings.spindleSpeed).toBe(1000);
      expect(probeSettings.units).toBe('mm');
      expect(probeSettings.endmillSize.unit).toBe('fraction');
      expect(probeSettings.endmillSize.sizeInMM).toBe(6.35);
    });

    it('should allow different endmill units', () => {
      const probeSettings: ProbeSequenceSettings = {
        initialPosition: { X: 0, Y: 0, Z: 0 },
        dwellsBeforeProbe: 1,
        spindleSpeed: 500,
        units: 'inch',
        endmillSize: {
          input: '6.35',
          unit: 'mm',
          sizeInMM: 6.35
        },
        operations: []
      };

      expect(probeSettings.endmillSize.unit).toBe('mm');
      expect(probeSettings.units).toBe('inch');
    });

    it('should allow inch endmill unit', () => {
      const probeSettings: ProbeSequenceSettings = {
        initialPosition: { X: 0, Y: 0, Z: 0 },
        dwellsBeforeProbe: 1,
        spindleSpeed: 500,
        units: 'mm',
        endmillSize: {
          input: '0.25',
          unit: 'inch',
          sizeInMM: 6.35
        },
        operations: []
      };

      expect(probeSettings.endmillSize.unit).toBe('inch');
    });
  });

  describe('ProbeOperation interface', () => {
    it('should define proper ProbeOperation structure', () => {
      const probeOp: ProbeOperation = {
        id: 'probe-1',
        axis: 'X',
        direction: 1,
        distance: 10,
        feedRate: 50,
        backoffDistance: 2,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      };

      expect(probeOp.id).toBe('probe-1');
      expect(probeOp.axis).toBe('X');
      expect(probeOp.direction).toBe(1);
      expect(probeOp.distance).toBe(10);
      expect(probeOp.feedRate).toBe(50);
      expect(probeOp.backoffDistance).toBe(2);
      expect(probeOp.wcsOffset).toBe(0);
      expect(Array.isArray(probeOp.preMoves)).toBe(true);
      expect(Array.isArray(probeOp.postMoves)).toBe(true);
    });

    it('should allow different axes and negative direction', () => {
      const probeOpY: ProbeOperation = {
        id: 'probe-y',
        axis: 'Y',
        direction: -1,
        distance: 5,
        feedRate: 25,
        backoffDistance: 1,
        wcsOffset: -5,
        preMoves: [],
        postMoves: []
      };

      expect(probeOpY.axis).toBe('Y');
      expect(probeOpY.direction).toBe(-1);
      expect(probeOpY.wcsOffset).toBe(-5);

      const probeOpZ: ProbeOperation = {
        id: 'probe-z',
        axis: 'Z',
        direction: 1,
        distance: 15,
        feedRate: 75,
        backoffDistance: 3,
        wcsOffset: 10,
        preMoves: [],
        postMoves: []
      };

      expect(probeOpZ.axis).toBe('Z');
    });
  });

  describe('MovementStep interface', () => {
    it('should define proper MovementStep structure for rapid moves', () => {
      const rapidMove: MovementStep = {
        id: 'move-1',
        type: 'rapid',
        description: 'Move to safe position',
        axesValues: { X: -5.5, Y: -4 },
        positionMode: 'absolute',
        coordinateSystem: 'wcs'
      };

      expect(rapidMove.id).toBe('move-1');
      expect(rapidMove.type).toBe('rapid');
      expect(rapidMove.description).toBe('Move to safe position');
      expect(rapidMove.axesValues).toEqual({ X: -5.5, Y: -4 });
      expect(rapidMove.positionMode).toBe('absolute');
      expect(rapidMove.coordinateSystem).toBe('wcs');
      expect(rapidMove.dwellTime).toBeUndefined();
    });

    it('should define proper MovementStep structure for dwell moves', () => {
      const dwellMove: MovementStep = {
        id: 'dwell-1',
        type: 'dwell',
        description: 'Pause for spindle speed',
        dwellTime: 2.5
      };

      expect(dwellMove.id).toBe('dwell-1');
      expect(dwellMove.type).toBe('dwell');
      expect(dwellMove.description).toBe('Pause for spindle speed');
      expect(dwellMove.dwellTime).toBe(2.5);
      expect(dwellMove.axesValues).toBeUndefined();
      expect(dwellMove.positionMode).toBeUndefined();
      expect(dwellMove.coordinateSystem).toBeUndefined();
    });

    it('should allow different position modes and coordinate systems', () => {
      const relativeMove: MovementStep = {
        id: 'rel-move',
        type: 'rapid',
        description: 'Relative movement',
        axesValues: { Z: 10 },
        positionMode: 'relative',
        coordinateSystem: 'machine'
      };

      expect(relativeMove.positionMode).toBe('relative');
      expect(relativeMove.coordinateSystem).toBe('machine');

      const noneMove: MovementStep = {
        id: 'none-move',
        type: 'rapid',
        description: 'Unspecified movement',
        axesValues: { X: 0, Y: 0 },
        positionMode: 'none',
        coordinateSystem: 'none'
      };

      expect(noneMove.positionMode).toBe('none');
      expect(noneMove.coordinateSystem).toBe('none');
    });
  });

  describe('Complete ProbeSequenceSettings with operations and moves', () => {
    it('should work with complex nested structure', () => {
      const complexProbeSettings: ProbeSequenceSettings = {
        initialPosition: { X: 0, Y: 0, Z: 10 },
        dwellsBeforeProbe: 3,
        spindleSpeed: 12000,
        units: 'mm',
        endmillSize: {
          input: '1/8',
          unit: 'fraction',
          sizeInMM: 3.175
        },
        operations: [
          {
            id: 'x-probe',
            axis: 'X',
            direction: 1,
            distance: 20,
            feedRate: 100,
            backoffDistance: 2,
            wcsOffset: 0,
            preMoves: [
              {
                id: 'pre-rapid',
                type: 'rapid',
                description: 'Move to start position',
                axesValues: { X: -10, Y: 0, Z: 5 },
                positionMode: 'absolute',
                coordinateSystem: 'wcs'
              },
              {
                id: 'pre-dwell',
                type: 'dwell',
                description: 'Wait for stability',
                dwellTime: 1.0
              }
            ],
            postMoves: [
              {
                id: 'post-rapid',
                type: 'rapid',
                description: 'Retract after probe',
                axesValues: { Z: 10 },
                positionMode: 'relative',
                coordinateSystem: 'none'
              }
            ]
          }
        ]
      };

      expect(complexProbeSettings.operations).toHaveLength(1);
      expect(complexProbeSettings.operations[0].preMoves).toHaveLength(2);
      expect(complexProbeSettings.operations[0].postMoves).toHaveLength(1);
      expect(complexProbeSettings.operations[0].preMoves[0].type).toBe('rapid');
      expect(complexProbeSettings.operations[0].preMoves[1].type).toBe('dwell');
      expect(complexProbeSettings.operations[0].postMoves[0].axesValues).toEqual({ Z: 10 });
    });
  });
});
