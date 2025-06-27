import { describe, it, expect, vi } from 'vitest';
import { createStateUpdater, validators, arrays, objects, compose, conditionally, generateId, eventHandlers } from '../functional';

describe('validators', () => {
  it('number clamps to min/max', () => {
    expect(validators.number('5', 0, 10)).toBe(5);
    expect(validators.number('-5', 0, 10)).toBe(0);
    expect(validators.number('15', 0, 10)).toBe(10);
    expect(validators.number('abc', 0, 10)).toBe(0);
  });
  it('clamp handles negative ranges', () => {
    expect(validators.clamp(-10, -20, -5)).toBe(-10);
    expect(validators.clamp(-30, -20, -5)).toBe(-20);
    expect(validators.clamp(0, -20, -5)).toBe(-5);
  });
  it('parseFloat returns fallback for invalid', () => {
    expect(validators.parseFloat('abc', 42)).toBe(42);
    expect(validators.parseFloat('3.14')).toBeCloseTo(3.14);
  });
  it('isValidNumber works', () => {
    expect(validators.isValidNumber('123')).toBe(true);
    expect(validators.isValidNumber('abc')).toBe(false);
  });
});

describe('arrays', () => {
  it('updateAt updates correct index', () => {
    expect(arrays.updateAt([1,2,3], 1, 9)).toEqual([1,9,3]);
  });
  it('removeAt removes correct index', () => {
    expect(arrays.removeAt([1,2,3], 1)).toEqual([1,3]);
  });
  it('move reorders array', () => {
    expect(arrays.move([1,2,3], 0, 2)).toEqual([2,3,1]);
  });
  it('findByProperty finds item', () => {
    expect(arrays.findByProperty([{id:1},{id:2}], 'id', 2)).toEqual({id:2});
  });
  it('updateByProperty updates item', () => {
    expect(arrays.updateByProperty([{id:1,a:1},{id:2,a:2}], 'id', 2, {a:9})).toEqual([{id:1,a:1},{id:2,a:9}]);
  });
});

describe('objects', () => {
  it('pick selects keys', () => {
    expect(objects.pick({a:1,b:2}, ['a'])).toEqual({a:1});
  });
  it('omit removes keys', () => {
    expect(objects.omit({a:1,b:2}, ['a'])).toEqual({b:2});
  });
  it('mapValues maps values', () => {
    expect(objects.mapValues({a:1,b:2}, v => v*2)).toEqual({a:2,b:4});
  });
  it('isEmpty checks for empty', () => {
    expect(objects.isEmpty({})).toBe(true);
    expect(objects.isEmpty({a:1})).toBe(false);
  });
});

describe('compose', () => {
  it('pipe composes functions', () => {
    const add1 = (x:number) => x+1;
    const mul2 = (x:number) => x*2;
    expect(compose.pipe(add1, mul2)(3)).toBe(8);
  });
  it('debounce and throttle are callable', () => {
    const fn = vi.fn();
    const debounced = compose.debounce(fn, 10);
    debounced('a');
    const throttled = compose.throttle(fn, 10);
    throttled('b');
    expect(typeof debounced).toBe('function');
    expect(typeof throttled).toBe('function');
  });
});

describe('conditionally', () => {
  it('when returns value if true', () => {
    expect(conditionally.when(true, 1)).toBe(1);
    expect(conditionally.when(false, 1)).toBeUndefined();
  });
  it('ifElse returns correct value', () => {
    expect(conditionally.ifElse(true, 1, 2)).toBe(1);
    expect(conditionally.ifElse(false, 1, 2)).toBe(2);
  });
  it('maybe maps if not null', () => {
    expect(conditionally.maybe(2, x => x*2)).toBe(4);
    expect(conditionally.maybe(null, (x: number) => x*2)).toBeUndefined();
  });
});

describe('generateId', () => {
  it('generates unique ids', () => {
    const id1 = generateId('foo');
    const id2 = generateId('foo');
    expect(id1).not.toBe(id2);
    expect(id1.startsWith('foo-')).toBe(true);
  });
});

describe('createStateUpdater', () => {
  it('updateNested updates nested value', () => {
    type State = { a: { b: number }, c: number };
    let state: State = { a: { b: 1 }, c: 2 };
    const setState = (updater: (prev: State) => State) => { state = updater(state); };
    const updater = createStateUpdater<State>();
    updater.updateNested(setState, 'a', { b: 9 });
    expect(state.a.b).toBe(9);
  });
  it('updateMultiple updates multiple keys', () => {
    type State = { a: number, b: number };
    let state: State = { a: 1, b: 2 };
    const setState = (updater: (prev: State) => State) => { state = updater(state); };
    const updater = createStateUpdater<State>();
    updater.updateMultiple(setState, { a: 9, b: 8 });
    expect(state).toEqual({ a: 9, b: 8 });
  });
  it('updateArrayElement updates array element', () => {
    type State = { arr: number[] };
    let state: State = { arr: [1,2,3] };
    const setState = (updater: (prev: State) => State) => { state = updater(state); };
    const updater = createStateUpdater<State>();
    updater.updateArrayElement(setState, 'arr', 1, 9);
    expect(state.arr).toEqual([1,9,3]);
  });
});

describe('eventHandlers', () => {
  it('inputValue calls handler with value', () => {
    const handler = vi.fn();
    const e = { target: { value: 'abc' } } as React.ChangeEvent<HTMLInputElement>;
    eventHandlers.inputValue(handler)(e);
    expect(handler).toHaveBeenCalledWith('abc');
  });
  it('inputNumberValue calls handler with number', () => {
    const handler = vi.fn();
    const e = { target: { value: '42' } } as React.ChangeEvent<HTMLInputElement>;
    eventHandlers.inputNumberValue(handler)(e);
    expect(handler).toHaveBeenCalledWith(42);
  });
  it('selectValue calls handler with value', () => {
    const handler = vi.fn();
    eventHandlers.selectValue(handler)('foo');
    expect(handler).toHaveBeenCalledWith('foo');
  });
});
