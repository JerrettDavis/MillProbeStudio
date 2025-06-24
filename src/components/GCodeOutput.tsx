import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface GCodeOutputProps {
  generatedGCode: string;
  generateGCode: () => void;
}

const GCodeOutput: React.FC<GCodeOutputProps> = ({ generatedGCode, generateGCode }) => (
  <Card>
    <CardHeader>
      <CardTitle>Generated G-Code</CardTitle>
      <CardDescription>Review and export your probing sequence G-code</CardDescription>
      <Button onClick={generateGCode} className="w-fit">
        Generate G-Code
      </Button>
    </CardHeader>
    <CardContent>
      <Textarea
        value={generatedGCode}
        readOnly
        className="font-mono text-sm min-h-96"
        placeholder="Click 'Generate G-Code' to create your probing sequence..."
      />
      {generatedGCode && (
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => navigator.clipboard.writeText(generatedGCode)}
            variant="outline"
          >
            Copy to Clipboard
          </Button>
          <Button
            onClick={() => {
              const blob = new Blob([generatedGCode], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'probe-sequence.gcode';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            variant="outline"
          >
            Download G-Code
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

export default GCodeOutput;
