import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerTrigger
} from "@/components/ui/drawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Settings, ChevronDown, ChevronRight } from "lucide-react";
import type { ProbeOperation, MovementStep, ProbeSequenceSettings, MachineSettings, AxisConfig } from '@/types/machine';
import MachineSettingsForm from './MachineSettings';

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
    
    // Machine settings for drawer
    machineSettings: MachineSettings;
    setMachineSettings: React.Dispatch<React.SetStateAction<MachineSettings>>;
    updateAxisConfig: (axis: 'X' | 'Y' | 'Z', field: keyof AxisConfig, value: AxisConfig[keyof AxisConfig]) => void;
    
    // Callbacks to notify parent of changes
    onProbeSequenceChange?: (probeSequence: ProbeOperation[]) => void;
    onProbeSequenceSettingsChange?: (settings: ProbeSequenceSettings) => void;
}

const ProbeSequenceEditor: React.FC<ProbeSequenceProps> = ({
    initialData,
    machineSettingsUnits,
    machineAxes,
    machineSettings,
    setMachineSettings,
    updateAxisConfig,
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
    );

    // State for collapsible sections - track which probe operation sections are open
    const [collapsibleState, setCollapsibleState] = useState<Record<string, {
        probing: boolean;
        preMoves: boolean;
        postMoves: boolean;
    }>>({});

    // Initialize collapsible state for new probe operations
    useEffect(() => {
        setCollapsibleState(prev => {
            const newState = { ...prev };
            let hasChanges = false;
            
            probeSequence.forEach(probe => {
                if (!newState[probe.id]) {
                    newState[probe.id] = {
                        probing: true,  // Operation Probing Settings open by default
                        preMoves: false, // Pre-Probe Movements closed by default
                        postMoves: false // Post-Probe Movements closed by default
                    };
                    hasChanges = true;
                }
            });
            
            return hasChanges ? newState : prev;
        });
    }, [probeSequence]);

    // Helper function to toggle collapsible state
    const toggleCollapsible = (probeId: string, section: 'probing' | 'preMoves' | 'postMoves') => {
        setCollapsibleState(prev => ({
            ...prev,
            [probeId]: {
                ...prev[probeId],
                [section]: !prev[probeId]?.[section]
            }
        }));
    };    // Sync units from machine settings
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

    const updateProbeOperation = (id: string, field: keyof ProbeOperation, value: ProbeOperation[keyof ProbeOperation]) => {
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

        // Expand the section if it's collapsed
        const sectionKey = moveType === 'pre' ? 'preMoves' : 'postMoves';
        if (!collapsibleState[probeId]?.[sectionKey]) {
            setCollapsibleState(prev => ({
                ...prev,
                [probeId]: {
                    ...prev[probeId],
                    [sectionKey]: true
                }
            }));
        }

        setProbeSequence(prev => prev.map(probe =>
            probe.id === probeId ? {
                ...probe,
                [moveType === 'pre' ? 'preMoves' : 'postMoves']: [
                    ...(moveType === 'pre' ? probe.preMoves : probe.postMoves), 
                    newStep
                ]
            } : probe
        ));

        // Scroll the new element into view after a short delay to allow for DOM updates
        setTimeout(() => {
            const newElement = document.querySelector(`[data-step-id="${newStep.id}"]`);
            if (newElement) {
                newElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    };

    const updateMovementStep = (probeId: string, stepId: string, field: keyof MovementStep, value: MovementStep[keyof MovementStep], moveType: 'pre' | 'post' = 'post') => {
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
        <div className="flex flex-row gap-2 sm:gap-4 items-end w-full sm:w-auto">
            <div className="flex flex-col w-full sm:w-20">
                <Label htmlFor={`${idPrefix}-x-${move.id}`} className="text-sm">X</Label>
                <Input
                    id={`${idPrefix}-x-${move.id}`}
                    type="number"
                    step="0.01"
                    value={move.axesValues?.X ?? ''}
                    onChange={e => {
                        const val = parseFloat(e.target.value);
                        const newAxesValues = { ...move.axesValues };
                        if (isNaN(val)) {
                            delete newAxesValues.X;
                        } else {
                            newAxesValues.X = val;
                        }
                        updateMovementStep(probe.id, move.id, 'axesValues', newAxesValues, moveType);
                    }}
                    placeholder="X"
                />
            </div>
            <div className="flex flex-col w-full sm:w-20">
                <Label htmlFor={`${idPrefix}-y-${move.id}`} className="text-sm">Y</Label>
                <Input
                    id={`${idPrefix}-y-${move.id}`}
                    type="number"
                    step="0.01"
                    value={move.axesValues?.Y ?? ''}
                    onChange={e => {
                        const val = parseFloat(e.target.value);
                        const newAxesValues = { ...move.axesValues };
                        if (isNaN(val)) {
                            delete newAxesValues.Y;
                        } else {
                            newAxesValues.Y = val;
                        }
                        updateMovementStep(probe.id, move.id, 'axesValues', newAxesValues, moveType);
                    }}
                    placeholder="Y"
                />
            </div>
            <div className="flex flex-col w-full sm:w-20">
                <Label htmlFor={`${idPrefix}-z-${move.id}`} className="text-sm">Z</Label>
                <Input
                    id={`${idPrefix}-z-${move.id}`}
                    type="number"
                    step="0.01"
                    value={move.axesValues?.Z ?? ''}
                    onChange={e => {
                        const val = parseFloat(e.target.value);
                        const newAxesValues = { ...move.axesValues };
                        if (isNaN(val)) {
                            delete newAxesValues.Z;
                        } else {
                            newAxesValues.Z = val;
                        }
                        updateMovementStep(probe.id, move.id, 'axesValues', newAxesValues, moveType);
                    }}
                    placeholder="Z"
                />
            </div>
        </div>
    );

    // Handler for WCS Offset change - simple controlled input
    const handleWcsOffsetChange = (probeId: string, value: string) => {
        if (value === '' || isNaN(Number(value))) {
            updateProbeOperation(probeId, 'wcsOffset', 0);
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
        isOpen: boolean;
        onToggle: () => void;
    }> = ({ probe, moveType, moves, title, isOpen, onToggle }) => {
        const hasMovements = moves.length > 0;
        const titleWithCount = hasMovements ? `${moves.length} ${title}` : title;
        
        return (
            <Collapsible open={isOpen} onOpenChange={onToggle}>
                <CollapsibleTrigger asChild>
                    <div className={`flex justify-between items-center mb-4 p-2 rounded-md transition-colors ${
                        hasMovements ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : 'cursor-default'
                    }`}>
                        <div className="flex items-center gap-2">
                            {hasMovements && (
                                isOpen ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )
                            )}
                            <Label className={`text-base font-semibold ${hasMovements ? 'cursor-pointer' : 'cursor-default'}`}>{titleWithCount}</Label>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the collapsible
                                addMovementStep(probe.id, moveType);
                            }}
                        >
                            Add Movement
                        </Button>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="space-y-2">
                        {moves.map((move, moveIndex) => (
                        <Card key={move.id} className="mb-2 bg-gray-50 dark:bg-gray-800 pt-4 pb-4" data-step-id={move.id}>
                            <CardContent className="pt-0 mt-0">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant="outline">Step {moveIndex + 1}</Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteMovementStep(probe.id, move.id, moveType)}
                                        className="ml-2"
                                        aria-label="Delete movement step"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={6} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </Button>
                                </div>
                        
                        {/* First row: Type, Axes (for rapid), Dwell Time (for dwell), and Description */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-4">
                            <div className="w-full sm:w-40">
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
                                <div className="w-full sm:w-auto">
                                    <AxisInputs move={move} probe={probe} idPrefix={`${moveType}-rapid`} moveType={moveType} />
                                </div>
                            )}
                            
                            {move.type === 'dwell' && (
                                <div className="w-full sm:w-32">
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
                            
                            <div className="flex-1 w-full">
                                <Label>Description</Label>
                                <Input
                                    value={move.description}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                        updateMovementStep(probe.id, move.id, 'description', e.target.value, moveType)}
                                />
                            </div>
                        </div>
                        
                        {/* Second row: Radio groups for rapid moves only - responsive layout */}
                        {move.type === 'rapid' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Position Mode Radio Group */}
                                <div>
                                    <Label className="text-sm font-medium">Position Mode</Label>
                                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
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
                                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
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
                </CollapsibleContent>
            </Collapsible>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Probe Sequence</CardTitle>
                <CardDescription>Define the sequence of probing operations</CardDescription>
                <div className="flex gap-2">
                    <Button onClick={addProbeOperation} className="w-fit">
                        Add Probe Operation
                    </Button>
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button variant="outline" className="w-fit">
                                <Settings className="w-4 h-4 mr-2" />
                                Machine Settings
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle>Machine Settings</DrawerTitle>
                                <DrawerDescription>Configure your CNC machine parameters and axis settings</DrawerDescription>
                            </DrawerHeader>
                            <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
                                <MachineSettingsForm
                                    machineSettings={machineSettings}
                                    setMachineSettings={setMachineSettings}
                                    updateAxisConfig={updateAxisConfig}
                                />
                            </div>
                        </DrawerContent>
                    </Drawer>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Initial Position Settings */}
                <Card className="bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700">
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
                    <Card className="bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700">
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
                    <Card className="bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700">
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
                    <Card className="bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700">
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
                    <Card key={probe.id} className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
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
                            {/* Operation Probing Settings - Collapsible */}
                            <Collapsible 
                                open={collapsibleState[probe.id]?.probing ?? true} 
                                onOpenChange={() => toggleCollapsible(probe.id, 'probing')}
                            >
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md transition-colors mb-4">
                                        {collapsibleState[probe.id]?.probing ?? true ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <Label className="text-base font-semibold cursor-pointer">{probe.axis} Axis Probing Settings</Label>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="space-y-4">
                                        {/* First row: Axis, Direction, Distance */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                        {/* Second row: Feed Rate, Backoff Distance, WCS Offset */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                                </Label>
                                                <Input
                                                    id={`wcs-offset-${probe.id}`}
                                                    type="number"
                                                    step="0.0001"
                                                    value={typeof probe.wcsOffset === 'number' && !isNaN(probe.wcsOffset) ? probe.wcsOffset : ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWcsOffsetChange(probe.id, e.target.value)}
                                                    min={0}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            <Separator />
                            
                            <MovementStepsSection
                                probe={probe}
                                moveType="pre"
                                moves={probe.preMoves}
                                title="Pre-Probe Movements"
                                isOpen={collapsibleState[probe.id]?.preMoves ?? false}
                                onToggle={() => toggleCollapsible(probe.id, 'preMoves')}
                            />
                            
                            <Separator />

                            <MovementStepsSection
                                probe={probe}
                                moveType="post"
                                moves={probe.postMoves}
                                title="Post-Probe Movements"
                                isOpen={collapsibleState[probe.id]?.postMoves ?? false}
                                onToggle={() => toggleCollapsible(probe.id, 'postMoves')}
                            />
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
};

export default ProbeSequenceEditor;
