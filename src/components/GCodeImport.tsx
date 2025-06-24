import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseGCode, type ParsedGCodeResult } from '@/utils/gcodeParser';
import type { ProbeOperation, MachineSettings } from '@/types/machine';

interface GCodeImportProps {
  onImport: (parseResult: ParsedGCodeResult) => void;
  machineSettings: MachineSettings;
}

const GCodeImport: React.FC<GCodeImportProps> = ({ onImport, machineSettings }) => {
  const [gcodeInput, setGcodeInput] = useState('');
  const [parseResult, setParseResult] = useState<ParsedGCodeResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleParse = () => {
    if (!gcodeInput.trim()) return;
    
    const result = parseGCode(gcodeInput);
    setParseResult(result);
  };

  const handleImport = () => {
    if (!parseResult) return;
    
    onImport(parseResult);
    
    // Clear the input and result after successful import
    setGcodeInput('');
    setParseResult(null);
    setIsExpanded(false);
  };

  const handleClear = () => {
    setGcodeInput('');
    setParseResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Import from G-Code</CardTitle>
            <CardDescription>
              Parse existing G-code to automatically configure probe sequences
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Show'} G-Code Import
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gcode-input">G-Code Input</Label>
            <Textarea
              id="gcode-input"
              placeholder="Paste your G-code here..."
              value={gcodeInput}
              onChange={(e) => setGcodeInput(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleParse} disabled={!gcodeInput.trim()}>
              Parse G-Code
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
          
          {parseResult && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Parse Results</h4>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Probe Operations Found</Label>
                    <Badge variant="secondary" className="mt-1">
                      {parseResult.probeSequence.length} operations
                    </Badge>
                  </div>
                  
                  {parseResult.spindleSpeed && (
                    <div>
                      <Label className="text-sm font-medium">Spindle Speed</Label>
                      <Badge variant="secondary" className="mt-1">
                        {parseResult.spindleSpeed} RPM
                      </Badge>
                    </div>
                  )}
                  
                  {parseResult.units && (
                    <div>
                      <Label className="text-sm font-medium">Units</Label>
                      <Badge variant="secondary" className="mt-1">
                        {parseResult.units === 'mm' ? 'Millimeters' : 'Inches'}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {parseResult.probeSequence.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">Detected Probe Operations:</Label>
                    <div className="space-y-2">
                      {parseResult.probeSequence.map((probe, index) => (
                        <div key={probe.id} className="text-sm border rounded p-2">
                          <div className="font-medium">
                            Operation {index + 1}: {probe.axis} Axis
                          </div>
                          <div className="text-muted-foreground">
                            Direction: {probe.direction > 0 ? '+' : '-'}, 
                            Distance: {probe.distance}{machineSettings.units}, 
                            Feed: {probe.feedRate}{machineSettings.units}/min
                            {probe.wcsOffset !== undefined && `, WCS Offset: ${probe.wcsOffset}`}
                          </div>
                          {probe.postMoves.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {probe.postMoves.length} post-probe movement(s)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {parseResult.errors.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-destructive mb-2 block">
                      Parsing Errors ({parseResult.errors.length}):
                    </Label>
                    <div className="space-y-1">
                      {parseResult.errors.map((error, index) => (
                        <div key={index} className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleImport}
                    disabled={parseResult.probeSequence.length === 0}
                  >
                    Import {parseResult.probeSequence.length} Probe Operation(s)
                  </Button>
                  {parseResult.probeSequence.length === 0 && (
                    <p className="text-sm text-muted-foreground flex items-center">
                      No valid probe operations found in the G-code
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default GCodeImport;
