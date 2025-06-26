import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Dimensional3DInput } from "@/components/ui/DimensionalInput";
import type { MachineSettings, AxisConfig } from '@/types/machine';

interface MachineSettingsProps {
  machineSettings: MachineSettings;
  setMachineSettings: React.Dispatch<React.SetStateAction<MachineSettings>>;
  updateAxisConfig: (axis: 'X' | 'Y' | 'Z', field: keyof AxisConfig, value: AxisConfig[keyof AxisConfig]) => void;
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
      
      {/* Machine Configuration Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Machine Configuration</h3>
        
        {/* Machine Orientation */}
        <div>
          <Label className="text-sm text-muted-foreground">Machine Orientation</Label>
          <RadioGroup 
            value={machineSettings.machineOrientation} 
            onValueChange={(value: 'vertical' | 'horizontal') =>
              setMachineSettings(prev => ({ ...prev, machineOrientation: value }))}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="vertical" id="vertical" />
              <Label htmlFor="vertical" className="text-sm">
                Vertical Spindle (Traditional Mill)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="horizontal" id="horizontal" />
              <Label htmlFor="horizontal" className="text-sm">
                Horizontal Spindle (Rotated Stage)
              </Label>
            </div>
          </RadioGroup>
          
          {machineSettings.machineOrientation === 'horizontal' && (
            <p className="text-xs text-muted-foreground mt-2">
              X+ face attached to stage, spindle faces Z+ direction
            </p>
          )}
        </div>

        {/* Stage Dimensions for Horizontal Machines */}
        {machineSettings.machineOrientation === 'horizontal' && (
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">
              Stage Dimensions
            </Label>
            <Dimensional3DInput
              values={machineSettings.stageDimensions}
              onChange={(dimensions: [number, number, number]) => 
                setMachineSettings(prev => ({ ...prev, stageDimensions: dimensions }))}
              labels={['Height (X)', 'Width (Y)', 'Depth (Z)']}
              units={machineSettings.units}
              min={0.1}
              step={0.1}
              className="h-8"
            />
            <p className="text-xs text-muted-foreground">
              Stage is positioned perpendicular to XY plane, affixed to bottom of stock
            </p>
          </div>
        )}
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
