import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ProbeOperation, MovementStep, ProbeSequenceSettings } from '@/types/machine';

interface ProbeSequenceProps {
    // Data passed in
    initialData?: {
        probeSequence: ProbeOperation[];
        probeSequenceSettings: ProbeSequenceSettings;
    };
    
    // Configuration from machine settings
    machineSettingsUnits: string;
    machineAxes: {
        X: { positiveDirection: string; negativeDirection: string };
        Y: { positiveDirection: string; negativeDirection: string };
        Z: { positiveDirection: string; negativeDirection: string };
    };
    
    // Callbacks to notify parent of changes
    onProbeSequenceChange?: (probeSequence: ProbeOperation[]) => void;
    onProbeSequenceSettingsChange?: (settings: ProbeSequenceSettings) => void;
}

const ProbeSequenceEditor: React.FC<ProbeSequenceProps> = ({
    initialData,
    machineSettingsUnits,
    machineAxes,
    onProbeSequenceChange,
    onProbeSequenceSettingsChange
}) => {
    // Internal state management
    const [probeSequence, setProbeSequence] = useState<ProbeOperation[]>(
        initialData?.probeSequence || []
    );
    
    const [probeSequenceSettings, setProbeSequenceSettings] = useState<ProbeSequenceSettings>(
        initialData?.probeSequenceSettings || {
            initialPosition: { X: -78, Y: -100, Z: -41 },
            dwellsBeforeProbe: 15,
            spindleSpeed: 5000,
            units: 'mm',
            endmillSize: {
                input: '1/8',
                unit: 'fraction',
                sizeInMM: 3.175
            },
            operations: []
        }
    );    // Sync units from machine settings
    useEffect(() => {
        setProbeSequenceSettings(prev => ({
            ...prev,
            units: machineSettingsUnits as 'mm' | 'inch'
        }));
    }, [machineSettingsUnits]);

    // Note: We don't automatically update WCS Offset when endmill size changes
    // to preserve user's custom values. WCS Offset should only be auto-set for new probes.    // Notify parent of changes
    useEffect(() => {
        onProbeSequenceChange?.(probeSequence);
    }, [probeSequence, onProbeSequenceChange]);

    useEffect(() => {
        onProbeSequenceSettingsChange?.(probeSequenceSettings);
    }, [probeSequenceSettings, onProbeSequenceSettingsChange]);

    // Helper to parse tool size input
    const parseToolSize = (input: string, unit: 'fraction' | 'inch' | 'mm'): number => {
        if (unit === 'mm') {
            return parseFloat(input);
        } else if (unit === 'inch') {
            return parseFloat(input) * 25.4;
        } else if (unit === 'fraction') {
            // e.g. "1/8"
            const [num, denom] = input.split('/').map(Number);
            if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
                return (num / denom) * 25.4;
            }
            return 0;
        }
        return 0;
    };

    // Internal methods for state management
    const updateInitialPosition = (axis: 'X' | 'Y' | 'Z', value: number) => {
        setProbeSequenceSettings(prev => ({
            ...prev,
            initialPosition: {
                ...prev.initialPosition,
                [axis]: value
            }
        }));
    };

    const updateDwellsBeforeProbe = (value: number) => {
        setProbeSequenceSettings(prev => ({
            ...prev,
            dwellsBeforeProbe: value
        }));
    };

    const updateSpindleSpeed = (speed: number) => {
        setProbeSequenceSettings(prev => ({
            ...prev,
            spindleSpeed: speed
        }));
    };

    const updateEndmillSize = (input?: string, unit?: 'fraction' | 'inch' | 'mm') => {
        const newInput = input !== undefined ? input : probeSequenceSettings.endmillSize.input;
        const newUnit = unit !== undefined ? unit : probeSequenceSettings.endmillSize.unit;
        const sizeInMM = parseToolSize(newInput, newUnit);
        
        setProbeSequenceSettings(prev => ({
            ...prev,
            endmillSize: {
                input: newInput,
                unit: newUnit,
                sizeInMM
            }
        }));
    };

    const addProbeOperation = () => {
        const newProbe: ProbeOperation = {
            id: `probe-${Date.now()}`,
            axis: 'Y',
            direction: -1,
            distance: 25,
            feedRate: 10,
            backoffDistance: 1,
            wcsOffset: probeSequenceSettings.endmillSize.sizeInMM / 2,
            preMoves: [],
            postMoves: []
        };
        setProbeSequence(prev => [...prev, newProbe]);
    };

    const updateProbeOperation = (id: string, field: keyof ProbeOperation, value: any) => {
        setProbeSequence(prev => prev.map(probe =>
            probe.id === id ? { ...probe, [field]: value } : probe
        ));
    };

    const deleteProbeOperation = (id: string) => {
        setProbeSequence(prev => prev.filter(probe => probe.id !== id));
    };

    const addMovementStep = (probeId: string, moveType: 'pre' | 'post' = 'post') => {
        const newStep: MovementStep = {
            id: `step-${Date.now()}`,
            type: 'rapid',
            description: moveType === 'pre' ? 'Position for probe' : 'Move away from surface',
            axesValues: {},
            positionMode: 'relative',
            coordinateSystem: 'none'
        };

        setProbeSequence(prev => prev.map(probe =>
            probe.id === probeId ? {
                ...probe,
                [moveType === 'pre' ? 'preMoves' : 'postMoves']: [
                    ...(moveType === 'pre' ? probe.preMoves : probe.postMoves), 
                    newStep
                ]
            } : probe
        ));
    };

    const updateMovementStep = (probeId: string, stepId: string, field: keyof MovementStep, value: any, moveType: 'pre' | 'post' = 'post') => {
        setProbeSequence(prev => prev.map(probe =>
            probe.id === probeId ? {
                ...probe,
                [moveType === 'pre' ? 'preMoves' : 'postMoves']: (moveType === 'pre' ? probe.preMoves : probe.postMoves).map(step =>
                    step.id === stepId ? { ...step, [field]: value } : step
                )
            } : probe
        ));
    };

    const deleteMovementStep = (probeId: string, stepId: string, moveType: 'pre' | 'post' = 'post') => {
        setProbeSequence(prev => prev.map(probe =>
            probe.id === probeId ? {
                ...probe,
                [moveType === 'pre' ? 'preMoves' : 'postMoves']: (moveType === 'pre' ? probe.preMoves : probe.postMoves).filter(step => step.id !== stepId)
            } : probe
        ));
    };// Helper component for axis inputs to reduce duplication
    const AxisInputs: React.FC<{
        move: MovementStep;
        probe: ProbeOperation;
        idPrefix: string;
        moveType: 'pre' | 'post';
    }> = ({ move, probe, idPrefix, moveType }) => (
        <div className="col-span-3 flex flex-row gap-4 items-end">
            <div className="flex flex-col w-20">
                <Label htmlFor={`${idPrefix}-x-${move.id}`}>X</Label>
                <Input
                    id={`${idPrefix}-x-${move.id}`}
                    type="number"
                    step="0.01"
                    value={move.axesValues?.X ?? ''}
                    onChange={e => {
                        const val = parseFloat(e.target.value);
                        updateMovementStep(probe.id, move.id, 'axesValues', { ...move.axesValues, X: isNaN(val) ? undefined : val }, moveType);
                    }}
                    placeholder="X"
                />
            </div>
            <div className="flex flex-col w-20">
                <Label htmlFor={`${idPrefix}-y-${move.id}`}>Y</Label>
                <Input
                    id={`${idPrefix}-y-${move.id}`}
                    type="number"
                    step="0.01"
                    value={move.axesValues?.Y ?? ''}
                    onChange={e => {
                        const val = parseFloat(e.target.value);
                        updateMovementStep(probe.id, move.id, 'axesValues', { ...move.axesValues, Y: isNaN(val) ? undefined : val }, moveType);
                    }}
                    placeholder="Y"
                />
            </div>
            <div className="flex flex-col w-20">
                <Label htmlFor={`${idPrefix}-z-${move.id}`}>Z</Label>
                <Input
                    id={`${idPrefix}-z-${move.id}`}
                    type="number"
                    step="0.01"
                    value={move.axesValues?.Z ?? ''}
                    onChange={e => {
                        const val = parseFloat(e.target.value);
                        updateMovementStep(probe.id, move.id, 'axesValues', { ...move.axesValues, Z: isNaN(val) ? undefined : val }, moveType);
                    }}
                    placeholder="Z"
                />
            </div>
        </div>
    );    // Handler for WCS Offset change - simple controlled input
    const handleWcsOffsetChange = (probeId: string, value: string) => {
        if (value === '' || isNaN(Number(value))) {
            updateProbeOperation(probeId, 'wcsOffset', undefined);
        } else {
            updateProbeOperation(probeId, 'wcsOffset', parseFloat(value));
        }
    };

    // Reusable component for rendering movement steps
    const MovementStepsSection: React.FC<{
        probe: ProbeOperation;
        moveType: 'pre' | 'post';
        moves: MovementStep[];
        title: string;
    }> = ({ probe, moveType, moves, title }) => (
        <div>
            <div className="flex justify-between items-center mb-2">
                <Label className="text-base font-semibold">{title}</Label>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addMovementStep(probe.id, moveType)}
                >
                    Add Movement
                </Button>
            </div>
            {moves.map((move, moveIndex) => (
                <Card key={move.id} className="mb-2">
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                            <Badge variant="secondary">Step {moveIndex + 1}</Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMovementStep(probe.id, move.id, moveType)}
                            >
                                Delete
                            </Button>
                        </div>
                        
                        {/* First row: Type, Axes (for rapid), Dwell Time (for dwell), and Description */}
                        <div className="flex gap-4 items-end mb-4">
                            <div className="w-48">
                                <Label>Type</Label>
                                <Select value={move.type} onValueChange={(value: 'rapid' | 'dwell') =>
                                    updateMovementStep(probe.id, move.id, 'type', value, moveType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rapid">Rapid Move (G0)</SelectItem>
                                        <SelectItem value="dwell">Dwell (G4)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {move.type === 'rapid' && (
                                <AxisInputs move={move} probe={probe} idPrefix={`${moveType}-rapid`} moveType={moveType} />
                            )}
                            
                            {move.type === 'dwell' && (
                                <div className="w-32">
                                    <Label>Dwell Time (sec)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={move.dwellTime || 0}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                            updateMovementStep(probe.id, move.id, 'dwellTime', parseFloat(e.target.value), moveType)}
                                    />
                                </div>
                            )}
                            
                            <div className="flex-1">
                                <Label>Description</Label>
                                <Input
                                    value={move.description}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                        updateMovementStep(probe.id, move.id, 'description', e.target.value, moveType)}
                                />
                            </div>
                        </div>
                        
                        {/* Second row: Radio groups for rapid moves only */}
                        {move.type === 'rapid' && (
                            <div className="grid grid-cols-2 gap-4">
                                {/* Position Mode Radio Group */}
                                <div>
                                    <Label className="text-sm font-medium">Position Mode</Label>
                                    <div className="flex flex-row gap-2 mt-2">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`position-none-${moveType}-${move.id}`}
                                                name={`position-mode-${moveType}-${move.id}`}
                                                checked={move.positionMode === 'none'}
                                                onChange={() => updateMovementStep(probe.id, move.id, 'positionMode', 'none', moveType)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={`position-none-${moveType}-${move.id}`} className="text-sm">
                                                None
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`position-relative-${moveType}-${move.id}`}
                                                name={`position-mode-${moveType}-${move.id}`}
                                                checked={move.positionMode === 'relative'}
                                                onChange={() => updateMovementStep(probe.id, move.id, 'positionMode', 'relative', moveType)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={`position-relative-${moveType}-${move.id}`} className="text-sm">
                                                Relative (G91)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`position-absolute-${moveType}-${move.id}`}
                                                name={`position-mode-${moveType}-${move.id}`}
                                                checked={move.positionMode === 'absolute'}
                                                onChange={() => updateMovementStep(probe.id, move.id, 'positionMode', 'absolute', moveType)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={`position-absolute-${moveType}-${move.id}`} className="text-sm">
                                                Absolute (G90)
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Coordinate System Radio Group */}
                                <div>
                                    <Label className="text-sm font-medium">Coordinate System</Label>
                                    <div className="flex flex-row gap-2 mt-2">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`coord-none-${moveType}-${move.id}`}
                                                name={`coord-system-${moveType}-${move.id}`}
                                                checked={move.coordinateSystem === 'none'}
                                                onChange={() => updateMovementStep(probe.id, move.id, 'coordinateSystem', 'none', moveType)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={`coord-none-${moveType}-${move.id}`} className="text-sm">
                                                None
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`coord-machine-${moveType}-${move.id}`}
                                                name={`coord-system-${moveType}-${move.id}`}
                                                checked={move.coordinateSystem === 'machine'}
                                                onChange={() => updateMovementStep(probe.id, move.id, 'coordinateSystem', 'machine', moveType)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={`coord-machine-${moveType}-${move.id}`} className="text-sm">
                                                Machine (G53)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`coord-wcs-${moveType}-${move.id}`}
                                                name={`coord-system-${moveType}-${move.id}`}
                                                checked={move.coordinateSystem === 'wcs'}
                                                onChange={() => updateMovementStep(probe.id, move.id, 'coordinateSystem', 'wcs', moveType)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={`coord-wcs-${moveType}-${move.id}`} className="text-sm">
                                                WCS (G54)
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Probe Sequence</CardTitle>
                <CardDescription>Define the sequence of probing operations</CardDescription>
                <Button onClick={addProbeOperation} className="w-fit">
                    Add Probe Operation
                </Button>            </CardHeader>
            <CardContent className="space-y-4">
                {/* Initial Position Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Initial Probe Position</CardTitle>
                        <CardDescription>Set the starting position for the probe sequence in machine coordinates</CardDescription>
                    </CardHeader>
                    <CardContent>                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(probeSequenceSettings.initialPosition).map(([axis, value]) => (
                                <div key={axis}>
                                    <Label>{axis} Position ({machineSettingsUnits})</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={value}
                                        onChange={(e) => updateInitialPosition(axis as 'X' | 'Y' | 'Z', parseFloat(e.target.value))}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>                {/* Buffer Clear, Spindle, and Endmill Settings Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Dwells Before Probe Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Buffer Clear Settings</CardTitle>
                            <CardDescription>Configure the number of buffer clear dwells before each probe operation</CardDescription>
                        </CardHeader>
                        <CardContent>                            <div>
                                <Label>Dwells Before Probe</Label>
                                <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={probeSequenceSettings.dwellsBeforeProbe}
                                    onChange={(e) => updateDwellsBeforeProbe(parseInt(e.target.value))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Spindle Speed Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Spindle Settings</CardTitle>
                            <CardDescription>Configure spindle speed for this probe sequence</CardDescription>
                        </CardHeader>
                        <CardContent>                            <div>
                                <Label>Spindle Speed (RPM)</Label>
                                <Input
                                    type="number"
                                    value={probeSequenceSettings.spindleSpeed}
                                    onChange={(e) => updateSpindleSpeed(parseInt(e.target.value))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Endmill Size Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Endmill Settings</CardTitle>
                            <CardDescription>Configure endmill size for this probe sequence (affects WCS offset calculation)</CardDescription>
                        </CardHeader>                        <CardContent>
                            <div>
                                <Label>Endmill Size</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        value={probeSequenceSettings.endmillSize.input}
                                        onChange={e => updateEndmillSize(e.target.value)}
                                        className="w-32"
                                    />
                                    <Select value={probeSequenceSettings.endmillSize.unit} onValueChange={v => updateEndmillSize(undefined, v as 'fraction' | 'inch' | 'mm')}>
                                        <SelectTrigger className="w-28">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fraction">Fractional Inch</SelectItem>
                                            <SelectItem value="inch">Decimal Inch</SelectItem>
                                            <SelectItem value="mm">Millimeter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <span className="text-gray-500 text-sm mt-1 block">(WCS Offset auto: {(probeSequenceSettings.endmillSize.sizeInMM/2).toFixed(4)} mm)</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Probe Operations */}
                {probeSequence.map((probe, index) => (
                    <Card key={probe.id}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Probe Operation {index + 1}</CardTitle>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteProbeOperation(probe.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Probe Axis</Label>
                                    <Select value={probe.axis} onValueChange={(value: 'X' | 'Y' | 'Z') =>
                                        updateProbeOperation(probe.id, 'axis', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="X">X Axis</SelectItem>
                                            <SelectItem value="Y">Y Axis</SelectItem>
                                            <SelectItem value="Z">Z Axis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>
                                        <span className="flex items-center gap-1">
                                            Direction
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help text-muted-foreground">?</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Which direction the axis should move to bring the probe into contact with the stock surface</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </span>
                                    </Label>
                                    <Select value={probe.direction.toString()} onValueChange={(value) =>
                                        updateProbeOperation(probe.id, 'direction', parseInt(value))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">{machineAxes[probe.axis].positiveDirection} (+)</SelectItem>
                                            <SelectItem value="-1">{machineAxes[probe.axis].negativeDirection} (-)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>
                                        <span className="flex items-center gap-1">
                                            Distance ({machineSettingsUnits})
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help text-muted-foreground">?</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Maximum distance the axis can travel to find stock surface</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </span>
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={probe.distance}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProbeOperation(probe.id, 'distance', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>
                                        <span className="flex items-center gap-1">
                                            Feed Rate ({machineSettingsUnits}/min)
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help text-muted-foreground">?</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>How fast the axis should move</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </span>
                                    </Label>
                                    <Input
                                        type="number"
                                        value={probe.feedRate}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProbeOperation(probe.id, 'feedRate', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label>
                                        <span className="flex items-center gap-1">
                                            Backoff Distance ({machineSettingsUnits})
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help text-muted-foreground">?</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>How far the axis should retract after making contact with the stock surface</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </span>
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={probe.backoffDistance}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProbeOperation(probe.id, 'backoffDistance', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`wcs-offset-${probe.id}`}>
                                        <span className="flex items-center gap-1">
                                            WCS Offset ({machineSettingsUnits})
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help text-muted-foreground">?</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Typically does not need to be manually set. Used to offset for the radius of the tool. Sets distance between contact point and actual origin.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </span>
                                    </Label>                                    <Input
                                        id={`wcs-offset-${probe.id}`}
                                        type="number"
                                        step="0.0001"
                                        value={typeof probe.wcsOffset === 'number' && !isNaN(probe.wcsOffset) ? probe.wcsOffset : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWcsOffsetChange(probe.id, e.target.value)}
                                        min={0}
                                    />
                                </div>
                            </div>                            <Separator />
                            
                            <MovementStepsSection
                                probe={probe}
                                moveType="pre"
                                moves={probe.preMoves}
                                title="Pre-Probe Movements"
                            />
                            
                            <Separator />
                            
                            <MovementStepsSection
                                probe={probe}
                                moveType="post"
                                moves={probe.postMoves}
                                title="Post-Probe Movements"
                            />
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
};

export default ProbeSequenceEditor;
