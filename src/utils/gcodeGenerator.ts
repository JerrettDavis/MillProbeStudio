// src/utils/gcodeGenerator.ts

import type { ProbeOperation, ProbeSequenceSettings, MovementStep } from '@/types/machine';

// Pure utility functions
const padLine = (code: string, comment: string, padTo = 40): string => {
  const codeStr = code.trimEnd();
  const padLength = Math.max(padTo - codeStr.length, 2);
  return codeStr + ' '.repeat(padLength) + (comment ? `(${comment})` : '');
};

const formatLine = (code: string, comment: string): string => 
  padLine(code, comment) + '\n';

// Movement generation functions
const buildAxesString = (axesValues: Record<string, number>): string => 
  Object.entries(axesValues)
    .filter(([, value]) => typeof value === 'number')
    .map(([axis, value]) => `${axis}${value}`)
    .join(' ');

const buildPositionMode = (positionMode: string | undefined): string => {
  switch (positionMode) {
    case 'absolute': return 'G90';
    case 'relative': return 'G91';
    default: return '';
  }
};

const buildCoordinateSystem = (coordinateSystem: string | undefined): string => {
  switch (coordinateSystem) {
    case 'machine': return 'G53';
    case 'wcs': return 'G54';
    default: return '';
  }
};

const generateRapidMove = (move: MovementStep): string => {
  const axesStr = buildAxesString(move.axesValues || {});
  if (!axesStr) return '';
  
  const command = [
    'G0',
    buildPositionMode(move.positionMode),
    buildCoordinateSystem(move.coordinateSystem),
    axesStr
  ].filter(Boolean).join(' ');
  
  return formatLine(command, move.description);
};

const generateDwellMove = (move: MovementStep): string => 
  formatLine(`G4 P${move.dwellTime}`, move.description);

const generateMovementGCode = (move: MovementStep): string => {
  switch (move.type) {
    case 'rapid':
      return move.axesValues ? generateRapidMove(move) : '';
    case 'dwell':
      return move.dwellTime ? generateDwellMove(move) : '';
    default:
      return '';
  }
};

// Header generation functions
const generateUnitsHeader = (isMM: boolean): string => 
  formatLine(`G2${isMM ? 1 : 0}`, `Set units to ${isMM ? 'millimeters' : 'inches'}`);

const generateInitialPositioning = (initialPosition: { X: number; Y: number; Z: number }): string => [
  formatLine(`G90 G53 G0 Z${initialPosition.Z}`, 'Absolute move in machine coordinates to Z'),
  formatLine(`G90 G53 G0 Y${initialPosition.Y}`, 'Absolute move in machine coordinates to Y'),
  formatLine(`G90 G53 G0 X${initialPosition.X}`, 'Absolute move in machine coordinates to X')
].join('') + '\n';

const generateSpindleStart = (spindleSpeed: number): string => [
  formatLine(`S${spindleSpeed} M4`, `Start spindle in reverse at ${spindleSpeed} RPM`),
  formatLine('G4 P3', 'Dwell for 3 seconds to let spindle stabilize')
].join('') + '\n';

const generatePositioningMode = (): string => 
  formatLine('G91', 'Set to incremental positioning mode') + '\n';

// Probe operation generation functions
const generateBufferClearing = (dwellsBeforeProbe: number): string => 
  Array.from({ length: dwellsBeforeProbe }, () => 
    formatLine('G4 P0.01', 'Empty Buffer')
  ).join('') + '\n';

const generateProbeOperation = (probe: ProbeOperation): string => {
  const probeDir = probe.direction > 0 ? '' : '-';
  return [
    formatLine(`G38.2 ${probe.axis}${probeDir}${probe.distance} F${probe.feedRate}`, `Probe along ${probe.axis}${probeDir} axis`),
    formatLine(`G10 L20 P1 ${probe.axis}${probe.wcsOffset}`, `Set WCS G54 ${probe.axis} origin`),
    formatLine(`G0 G91 ${probe.axis}${probe.backoffDistance}`, 'Back off from surface')
  ].join('') + '\n';
};

const generateMovements = (moves: MovementStep[], label: string): string => {
  if (moves.length === 0) return '';
  
  return [
    `(${label})\n`,
    ...moves.map(generateMovementGCode),
    '\n'
  ].join('');
};

const generateProbeSequenceOperation = (probe: ProbeOperation, index: number, dwellsBeforeProbe: number): string => [
  `(=== Probe Operation ${index + 1}: ${probe.axis} Axis ===)\n`,
  generateMovements(probe.preMoves, `Pre-moves for Probe Operation ${index + 1}`),
  generateBufferClearing(dwellsBeforeProbe),
  generateProbeOperation(probe),
  generateMovements(probe.postMoves, `Post-moves for Probe Operation ${index + 1}`),
  '\n'
].join('');

// Footer generation functions
const generateFooter = (): string => [
  formatLine('G0 G54 G90 X0Y0', 'Return to origin'),
  formatLine('S0', 'Stop spindle')
].join('');

// Main generation function
export const generateGCode = (
  probeSequence: ProbeOperation[], 
  probeSequenceSettings: ProbeSequenceSettings
): string => {
  const isMM = probeSequenceSettings.units === 'mm';
  
  const sections = [
    generateUnitsHeader(isMM),
    generateInitialPositioning(probeSequenceSettings.initialPosition),
    generateSpindleStart(probeSequenceSettings.spindleSpeed),
    generatePositioningMode(),
    ...probeSequence.map((probe, index) => 
      generateProbeSequenceOperation(probe, index, probeSequenceSettings.dwellsBeforeProbe)
    ),
    generateFooter()
  ];
  
  return sections.join('');
};

// Legacy class-based API for backward compatibility
export class GCodeGenerator {
  static generate(
    probeSequence: ProbeOperation[], 
    probeSequenceSettings: ProbeSequenceSettings
  ): string {
    return generateGCode(probeSequence, probeSequenceSettings);
  }
}
