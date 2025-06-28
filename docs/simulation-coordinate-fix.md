# Fix for Probe Simulation Coordinate Transformation Bug

## Problem
When running the probe simulation on a horizontal mill configuration, the probe was "jumping down" in the visualization during Y-axis probing. The probe should only move in and out (Y) and left to right (Z) as designed for the horizontal mill setup.

## Root Cause
The simulation was directly using machine coordinates (X, Y, Z) from the simulation state, but the probe position visualization uses a different coordinate transformation for horizontal machines.

In horizontal mill configurations:
- The spindle X position is **fixed** at `machineSettings.axes.X.max`
- Only Y and Z coordinates change based on the probe position
- The simulation was incorrectly updating all three coordinates directly

## Solution
Updated the `effectiveToolPosition` calculation in `Scene3D.tsx` to use the same coordinate transformation logic as the normal probe position by:

1. **Importing** the `calculateToolPosition` function from `machineGeometry.ts`
2. **Transforming** simulation coordinates using the same logic during simulation:
   ```typescript
   const tempProbeSequence: ProbeSequenceSettings = {
     ...probeSequence,
     initialPosition: simulationState.currentPosition
   } as ProbeSequenceSettings;
   
   return calculateToolPosition(machineSettings, tempProbeSequence, machineOrientation);
   ```
3. **Applying** the same transformation to contact points visualization

## Technical Details
The `calculateToolPosition` function handles machine orientation correctly:
- **Horizontal machines**: `{ x: machineSettings.axes.X.max, y: baseY, z: baseZ }`
- **Vertical machines**: `{ x: baseX, y: baseY, z: baseZ }`

This ensures the simulation uses the exact same coordinate system as the normal probe position display.

## Result
- Probe simulation now correctly follows the same movement patterns as the static probe position
- Y-axis probing moves the probe in/out only (no unwanted vertical movement)
- X-axis probing moves the probe left/right only  
- Z-axis probing moves the probe up/down only
- Contact points are displayed at the correct transformed coordinates
