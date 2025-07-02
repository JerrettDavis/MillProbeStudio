import React, { useEffect, useRef } from 'react';

interface GCodeReadoutProps {
  gcodeLines: string[];
  currentLine: number;
  contextWindow?: number; // How many lines before/after to highlight
}

/**
 * Scrollable, color-coded G-code readout for simulation.
 * - Executed: gray/faded
 * - Current: bright green
 * - Next: faded green
 * - Next few: yellow
 * - Future: gray
 */
export const GCodeReadout: React.FC<GCodeReadoutProps> = ({ gcodeLines, currentLine, contextWindow = 2 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Auto-scroll to current line
    const node = lineRefs.current[currentLine];
    if (node && containerRef.current) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLine]);

  return (
    <div
      ref={containerRef}
      style={{
        height: 180,
        overflowY: 'auto',
        background: '#181818',
        fontFamily: 'monospace',
        fontSize: 14,
        borderRadius: 6,
        border: '1px solid #333',
        padding: 8,
        marginTop: 12,
      }}
    >
      {gcodeLines.map((line, i) => {
        const style: React.CSSProperties = {
          transition: 'color 0.2s, background 0.2s',
          padding: '2px 4px',
          borderRadius: 3,
        };
        if (i < currentLine) {
          style.color = '#888';
        } else if (i === currentLine) {
          style.color = '#fff';
          style.background = '#1e3a1e';
          style.fontWeight = 'bold';
          style.boxShadow = '0 0 4px #4caf50';
        } else if (i === currentLine + 1) {
          style.color = '#4caf50';
        } else if (i > currentLine + 1 && i <= currentLine + contextWindow) {
          style.color = '#ffd600';
        } else {
          style.color = '#444';
        }
        return (
          <div
            key={i}
            ref={el => { lineRefs.current[i] = el; }}
            style={style}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

export default GCodeReadout;
