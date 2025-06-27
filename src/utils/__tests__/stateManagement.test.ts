import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProbeSequenceState, useProbeSequenceSettings, createImportHandler, parseToolSize } from '../stateManagement';
import type { ProbeOperation, ProbeSequenceSettings } from '@/types/machine';

describe('useProbeSequenceState', () => {
  const initialSequence: ProbeOperation[] = [
    { id: 'probe-1', axis: 'X', direction: 1, distance: 10, feedRate: 5, backoffDistance: 1, wcsOffset: 0, preMoves: [], postMoves: [] },
  ];
  it('adds a probe operation', () => {
    const setProbeSequence = vi.fn();
    const { result } = renderHook(() => useProbeSequenceState(initialSequence, setProbeSequence));
    act(() => {
      result.current.addProbe({ axis: 'Y' });
    });
    expect(setProbeSequence).toHaveBeenCalled();
    const added = setProbeSequence.mock.calls[0][0];
    expect(added.length).toBe(2);
    expect(added[1].axis).toBe('Y');
  });

  it('updates a probe operation', () => {
    const setProbeSequence = vi.fn();
    const { result } = renderHook(() => useProbeSequenceState(initialSequence, setProbeSequence));
    act(() => {
      result.current.updateProbe('probe-1', { distance: 20 });
    });
    expect(setProbeSequence).toHaveBeenCalled();
  });

  it('removes a probe operation', () => {
    const setProbeSequence = vi.fn();
    const { result } = renderHook(() => useProbeSequenceState(initialSequence, setProbeSequence));
    act(() => {
      result.current.removeProbe('probe-1');
    });
    expect(setProbeSequence).toHaveBeenCalledWith([]);
  });
});

describe('useProbeSequenceState (movements)', () => {
  const probeWithMoves = [
    {
      id: 'probe-1',
      axis: 'X' as const,
      direction: 1 as const,
      distance: 10,
      feedRate: 5,
      backoffDistance: 1,
      wcsOffset: 0,
      preMoves: [{ id: 'move-1', type: 'rapid' as const, description: 'desc', axesValues: { X: 1 }, positionMode: 'relative' as const, coordinateSystem: 'none' as const }],
      postMoves: [],
    },
  ];
  it('updates a movement step', () => {
    const setProbeSequence = vi.fn();
    const { result } = renderHook(() => useProbeSequenceState(probeWithMoves, setProbeSequence));
    act(() => {
      result.current.updateMovement('probe-1', 'move-1', 'preMoves', { description: 'updated' });
    });
    expect(setProbeSequence).toHaveBeenCalled();
  });
  it('removes a movement step', () => {
    const setProbeSequence = vi.fn();
    const { result } = renderHook(() => useProbeSequenceState(probeWithMoves, setProbeSequence));
    act(() => {
      result.current.removeMovement('probe-1', 'move-1', 'preMoves');
    });
    expect(setProbeSequence).toHaveBeenCalled();
  });
  it('addMovement adds to correct probe and moveType', () => {
    const setProbeSequence = vi.fn();
    const probeSequence = [
      {
        id: 'probe-1',
        axis: 'X' as const,
        direction: 1 as const,
        distance: 10,
        feedRate: 5,
        backoffDistance: 1,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      },
      {
        id: 'probe-2',
        axis: 'Y' as const,
        direction: -1 as -1,
        distance: 5,
        feedRate: 2,
        backoffDistance: 1,
        wcsOffset: 0,
        preMoves: [],
        postMoves: []
      }
    ];
    const { result } = renderHook(() => useProbeSequenceState(probeSequence, setProbeSequence));
    act(() => {
      result.current.addMovement('probe-2', 'postMoves', { description: 'custom' });
    });
    expect(setProbeSequence).toHaveBeenCalledWith([
      probeSequence[0],
      expect.objectContaining({
        id: 'probe-2',
        postMoves: [expect.objectContaining({ description: 'custom' })]
      })
    ]);
  });
});

describe('useProbeSequenceSettings', () => {
  const initialSettings: ProbeSequenceSettings = {
    initialPosition: { X: 0, Y: 0, Z: 0 },
    dwellsBeforeProbe: 0,
    spindleSpeed: 0,
    units: 'mm',
    endmillSize: { input: '1/4', unit: 'fraction', sizeInMM: 6.35 },
    operations: [],
  };
  it('updates initial position', () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() => useProbeSequenceSettings(initialSettings, setSettings));
    act(() => {
      result.current.updateInitialPosition('X', 10);
    });
    expect(setSettings).toHaveBeenCalledWith({ ...initialSettings, initialPosition: { ...initialSettings.initialPosition, X: 10 } });
  });
  it('updates spindle speed', () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() => useProbeSequenceSettings(initialSettings, setSettings));
    act(() => {
      result.current.updateSpindleSpeed(5000);
    });
    expect(setSettings).toHaveBeenCalledWith({ ...initialSettings, spindleSpeed: 5000 });
  });
});

