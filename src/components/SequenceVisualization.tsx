import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProbeOperation } from '@/types/machine';

interface SequenceVisualizationProps {
  probeSequence: ProbeOperation[];
  machineSettingsUnits: string;
}

const SequenceVisualization: React.FC<SequenceVisualizationProps> = ({ probeSequence, machineSettingsUnits }) => (
  <Card>
    <CardHeader>
      <CardTitle>Sequence Visualization</CardTitle>
      <CardDescription>Visual representation of your probing sequence</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="bg-gray-100 p-6 rounded-lg min-h-96 flex items-center justify-center">
        <div className="text-center">
          {/* Replace with 3D visualization in the future */}
          <p className="text-gray-600">3D visualization coming soon!</p>
          <p className="text-sm text-gray-500 mt-2">
            This will show a 3D representation of your mill's workspace and probe sequence
          </p>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Sequence Summary</h3>
        <div className="space-y-2">
          {probeSequence.map((probe, index) => (
            <div key={probe.id} className="flex items-center space-x-4 p-3 border rounded-lg">
              <Badge>{index + 1}</Badge>
              <div className="flex-1">
                <span className="font-medium">
                  Probe {probe.axis} axis {probe.direction > 0 ? 'positive' : 'negative'} direction
                </span>
                <div className="text-sm text-gray-600">
                  Distance: {probe.distance}{machineSettingsUnits},
                  Feed: {probe.feedRate}{machineSettingsUnits}/min,
                  Backoff: {probe.backoffDistance}{machineSettingsUnits}
                </div>
              </div>
              <Badge variant="outline">{probe.postMoves.length} post-moves</Badge>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default SequenceVisualization;
