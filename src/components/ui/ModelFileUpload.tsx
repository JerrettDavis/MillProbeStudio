import React, { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { isFileSizeStorable } from '@/utils/fileStorage';

export interface ModelFileUploadProps {
  onFileSelected: (file: File | null) => Promise<void> | void;
  currentFile: File | null;
  isProcessing?: boolean; // From parent component/store
  disabled?: boolean;
  accept?: string;
}

/**
 * File upload component specifically for 3D model files (STL, OBJ)
 */
export const ModelFileUpload: React.FC<ModelFileUploadProps> = ({
  onFileSelected,
  currentFile,
  isProcessing = false,
  disabled = false,
  accept = '.stl,.obj'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    await onFileSelected(file);
  }, [onFileSelected]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    await onFileSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelected]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    const validFile = files.find(file => {
      const extension = file.name.toLowerCase();
      return extension.endsWith('.stl') || extension.endsWith('.obj');
    });
    
    if (validFile) {
      await onFileSelected(validFile);
    }
  }, [onFileSelected]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <Label>Custom 3D Model (STL/OBJ)</Label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
      
      {currentFile ? (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentFile.name}</p>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(currentFile.size)}
                    {isFileSizeStorable(currentFile) ? (
                      <span className="text-green-600 ml-1">• Will persist across sessions</span>
                    ) : (
                      <span className="text-orange-600 ml-1">• Too large to persist ({'>'}10MB)</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={disabled || isProcessing}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleButtonClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardContent className="p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              STL or OBJ files only
            </p>
          </CardContent>
        </Card>
      )}
      
      <p className="text-xs text-muted-foreground">
        Upload a custom 3D model to replace the default stock visualization. 
        Files under 10MB will be saved automatically and restored when you return.
      </p>
    </div>
  );
};