describe('useProbeSequenceSettings (all callbacks)', () => {
  const initialSettings: ProbeSequenceSettings = {
    initialPosition: { X: 0, Y: 0, Z: 0 },
    dwellsBeforeProbe: 0,
    spindleSpeed: 0,
    units: 'mm',
    endmillSize: { input: '1/4', unit: 'fraction', sizeInMM: 6.35 },
    operations: [],
  };
  it('updates dwellsBeforeProbe', () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() => useProbeSequenceSettings(initialSettings, setSettings));
    act(() => {
      result.current.updateDwellsBeforeProbe(3);
    });
    expect(setSettings).toHaveBeenCalledWith({ ...initialSettings, dwellsBeforeProbe: 3 });
  });
  it('updates units', () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() => useProbeSequenceSettings(initialSettings, setSettings));
    act(() => {
      result.current.updateUnits('inch');
    });
    expect(setSettings).toHaveBeenCalledWith({ ...initialSettings, units: 'inch' });
  });
  it('updates endmill size (fraction)', () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() => useProbeSequenceSettings(initialSettings, setSettings));
    act(() => {
      result.current.updateEndmillSize('1/2', 'fraction');
    });
    expect(setSettings).toHaveBeenCalledWith(expect.objectContaining({ endmillSize: expect.objectContaining({ sizeInMM: 12.7 }) }));
  });
  it('updates endmill size (inch)', () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() => useProbeSequenceSettings(initialSettings, setSettings));
    act(() => {
      result.current.updateEndmillSize('2', 'inch');
    });
    expect(setSettings).toHaveBeenCalledWith(expect.objectContaining({ endmillSize: expect.objectContaining({ sizeInMM: 50.8 }) }));
  });
  it('updates endmill size (mm)', () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() => useProbeSequenceSettings(initialSettings, setSettings));
    act(() => {
      result.current.updateEndmillSize('10', 'mm');
    });
    expect(setSettings).toHaveBeenCalledWith(expect.objectContaining({ endmillSize: expect.objectContaining({ sizeInMM: 10 }) }));
  });
  it('updates endmill size (invalid fraction)', () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() => useProbeSequenceSettings(initialSettings, setSettings));
    act(() => {
      result.current.updateEndmillSize('bad', 'fraction');
    });
    expect(setSettings).toHaveBeenCalledWith(expect.objectContaining({ endmillSize: expect.objectContaining({ sizeInMM: 0 }) }));
  });
  it('updateMultiple merges updates', () => {
    const setSettings = vi.fn();
    const { result } = renderHook(() => useProbeSequenceSettings(initialSettings, setSettings));
    act(() => {
      result.current.updateMultiple({ spindleSpeed: 123 });
    });
    expect(setSettings).toHaveBeenCalledWith({ ...initialSettings, spindleSpeed: 123 });
  });
});

describe('createImportHandler', () => {
  it('applies import result to all state setters', () => {
    const setProbeSequence = vi.fn();
    const setProbeSequenceSettings = vi.fn();
    const setMachineSettings = vi.fn();
    const setImportCounter = vi.fn();
    const handler = createImportHandler(setProbeSequence, setProbeSequenceSettings, setMachineSettings, setImportCounter);
    handler({
      probeSequence: [{ id: 'probe-1', axis: 'X', direction: 1, distance: 10, feedRate: 5, backoffDistance: 1, wcsOffset: 0, preMoves: [], postMoves: [] }],
      initialPosition: { X: 1, Y: 2, Z: 3 },
      dwellsBeforeProbe: 2,
      spindleSpeed: 1000,
      units: 'inch',
    });
    expect(setProbeSequence).toHaveBeenCalled();
    expect(setProbeSequenceSettings).toHaveBeenCalled();
    expect(setMachineSettings).toHaveBeenCalled();
    expect(setImportCounter).toHaveBeenCalled();
  });
  it('handles missing optional fields', () => {
    const setProbeSequence = vi.fn();
    const setProbeSequenceSettings = vi.fn();
    const setMachineSettings = vi.fn();
    const setImportCounter = vi.fn();
    const handler = createImportHandler(setProbeSequence, setProbeSequenceSettings, setMachineSettings, setImportCounter);
    handler({ probeSequence: [] });
    expect(setProbeSequence).toHaveBeenCalledWith([]);
    expect(setProbeSequenceSettings).not.toHaveBeenCalled();
    expect(setMachineSettings).not.toHaveBeenCalled();
    expect(setImportCounter).toHaveBeenCalled();
  });
});

describe('parseToolSize (default branch)', () => {
  it('returns 0 for unknown unit', () => {
    expect(parseToolSize('5', 'unknown' as any)).toBe(0);
  });
});
