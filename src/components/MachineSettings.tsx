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
}

const MachineSettingsForm: React.FC<MachineSettingsProps> = ({ machineSettings, setMachineSettings, updateAxisConfig }) => (
  <Card>
    <CardHeader>
      <CardTitle>Machine Configuration</CardTitle>
      <CardDescription>Configure your mill's axis assignments, directions, and limits</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">      <div className="grid grid-cols-1 gap-4">
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
                <Label>Max Value ({machineSettings.units})</Label>                <Input
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
    </CardContent>
  </Card>
);

export default MachineSettingsForm;
