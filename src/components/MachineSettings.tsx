import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { MachineSettings, AxisConfig } from '@/types/machine';

interface MachineSettingsProps {
  machineSettings: MachineSettings;
  setMachineSettings: React.Dispatch<React.SetStateAction<MachineSettings>>;
  updateAxisConfig: (axis: 'X' | 'Y' | 'Z', field: keyof AxisConfig, value: any) => void;
  toolSizeInput: string;
  setToolSizeInput: (v: string) => void;
  toolSizeUnit: 'fraction' | 'inch' | 'mm';
  setToolSizeUnit: (v: 'fraction' | 'inch' | 'mm') => void;
  toolSizeMM: number;
}

const MachineSettingsForm: React.FC<MachineSettingsProps> = ({ machineSettings, setMachineSettings, updateAxisConfig, toolSizeInput, setToolSizeInput, toolSizeUnit, setToolSizeUnit, toolSizeMM }) => (
  <Card>
    <CardHeader>
      <CardTitle>Machine Configuration</CardTitle>
      <CardDescription>Configure your mill's axis assignments, directions, and limits</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="units">Units</Label>
          <Select value={machineSettings.units} onValueChange={(value: 'mm' | 'inch') =>
            setMachineSettings(prev => ({ ...prev, units: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mm">Millimeters (mm)</SelectItem>
              <SelectItem value="inch">Inches (in)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="spindle">Spindle Speed (RPM)</Label>
          <Input
            type="number"
            value={machineSettings.spindleSpeed}
            onChange={(e) => setMachineSettings(prev => ({ ...prev, spindleSpeed: parseInt(e.target.value) }))}
          />
        </div>
        <div className="col-span-2">
          <Label>Endmill Size</Label>
          <div className="flex gap-2 items-center">
            <Input
              value={toolSizeInput}
              onChange={e => setToolSizeInput(e.target.value)}
              className="w-32"
            />
            <Select value={toolSizeUnit} onValueChange={v => setToolSizeUnit(v as 'fraction' | 'inch' | 'mm')}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fraction">Fractional Inch</SelectItem>
                <SelectItem value="inch">Decimal Inch</SelectItem>
                <SelectItem value="mm">Millimeter</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-gray-500 text-sm">(WCS Offset auto: {(toolSizeMM/2).toFixed(4)} mm)</span>
          </div>
        </div>
      </div>
      <Separator />
      {Object.entries(machineSettings.axes).map(([axis, config]) => (
        <Card key={axis}>
          <CardHeader>
            <CardTitle className="text-lg">{axis} Axis Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Axis Label</Label>
                <Input
                  value={`${config.positiveDirection}/${config.negativeDirection}`}
                  readOnly
                  tabIndex={-1}
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Polarity</Label>
                <Select value={config.polarity.toString()} onValueChange={(value) =>
                  updateAxisConfig(axis as 'X' | 'Y' | 'Z', 'polarity', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Normal (1)</SelectItem>
                    <SelectItem value="-1">Inverted (-1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Positive Direction</Label>
                <Input
                  value={config.positiveDirection}
                  onChange={(e) => updateAxisConfig(axis as 'X' | 'Y' | 'Z', 'positiveDirection', e.target.value)}
                />
              </div>
              <div>
                <Label>Negative Direction</Label>
                <Input
                  value={config.negativeDirection}
                  onChange={(e) => updateAxisConfig(axis as 'X' | 'Y' | 'Z', 'negativeDirection', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Value ({machineSettings.units})</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.min}
                  onChange={(e) => updateAxisConfig(axis as 'X' | 'Y' | 'Z', 'min', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Max Value ({machineSettings.units})</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.max}
                  onChange={(e) => updateAxisConfig(axis as 'X' | 'Y' | 'Z', 'max', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader>
          <CardTitle>Initial Probe Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(machineSettings.initialPosition).map(([axis, value]) => (
              <div key={axis}>
                <Label>{axis} Position ({machineSettings.units})</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => setMachineSettings(prev => ({
                    ...prev,
                    initialPosition: {
                      ...prev.initialPosition,
                      [axis]: parseFloat(e.target.value)
                    }
                  }))}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </CardContent>
  </Card>
);

export default MachineSettingsForm;
