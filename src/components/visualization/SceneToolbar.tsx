import React, { useCallback } from 'react';
import { MousePointer, Move, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type SceneInteractionTool = 'select' | 'move' | 'rotate';
export type SceneObject = 'none' | 'stock' | 'spindle' | 'stage' | 'model';

export interface SceneToolbarProps {
  selectedTool: SceneInteractionTool;
  selectedObject: SceneObject;
  onToolChange: (tool: SceneInteractionTool) => void;
  onObjectDeselect: () => void;
  canRotate?: boolean;
  canMove?: boolean;
  className?: string;
}

const TOOL_ICONS = {
  select: MousePointer,
  move: Move,
  rotate: RotateCcw,
} as const;

const TOOL_LABELS = {
  select: 'Select Objects',
  move: 'Move Objects',
  rotate: 'Rotate Objects',
} as const;

const OBJECT_LABELS = {
  none: 'No Selection',
  stock: 'Stock/Workpiece',
  spindle: 'Spindle/Tool',
  stage: 'Machine Stage',
  model: 'Custom Model',
} as const;

/**
 * Floating toolbar for scene interaction tools
 */
export const SceneToolbar: React.FC<SceneToolbarProps> = ({
  selectedTool,
  selectedObject,
  onToolChange,
  onObjectDeselect,
  canRotate = false,
  canMove = false,
  className = ''
}) => {
  const handleToolClick = useCallback((tool: SceneInteractionTool) => {
    if (tool === selectedTool) {
      // Toggle off if same tool is clicked - default to select
      onToolChange('select');
    } else {
      onToolChange(tool);
    }
  }, [selectedTool, onToolChange]);

  const isToolDisabled = useCallback((tool: SceneInteractionTool) => {
    if (selectedObject === 'none') {
      return tool !== 'select';
    }
    
    switch (tool) {
      case 'select':
        return false;
      case 'move':
        return !canMove;
      case 'rotate':
        return !canRotate;
      default:
        return false;
    }
  }, [selectedObject, canMove, canRotate]);

  const getToolTooltip = useCallback((tool: SceneInteractionTool) => {
    const baseLabel = TOOL_LABELS[tool];
    
    if (isToolDisabled(tool)) {
      switch (tool) {
        case 'move':
          return `${baseLabel} (Not available for ${OBJECT_LABELS[selectedObject]})`;
        case 'rotate':
          return `${baseLabel} (Not available for ${OBJECT_LABELS[selectedObject]})`;
        default:
          return `${baseLabel} (Select an object first)`;
      }
    }
    
    return baseLabel;
  }, [selectedObject, isToolDisabled]);

  return (
    <TooltipProvider>
      <Card className={`p-2 shadow-lg backdrop-blur-sm bg-gray-800 bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90 border-gray-600 ${className}`}>
        <div className="flex flex-col space-y-1">
          {/* Tool buttons */}
          <div className="flex space-x-1">
            {Object.entries(TOOL_ICONS).map(([tool, Icon]) => {
              const toolKey = tool as SceneInteractionTool;
              const isSelected = selectedTool === toolKey;
              const isDisabled = isToolDisabled(toolKey);
              
              return (
                <Tooltip key={tool}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => handleToolClick(toolKey)}
                      disabled={isDisabled}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{getToolTooltip(toolKey)}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          
          {/* Object selection indicator */}
          {selectedObject !== 'none' && (
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between space-x-2">
                <span className="text-xs text-muted-foreground truncate">
                  {OBJECT_LABELS[selectedObject]}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-4 h-4 p-0 text-muted-foreground hover:text-foreground"
                      onClick={onObjectDeselect}
                    >
                      ×
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Deselect object</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
};
