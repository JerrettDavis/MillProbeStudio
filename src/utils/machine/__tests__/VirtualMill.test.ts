// src/utils/machine/__tests__/VirtualMill.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualMill } from '../VirtualMill';
import { createMockMachineSettings, createMockMachineSettingsVertical } from '@/test/mockMachineSettings';
import type { MachineSettings } from '@/types/machine';

describe('VirtualMill', () => {
  let virtualMill: VirtualMill;
  let horizontalMachineSettings: MachineSettings;
  let verticalMachineSettings: MachineSettings;
  
  beforeEach(() => {
    horizontalMachineSettings = createMockMachineSettings();
    verticalMachineSettings = createMockMachineSettingsVertical();
    virtualMill = new VirtualMill(horizontalMachineSettings, { X: 0, Y: 0, Z: 0 });
  });
  
  describe('constructor and basic setup', () => {
    it('should initialize with provided machine settings and position', () => {
      const initialPos = { X: 10, Y: 20, Z: 30 };
      const mill = new VirtualMill(horizontalMachineSettings, initialPos);
      
      expect(mill.getCurrentPosition()).toEqual(initialPos);
      expect(mill.getWCSOffset()).toEqual({ X: 0, Y: 0, Z: 0 });
      expect(mill.getPositionMode()).toBe('absolute');
      expect(mill.getCoordinateSystem()).toBe('machine');
    });
    
    it('should default to origin if no initial position provided', () => {
      const mill = new VirtualMill(horizontalMachineSettings);
      expect(mill.getCurrentPosition()).toEqual({ X: 0, Y: 0, Z: 0 });
    });
  });
  
  describe('machine orientation detection', () => {
    it('should correctly identify horizontal machine', () => {
      const mill = new VirtualMill(horizontalMachineSettings);
      expect(mill.isHorizontal()).toBe(true);
      expect(mill.isVertical()).toBe(false);
    });
    
    it('should correctly identify vertical machine', () => {
      const mill = new VirtualMill(verticalMachineSettings);
      expect(mill.isHorizontal()).toBe(false);
      expect(mill.isVertical()).toBe(true);
    });
  });
  
  describe('axis configuration', () => {
    it('should get correct axis limits', () => {
      const limits = virtualMill.getAxisLimits();
      
      expect(limits.X).toEqual([-100, 100]);
      expect(limits.Y).toEqual([-150, 150]);
      expect(limits.Z).toEqual([-50, 50]);
    });
    
    it('should detect inverted axes', () => {
      expect(virtualMill.isAxisInverted('X')).toBe(false); // polarity 1
      expect(virtualMill.isAxisInverted('Y')).toBe(false); // polarity 1
      expect(virtualMill.isAxisInverted('Z')).toBe(true);  // polarity -1
    });
  });
  
  describe('stock configuration', () => {
    it('should set and get stock bounds correctly', () => {
      virtualMill.setStock([50, 30, 20], [10, 5, -10]);
      
      const bounds = virtualMill.getStockBounds();
      expect(bounds.min).toEqual({ X: -15, Y: -10, Z: -20 });
      expect(bounds.max).toEqual({ X: 35, Y: 20, Z: 0 });
    });
    
    it('should have default stock configuration', () => {
      const bounds = virtualMill.getStockBounds();
      expect(bounds.min).toEqual({ X: -12.5, Y: -12.5, Z: -5 });
      expect(bounds.max).toEqual({ X: 12.5, Y: 12.5, Z: 5 });
    });
  });
  
  describe('stage bounds calculation', () => {
    it('should calculate stage bounds for horizontal machine', () => {
      const mill = new VirtualMill(horizontalMachineSettings);
      const bounds = mill.getStageBounds();
      
      // Stage dimensions: [12.7, 304.8, 63.5] -> [height, width, depth]
      // For horizontal: stage is in YZ plane
      expect(bounds.min).toEqual({ X: 0, Y: -152.4, Z: -31.75 });
      expect(bounds.max).toEqual({ X: 12.7, Y: 152.4, Z: 31.75 });
    });
    
    it('should calculate stage bounds for vertical machine', () => {
      const mill = new VirtualMill(verticalMachineSettings);
      const bounds = mill.getStageBounds();
      
      // For vertical: stage is in XY plane
      expect(bounds.min).toEqual({ X: -152.4, Y: -31.75, Z: 0 });
      expect(bounds.max).toEqual({ X: 152.4, Y: 31.75, Z: 12.7 });
    });
  });
  
  describe('coordinate system transformations', () => {
    beforeEach(() => {
      // Move to a known position first
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 50,
        Y: 60,
        Z: 30
      });
      
      // Set WCS offset: when at machine (50, 60, 30), set WCS to (10, 20, 0)
      // This creates offset = (50-10, 60-20, 30-0) = (40, 40, 30)
      virtualMill.executeGCodeSync({
        type: 'wcs',
        wcsAxis: 'X',
        wcsValue: 10
      });
      virtualMill.executeGCodeSync({
        type: 'wcs',
        wcsAxis: 'Y',
        wcsValue: 20
      });
      virtualMill.executeGCodeSync({
        type: 'wcs',
        wcsAxis: 'Z',
        wcsValue: 0
      });
    });
    
    it('should transform from machine to WCS coordinates', () => {
      const machinePos = { X: 90, Y: 100, Z: 60 };
      const wcsPos = virtualMill.transformCoordinates(machinePos, 'machine', 'wcs');
      
      // WCS = Machine - Offset
      // Offset is (40, 40, 30), so WCS = (90, 100, 60) - (40, 40, 30) = (50, 60, 30)
      expect(wcsPos.X).toBeCloseTo(50); // 90 - 40
      expect(wcsPos.Y).toBeCloseTo(60); // 100 - 40
      expect(wcsPos.Z).toBeCloseTo(30); // 60 - 30
    });
    
    it('should transform from WCS to machine coordinates', () => {
      const wcsPos = { X: 30, Y: 40, Z: 15 };
      const machinePos = virtualMill.transformCoordinates(wcsPos, 'wcs', 'machine');
      
      // Machine = WCS + Offset
      // Offset is (40, 40, 30), so Machine = (30, 40, 15) + (40, 40, 30) = (70, 80, 45)
      expect(machinePos.X).toBeCloseTo(70); // 30 + 40
      expect(machinePos.Y).toBeCloseTo(80); // 40 + 40
      expect(machinePos.Z).toBeCloseTo(45); // 15 + 30
    });
    
    it('should return same coordinates when transforming between same coordinate system', () => {
      const pos = { X: 10, Y: 20, Z: 30 };
      
      expect(virtualMill.transformCoordinates(pos, 'machine', 'machine')).toEqual(pos);
      expect(virtualMill.transformCoordinates(pos, 'wcs', 'wcs')).toEqual(pos);
    });
  });
  
  describe('axis limits validation', () => {
    it('should accept positions within axis limits', () => {
      const validPos = { X: 50, Y: 100, Z: 25 };
      expect(virtualMill.isWithinAxisLimits(validPos)).toBe(true);
    });
    
    it('should reject positions outside axis limits', () => {
      const invalidPos1 = { X: 150, Y: 0, Z: 0 }; // X too high
      const invalidPos2 = { X: 0, Y: 200, Z: 0 }; // Y too high
      const invalidPos3 = { X: 0, Y: 0, Z: 100 }; // Z too high
      
      expect(virtualMill.isWithinAxisLimits(invalidPos1)).toBe(false);
      expect(virtualMill.isWithinAxisLimits(invalidPos2)).toBe(false);
      expect(virtualMill.isWithinAxisLimits(invalidPos3)).toBe(false);
    });
    
    it('should accept positions at axis limits', () => {
      const limits = virtualMill.getAxisLimits();
      const minPos = { X: limits.X[0], Y: limits.Y[0], Z: limits.Z[0] };
      const maxPos = { X: limits.X[1], Y: limits.Y[1], Z: limits.Z[1] };
      
      expect(virtualMill.isWithinAxisLimits(minPos)).toBe(true);
      expect(virtualMill.isWithinAxisLimits(maxPos)).toBe(true);
    });
  });
  
  describe('G-code execution - mode commands', () => {
    it('should change position mode', () => {
      virtualMill.executeGCodeSync({
        type: 'mode',
        positionMode: 'relative'
      });
      
      expect(virtualMill.getPositionMode()).toBe('relative');
    });
    
    it('should change coordinate system', () => {
      virtualMill.executeGCodeSync({
        type: 'mode',
        coordinateSystem: 'wcs'
      });
      
      expect(virtualMill.getCoordinateSystem()).toBe('wcs');
    });
    
    it('should change both mode and coordinate system in one command', () => {
      virtualMill.executeGCodeSync({
        type: 'mode',
        positionMode: 'relative',
        coordinateSystem: 'wcs'
      });
      
      expect(virtualMill.getPositionMode()).toBe('relative');
      expect(virtualMill.getCoordinateSystem()).toBe('wcs');
    });
  });
  
  describe('G-code execution - movement commands', () => {
    it('should execute absolute movement in machine coordinates', () => {
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 10,
        Y: 20,
        Z: 30
      });
      
      expect(virtualMill.getCurrentPosition()).toEqual({ X: 10, Y: 20, Z: 30 });
    });
    
    it('should execute relative movement', () => {
      // Set initial position
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 10,
        Y: 20,
        Z: 30
      });
      
      // Switch to relative mode
      virtualMill.executeGCodeSync({
        type: 'mode',
        positionMode: 'relative'
      });
      
      // Execute relative movement
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 5,
        Y: -10,
        Z: 15
      });
      
      expect(virtualMill.getCurrentPosition()).toEqual({ X: 15, Y: 10, Z: 45 });
    });
    
    it('should execute movement in WCS coordinates', () => {
      // Move to position and set WCS offset
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 0,
        Y: 0,
        Z: 0
      });
      
      // Set WCS offset: current machine position (0) should be WCS 5
      virtualMill.executeGCodeSync({
        type: 'wcs',
        wcsAxis: 'X',
        wcsValue: 5
      });
      
      // Switch to WCS coordinate system
      virtualMill.executeGCodeSync({
        type: 'mode',
        coordinateSystem: 'wcs'
      });
      
      // Move to WCS position 10 (should be machine position 5, since offset is -5)
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 10
      });
      
      expect(virtualMill.getCurrentPosition().X).toBeCloseTo(5); // 10 + (-5) = 5
    });
    
    it('should reject movement outside machine limits', () => {
      expect(() => {
        virtualMill.executeGCodeSync({
          type: 'rapid',
          X: 200 // Outside X limits
        });
      }).toThrow('Position');
    });
    
    it('should handle partial axis movement', () => {
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 10,
        Y: 20,
        Z: 30
      });
      
      // Move only Y axis
      virtualMill.executeGCodeSync({
        type: 'rapid',
        Y: 50
      });
      
      expect(virtualMill.getCurrentPosition()).toEqual({ X: 10, Y: 50, Z: 30 });
    });
  });
  
  describe('G-code execution - WCS commands', () => {
    it('should set WCS offset correctly', () => {
      // Move to a position
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 25,
        Y: 35,
        Z: 45
      });
      
      // Set WCS so current X position equals 10
      virtualMill.executeGCodeSync({
        type: 'wcs',
        wcsAxis: 'X',
        wcsValue: 10
      });
      
      const offset = virtualMill.getWCSOffset();
      expect(offset.X).toBeCloseTo(15); // 25 - 10 = 15
    });
    
    it('should set multiple axis WCS offsets independently', () => {
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 30,
        Y: 40,
        Z: 50
      });
      
      virtualMill.executeGCodeSync({
        type: 'wcs',
        wcsAxis: 'X',
        wcsValue: 5
      });
      
      virtualMill.executeGCodeSync({
        type: 'wcs',
        wcsAxis: 'Z',
        wcsValue: 15
      });
      
      const offset = virtualMill.getWCSOffset();
      expect(offset.X).toBeCloseTo(25); // 30 - 5
      expect(offset.Y).toBeCloseTo(0);  // Unchanged
      expect(offset.Z).toBeCloseTo(35); // 50 - 15
    });
  });
  
  describe('collision detection', () => {
    beforeEach(() => {
      // Set up stock: 20x20x10 centered at origin
      virtualMill.setStock([20, 20, 10], [0, 0, 0]);
    });
    
    it('should detect collision when probe tip intersects stock', () => {
      // Probe approaching stock from X- side
      // Stock bounds: X: [-10, 10], Y: [-10, 10], Z: [-5, 5]
      // Probe at X=-12 moving in +X direction with radius 2
      // Front edge at X=-10, should hit stock at X=-10
      const probePos = { X: -12, Y: 0, Z: 0 };
      const result = virtualMill.checkProbeCollision(probePos, 'X', 2, 1);
      
      expect(result.collision).toBe(true);
      expect(result.contactPoint).toEqual({ X: -10, Y: 0, Z: 0 });
    });
    
    it('should not detect collision when probe is outside stock influence', () => {
      const probePos = { X: -20, Y: 15, Z: 8 };
      const result = virtualMill.checkProbeCollision(probePos, 'X', 2, 1);
      
      expect(result.collision).toBe(false);
    });
    
    it('should detect collision for different axes', () => {
      const toolRadius = 1;
      
      // Debug stock bounds
      const stockBounds = virtualMill.getStockBounds();
      console.log('Stock bounds:', stockBounds);
      
      // X-axis probe: probe at X=-12 moving +X, front edge at X=-11, should hit stock at X=-10
      console.log('Testing X-axis collision...');
      console.log('Probe position: X=-12, Y=0, Z=0');
      console.log('Tool radius:', toolRadius);
      console.log('Direction: 1 (moving +X)');
      console.log('Front edge position:', -12 + toolRadius, '= X=-11');
      console.log('Stock starts at X=-10, so front edge should hit');
      
      // Check expanded bounds calculation
      const expandedYMin = stockBounds.min.Y - toolRadius;
      const expandedYMax = stockBounds.max.Y + toolRadius;
      const expandedZMin = stockBounds.min.Z - toolRadius;
      const expandedZMax = stockBounds.max.Z + toolRadius;
      console.log('Expanded Y bounds:', expandedYMin, 'to', expandedYMax);
      console.log('Expanded Z bounds:', expandedZMin, 'to', expandedZMax);
      console.log('Probe Y=0 within Y bounds?', 0 >= expandedYMin && 0 <= expandedYMax);
      console.log('Probe Z=0 within Z bounds?', 0 >= expandedZMin && 0 <= expandedZMax);
      
      const xResult = virtualMill.checkProbeCollision({ X: -12, Y: 0, Z: 0 }, 'X', toolRadius, 1);
      console.log('X collision result:', xResult);
      expect(xResult.collision).toBe(true);
      
      // Y-axis probe: probe at Y=-12 moving +Y, front edge at Y=-11, should hit stock at Y=-10
      const yResult = virtualMill.checkProbeCollision({ X: 0, Y: -12, Z: 0 }, 'Y', toolRadius, 1);
      expect(yResult.collision).toBe(true);
      
      // Z-axis probe: probe at Z=-7 moving +Z, front edge at Z=-6, should hit stock at Z=-5
      const zResult = virtualMill.checkProbeCollision({ X: 0, Y: 0, Z: -7 }, 'Z', toolRadius, 1);
      expect(zResult.collision).toBe(true);
    });
    
    it('should handle different probe directions', () => {
      const toolRadius = 2;
      
      // X+ direction (moving towards +X): probe at X=-15, front edge at X=-13, should hit at X=-10
      const xPlusResult = virtualMill.checkProbeCollision({ X: -15, Y: 0, Z: 0 }, 'X', toolRadius, 1);
      expect(xPlusResult.collision).toBe(true);
      
      // X- direction (moving towards -X): probe at X=15, front edge at X=13, should hit at X=10
      const xMinusResult = virtualMill.checkProbeCollision({ X: 15, Y: 0, Z: 0 }, 'X', toolRadius, -1);
      expect(xMinusResult.collision).toBe(true);
    });
  });
  
  describe('probe execution', () => {
    beforeEach(() => {
      virtualMill.setStock([20, 20, 10], [0, 0, 0]);
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: -20,
        Y: 0,
        Z: 0
      });
    });
    
    it('should execute probe movement and detect contact', () => {
      virtualMill.executeGCodeSync({
        type: 'probe',
        axis: 'X',
        direction: 1,
        distance: 15,
        feedRate: 100
      });
      
      // Should stop at stock boundary
      expect(virtualMill.getCurrentPosition().X).toBeCloseTo(-10);
    });
    
    it('should move to end position if no contact detected', () => {
      virtualMill.executeGCodeSync({
        type: 'probe',
        axis: 'Y',
        direction: 1,
        distance: 5, // Short distance that won't hit stock
        feedRate: 100
      });
      
      expect(virtualMill.getCurrentPosition().Y).toBeCloseTo(5);
    });
    
    it('should throw error for invalid probe commands', () => {
      expect(() => {
        virtualMill.executeGCodeSync({
          type: 'probe'
          // Missing required fields
        });
      }).toThrow('Invalid probe command');
    });
  });
  
  describe('reset functionality', () => {
    it('should reset all state to defaults', () => {
      // Change state to valid positions within machine limits
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 50,  // Within X limits: [-100, 100]
        Y: 60,  // Within Y limits: [-150, 150]
        Z: 25   // Within Z limits: [-50, 50]
      });
      virtualMill.executeGCodeSync({
        type: 'mode',
        positionMode: 'relative',
        coordinateSystem: 'wcs'
      });
      virtualMill.executeGCodeSync({
        type: 'wcs',
        wcsAxis: 'X',
        wcsValue: 10
      });
      
      // Reset
      virtualMill.reset();
      
      expect(virtualMill.getCurrentPosition()).toEqual({ X: 0, Y: 0, Z: 0 });
      expect(virtualMill.getWCSOffset()).toEqual({ X: 0, Y: 0, Z: 0 });
      expect(virtualMill.getPositionMode()).toBe('absolute');
      expect(virtualMill.getCoordinateSystem()).toBe('machine');
    });
    
    it('should reset to specified initial position', () => {
      const newInitial = { X: 10, Y: 20, Z: 30 };
      virtualMill.reset(newInitial);
      
      expect(virtualMill.getCurrentPosition()).toEqual(newInitial);
    });
  });
  
  describe('state summary', () => {
    it('should provide comprehensive state information', () => {
      virtualMill.setStock([30, 40, 20], [5, 10, -5]);
      virtualMill.executeGCodeSync({
        type: 'rapid',
        X: 25,
        Y: 35
      });
      virtualMill.executeGCodeSync({
        type: 'mode',
        positionMode: 'relative'
      });
      
      const state = virtualMill.getState();
      
      expect(state.position).toEqual({ X: 25, Y: 35, Z: 0 });
      expect(state.positionMode).toBe('relative');
      expect(state.coordinateSystem).toBe('machine');
      expect(state.isHorizontal).toBe(true);
      expect(state.stockBounds.min).toEqual({ X: -10, Y: -10, Z: -15 });
      expect(state.stockBounds.max).toEqual({ X: 20, Y: 30, Z: 5 });
      expect(state.stageBounds).toBeDefined();
    });
  });
});
