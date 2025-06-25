// src/components/ui/DimensionalInput.tsx
// Reusable component for dimensional input controls (eliminates duplication)

import React from 'react';
import { Label } from './label';
import { Input } from './input';
import { eventHandlers } from '@/utils/functional';

interface DimensionalInputProps {
  label: string;
  id: string;
  value: number;
  onChange: (value: number) => void;
  units: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const DimensionalInput: React.FC<DimensionalInputProps> = ({
  label,
  id,
  value,
  onChange,
  units,
  min = 0.1,
  max,
  step = 0.1,
  className = "h-8"
}) => (
  <div>
    <Label htmlFor={id} className="text-xs">
      {label} {units}
    </Label>
    <Input
      id={id}
      type="number"
      value={value}
      onChange={eventHandlers.inputNumberValue(onChange, min, max)}
      step={step}
      min={min}
      max={max}
      className={className}
    />
  </div>
);

// Component for 3D dimensional inputs (X, Y, Z)
interface Dimensional3DInputProps {
  values: [number, number, number];
  onChange: (values: [number, number, number]) => void;
  labels: [string, string, string];
  units: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const Dimensional3DInput: React.FC<Dimensional3DInputProps> = ({
  values,
  onChange,
  labels,
  units,
  min,
  max,
  step,
  className
}) => {
  const handleChange = (index: number, value: number) => {
    const newValues = [...values] as [number, number, number];
    newValues[index] = value;
    onChange(newValues);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {labels.map((label, index) => (
        <DimensionalInput
          key={index}
          label={label}
          id={`dimensional-${index}`}
          value={values[index]}
          onChange={(value) => handleChange(index, value)}
          units={units}
          min={min}
          max={max}
          step={step}
          className={className}
        />
      ))}
    </div>
  );
};
