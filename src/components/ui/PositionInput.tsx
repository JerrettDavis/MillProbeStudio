// src/components/ui/PositionInput.tsx
// Reusable component for position input controls with machine limits

import React from 'react';
import { Label } from './label';
import { Input } from './input';
import { eventHandlers, validators } from '@/utils/functional';

interface AxisLimits {
  min: number;
  max: number;
}

interface PositionInputProps {
  label: string;
  id: string;
  value: number;
  onChange: (value: number) => void;
  units: string;
  limits?: AxisLimits;
  step?: number;
  className?: string;
}

export const PositionInput: React.FC<PositionInputProps> = ({
  label,
  id,
  value,
  onChange,
  units,
  limits,
  step = 0.1,
  className = "h-8"
}) => {
  const handleChange = (newValue: number) => {
    const clampedValue = limits 
      ? validators.clamp(newValue, limits.min, limits.max)
      : newValue;
    onChange(clampedValue);
  };

  return (
    <div>
      <Label htmlFor={id} className="text-xs">
        {label} {units}
        {limits && (
          <span className="text-muted-foreground ml-1">
            ({limits.min} to {limits.max})
          </span>
        )}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={eventHandlers.inputNumberValue(handleChange)}
        step={step}
        min={limits?.min}
        max={limits?.max}
        className={className}
      />
    </div>
  );
};

// Component for 3D position inputs (X, Y, Z)
interface Position3DInputProps {
  position: { X: number; Y: number; Z: number };
  onChange: (position: { X: number; Y: number; Z: number }) => void;
  units: string;
  machineLimits?: {
    X: AxisLimits;
    Y: AxisLimits;
    Z: AxisLimits;
  };
  step?: number;
  className?: string;
}

export const Position3DInput: React.FC<Position3DInputProps> = ({
  position,
  onChange,
  units,
  machineLimits,
  step,
  className
}) => {
  const handleAxisChange = (axis: 'X' | 'Y' | 'Z', value: number) => {
    onChange({ ...position, [axis]: value });
  };

  const axes: Array<{ key: 'X' | 'Y' | 'Z'; label: string }> = [
    { key: 'X', label: 'X Position' },
    { key: 'Y', label: 'Y Position' },
    { key: 'Z', label: 'Z Position' }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {axes.map(({ key, label }) => (
        <PositionInput
          key={key}
          label={label}
          id={`position-${key.toLowerCase()}`}
          value={position[key]}
          onChange={(value) => handleAxisChange(key, value)}
          units={units}
          limits={machineLimits?.[key]}
          step={step}
          className={className}
        />
      ))}
    </div>
  );
};
