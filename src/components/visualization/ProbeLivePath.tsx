import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';

export interface ProbeLivePathProps {
  positions: Array<{ X: number; Y: number; Z: number; axis: 'X' | 'Y' | 'Z' }>;
}

/**
 * Draws a colored path for the probe's live movement.
 * Green for Y, Red for X, Blue for Z.
 */
export const ProbeLivePath: React.FC<ProbeLivePathProps> = ({ positions }) => {
  // Group positions by axis for colored segments
  const segments = useMemo(() => {
    if (positions.length < 2) return [];
    const segs: Array<{ color: string; points: [number, number, number][] }> = [];
    let currentAxis = positions[0].axis;
    let currentPoints: [number, number, number][] = [[positions[0].X, positions[0].Y, positions[0].Z]];
    for (let i = 1; i < positions.length; i++) {
      const pos = positions[i];
      // Sanity check: probe should never draw an X line
      if (pos.axis === 'X') {
        throw new Error('Sanity error: ProbeLivePath attempted to draw an X line. Only the stage should move in X.');
      }
      if (pos.axis !== currentAxis) {
        if (currentPoints.length > 1) {
          segs.push({ color: currentAxis === 'Y' ? 'green' : currentAxis === 'X' ? 'red' : 'blue', points: [...currentPoints] });
        }
        currentAxis = pos.axis;
        currentPoints = [];
      }
      currentPoints.push([pos.X, pos.Y, pos.Z]);
    }
    if (currentPoints.length > 1) {
      segs.push({ color: currentAxis === 'Y' ? 'green' : currentAxis === 'X' ? 'red' : 'blue', points: currentPoints });
    }
    return segs;
  }, [positions]);

  return (
    <>
      {segments.map((seg, i) => (
        seg.points.length > 1 && (
          <Line
            key={i}
            points={seg.points}
            color={seg.color}
            lineWidth={8} // thickness in pixels
            dashed={false}
          />
        )
      ))}
    </>
  );
};
