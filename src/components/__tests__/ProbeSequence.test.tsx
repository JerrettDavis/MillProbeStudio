import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import ProbeSequenceEditor from '../ProbeSequence';

describe('ProbeSequenceEditor WCS Offset Input', () => {  const baseProbe = {
    id: 'probe-1',
    axis: 'X' as 'X',
    direction: 1 as 1, // Fix type to match ProbeOperation
    distance: 10,
    feedRate: 100,
    backoffDistance: 2,
    wcsOffset: 0.25,
    preMoves: [],
    postMoves: [],
  };

  const machineAxes = {
    X: { positiveDirection: 'Right', negativeDirection: 'Left' },
    Y: { positiveDirection: 'Forward', negativeDirection: 'Back' },
    Z: { positiveDirection: 'Up', negativeDirection: 'Down' },
  };  it('should allow editing WCS Offset via keyboard and update state', async () => {
    const updateProbeOperationMock = vi.fn();
    
    const TestWrapper = () => {
      const [probeSequence, setProbeSequence] = React.useState([{ ...baseProbe }]);
      
      const updateProbeOperation = (id: string, field: string, value: any) => {
        updateProbeOperationMock(id, field, value);
        setProbeSequence(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
      };

      return (
        <ProbeSequenceEditor
          probeSequence={probeSequence}
          addProbeOperation={vi.fn()}
          updateProbeOperation={updateProbeOperation}
          deleteProbeOperation={vi.fn()}
          addMovementStep={vi.fn()}
          updateMovementStep={vi.fn()}
          deleteMovementStep={vi.fn()}
          machineSettingsUnits="mm"
          machineAxes={machineAxes}
          defaultWcsOffset={0.25}
        />
      );
    };

    render(<TestWrapper />);

    // Find the WCS Offset input
    const wcsInput = screen.getAllByLabelText(/WCS Offset/i)[0];
    // Clear the input using userEvent
    await userEvent.clear(wcsInput);
    expect(updateProbeOperationMock).toHaveBeenCalledWith('probe-1', 'wcsOffset', undefined);

    // Type a new value using keyboard
    await userEvent.type(wcsInput, '1.2345');
    expect(wcsInput).toHaveValue(1.2345);
    expect(updateProbeOperationMock).toHaveBeenCalledWith('probe-1', 'wcsOffset', 1.2345);

    // Simulate more keyboard actions: backspace, then 0
    await userEvent.type(wcsInput, '{backspace}0');
    expect(wcsInput).toHaveValue(1.234);
    expect(updateProbeOperationMock).toHaveBeenCalledWith('probe-1', 'wcsOffset', 1.234);

    expect(wcsInput).not.toHaveAttribute('readonly');
  });
  it('should allow editing WCS Offset even when parent component tries to override it', async () => {
    const updateProbeOperationMock = vi.fn();
    let currentToolSize = 1.0; // Simulates endmill size changing
    
    const ProblematicParentWrapper = () => {
      const [probeSequence, setProbeSequence] = React.useState([{ ...baseProbe, wcsOffset: 0.25 }]);
      const [toolSize, setToolSize] = React.useState(currentToolSize);
      
      const updateProbeOperation = (id: string, field: string, value: any) => {
        updateProbeOperationMock(id, field, value);
        setProbeSequence(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
      };

      // Simulate the problematic behavior from the real app - DON'T do this in real code!
      const problematicProbeSequence = probeSequence.map(probe => ({
        ...probe,
        wcsOffset: toolSize / 2 // This would override user input
      }));

      return (
        <div>
          <button 
            data-testid="change-tool-size" 
            onClick={() => {
              currentToolSize = 2.0;
              setToolSize(2.0);
            }}
          >
            Change Tool Size
          </button>
          <ProbeSequenceEditor
            probeSequence={problematicProbeSequence} // This simulates the bug
            addProbeOperation={vi.fn()}
            updateProbeOperation={updateProbeOperation}
            deleteProbeOperation={vi.fn()}
            addMovementStep={vi.fn()}
            updateMovementStep={vi.fn()}
            deleteMovementStep={vi.fn()}
            machineSettingsUnits="mm"
            machineAxes={machineAxes}
            defaultWcsOffset={toolSize / 2}
          />
        </div>
      );
    };

    render(<ProblematicParentWrapper />);

    const wcsInput = screen.getAllByLabelText(/WCS Offset/i)[0];
    
    // Initially should show the tool size / 2 (0.5)
    expect(wcsInput).toHaveValue(0.5);

    // Try to edit the WCS Offset - this demonstrates the problematic behavior
    await userEvent.clear(wcsInput);
    
    // The clear should call updateProbeOperation with undefined
    expect(updateProbeOperationMock).toHaveBeenCalledWith('probe-1', 'wcsOffset', undefined);
    
    // But the input should still show 0.5 because the parent overrides it!
    expect(wcsInput).toHaveValue(0.5); // This demonstrates the bug!
    
    // Any typing will also be overridden
    await userEvent.type(wcsInput, '9');
    
    // The function gets called with the typed value
    expect(updateProbeOperationMock).toHaveBeenCalledWith('probe-1', 'wcsOffset', 0.59);
    
    // But the input will still show the overridden value (0.5) instead of 0.59
    expect(wcsInput).toHaveValue(0.5); // Parent keeps overriding!
  });

  it('should maintain WCS Offset independence from tool size changes (correct behavior)', async () => {
    const updateProbeOperationMock = vi.fn();
    
    const CorrectParentWrapper = () => {
      const [probeSequence, setProbeSequence] = React.useState([{ ...baseProbe, wcsOffset: 0.25 }]);
      const [toolSize, setToolSize] = React.useState(1.0);
      
      const updateProbeOperation = (id: string, field: string, value: any) => {
        updateProbeOperationMock(id, field, value);
        setProbeSequence(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
      };

      return (
        <div>
          <button 
            data-testid="change-tool-size" 
            onClick={() => setToolSize(2.0)}
          >
            Change Tool Size
          </button>
          <ProbeSequenceEditor
            probeSequence={probeSequence} // Correct: pass actual sequence without override
            addProbeOperation={vi.fn()}
            updateProbeOperation={updateProbeOperation}
            deleteProbeOperation={vi.fn()}
            addMovementStep={vi.fn()}
            updateMovementStep={vi.fn()}
            deleteMovementStep={vi.fn()}
            machineSettingsUnits="mm"
            machineAxes={machineAxes}
            defaultWcsOffset={toolSize / 2} // Only affects new probe operations
          />
        </div>
      );
    };

    render(<CorrectParentWrapper />);

    const wcsInput = screen.getAllByLabelText(/WCS Offset/i)[0];
    
    // Initially should show the probe's actual wcsOffset (0.25)
    expect(wcsInput).toHaveValue(0.25);

    // Edit the WCS Offset to a custom value
    await userEvent.clear(wcsInput);
    await userEvent.type(wcsInput, '1.5');
    expect(wcsInput).toHaveValue(1.5);
    expect(updateProbeOperationMock).toHaveBeenCalledWith('probe-1', 'wcsOffset', 1.5);

    // Change the tool size - this should NOT affect existing probe's WCS Offset
    const changeToolButton = screen.getByTestId('change-tool-size');
    await userEvent.click(changeToolButton);
    
    // The WCS Offset should remain at the user-set value (1.5)
    // and NOT be overridden by the new tool size
    expect(wcsInput).toHaveValue(1.5);
    
    // Further edits should still work
    await userEvent.clear(wcsInput);
    await userEvent.type(wcsInput, '2.75');
    expect(wcsInput).toHaveValue(2.75);
  });  it('reproduces the exact bug from App.tsx (this test demonstrates the problem)', async () => {
    // This test demonstrates the exact pattern that was problematic in App.tsx
    // It shows that the UI becomes uneditable when parent overrides values
    const updateProbeOperationMock = vi.fn();
    
    const AppLikeBuggyWrapper = () => {
      const [probeSequence, setProbeSequence] = React.useState([{ ...baseProbe, wcsOffset: 0.25 }]);
      const [endmillSize] = React.useState(1.0);
      
      const updateProbeOperation = (id: string, field: string, value: any) => {
        updateProbeOperationMock(id, field, value);
        setProbeSequence(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
      };

      return (
        <ProbeSequenceEditor
          // This was the actual problematic line from App.tsx before the fix:
          probeSequence={probeSequence.map(probe => ({ ...probe, wcsOffset: endmillSize / 2 }))}
          addProbeOperation={vi.fn()}
          updateProbeOperation={updateProbeOperation}
          deleteProbeOperation={vi.fn()}
          addMovementStep={vi.fn()}
          updateMovementStep={vi.fn()}
          deleteMovementStep={vi.fn()}
          machineSettingsUnits="mm"
          machineAxes={machineAxes}
          defaultWcsOffset={endmillSize / 2}
        />
      );
    };

    render(<AppLikeBuggyWrapper />);

    const wcsInput = screen.getAllByLabelText(/WCS Offset/i)[0];
    
    // The input shows the endmill-derived value, not the probe's actual wcsOffset
    expect(wcsInput).toHaveValue(0.5); // endmillSize / 2, not 0.25
    
    // User tries to change it - this demonstrates the exact frustration users experienced
    await userEvent.clear(wcsInput);
    
    // After clearing, the input should be empty, but it immediately reverts to 0.5
    // This is the bug - users couldn't clear or edit the field
    expect(wcsInput).toHaveValue(0.5); // Still shows endmillSize / 2 - this is the BUG!
    
    // Any attempts to type are also overridden
    await userEvent.type(wcsInput, '9');
    
    // The input still shows the overridden value instead of user input
    expect(wcsInput).toHaveValue(0.5); // Still shows endmillSize / 2 - BUG continues!
    
    // This test proves that with the buggy pattern, the WCS Offset becomes completely uneditable
    // The fix was to remove the .map() override in App.tsx
  });

});


